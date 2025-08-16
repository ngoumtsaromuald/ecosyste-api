"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../config/prisma.service");
const cache_service_1 = require("../config/cache.service");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../config/logger.service");
let HealthController = class HealthController {
    constructor(prisma, cacheService, configService, logger) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.configService = configService;
        this.logger = logger;
        this.startTime = Date.now();
    }
    async check() {
        const timestamp = new Date().toISOString();
        const uptime = Date.now() - this.startTime;
        const version = this.configService.get('app.version', '1.0.0');
        const environment = this.configService.get('nodeEnv', 'development');
        try {
            const healthChecks = await Promise.allSettled([
                this.checkDatabase(),
                this.checkRedis(),
                this.checkExternalServices(),
            ]);
            const [databaseResult, redisResult, externalResult] = healthChecks;
            const services = {
                database: this.extractServiceHealth(databaseResult),
                redis: this.extractServiceHealth(redisResult),
                ...(externalResult.status === 'fulfilled' && { external: externalResult.value }),
            };
            const status = this.determineOverallStatus(services);
            const result = {
                status,
                timestamp,
                version,
                environment,
                uptime,
                services,
                metrics: {
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: process.cpuUsage(),
                },
            };
            this.logger.log(`Health check completed: ${status}`, {
                context: 'HealthController',
                status,
                services: Object.entries(services).map(([name, health]) => ({
                    name,
                    status: health.status,
                    responseTime: health.responseTime,
                })),
            });
            if (status === 'unhealthy') {
                throw new common_1.HttpException(result, common_1.HttpStatus.SERVICE_UNAVAILABLE);
            }
            return result;
        }
        catch (error) {
            this.logger.error('Health check failed:', error.stack, {
                context: 'HealthController',
                error: error.message,
            });
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            const errorResult = {
                status: 'unhealthy',
                timestamp,
                version,
                environment,
                uptime,
                services: {
                    database: { status: 'down', error: 'Health check failed' },
                    redis: { status: 'down', error: 'Health check failed' },
                },
            };
            throw new common_1.HttpException(errorResult, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    async readiness() {
        try {
            await Promise.all([
                this.quickDatabaseCheck(),
                this.quickRedisCheck(),
            ]);
            return {
                status: 'ready',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.warn('Readiness check failed:', {
                context: 'HealthController',
                error: error.message,
            });
            throw new common_1.HttpException({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                error: error.message,
            }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    async liveness() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
        };
    }
    async checkDatabase() {
        const startTime = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1 as test`;
            const stats = await this.getDatabaseStats();
            const responseTime = Date.now() - startTime;
            return {
                status: responseTime > 1000 ? 'degraded' : 'up',
                responseTime,
                details: stats,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.logger.error('Database health check failed:', error.stack, {
                context: 'HealthController',
                operation: 'database_health_check',
                responseTime,
            });
            return {
                status: 'down',
                responseTime,
                error: error.message,
            };
        }
    }
    async checkRedis() {
        const startTime = Date.now();
        try {
            const stats = await this.cacheService.getStats();
            const responseTime = Date.now() - startTime;
            if (!stats.connected) {
                return {
                    status: 'down',
                    responseTime,
                    error: 'Redis not connected',
                };
            }
            return {
                status: responseTime > 500 ? 'degraded' : 'up',
                responseTime,
                details: stats,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.logger.error('Redis health check failed:', error.stack, {
                context: 'HealthController',
                operation: 'redis_health_check',
                responseTime,
            });
            return {
                status: 'down',
                responseTime,
                error: error.message,
            };
        }
    }
    async checkExternalServices() {
        try {
            return {
                status: 'up',
                responseTime: 0,
                details: { message: 'No external services configured' },
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error.message,
            };
        }
    }
    async quickDatabaseCheck() {
        await this.prisma.$queryRaw `SELECT 1`;
    }
    async quickRedisCheck() {
        const stats = await this.cacheService.getStats();
        if (!stats.connected) {
            throw new Error('Redis not connected');
        }
    }
    async getDatabaseStats() {
        try {
            const [connectionCount, databaseSize] = await Promise.all([
                this.prisma.$queryRaw `SELECT count(*) as connections FROM pg_stat_activity WHERE state = 'active'`,
                this.prisma.$queryRaw `SELECT pg_size_pretty(pg_database_size(current_database())) as size`,
            ]);
            return {
                activeConnections: connectionCount[0]?.connections || 0,
                databaseSize: databaseSize[0]?.size || 'unknown',
            };
        }
        catch (error) {
            this.logger.warn('Failed to get database stats:', {
                context: 'HealthController',
                error: error.message,
            });
            return { error: 'Stats unavailable' };
        }
    }
    extractServiceHealth(result) {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        else {
            return {
                status: 'down',
                error: result.reason?.message || 'Unknown error',
            };
        }
    }
    determineOverallStatus(services) {
        const serviceStatuses = Object.values(services).map(service => service.status);
        if (serviceStatuses.includes('down')) {
            return 'unhealthy';
        }
        if (serviceStatuses.includes('degraded')) {
            return 'degraded';
        }
        return 'healthy';
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Comprehensive health check',
        description: 'Returns detailed health status of all system components including database, cache, and external services'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'System is healthy',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'], example: 'healthy' },
                        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
                        version: { type: 'string', example: '1.0.0' },
                        environment: { type: 'string', example: 'development' },
                        uptime: { type: 'number', example: 3600000 },
                        services: {
                            type: 'object',
                            properties: {
                                database: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', enum: ['up', 'down', 'degraded'], example: 'up' },
                                        responseTime: { type: 'number', example: 15 },
                                        details: { type: 'object' }
                                    }
                                },
                                redis: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', enum: ['up', 'down', 'degraded'], example: 'up' },
                                        responseTime: { type: 'number', example: 5 },
                                        details: { type: 'object' }
                                    }
                                }
                            }
                        },
                        metrics: {
                            type: 'object',
                            properties: {
                                memoryUsage: { type: 'object' },
                                cpuUsage: { type: 'object' }
                            }
                        }
                    }
                },
                timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'System is unhealthy',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                error: {
                    type: 'object',
                    properties: {
                        code: { type: 'string', example: 'SERVICE_UNHEALTHY' },
                        message: { type: 'string', example: 'One or more critical services are down' },
                        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
                    }
                }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, swagger_1.ApiOperation)({
        summary: 'Readiness probe',
        description: 'Kubernetes readiness probe endpoint - checks if service is ready to receive traffic'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is ready' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Service is not ready' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "readiness", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, swagger_1.ApiOperation)({
        summary: 'Liveness probe',
        description: 'Kubernetes liveness probe endpoint - checks if service is alive'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is alive' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "liveness", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        config_1.ConfigService,
        logger_service_1.CustomLoggerService])
], HealthController);
//# sourceMappingURL=health.controller.js.map