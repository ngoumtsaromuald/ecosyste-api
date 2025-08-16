"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("./config/logger.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const logger = app.get(logger_service_1.CustomLoggerService);
    app.useLogger(logger);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: configService.get('CORS_ORIGINS')?.split(',') || ['http://localhost:3000'],
        credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    const config = new swagger_1.DocumentBuilder()
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
        .setContact('ROMAPI Support', 'https://romapi.com/support', 'support@romapi.com')
        .setLicense('MIT License', 'https://opensource.org/licenses/MIT')
        .addServer('http://localhost:3000', 'Development Server')
        .addServer('https://api-dev.romapi.com', 'Development Environment')
        .addServer('https://api.romapi.com', 'Production Environment')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addTag('Health', 'Health check and system status endpoints')
        .addTag('API Resources', 'Manage business resources, services, and data entries')
        .addTag('Categories', 'Hierarchical category management system')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config, {
        operationIdFactory: (controllerKey, methodKey) => {
            const controllerName = controllerKey.replace('Controller', '').toLowerCase();
            return `${controllerName}_${methodKey}`;
        },
        deepScanRoutes: true,
    });
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
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
//# sourceMappingURL=main.js.map