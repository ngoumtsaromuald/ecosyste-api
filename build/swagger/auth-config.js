"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSwaggerOperations = exports.AuthSwaggerTags = void 0;
exports.setupAuthSwagger = setupAuthSwagger;
const swagger_1 = require("@nestjs/swagger");
const auth_schemas_1 = require("./auth-schemas");
const auth_examples_1 = require("./auth-examples");
function setupAuthSwagger(app) {
    const config = new swagger_1.DocumentBuilder()
        .setTitle('ROMAPI Authentication Service')
        .setDescription(`
# ROMAPI Authentication API

The ROMAPI Authentication Service provides comprehensive user authentication, authorization, and API key management capabilities.

## Features

- **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- **OAuth2 Integration**: Support for Google, GitHub, and LinkedIn OAuth providers
- **API Key Management**: Create, manage, and revoke API keys for service-to-service authentication
- **Role-Based Access Control (RBAC)**: Fine-grained permission system
- **Rate Limiting**: Configurable rate limits per user, API key, and IP address
- **Session Management**: Secure session handling with Redis storage
- **Password Security**: Bcrypt hashing with configurable salt rounds
- **Audit Logging**: Comprehensive security event logging
- **Email Integration**: Password reset and notification emails

## Authentication Methods

### 1. JWT Bearer Token
Use the access token in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

### 2. API Key
Use your API key in the X-API-Key header:
\`\`\`
X-API-Key: <api_key>
\`\`\`

## Rate Limiting

All endpoints are subject to rate limiting. Rate limit information is returned in response headers:

- \`X-RateLimit-Limit\`: Request limit per window
- \`X-RateLimit-Remaining\`: Remaining requests in current window  
- \`X-RateLimit-Reset\`: Unix timestamp when limit resets
- \`X-RateLimit-Window\`: Rate limit window in seconds

## Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/endpoint",
    "method": "POST"
  }
}
\`\`\`

## User Types and Permissions

### Individual Users
- Basic profile management
- Limited API quotas
- Standard resource access

### Business Users  
- Enhanced quotas and features
- Business-specific endpoints
- Analytics access
- Team management capabilities

### Admin Users
- Full system access
- User management
- System configuration
- Audit log access

## Security Best Practices

1. **Token Security**: Store tokens securely, never in localStorage for web apps
2. **API Key Security**: Rotate API keys regularly, use different keys for different environments
3. **Rate Limiting**: Implement client-side rate limiting to avoid hitting limits
4. **HTTPS Only**: All authentication endpoints require HTTPS in production
5. **Password Policy**: Enforce strong passwords with minimum requirements
    `)
        .setVersion('1.0.0')
        .setContact('ROMAPI Support', 'https://romapi.com/support', 'support@romapi.com')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addServer('https://api.romapi.com', 'Production')
        .addServer('https://staging-api.romapi.com', 'Staging')
        .addServer('http://localhost:3000', 'Development')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addApiKey({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key for service authentication'
    }, 'API-Key')
        .addTag('Authentication', 'User authentication and session management')
        .addTag('API Keys', 'API key creation and management')
        .addTag('OAuth', 'OAuth2 provider integration')
        .addTag('Users', 'User profile and account management')
        .addTag('Security', 'Security and audit endpoints')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config, {
        operationIdFactory: (controllerKey, methodKey) => methodKey,
        extraModels: [],
    });
    document.components = document.components || {};
    document.components.schemas = {
        ...document.components.schemas,
        ...auth_schemas_1.AuthSwaggerSchemas,
    };
    document.components.securitySchemes = {
        'JWT-auth': {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT access token for user authentication'
        },
        'API-Key': {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for service-to-service authentication'
        }
    };
    if (document.components) {
        document.components.examples = {
            RegisterRequest: {
                summary: 'Individual user registration',
                value: auth_examples_1.AuthSwaggerExamples.Auth.RegisterRequest
            },
            RegisterBusinessRequest: {
                summary: 'Business user registration',
                value: auth_examples_1.AuthSwaggerExamples.Auth.RegisterBusinessRequest
            },
            LoginRequest: {
                summary: 'User login',
                value: auth_examples_1.AuthSwaggerExamples.Auth.LoginRequest
            },
            AuthResponse: {
                summary: 'Successful authentication response',
                value: auth_examples_1.AuthSwaggerExamples.Auth.AuthResponse
            },
            TokenResponse: {
                summary: 'Token refresh response',
                value: auth_examples_1.AuthSwaggerExamples.Auth.TokenResponse
            },
            CreateApiKeyRequest: {
                summary: 'Create production API key',
                value: auth_examples_1.AuthSwaggerExamples.ApiKeys.CreateRequest
            },
            CreateApiKeyResponse: {
                summary: 'API key creation response',
                value: auth_examples_1.AuthSwaggerExamples.ApiKeys.CreateResponse
            },
            ApiKeyListResponse: {
                summary: 'User API keys list',
                value: auth_examples_1.AuthSwaggerExamples.ApiKeys.ListResponse
            },
            OAuthInitiateResponse: {
                summary: 'OAuth initiation response',
                value: auth_examples_1.AuthSwaggerExamples.OAuth.InitiateResponse
            },
            OAuthAccountResponse: {
                summary: 'OAuth account information',
                value: auth_examples_1.AuthSwaggerExamples.OAuth.AccountResponse
            },
            ValidationError: {
                summary: 'Validation error response',
                value: auth_examples_1.AuthSwaggerExamples.Errors.ValidationError
            },
            UnauthorizedError: {
                summary: 'Unauthorized error response',
                value: auth_examples_1.AuthSwaggerExamples.Errors.UnauthorizedError
            },
            RateLimitError: {
                summary: 'Rate limit exceeded response',
                value: auth_examples_1.AuthSwaggerExamples.Errors.RateLimitError
            }
        };
    }
    swagger_1.SwaggerModule.setup('api/docs/auth', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            docExpansion: 'none',
            filter: true,
            showRequestHeaders: true,
            tryItOutEnabled: true,
            requestInterceptor: (req) => {
                req.headers['Content-Type'] = 'application/json';
                return req;
            },
            responseInterceptor: (res) => {
                console.log('Swagger Response:', res.status, res.url);
                return res;
            }
        },
        customSiteTitle: 'ROMAPI Auth API Documentation',
        customfavIcon: '/favicon.ico',
        customJs: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
        ],
        customCssUrl: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
        ],
    });
}
exports.AuthSwaggerTags = {
    AUTHENTICATION: 'Authentication',
    API_KEYS: 'API Keys',
    OAUTH: 'OAuth',
    USERS: 'Users',
    SECURITY: 'Security'
};
exports.AuthSwaggerOperations = {
    REGISTER: 'register',
    LOGIN: 'login',
    REFRESH_TOKEN: 'refreshToken',
    LOGOUT: 'logout',
    FORGOT_PASSWORD: 'forgotPassword',
    RESET_PASSWORD: 'resetPassword',
    GET_PROFILE: 'getProfile',
    LIST_API_KEYS: 'listApiKeys',
    CREATE_API_KEY: 'createApiKey',
    UPDATE_API_KEY: 'updateApiKey',
    REVOKE_API_KEY: 'revokeApiKey',
    REACTIVATE_API_KEY: 'reactivateApiKey',
    GET_API_KEY_STATS: 'getApiKeyStats',
    INITIATE_OAUTH: 'initiateOAuth',
    OAUTH_CALLBACK: 'oauthCallback',
    LINK_OAUTH_ACCOUNT: 'linkOAuthAccount',
    GET_OAUTH_ACCOUNTS: 'getOAuthAccounts',
    UNLINK_OAUTH_ACCOUNT: 'unlinkOAuthAccount',
    INITIATE_OAUTH_LINKING: 'initiateOAuthLinking',
    REFRESH_OAUTH_TOKENS: 'refreshOAuthTokens'
};
//# sourceMappingURL=auth-config.js.map