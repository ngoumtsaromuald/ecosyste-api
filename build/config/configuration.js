"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'production') {
        const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_HOST'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
    }
    return {
        port: parseInt(process.env.PORT, 10) || 3000,
        nodeEnv,
        database: {
            url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USERNAME || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'romapi_core'}?schema=public`,
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            name: process.env.DB_NAME || 'romapi_core',
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT, 10) || 6379,
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB, 10) || 0,
        },
        jwt: {
            secret: process.env.JWT_SECRET || (nodeEnv === 'production' ? (() => { throw new Error('JWT_SECRET is required in production'); })() : 'dev-secret-key'),
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        },
        api: {
            prefix: process.env.API_PREFIX || 'api/v1',
            corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
        },
        rateLimit: {
            ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000,
            limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || (nodeEnv === 'production' ? 1000 : 100),
        },
        cache: {
            apiResourceTtl: parseInt(process.env.CACHE_API_RESOURCE_TTL, 10) || (nodeEnv === 'production' ? 7200 : 3600),
            categoriesTtl: parseInt(process.env.CACHE_CATEGORIES_TTL, 10) || (nodeEnv === 'production' ? 172800 : 86400),
            searchTtl: parseInt(process.env.CACHE_SEARCH_TTL, 10) || (nodeEnv === 'production' ? 3600 : 1800),
            userTtl: parseInt(process.env.CACHE_USER_TTL, 10) || (nodeEnv === 'production' ? 3600 : 1800),
        },
        logging: {
            level: process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),
            format: process.env.LOG_FORMAT || (nodeEnv === 'production' ? 'json' : 'simple'),
        },
        security: {
            helmetEnabled: process.env.HELMET_ENABLED === 'true' || nodeEnv === 'production',
            trustProxy: process.env.TRUST_PROXY === 'true' || nodeEnv === 'production',
        },
        monitoring: {
            metricsEnabled: process.env.METRICS_ENABLED !== 'false',
            healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
        },
        performance: {
            maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
            requestTimeout: parseInt(process.env.REQUEST_TIMEOUT, 10) || 30000,
        },
        ssl: {
            enabled: process.env.SSL_ENABLED === 'true',
        },
    };
};
//# sourceMappingURL=configuration.js.map