/**
 * Complete Swagger documentation setup for Authentication API
 */

import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthSwaggerSchemas, AuthResponseHeaders } from './auth-schemas';
import { AuthSwaggerExamples } from './auth-examples';

export function setupCompleteAuthDocumentation(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('ROMAPI Authentication & Authorization API')
    .setDescription(`
# ROMAPI Authentication & Authorization Service

A comprehensive authentication and authorization service providing secure user management, JWT tokens, API keys, OAuth integration, and fine-grained access control.

## 🚀 Quick Start

### 1. Register a New User
\`\`\`bash
curl -X POST https://api.romapi.com/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "userType": "INDIVIDUAL"
  }'
\`\`\`

### 2. Login and Get Tokens
\`\`\`bash
curl -X POST https://api.romapi.com/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
\`\`\`

### 3. Use Access Token
\`\`\`bash
curl -X GET https://api.romapi.com/auth/profile \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
\`\`\`

### 4. Create API Key
\`\`\`bash
curl -X POST https://api.romapi.com/api-keys \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My App API Key",
    "permissions": ["read:resources", "write:resources"],
    "rateLimit": 1000
  }'
\`\`\`

## 🔐 Authentication Methods

### JWT Bearer Authentication
Most endpoints require JWT authentication. Include the access token in the Authorization header:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

**Token Lifecycle:**
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens
- **Session**: Managed server-side with Redis for security

### API Key Authentication
For service-to-service communication, use API keys in the X-API-Key header:

\`\`\`
X-API-Key: <api_key>
\`\`\`

**API Key Features:**
- Scoped permissions
- Rate limiting
- Usage tracking
- Expiration dates
- Easy revocation

## 🔑 OAuth2 Integration

Supported providers:
- **Google**: Full profile access
- **GitHub**: Public profile and email
- **LinkedIn**: Basic profile information

OAuth flow:
1. Initiate OAuth with \`GET /oauth/{provider}/initiate\`
2. User authorizes on provider's site
3. Handle callback with \`GET /oauth/{provider}/callback\`
4. Link additional accounts with \`POST /oauth/link\`

## 👥 User Types & Permissions

### Individual Users (FREE/BASIC/PREMIUM)
- Profile management
- Basic API access
- Limited quotas
- Standard features

**Default Permissions:**
- \`read:profile\` - View own profile
- \`update:profile\` - Update own profile
- \`read:resources\` - View resources
- \`create:resources\` - Create resources

### Business Users (PREMIUM/ENTERPRISE)
- Enhanced quotas
- Team management
- Analytics access
- Priority support

**Additional Permissions:**
- \`read:business\` - View business data
- \`update:business\` - Manage business settings
- \`read:analytics\` - Access analytics
- \`manage:team\` - Team management

### Admin Users
- Full system access
- User management
- System configuration
- Audit logs

**Admin Permissions:**
- \`admin:*\` - Full administrative access
- \`read:*\` - Read all resources
- \`write:*\` - Modify all resources
- \`delete:*\` - Delete any resource

## 🛡️ Security Features

### Rate Limiting
All endpoints are protected by intelligent rate limiting:

- **Per User**: 1000 requests/hour (authenticated)
- **Per IP**: 100 requests/hour (unauthenticated)
- **Per API Key**: Configurable limit
- **Burst Protection**: Short-term spike protection

Rate limit headers in responses:
- \`X-RateLimit-Limit\`: Request limit per window
- \`X-RateLimit-Remaining\`: Remaining requests
- \`X-RateLimit-Reset\`: Reset timestamp
- \`X-RateLimit-Window\`: Window duration

### Password Security
- **Bcrypt hashing** with configurable salt rounds
- **Strength validation**: Minimum 8 characters, mixed case, numbers, symbols
- **Breach detection**: Integration with HaveIBeenPwned API
- **Reset tokens**: Secure, single-use, time-limited

### Session Management
- **Redis-backed sessions** for scalability
- **Device tracking** with user-agent and IP
- **Concurrent session limits** per user type
- **Automatic cleanup** of expired sessions

### Audit Logging
Comprehensive security event logging:
- Authentication attempts (success/failure)
- Token generation and refresh
- Permission checks
- API key usage
- Password changes
- Account modifications

## 📊 Monitoring & Analytics

### Health Checks
- \`GET /health\` - Service health status
- \`GET /health/auth\` - Authentication service status
- \`GET /health/redis\` - Redis connection status
- \`GET /health/database\` - Database connectivity

### Metrics Endpoints
- API key usage statistics
- User authentication metrics
- Rate limiting statistics
- Error rate monitoring

## 🚨 Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [/* validation errors */],
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/endpoint",
    "method": "POST"
  }
}
\`\`\`

### Common Error Codes
- \`VALIDATION_ERROR\` - Input validation failed
- \`UNAUTHORIZED\` - Authentication required
- \`FORBIDDEN\` - Insufficient permissions
- \`RATE_LIMIT_EXCEEDED\` - Too many requests
- \`TOKEN_EXPIRED\` - Access token expired
- \`INVALID_CREDENTIALS\` - Login failed
- \`EMAIL_ALREADY_EXISTS\` - Registration conflict
- \`API_KEY_NOT_FOUND\` - API key invalid
- \`OAUTH_ERROR\` - OAuth flow failed

## 🔧 Configuration

### Environment Variables
\`\`\`bash
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Rate Limiting
RATE_LIMIT_USER=1000
RATE_LIMIT_IP=100
RATE_LIMIT_WINDOW=3600

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
\`\`\`

## 📚 SDKs & Libraries

### JavaScript/TypeScript
\`\`\`bash
npm install @romapi/auth-sdk
\`\`\`

\`\`\`typescript
import { RomApiAuth } from '@romapi/auth-sdk';

const auth = new RomApiAuth({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.romapi.com'
});

// Authenticate user
const result = await auth.login('user@example.com', 'password');
\`\`\`

### Python
\`\`\`bash
pip install romapi-auth
\`\`\`

\`\`\`python
from romapi_auth import RomApiAuth

auth = RomApiAuth(api_key='your-api-key')
result = auth.login('user@example.com', 'password')
\`\`\`

## 🆘 Support

- **Documentation**: https://docs.romapi.com/auth
- **Support Email**: support@romapi.com
- **Status Page**: https://status.romapi.com
- **GitHub Issues**: https://github.com/romapi/auth-service/issues

## 📄 License

This API is licensed under the MIT License. See LICENSE file for details.
    `)
    .setVersion('1.0.0')
    .setTermsOfService('https://romapi.com/terms')
    .setContact(
      'ROMAPI Support Team',
      'https://romapi.com/support',
      'support@romapi.com'
    )
    .setLicense(
      'MIT License',
      'https://opensource.org/licenses/MIT'
    )
    .addServer('https://api.romapi.com', 'Production Server')
    .addServer('https://staging-api.romapi.com', 'Staging Server')
    .addServer('http://localhost:3000', 'Development Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token (without "Bearer " prefix)',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'Enter your API key for service-to-service authentication'
      },
      'API-Key'
    )
    .addTag('Authentication', 'User registration, login, logout, and token management')
    .addTag('API Keys', 'Create, manage, and revoke API keys for programmatic access')
    .addTag('OAuth', 'OAuth2 integration with Google, GitHub, and LinkedIn')
    .addTag('Users', 'User profile management and account settings')
    .addTag('Security', 'Security monitoring, audit logs, and health checks')
    .addTag('Admin', 'Administrative endpoints for user and system management')
    .build();

  // Create the document
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Enhance the document with custom schemas and examples
  document.components = document.components || {};
  document.components.schemas = {
    ...document.components.schemas,
    ...AuthSwaggerSchemas,
  };

  // Add comprehensive examples
  document.components.examples = {
    // Authentication Examples
    RegisterIndividualRequest: {
      summary: 'Register individual user',
      description: 'Example request to register a new individual user account',
      value: AuthSwaggerExamples.Auth.RegisterRequest
    },
    RegisterBusinessRequest: {
      summary: 'Register business user',
      description: 'Example request to register a new business user account',
      value: AuthSwaggerExamples.Auth.RegisterBusinessRequest
    },
    LoginRequest: {
      summary: 'User login',
      description: 'Example login request with email and password',
      value: AuthSwaggerExamples.Auth.LoginRequest
    },
    RefreshTokenRequest: {
      summary: 'Refresh access token',
      description: 'Example request to refresh an expired access token',
      value: AuthSwaggerExamples.Auth.RefreshTokenRequest
    },
    ForgotPasswordRequest: {
      summary: 'Request password reset',
      description: 'Example request to initiate password reset flow',
      value: AuthSwaggerExamples.Auth.ForgotPasswordRequest
    },
    ResetPasswordRequest: {
      summary: 'Reset password',
      description: 'Example request to reset password with token',
      value: AuthSwaggerExamples.Auth.ResetPasswordRequest
    },
    AuthSuccessResponse: {
      summary: 'Successful authentication',
      description: 'Example response after successful login or registration',
      value: AuthSwaggerExamples.Auth.AuthResponse
    },
    TokenRefreshResponse: {
      summary: 'Token refresh response',
      description: 'Example response after successful token refresh',
      value: AuthSwaggerExamples.Auth.TokenResponse
    },

    // API Key Examples
    CreateApiKeyRequest: {
      summary: 'Create API key',
      description: 'Example request to create a new API key with permissions',
      value: AuthSwaggerExamples.ApiKeys.CreateRequest
    },
    CreateApiKeyDevelopmentRequest: {
      summary: 'Create development API key',
      description: 'Example request to create an API key for development use',
      value: AuthSwaggerExamples.ApiKeys.CreateDevelopmentRequest
    },
    UpdateApiKeyRequest: {
      summary: 'Update API key',
      description: 'Example request to update API key properties',
      value: AuthSwaggerExamples.ApiKeys.UpdateRequest
    },
    ApiKeyCreatedResponse: {
      summary: 'API key created',
      description: 'Example response after successful API key creation (includes full key value)',
      value: AuthSwaggerExamples.ApiKeys.CreateResponse
    },
    ApiKeyListResponse: {
      summary: 'List of API keys',
      description: 'Example response showing user\'s API keys (without full key values)',
      value: AuthSwaggerExamples.ApiKeys.ListResponse
    },
    ApiKeyStatsResponse: {
      summary: 'API key statistics',
      description: 'Example response showing API key usage statistics',
      value: AuthSwaggerExamples.ApiKeys.StatsResponse
    },

    // OAuth Examples
    OAuthInitiateResponse: {
      summary: 'OAuth initiation',
      description: 'Example response when initiating OAuth flow',
      value: AuthSwaggerExamples.OAuth.InitiateResponse
    },
    OAuthLinkRequest: {
      summary: 'Link OAuth account',
      description: 'Example request to link an OAuth account to existing user',
      value: AuthSwaggerExamples.OAuth.LinkRequest
    },
    OAuthAccountResponse: {
      summary: 'OAuth account info',
      description: 'Example OAuth account information',
      value: AuthSwaggerExamples.OAuth.AccountResponse
    },
    OAuthAccountsListResponse: {
      summary: 'User OAuth accounts',
      description: 'Example response showing all OAuth accounts linked to user',
      value: AuthSwaggerExamples.OAuth.AccountsListResponse
    },

    // Error Examples
    ValidationErrorResponse: {
      summary: 'Validation error',
      description: 'Example response when request validation fails',
      value: AuthSwaggerExamples.Errors.ValidationError
    },
    UnauthorizedErrorResponse: {
      summary: 'Unauthorized error',
      description: 'Example response when authentication fails',
      value: AuthSwaggerExamples.Errors.UnauthorizedError
    },
    ForbiddenErrorResponse: {
      summary: 'Forbidden error',
      description: 'Example response when user lacks required permissions',
      value: AuthSwaggerExamples.Errors.ForbiddenError
    },
    RateLimitErrorResponse: {
      summary: 'Rate limit exceeded',
      description: 'Example response when rate limit is exceeded',
      value: AuthSwaggerExamples.Errors.RateLimitError
    },
    ConflictErrorResponse: {
      summary: 'Conflict error',
      description: 'Example response when resource already exists',
      value: AuthSwaggerExamples.Errors.ConflictError
    },
    NotFoundErrorResponse: {
      summary: 'Not found error',
      description: 'Example response when requested resource is not found',
      value: AuthSwaggerExamples.Errors.NotFoundError
    }
  };

  // Add security schemes
  document.components.securitySchemes = {
    'JWT-auth': {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT access token for user authentication. Format: Bearer <token>'
    },
    'API-Key': {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
      description: 'API key for service-to-service authentication'
    }
  };

  // Setup Swagger UI with enhanced configuration
  SwaggerModule.setup('api/docs/auth', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showResponseHeaders: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        // Add default headers for better UX
        if (!req.headers['Content-Type'] && req.method !== 'GET') {
          req.headers['Content-Type'] = 'application/json';
        }
        return req;
      },
      responseInterceptor: (res: any) => {
        // Log responses for debugging in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Swagger API Response: ${res.status} ${res.url}`);
        }
        return res;
      },
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayOperationId: false,
      showExtensions: true,
      showCommonExtensions: true,
      useUnsafeMarkdown: false
    },
    customSiteTitle: 'ROMAPI Authentication API - Interactive Documentation',
    customfavIcon: 'https://romapi.com/favicon.ico',
    customJs: [
      // Add custom JavaScript for enhanced functionality
      '/swagger-custom.js'
    ],
    customCssUrl: [
      // Add custom CSS for branding
      '/swagger-custom.css'
    ],
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
      .swagger-ui .auth-wrapper { margin: 20px 0; }
      .swagger-ui .btn.authorize { background-color: #007bff; border-color: #007bff; }
      .swagger-ui .btn.authorize:hover { background-color: #0056b3; border-color: #0056b3; }
    `
  });

  console.log('✅ Swagger documentation setup complete at /api/docs/auth');
}

// Export utility functions for documentation
export const SwaggerDocUtils = {
  /**
   * Add custom operation documentation
   */
  addOperationDoc: (operation: any, summary: string, description: string, examples?: any) => {
    operation.summary = summary;
    operation.description = description;
    if (examples) {
      operation.examples = examples;
    }
    return operation;
  },

  /**
   * Add rate limit documentation to operation
   */
  addRateLimitDoc: (operation: any, limit: number, window: string = '1 hour') => {
    operation.description = `${operation.description || ''}\n\n**Rate Limit:** ${limit} requests per ${window}`;
    return operation;
  },

  /**
   * Add permission requirements to operation
   */
  addPermissionDoc: (operation: any, permissions: string[]) => {
    const permissionList = permissions.map(p => `\`${p}\``).join(', ');
    operation.description = `${operation.description || ''}\n\n**Required Permissions:** ${permissionList}`;
    return operation;
  }
};