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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = exports.CACHE_TTL = exports.CACHE_KEYS = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
exports.CACHE_KEYS = {
    API_RESOURCE: {
        BY_ID: (id) => `api-resource:${id}`,
        BY_SLUG: (slug) => `api-resource:slug:${slug}`,
        LIST: (filters) => `api-resources:list:${filters}`,
        SEARCH: (query) => `api-resources:search:${query}`,
    },
    CATEGORIES: 'categories:all',
    USER: {
        BY_ID: (id) => `user:${id}`,
        API_USAGE: (userId) => `api:usage:${userId}`,
    },
};
exports.CACHE_TTL = {
    API_RESOURCE: 3600,
    CATEGORIES: 86400,
    SEARCH: 1800,
    USER: 1800,
};
let CacheService = CacheService_1 = class CacheService {
    constructor(redis, configService) {
        this.redis = redis;
        this.configService = configService;
        this.logger = new common_1.Logger(CacheService_1.name);
    }
    getMetricsService() {
        if (!this.metricsService) {
            try {
                const { MetricsService } = require('../services/metrics.service');
                this.metricsService = global['metricsServiceInstance'] || null;
            }
            catch (error) {
                this.metricsService = null;
            }
        }
        return this.metricsService;
    }
    recordCacheMetrics(operation, result) {
        const metrics = this.getMetricsService();
        if (metrics) {
            metrics.recordCacheOperation(operation, 'redis', result);
        }
    }
    async get(key) {
        try {
            const value = await this.redis.get(key);
            if (value === null) {
                this.logger.debug(`Cache miss for key: ${key}`);
                this.recordCacheMetrics('get', 'miss');
                return null;
            }
            this.logger.debug(`Cache hit for key: ${key}`);
            this.recordCacheMetrics('get', 'hit');
            return JSON.parse(value);
        }
        catch (error) {
            this.logger.warn(`Cache get failed for key ${key}:`, error);
            this.recordCacheMetrics('get', 'error');
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            const serialized = JSON.stringify(value);
            if (ttl && ttl > 0) {
                await this.redis.setex(key, ttl, serialized);
                this.logger.debug(`Cache set with TTL ${ttl}s for key: ${key}`);
            }
            else {
                await this.redis.set(key, serialized);
                this.logger.debug(`Cache set (no TTL) for key: ${key}`);
            }
            this.recordCacheMetrics('set', 'success');
        }
        catch (error) {
            this.logger.warn(`Cache set failed for key ${key}:`, error);
            this.recordCacheMetrics('set', 'error');
        }
    }
    async del(key) {
        try {
            const result = await this.redis.del(key);
            this.logger.debug(`Cache delete for key: ${key}, deleted: ${result}`);
            this.recordCacheMetrics('del', 'success');
        }
        catch (error) {
            this.logger.warn(`Cache delete failed for key ${key}:`, error);
            this.recordCacheMetrics('del', 'error');
        }
    }
    async invalidatePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.logger.debug(`Cache invalidated ${keys.length} keys matching pattern: ${pattern}`);
            }
            else {
                this.logger.debug(`No keys found matching pattern: ${pattern}`);
            }
        }
        catch (error) {
            this.logger.warn(`Cache invalidation failed for pattern ${pattern}:`, error);
        }
    }
    async exists(key) {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            this.logger.warn(`Cache exists check failed for key ${key}:`, error);
            return false;
        }
    }
    async ttl(key) {
        try {
            return await this.redis.ttl(key);
        }
        catch (error) {
            this.logger.warn(`Cache TTL check failed for key ${key}:`, error);
            return -1;
        }
    }
    async expire(key, ttl) {
        try {
            await this.redis.expire(key, ttl);
            this.logger.debug(`Cache expiration set to ${ttl}s for key: ${key}`);
        }
        catch (error) {
            this.logger.warn(`Cache expire failed for key ${key}:`, error);
        }
    }
    async increment(key, value = 1) {
        try {
            const result = await this.redis.incrby(key, value);
            this.logger.debug(`Cache increment by ${value} for key: ${key}, new value: ${result}`);
            return result;
        }
        catch (error) {
            this.logger.warn(`Cache increment failed for key ${key}:`, error);
            return 0;
        }
    }
    async getStats() {
        try {
            const info = await this.redis.info('memory');
            const keyCount = await this.redis.dbsize();
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';
            return {
                connected: this.redis.status === 'ready',
                keyCount,
                memoryUsage,
            };
        }
        catch (error) {
            this.logger.warn('Failed to get cache stats:', error);
            return {
                connected: false,
                keyCount: 0,
                memoryUsage: 'unknown',
            };
        }
    }
    async getOrSet(key, factory, ttl) {
        try {
            const cached = await this.get(key);
            if (cached !== null) {
                this.logger.debug(`Cache hit for getOrSet key: ${key}`);
                return cached;
            }
            this.logger.debug(`Cache miss for getOrSet key: ${key}, calling factory`);
            const value = await factory();
            await this.set(key, value, ttl);
            return value;
        }
        catch (error) {
            this.logger.error(`getOrSet failed for key ${key}:`, error);
            try {
                return await factory();
            }
            catch (factoryError) {
                this.logger.error(`Factory function failed for key ${key}:`, factoryError);
                throw factoryError;
            }
        }
    }
    async getOrSetWithTtl(key, factory, dataType) {
        const ttl = this.getTtlForDataType(dataType);
        return this.getOrSet(key, factory, ttl);
    }
    getTtlForDataType(dataType) {
        const configTtl = this.configService.get(`cache.${dataType.toLowerCase()}Ttl`);
        return configTtl || exports.CACHE_TTL[dataType];
    }
    async clear() {
        try {
            await this.redis.flushdb();
            this.logger.warn('Cache cleared (all keys deleted)');
        }
        catch (error) {
            this.logger.error('Cache clear failed:', error);
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.default,
        config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map