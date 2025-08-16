"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: 'REDIS_CLIENT',
                useFactory: (configService) => {
                    const logger = new common_1.Logger('RedisModule');
                    const redisConfig = {
                        host: configService.get('redis.host'),
                        port: configService.get('redis.port'),
                        password: configService.get('redis.password'),
                        db: configService.get('redis.db'),
                        retryDelayOnFailover: 100,
                        enableReadyCheck: true,
                        maxRetriesPerRequest: 3,
                        lazyConnect: true,
                        keepAlive: 30000,
                        connectTimeout: 10000,
                        commandTimeout: 5000,
                    };
                    if (!redisConfig.password) {
                        delete redisConfig.password;
                    }
                    const redis = new ioredis_1.default(redisConfig);
                    redis.on('connect', () => {
                        logger.log(`Redis connected to ${redisConfig.host}:${redisConfig.port}`);
                    });
                    redis.on('ready', () => {
                        logger.log('Redis connection is ready');
                    });
                    redis.on('error', (error) => {
                        logger.error('Redis connection error:', error);
                    });
                    redis.on('close', () => {
                        logger.warn('Redis connection closed');
                    });
                    redis.on('reconnecting', (delay) => {
                        logger.log(`Redis reconnecting in ${delay}ms`);
                    });
                    redis.on('end', () => {
                        logger.warn('Redis connection ended');
                    });
                    process.on('SIGINT', async () => {
                        logger.log('Closing Redis connection...');
                        await redis.quit();
                    });
                    process.on('SIGTERM', async () => {
                        logger.log('Closing Redis connection...');
                        await redis.quit();
                    });
                    return redis;
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: ['REDIS_CLIENT'],
    })
], RedisModule);
//# sourceMappingURL=redis.module.js.map