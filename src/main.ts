import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from './config/logger.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Use custom logger
  const logger = app.get(CustomLoggerService);
  app.useLogger(logger);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGINS')?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ROMAPI Backend Core')
    .setDescription(`
      Backend API Core for ROMAPI ecosystem - A comprehensive API for managing business resources, categories, and services.
      
      ## Features
      - **API Resources Management**: Create, read, update, and delete business resources
      - **Category Management**: Hierarchical category system with full CRUD operations
      - **Advanced Search**: Full-text search with location-based filtering
      - **Bulk Operations**: Efficient bulk ingestion with validation and error reporting
      - **Caching**: Redis-based caching for optimal performance
      - **Rate Limiting**: Built-in rate limiting for API protection
      
      ## Authentication
      Most endpoints require Bearer token authentication. Use the 'Authorize' button to set your token.
      
      ## Rate Limits
      - Anonymous: 100 requests per hour
      - Authenticated: 1000 requests per hour
      - Bulk operations: 10 requests per hour
      
      ## Response Format
      All responses follow a standard format:
      \`\`\`json
      {
        "success": true,
        "data": { ... },
        "timestamp": "2024-01-15T10:30:00Z"
      }
      \`\`\`
    `)
    .setVersion('1.0.0')
    .setContact(
      'ROMAPI Support',
      'https://romapi.com/support',
      'support@romapi.com'
    )
    .setLicense(
      'MIT License',
      'https://opensource.org/licenses/MIT'
    )
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://api-dev.romapi.com', 'Development Environment')
    .addServer('https://api.romapi.com', 'Production Environment')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('Health', 'Health check and system status endpoints')
    .addTag('API Resources', 'Manage business resources, services, and data entries')
    .addTag('Categories', 'Hierarchical category management system')
    .build();
  
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      // Create unique operation IDs by combining controller and method names
      const controllerName = controllerKey.replace('Controller', '').toLowerCase();
      return `${controllerName}_${methodKey}`;
    },
    deepScanRoutes: true,
  });
  
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'ROMAPI Backend Core - API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.logBusiness('APPLICATION_STARTED', {
    port,
    environment: configService.get('nodeEnv'),
    version: configService.get('app.version', '1.0.0'),
  });
}

bootstrap();