# Exemples d'Intégration Microservices ROMAPI Auth

Ce document fournit des exemples concrets d'intégration du système d'authentification ROMAPI dans une architecture microservices.

## Table des Matières

1. [Architecture Microservices](#architecture-microservices)
2. [Service Gateway](#service-gateway)
3. [Service Utilisateurs](#service-utilisateurs)
4. [Service Produits](#service-produits)
5. [Service Notifications](#service-notifications)
6. [Service Analytics](#service-analytics)
7. [Communication Inter-Services](#communication-inter-services)
8. [Déploiement et Configuration](#déploiement-et-configuration)

## Architecture Microservices

### Vue d'ensemble de l'Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App]
        MOBILE[Mobile App]
        API_CLIENT[API Clients]
    end
    
    subgraph "API Gateway"
        GATEWAY[Kong/Nginx Gateway]
        AUTH_MIDDLEWARE[Auth Middleware]
        RATE_LIMITER[Rate Limiter]
    end
    
    subgraph "Core Services"
        AUTH_SERVICE[Auth Service]
        USER_SERVICE[User Service]
        PRODUCT_SERVICE[Product Service]
        NOTIFICATION_SERVICE[Notification Service]
        ANALYTICS_SERVICE[Analytics Service]
    end
    
    subgraph "Data Layer"
        AUTH_DB[(Auth DB)]
        USER_DB[(User DB)]
        PRODUCT_DB[(Product DB)]
        REDIS[Redis Cache]
    end
    
    WEB --> GATEWAY
    MOBILE --> GATEWAY
    API_CLIENT --> GATEWAY
    
    GATEWAY --> AUTH_MIDDLEWARE
    AUTH_MIDDLEWARE --> RATE_LIMITER
    
    RATE_LIMITER --> AUTH_SERVICE
    RATE_LIMITER --> USER_SERVICE
    RATE_LIMITER --> PRODUCT_SERVICE
    RATE_LIMITER --> NOTIFICATION_SERVICE
    RATE_LIMITER --> ANALYTICS_SERVICE
    
    AUTH_SERVICE --> AUTH_DB
    AUTH_SERVICE --> REDIS
    USER_SERVICE --> USER_DB
    PRODUCT_SERVICE --> PRODUCT_DB
```

## Service Gateway

### Configuration Kong Gateway

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: auth-service
    url: http://auth-service:3001
    routes:
      - name: auth-routes
        paths:
          - /auth
        strip_path: false

  - name: user-service
    url: http://user-service:3002
    routes:
      - name: user-routes
        paths:
          - /users
        strip_path: false

  - name: product-service
    url: http://product-service:3003
    routes:
      - name: product-routes
        paths:
          - /products
        strip_path: false

plugins:
  - name: jwt
    service: user-service
    config:
      key_claim_name: iss
      secret_is_base64: false
      claims_to_verify:
        - exp
        - iat
      
  - name: rate-limiting
    service: user-service
    config:
      minute: 100
      hour: 1000
      policy: redis
      redis_host: redis
      redis_port: 6379
```

### Middleware d'Authentification Gateway

```javascript
// gateway-auth-middleware.js
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const axios = require('axios');

class GatewayAuthMiddleware {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    });
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
  }

  async validateToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const apiKey = req.headers['x-api-key'];

      if (authHeader && authHeader.startsWith('Bearer ')) {
        await this.handleJWTAuth(req, res, next);
      } else if (apiKey) {
        await this.handleApiKeyAuth(req, res, next);
      } else {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }
    } catch (error) {
      console.error('Gateway auth error:', error);
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication failed' }
      });
    }
  }

  async handleJWTAuth(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    
    // Check cache first
    const cacheKey = `token:${token}`;
    const cachedUser = await this.redis.get(cacheKey);
    
    if (cachedUser) {
      req.user = JSON.parse(cachedUser);
      req.authType = 'jwt';
      return next();
    }

    // Validate with auth service
    const response = await axios.get(`${this.authServiceUrl}/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const user = response.data.user;
    
    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(user));
    
    req.user = user;
    req.authType = 'jwt';
    next();
  }

  async handleApiKeyAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    // Validate with auth service
    const response = await axios.post(`${this.authServiceUrl}/auth/validate-api-key`, {
      apiKey
    });

    const { user, apiKey: keyInfo } = response.data;
    
    req.user = user;
    req.apiKey = keyInfo;
    req.authType = 'api-key';
    next();
  }

  // Middleware pour routes publiques optionnelles
  async optionalAuth(req, res, next) {
    try {
      await this.validateToken(req, res, next);
    } catch (error) {
      // Continue sans authentification pour les routes publiques
      req.user = null;
      req.authType = null;
      next();
    }
  }
}

module.exports = GatewayAuthMiddleware;
```

## Service Utilisateurs

### Configuration du Service Utilisateurs

```typescript
// user-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { AuthMiddleware } from './middleware/auth.middleware';

async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  
  // Middleware d'authentification global
  app.use(new AuthMiddleware().use);
  
  await app.listen(3002);
}
bootstrap();
```

### Middleware d'Authentification Microservice

```typescript
// user-service/src/middleware/auth.middleware.ts
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface AuthenticatedRequest extends Request {
  user?: any;
  apiKey?: any;
  authType?: 'jwt' | 'api-key';
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Skip auth for health checks
    if (req.path === '/health' || req.path === '/metrics') {
      return next();
    }

    try {
      const authHeader = req.headers.authorization;
      const apiKey = req.headers['x-api-key'] as string;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        await this.handleJWTAuth(req, authHeader.split(' ')[1]);
      } else if (apiKey) {
        await this.handleApiKeyAuth(req, apiKey);
      } else {
        throw new UnauthorizedException('Authentication required');
      }

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message || 'Authentication failed'
        }
      });
    }
  }

  private async handleJWTAuth(req: AuthenticatedRequest, token: string) {
    // Validate token locally first
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      
      req.user = payload;
      req.authType = 'jwt';
    } catch (error) {
      // If local validation fails, check with auth service
      await this.validateWithAuthService(req, token);
    }
  }

  private async handleApiKeyAuth(req: AuthenticatedRequest, apiKey: string) {
    const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
    
    const response = await axios.post(`${authServiceUrl}/auth/validate-api-key`, {
      apiKey
    });

    req.user = response.data.user;
    req.apiKey = response.data.apiKey;
    req.authType = 'api-key';
  }

  private async validateWithAuthService(req: AuthenticatedRequest, token: string) {
    const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
    
    const response = await axios.get(`${authServiceUrl}/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    req.user = response.data.user;
    req.authType = 'jwt';
  }
}
```

### Contrôleur Utilisateurs avec Auth

```typescript
// user-service/src/controllers/user.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.userService.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Body() updateDto: UpdateProfileDto, @Req() req: AuthenticatedRequest) {
    return this.userService.updateProfile(req.user.id, updateDto);
  }

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermissions('users:list')
  listUsers(@Req() req: AuthenticatedRequest) {
    return this.userService.listUsers(req.user.id);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions('users:delete')
  deleteUser(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.userService.deleteUser(id, req.user.id);
  }
}
```

## Service Produits

### Configuration du Service Produits

```typescript
// product-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ProductModule } from './product.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // HTTP API
  const app = await NestFactory.create(ProductModule);
  await app.listen(3003);

  // Message Queue pour communication inter-services
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(ProductModule, {
    transport: Transport.REDIS,
    options: {
      host: 'localhost',
      port: 6379,
    },
  });
  
  await microservice.listen();
}
bootstrap();
```

### Service Produits avec Authentification

```typescript
// product-service/src/controllers/product.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { MessagePattern, EventPattern } from '@nestjs/microservices';
import { PermissionGuard } from '../guards/permission.guard';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { RateLimit } from '../decorators/rate-limit.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Endpoint public avec rate limiting
  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 1000, window: 3600000 })
  getProducts(@Query() query: GetProductsDto) {
    return this.productService.getProducts(query);
  }

  // Endpoint protégé pour les favoris utilisateur
  @Get('favorites')
  getFavorites(@Req() req: AuthenticatedRequest) {
    return this.productService.getFavorites(req.user.id);
  }

  // Endpoint admin pour créer des produits
  @Post()
  @UseGuards(PermissionGuard, RateLimitGuard)
  @RequirePermissions('products:create')
  @RateLimit({ limit: 50, window: 3600000 })
  createProduct(@Body() createDto: CreateProductDto, @Req() req: AuthenticatedRequest) {
    return this.productService.create(createDto, req.user.id);
  }

  // Endpoint API pour synchronisation partenaires
  @Get('api/sync')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 10, window: 60000 })
  syncProducts(@Req() req: AuthenticatedRequest) {
    if (req.authType !== 'api-key') {
      throw new UnauthorizedException('API key required for sync');
    }
    return this.productService.syncForPartner(req.apiKey.id);
  }

  // Message handler pour communication inter-services
  @MessagePattern('product.get')
  async getProductForService(data: { productId: string; userId?: string }) {
    return this.productService.getProductForService(data.productId, data.userId);
  }

  // Event handler pour mise à jour des permissions
  @EventPattern('user.permissions.updated')
  async handleUserPermissionsUpdated(data: { userId: string; permissions: string[] }) {
    await this.productService.updateUserPermissions(data.userId, data.permissions);
  }
}
```

### Client de Communication Inter-Services

```typescript
// product-service/src/clients/auth.client.ts
import { Injectable } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthClient {
  private client: ClientProxy;

  constructor(private readonly configService: ConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        host: this.configService.get('REDIS_HOST'),
        port: this.configService.get('REDIS_PORT'),
      },
    });
  }

  async validateUserPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    try {
      const result = await this.client.send('auth.validate.permissions', {
        userId,
        permissions: requiredPermissions
      }).toPromise();
      
      return result.valid;
    } catch (error) {
      console.error('Permission validation error:', error);
      return false;
    }
  }

  async getUserInfo(userId: string): Promise<any> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      const response = await axios.get(`${authServiceUrl}/users/${userId}/info`, {
        headers: {
          'X-Service-Token': this.configService.get('SERVICE_TOKEN')
        }
      });
      
      return response.data.user;
    } catch (error) {
      console.error('User info fetch error:', error);
      return null;
    }
  }

  async logUserAction(userId: string, action: string, details: any): Promise<void> {
    try {
      this.client.emit('audit.log', {
        userId,
        action,
        service: 'product-service',
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }
}
```

## Service Notifications

### Service de Notifications avec Auth

```typescript
// notification-service/src/controllers/notification.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { MessagePattern, EventPattern } from '@nestjs/microservices';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getUserNotifications(@Req() req: AuthenticatedRequest) {
    return this.notificationService.getUserNotifications(req.user.id);
  }

  @Post('mark-read/:id')
  markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Post('broadcast')
  @UseGuards(PermissionGuard)
  @RequirePermissions('notifications:broadcast')
  broadcastNotification(@Body() notificationDto: BroadcastNotificationDto, @Req() req: AuthenticatedRequest) {
    return this.notificationService.broadcast(notificationDto, req.user.id);
  }

  // Event handlers pour notifications automatiques
  @EventPattern('user.registered')
  async handleUserRegistered(data: { userId: string; email: string; name: string }) {
    await this.notificationService.sendWelcomeNotification(data);
  }

  @EventPattern('order.created')
  async handleOrderCreated(data: { userId: string; orderId: string; amount: number }) {
    await this.notificationService.sendOrderConfirmation(data);
  }

  @EventPattern('auth.login.suspicious')
  async handleSuspiciousLogin(data: { userId: string; ip: string; userAgent: string }) {
    await this.notificationService.sendSecurityAlert(data);
  }
}
```

### Service de Notifications Push

```typescript
// notification-service/src/services/push-notification.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { AuthClient } from '../clients/auth.client';

@Injectable()
export class PushNotificationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authClient: AuthClient,
  ) {
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.configService.get('FIREBASE_PROJECT_ID'),
        clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
        privateKey: this.configService.get('FIREBASE_PRIVATE_KEY'),
      }),
    });
  }

  async sendToUser(userId: string, notification: PushNotificationDto): Promise<void> {
    try {
      // Get user's device tokens from auth service
      const userInfo = await this.authClient.getUserInfo(userId);
      const deviceTokens = userInfo?.deviceTokens || [];

      if (deviceTokens.length === 0) {
        console.log(`No device tokens found for user ${userId}`);
        return;
      }

      // Send notification to all user devices
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        tokens: deviceTokens,
      };

      const response = await admin.messaging().sendMulticast(message);
      
      // Log results
      console.log(`Push notification sent: ${response.successCount} successful, ${response.failureCount} failed`);
      
      // Handle failed tokens (remove invalid ones)
      if (response.failureCount > 0) {
        const failedTokens = response.responses
          .map((resp, idx) => resp.success ? null : deviceTokens[idx])
          .filter(token => token !== null);
          
        await this.authClient.removeInvalidDeviceTokens(userId, failedTokens);
      }
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  async sendToRole(role: string, notification: PushNotificationDto): Promise<void> {
    try {
      // Get users with specific role from auth service
      const users = await this.authClient.getUsersByRole(role);
      
      // Send to each user
      await Promise.all(
        users.map(user => this.sendToUser(user.id, notification))
      );
    } catch (error) {
      console.error('Role-based push notification error:', error);
    }
  }
}
```

## Service Analytics

### Service Analytics avec Permissions

```typescript
// analytics-service/src/controllers/analytics.controller.ts
import { Controller, Get, Post, Query, Body, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../guards/permission.guard';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { RateLimit } from '../decorators/rate-limit.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Controller('analytics')
@UseGuards(PermissionGuard, RateLimitGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @RequirePermissions('analytics:dashboard:read')
  @RateLimit({ limit: 100, window: 3600000 })
  getDashboard(@Query() query: DashboardQueryDto, @Req() req: AuthenticatedRequest) {
    return this.analyticsService.getDashboard(query, req.user);
  }

  @Get('reports/sales')
  @RequirePermissions('analytics:sales:read')
  @RateLimit({ limit: 20, window: 3600000 })
  getSalesReport(@Query() query: SalesReportQueryDto, @Req() req: AuthenticatedRequest) {
    return this.analyticsService.getSalesReport(query, req.user);
  }

  @Post('reports/custom')
  @RequirePermissions('analytics:custom:create')
  @RateLimit({ limit: 5, window: 3600000 })
  generateCustomReport(@Body() reportDto: CustomReportDto, @Req() req: AuthenticatedRequest) {
    return this.analyticsService.generateCustomReport(reportDto, req.user);
  }

  @Get('metrics/realtime')
  @RequirePermissions('analytics:realtime:read')
  @RateLimit({ limit: 60, window: 3600000 })
  getRealtimeMetrics(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getRealtimeMetrics(req.user);
  }
}
```

### Collecteur de Métriques avec Auth

```typescript
// analytics-service/src/services/metrics-collector.service.ts
import { Injectable } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { AuthClient } from '../clients/auth.client';

@Injectable()
export class MetricsCollectorService {
  constructor(private readonly authClient: AuthClient) {}

  @EventPattern('user.login')
  async handleUserLogin(data: { userId: string; ip: string; userAgent: string; timestamp: string }) {
    try {
      const userInfo = await this.authClient.getUserInfo(data.userId);
      
      await this.recordMetric('user_login', {
        userId: data.userId,
        userType: userInfo?.userType,
        plan: userInfo?.plan,
        ip: data.ip,
        timestamp: data.timestamp,
      });
    } catch (error) {
      console.error('Login metrics error:', error);
    }
  }

  @EventPattern('api.request')
  async handleApiRequest(data: { 
    userId?: string; 
    apiKeyId?: string; 
    endpoint: string; 
    method: string; 
    statusCode: number;
    responseTime: number;
    timestamp: string;
  }) {
    try {
      let userInfo = null;
      
      if (data.userId) {
        userInfo = await this.authClient.getUserInfo(data.userId);
      } else if (data.apiKeyId) {
        userInfo = await this.authClient.getApiKeyOwner(data.apiKeyId);
      }

      await this.recordMetric('api_request', {
        ...data,
        userType: userInfo?.userType,
        plan: userInfo?.plan,
      });
    } catch (error) {
      console.error('API request metrics error:', error);
    }
  }

  @EventPattern('rate_limit.exceeded')
  async handleRateLimitExceeded(data: { 
    userId?: string; 
    apiKeyId?: string; 
    endpoint: string; 
    limit: number;
    timestamp: string;
  }) {
    await this.recordMetric('rate_limit_exceeded', data);
  }

  private async recordMetric(event: string, data: any): Promise<void> {
    // Store in time-series database (InfluxDB, TimescaleDB, etc.)
    // Implementation depends on your metrics storage solution
    console.log(`Metric recorded: ${event}`, data);
  }
}
```

## Communication Inter-Services

### Service de Communication Centralisé

```typescript
// shared/src/services/service-communication.service.ts
import { Injectable } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ServiceCommunicationService {
  private clients: Map<string, ClientProxy> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeClients();
  }

  private initializeClients() {
    const services = ['auth', 'user', 'product', 'notification', 'analytics'];
    
    services.forEach(service => {
      const client = ClientProxyFactory.create({
        transport: Transport.REDIS,
        options: {
          host: this.configService.get('REDIS_HOST'),
          port: this.configService.get('REDIS_PORT'),
        },
      });
      
      this.clients.set(service, client);
    });
  }

  async sendMessage(service: string, pattern: string, data: any): Promise<any> {
    const client = this.clients.get(service);
    if (!client) {
      throw new Error(`Service client not found: ${service}`);
    }

    return client.send(pattern, data).toPromise();
  }

  async emitEvent(event: string, data: any): Promise<void> {
    // Emit to all services
    this.clients.forEach(client => {
      client.emit(event, data);
    });
  }

  async makeHttpRequest(service: string, endpoint: string, options: any = {}): Promise<any> {
    const serviceUrl = this.configService.get(`${service.toUpperCase()}_SERVICE_URL`);
    const serviceToken = this.configService.get('SERVICE_TOKEN');

    const config = {
      ...options,
      headers: {
        ...options.headers,
        'X-Service-Token': serviceToken,
      },
    };

    const response = await axios(`${serviceUrl}${endpoint}`, config);
    return response.data;
  }
}
```

### Middleware de Validation Inter-Services

```typescript
// shared/src/middleware/service-auth.middleware.ts
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceAuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const serviceToken = req.headers['x-service-token'] as string;
    const expectedToken = this.configService.get('SERVICE_TOKEN');

    // Skip for external requests (they should use regular auth)
    if (!serviceToken) {
      return next();
    }

    if (serviceToken !== expectedToken) {
      throw new UnauthorizedException('Invalid service token');
    }

    // Mark as internal service request
    (req as any).isServiceRequest = true;
    next();
  }
}
```

## Déploiement et Configuration

### Docker Compose pour Microservices

```yaml
# docker-compose.microservices.yml
version: '3.8'

services:
  # Infrastructure
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: romapi
      POSTGRES_USER: romapi
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # API Gateway
  kong:
    image: kong:3.0
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/kong.yml
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    volumes:
      - ./kong.yml:/kong/kong.yml
    ports:
      - "8000:8000"
      - "8001:8001"
    depends_on:
      - redis

  # Core Services
  auth-service:
    build: ./auth-service
    environment:
      DATABASE_URL: postgresql://romapi:${POSTGRES_PASSWORD}@postgres:5432/romapi
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      SERVICE_TOKEN: ${SERVICE_TOKEN}
    depends_on:
      - postgres
      - redis
    ports:
      - "3001:3001"

  user-service:
    build: ./user-service
    environment:
      DATABASE_URL: postgresql://romapi:${POSTGRES_PASSWORD}@postgres:5432/romapi
      REDIS_URL: redis://redis:6379
      AUTH_SERVICE_URL: http://auth-service:3001
      SERVICE_TOKEN: ${SERVICE_TOKEN}
    depends_on:
      - postgres
      - redis
      - auth-service
    ports:
      - "3002:3002"

  product-service:
    build: ./product-service
    environment:
      DATABASE_URL: postgresql://romapi:${POSTGRES_PASSWORD}@postgres:5432/romapi
      REDIS_URL: redis://redis:6379
      AUTH_SERVICE_URL: http://auth-service:3001
      SERVICE_TOKEN: ${SERVICE_TOKEN}
    depends_on:
      - postgres
      - redis
      - auth-service
    ports:
      - "3003:3003"

  notification-service:
    build: ./notification-service
    environment:
      REDIS_URL: redis://redis:6379
      AUTH_SERVICE_URL: http://auth-service:3001
      SERVICE_TOKEN: ${SERVICE_TOKEN}
      FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}
      FIREBASE_CLIENT_EMAIL: ${FIREBASE_CLIENT_EMAIL}
      FIREBASE_PRIVATE_KEY: ${FIREBASE_PRIVATE_KEY}
    depends_on:
      - redis
      - auth-service
    ports:
      - "3004:3004"

  analytics-service:
    build: ./analytics-service
    environment:
      DATABASE_URL: postgresql://romapi:${POSTGRES_PASSWORD}@postgres:5432/romapi
      REDIS_URL: redis://redis:6379
      AUTH_SERVICE_URL: http://auth-service:3001
      SERVICE_TOKEN: ${SERVICE_TOKEN}
    depends_on:
      - postgres
      - redis
      - auth-service
    ports:
      - "3005:3005"

volumes:
  postgres_data:
  redis_data:
```

### Configuration Kubernetes

```yaml
# k8s/auth-service-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  labels:
    app: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: romapi/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secret
              key: jwt-secret
        - name: SERVICE_TOKEN
          valueFrom:
            secretKeyRef:
              name: service-secret
              key: token
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
  ports:
  - protocol: TCP
    port: 3001
    targetPort: 3001
  type: ClusterIP
```

### Variables d'Environnement par Service

```bash
# .env.auth-service
DATABASE_URL=postgresql://romapi:password@postgres:5432/romapi
REDIS_URL=redis://redis:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
SERVICE_TOKEN=your-service-token
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# .env.user-service
DATABASE_URL=postgresql://romapi:password@postgres:5432/romapi
REDIS_URL=redis://redis:6379
AUTH_SERVICE_URL=http://auth-service:3001
SERVICE_TOKEN=your-service-token
JWT_SECRET=your-jwt-secret

# .env.product-service
DATABASE_URL=postgresql://romapi:password@postgres:5432/romapi
REDIS_URL=redis://redis:6379
AUTH_SERVICE_URL=http://auth-service:3001
SERVICE_TOKEN=your-service-token

# .env.notification-service
REDIS_URL=redis://redis:6379
AUTH_SERVICE_URL=http://auth-service:3001
SERVICE_TOKEN=your-service-token
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CLIENT_EMAIL=your-firebase-email
FIREBASE_PRIVATE_KEY=your-firebase-key

# .env.analytics-service
DATABASE_URL=postgresql://romapi:password@postgres:5432/romapi
REDIS_URL=redis://redis:6379
AUTH_SERVICE_URL=http://auth-service:3001
SERVICE_TOKEN=your-service-token
```

Cette architecture microservices fournit une base solide pour intégrer l'authentification ROMAPI dans un environnement distribué, avec une communication sécurisée entre services et une gestion centralisée de l'authentification et des permissions.