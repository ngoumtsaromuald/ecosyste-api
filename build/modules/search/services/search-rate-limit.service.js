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
var SearchRateLimitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchRateLimitService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
const auth_service_1 = require("../../../auth/services/auth.service");
const jwt_service_1 = require("../../../auth/services/jwt.service");
let SearchRateLimitService = SearchRateLimitService_1 = class SearchRateLimitService {
    constructor(configService, authService, jwtService) {
        this.configService = configService;
        this.authService = authService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(SearchRateLimitService_1.name);
        this.redis = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_SEARCH_RATE_LIMIT_DB', 2),
            maxRetriesPerRequest: 3,
            lazyConnect: true
        });
        this.config = {
            authenticatedUser: {
                search: {
                    requests: this.configService.get('RATE_LIMIT_AUTH_SEARCH_REQUESTS', 1000),
                    window: this.configService.get('RATE_LIMIT_AUTH_SEARCH_WINDOW', 3600)
                },
                suggest: {
                    requests: this.configService.get('RATE_LIMIT_AUTH_SUGGEST_REQUESTS', 2000),
                    window: this.configService.get('RATE_LIMIT_AUTH_SUGGEST_WINDOW', 3600)
                },
                analytics: {
                    requests: this.configService.get('RATE_LIMIT_AUTH_ANALYTICS_REQUESTS', 100),
                    window: this.configService.get('RATE_LIMIT_AUTH_ANALYTICS_WINDOW', 3600)
                }
            },
            anonymous: {
                search: {
                    requests: this.configService.get('RATE_LIMIT_ANON_SEARCH_REQUESTS', 100),
                    window: this.configService.get('RATE_LIMIT_ANON_SEARCH_WINDOW', 3600)
                },
                suggest: {
                    requests: this.configService.get('RATE_LIMIT_ANON_SUGGEST_REQUESTS', 200),
                    window: this.configService.get('RATE_LIMIT_ANON_SUGGEST_WINDOW', 3600)
                },
                analytics: {
                    requests: this.configService.get('RATE_LIMIT_ANON_ANALYTICS_REQUESTS', 10),
                    window: this.configService.get('RATE_LIMIT_ANON_ANALYTICS_WINDOW', 3600)
                }
            },
            session: {
                search: {
                    requests: this.configService.get('RATE_LIMIT_SESSION_SEARCH_REQUESTS', 500),
                    window: this.configService.get('RATE_LIMIT_SESSION_SEARCH_WINDOW', 3600)
                },
                suggest: {
                    requests: this.configService.get('RATE_LIMIT_SESSION_SUGGEST_REQUESTS', 1000),
                    window: this.configService.get('RATE_LIMIT_SESSION_SUGGEST_WINDOW', 3600)
                }
            },
            global: {
                search: {
                    requests: this.configService.get('RATE_LIMIT_GLOBAL_SEARCH_REQUESTS', 10000),
                    window: this.configService.get('RATE_LIMIT_GLOBAL_SEARCH_WINDOW', 60)
                },
                suggest: {
                    requests: this.configService.get('RATE_LIMIT_GLOBAL_SUGGEST_REQUESTS', 20000),
                    window: this.configService.get('RATE_LIMIT_GLOBAL_SUGGEST_WINDOW', 60)
                }
            },
            premium: {
                search: {
                    requests: this.configService.get('RATE_LIMIT_PREMIUM_SEARCH_REQUESTS', 5000),
                    window: this.configService.get('RATE_LIMIT_PREMIUM_SEARCH_WINDOW', 3600)
                },
                suggest: {
                    requests: this.configService.get('RATE_LIMIT_PREMIUM_SUGGEST_REQUESTS', 10000),
                    window: this.configService.get('RATE_LIMIT_PREMIUM_SUGGEST_WINDOW', 3600)
                },
                analytics: {
                    requests: this.configService.get('RATE_LIMIT_PREMIUM_ANALYTICS_REQUESTS', 1000),
                    window: this.configService.get('RATE_LIMIT_PREMIUM_ANALYTICS_WINDOW', 3600)
                }
            }
        };
        this.initializeRedis();
    }
    async initializeRedis() {
        try {
            await this.redis.connect();
            this.logger.log('Connected to Redis for rate limiting');
        }
        catch (error) {
            this.logger.error('Failed to connect to Redis for rate limiting', error);
        }
    }
    async checkRateLimit(context) {
        try {
            const checks = await Promise.all([
                this.checkGlobalLimit(context),
                this.checkUserLimit(context),
                this.checkSessionLimit(context),
                this.checkIPLimit(context)
            ]);
            const failedCheck = checks.find(check => !check.allowed);
            if (failedCheck) {
                this.logger.warn(`Rate limit exceeded: ${failedCheck.limitType} for ${context.operationType}`, {
                    userId: context.userId,
                    sessionId: context.sessionId,
                    ipAddress: context.ipAddress,
                    endpoint: context.endpoint
                });
                return failedCheck;
            }
            const mostRestrictive = checks.reduce((prev, current) => current.remaining < prev.remaining ? current : prev);
            return mostRestrictive;
        }
        catch (error) {
            this.logger.error(`Rate limit check failed: ${error.message}`, error.stack);
            return {
                allowed: true,
                remaining: 1000,
                resetTime: new Date(Date.now() + 3600000),
                limitType: 'fallback',
                limitValue: 1000
            };
        }
    }
    async checkRateLimitAndThrow(context) {
        const result = await this.checkRateLimit(context);
        if (!result.allowed) {
            throw new common_1.HttpException({
                message: 'Limite de taux dépassée',
                limitType: result.limitType,
                remaining: result.remaining,
                resetTime: result.resetTime,
                retryAfter: result.retryAfter,
                endpoint: context.endpoint,
                operationType: context.operationType
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return result;
    }
    async checkGlobalLimit(context) {
        const operationType = this.mapOperationType(context.operationType);
        const limit = this.config.global[operationType];
        if (!limit) {
            return this.createAllowedResult('global', 1000000);
        }
        const key = `global:${operationType}`;
        return this.checkLimit(key, limit.requests, limit.window, 'global');
    }
    async checkUserLimit(context) {
        if (!context.userId || !context.isAuthenticated) {
            return this.createAllowedResult('user', 1000000);
        }
        const operationType = this.mapOperationType(context.operationType);
        const userTier = context.userTier || 'free';
        let limit;
        if (userTier === 'premium' || userTier === 'enterprise') {
            limit = this.config.premium[operationType];
        }
        else {
            limit = this.config.authenticatedUser[operationType];
        }
        if (!limit) {
            return this.createAllowedResult('user', 1000000);
        }
        const key = `user:${context.userId}:${operationType}`;
        return this.checkLimit(key, limit.requests, limit.window, `user-${userTier}`);
    }
    async checkSessionLimit(context) {
        if (!context.sessionId) {
            return this.createAllowedResult('session', 1000000);
        }
        const operationType = this.mapOperationType(context.operationType);
        const limit = this.config.session[operationType];
        if (!limit) {
            return this.createAllowedResult('session', 1000000);
        }
        const key = `session:${context.sessionId}:${operationType}`;
        return this.checkLimit(key, limit.requests, limit.window, 'session');
    }
    async checkIPLimit(context) {
        if (context.isAuthenticated) {
            return this.createAllowedResult('ip', 1000000);
        }
        const operationType = this.mapOperationType(context.operationType);
        const limit = this.config.anonymous[operationType];
        if (!limit) {
            return this.createAllowedResult('ip', 1000000);
        }
        const key = `ip:${context.ipAddress}:${operationType}`;
        return this.checkLimit(key, limit.requests, limit.window, 'ip');
    }
    async checkLimit(key, maxRequests, windowSeconds, limitType) {
        const now = Date.now();
        const windowStart = now - (windowSeconds * 1000);
        const pipeline = this.redis.pipeline();
        pipeline.zremrangebyscore(key, 0, windowStart);
        pipeline.zcard(key);
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        pipeline.expire(key, windowSeconds);
        const results = await pipeline.exec();
        if (!results || results.some(([err]) => err)) {
            throw new Error('Redis pipeline failed');
        }
        const currentCount = results[1][1];
        const remaining = Math.max(0, maxRequests - currentCount - 1);
        const resetTime = new Date(now + (windowSeconds * 1000));
        const allowed = currentCount < maxRequests;
        if (!allowed) {
            await this.redis.zrem(key, `${now}-${Math.random()}`);
            return {
                allowed: false,
                remaining: 0,
                resetTime,
                retryAfter: Math.ceil(windowSeconds / 2),
                limitType,
                limitValue: maxRequests
            };
        }
        return {
            allowed: true,
            remaining,
            resetTime,
            limitType,
            limitValue: maxRequests
        };
    }
    mapOperationType(operationType) {
        switch (operationType) {
            case 'search':
            case 'category':
            case 'multi-type':
                return 'search';
            case 'suggest':
                return 'suggest';
            case 'analytics':
                return 'analytics';
            default:
                return 'search';
        }
    }
    createAllowedResult(limitType, limitValue) {
        return {
            allowed: true,
            remaining: limitValue,
            resetTime: new Date(Date.now() + 3600000),
            limitType,
            limitValue
        };
    }
    async getRateLimitStats(userId, sessionId, ipAddress) {
        try {
            const stats = {};
            if (userId) {
                const userKeys = await this.redis.keys(`user:${userId}:*`);
                for (const key of userKeys) {
                    const count = await this.redis.zcard(key);
                    const operationType = key.split(':')[2];
                    stats[`user_${operationType}`] = count;
                }
            }
            if (sessionId) {
                const sessionKeys = await this.redis.keys(`session:${sessionId}:*`);
                for (const key of sessionKeys) {
                    const count = await this.redis.zcard(key);
                    const operationType = key.split(':')[2];
                    stats[`session_${operationType}`] = count;
                }
            }
            if (ipAddress) {
                const ipKeys = await this.redis.keys(`ip:${ipAddress}:*`);
                for (const key of ipKeys) {
                    const count = await this.redis.zcard(key);
                    const operationType = key.split(':')[2];
                    stats[`ip_${operationType}`] = count;
                }
            }
            return stats;
        }
        catch (error) {
            this.logger.error(`Failed to get rate limit stats: ${error.message}`, error.stack);
            return {};
        }
    }
    async resetRateLimits(userId, sessionId, ipAddress) {
        try {
            const keysToDelete = [];
            if (userId) {
                const userKeys = await this.redis.keys(`user:${userId}:*`);
                keysToDelete.push(...userKeys);
            }
            if (sessionId) {
                const sessionKeys = await this.redis.keys(`session:${sessionId}:*`);
                keysToDelete.push(...sessionKeys);
            }
            if (ipAddress) {
                const ipKeys = await this.redis.keys(`ip:${ipAddress}:*`);
                keysToDelete.push(...ipKeys);
            }
            if (keysToDelete.length > 0) {
                await this.redis.del(...keysToDelete);
                this.logger.log(`Reset rate limits for ${keysToDelete.length} keys`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to reset rate limits: ${error.message}`, error.stack);
            throw error;
        }
    }
    getRateLimitConfig() {
        return { ...this.config };
    }
    updateRateLimitConfig(newConfig) {
        Object.assign(this.config, newConfig);
        this.logger.log('Rate limit configuration updated');
    }
    async healthCheck() {
        try {
            await this.redis.ping();
            return {
                status: 'healthy',
                redis: 'connected',
                config: !!this.config
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                redis: 'disconnected',
                config: !!this.config
            };
        }
    }
    async enrichContextWithAuth(context, authToken) {
        try {
            if (authToken && !context.userId) {
                const payload = await this.jwtService.validateToken(authToken);
                if (payload && payload.sub) {
                    context.userId = payload.sub;
                    context.isAuthenticated = true;
                    const user = await this.authService['userRepository'].findById(payload.sub);
                    if (user) {
                        context.userTier = this.determineUserTier(user);
                    }
                }
            }
            return context;
        }
        catch (error) {
            this.logger.warn(`Failed to enrich context with auth: ${error.message}`);
            return context;
        }
    }
    determineUserTier(user) {
        if (user.subscription?.plan === 'enterprise') {
            return 'enterprise';
        }
        if (user.subscription?.plan === 'premium' || user.isPremium) {
            return 'premium';
        }
        return 'free';
    }
    async checkRateLimitWithAuth(context, authToken) {
        const enrichedContext = await this.enrichContextWithAuth({ ...context, isAuthenticated: false }, authToken);
        return this.checkRateLimit(enrichedContext);
    }
    async checkApiKeyRateLimit(apiKey, operationType, endpoint, ipAddress) {
        try {
            const apiKeyInfo = { id: apiKey, tier: 'free' };
            if (!apiKeyInfo) {
                throw new common_1.HttpException({
                    message: 'API key invalide',
                    limitType: 'invalid_api_key',
                    remaining: 0,
                    resetTime: new Date()
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            const limits = this.getApiKeyLimits(apiKeyInfo);
            const operationLimit = limits[this.mapOperationType(operationType)];
            if (!operationLimit) {
                return this.createAllowedResult('api_key', 1000000);
            }
            const key = `api_key:${apiKey}:${operationType}`;
            const result = await this.checkLimit(key, operationLimit.requests, operationLimit.window, 'api_key');
            this.logApiKeyUsage(apiKey, operationType, endpoint, ipAddress, result);
            return result;
        }
        catch (error) {
            this.logger.error(`API key rate limit check failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    getApiKeyLimits(apiKeyInfo) {
        const tier = apiKeyInfo.tier || 'free';
        const limits = {
            free: {
                search: { requests: 500, window: 3600 },
                suggest: { requests: 1000, window: 3600 },
                analytics: { requests: 50, window: 3600 }
            },
            premium: {
                search: { requests: 5000, window: 3600 },
                suggest: { requests: 10000, window: 3600 },
                analytics: { requests: 1000, window: 3600 }
            },
            enterprise: {
                search: { requests: 50000, window: 3600 },
                suggest: { requests: 100000, window: 3600 },
                analytics: { requests: 10000, window: 3600 }
            }
        };
        return limits[tier] || limits.free;
    }
    async logApiKeyUsage(apiKey, operationType, endpoint, ipAddress, result) {
        try {
            const logKey = `api_key_usage:${apiKey}:${new Date().toISOString().split('T')[0]}`;
            const logData = {
                timestamp: new Date().toISOString(),
                operationType,
                endpoint,
                ipAddress,
                allowed: result.allowed,
                remaining: result.remaining
            };
            await this.redis.lpush(logKey, JSON.stringify(logData));
            await this.redis.expire(logKey, 86400 * 30);
        }
        catch (error) {
            this.logger.warn(`Failed to log API key usage: ${error.message}`);
        }
    }
    async getApiKeyUsageStats(apiKey, days = 7) {
        try {
            const stats = {};
            const today = new Date();
            for (let i = 0; i < days; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                const logKey = `api_key_usage:${apiKey}:${dateKey}`;
                const logs = await this.redis.lrange(logKey, 0, -1);
                const dayStats = {
                    date: dateKey,
                    totalRequests: logs.length,
                    allowedRequests: 0,
                    blockedRequests: 0,
                    operationTypes: {}
                };
                logs.forEach(log => {
                    try {
                        const data = JSON.parse(log);
                        if (data.allowed) {
                            dayStats.allowedRequests++;
                        }
                        else {
                            dayStats.blockedRequests++;
                        }
                        dayStats.operationTypes[data.operationType] =
                            (dayStats.operationTypes[data.operationType] || 0) + 1;
                    }
                    catch (e) {
                    }
                });
                stats[dateKey] = dayStats;
            }
            return stats;
        }
        catch (error) {
            this.logger.error(`Failed to get API key usage stats: ${error.message}`, error.stack);
            return {};
        }
    }
    async checkDynamicRateLimit(context) {
        try {
            const systemLoad = await this.getSystemLoad();
            const adjustedContext = this.adjustLimitsForLoad(context, systemLoad);
            return this.checkRateLimit(adjustedContext);
        }
        catch (error) {
            this.logger.error(`Dynamic rate limit check failed: ${error.message}`, error.stack);
            return this.checkRateLimit(context);
        }
    }
    async getSystemLoad() {
        try {
            const start = Date.now();
            await this.redis.ping();
            const redisLatency = Date.now() - start;
            const redisInfo = await this.redis.info('memory');
            const memoryMatch = redisInfo.match(/used_memory:(\d+)/);
            const maxMemoryMatch = redisInfo.match(/maxmemory:(\d+)/);
            const usedMemory = memoryMatch ? parseInt(memoryMatch[1]) : 0;
            const maxMemory = maxMemoryMatch ? parseInt(maxMemoryMatch[1]) : 1;
            const memoryUsage = maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;
            return {
                cpu: 0,
                memory: memoryUsage,
                redis: redisLatency
            };
        }
        catch (error) {
            this.logger.warn(`Failed to get system load: ${error.message}`);
            return { cpu: 0, memory: 0, redis: 0 };
        }
    }
    adjustLimitsForLoad(context, load) {
        if (load.memory > 80 || load.redis > 100) {
            const adjustedConfig = { ...this.config };
            Object.keys(adjustedConfig).forEach(tier => {
                Object.keys(adjustedConfig[tier]).forEach(operation => {
                    if (adjustedConfig[tier][operation].requests) {
                        adjustedConfig[tier][operation].requests =
                            Math.floor(adjustedConfig[tier][operation].requests * 0.5);
                    }
                });
            });
            return { ...context };
        }
        return context;
    }
    async temporaryBlock(identifier, type, duration = 3600, reason = 'Rate limit violation') {
        try {
            const blockKey = `blocked:${type}:${identifier}`;
            const blockData = {
                blockedAt: new Date().toISOString(),
                reason,
                duration,
                expiresAt: new Date(Date.now() + duration * 1000).toISOString()
            };
            await this.redis.setex(blockKey, duration, JSON.stringify(blockData));
            this.logger.warn(`Temporarily blocked ${type} ${identifier} for ${duration}s: ${reason}`);
        }
        catch (error) {
            this.logger.error(`Failed to apply temporary block: ${error.message}`, error.stack);
        }
    }
    async isTemporarilyBlocked(identifier, type) {
        try {
            const blockKey = `blocked:${type}:${identifier}`;
            const blockData = await this.redis.get(blockKey);
            return !!blockData;
        }
        catch (error) {
            this.logger.error(`Failed to check temporary block: ${error.message}`, error.stack);
            return false;
        }
    }
    async getBlockInfo(identifier, type) {
        try {
            const blockKey = `blocked:${type}:${identifier}`;
            const blockData = await this.redis.get(blockKey);
            if (blockData) {
                return JSON.parse(blockData);
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to get block info: ${error.message}`, error.stack);
            return null;
        }
    }
    async removeTemporaryBlock(identifier, type) {
        try {
            const blockKey = `blocked:${type}:${identifier}`;
            await this.redis.del(blockKey);
            this.logger.log(`Removed temporary block for ${type} ${identifier}`);
        }
        catch (error) {
            this.logger.error(`Failed to remove temporary block: ${error.message}`, error.stack);
        }
    }
    async onModuleDestroy() {
        try {
            await this.redis.quit();
            this.logger.log('Redis connection closed for rate limiting');
        }
        catch (error) {
            this.logger.error('Error closing Redis connection', error);
        }
    }
};
exports.SearchRateLimitService = SearchRateLimitService;
exports.SearchRateLimitService = SearchRateLimitService = SearchRateLimitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        auth_service_1.AuthService,
        jwt_service_1.JWTService])
], SearchRateLimitService);
//# sourceMappingURL=search-rate-limit.service.js.map