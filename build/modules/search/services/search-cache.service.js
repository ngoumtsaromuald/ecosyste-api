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
var SearchCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let SearchCacheService = SearchCacheService_1 = class SearchCacheService {
    get redisClient() {
        return this.redis;
    }
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SearchCacheService_1.name);
        this.redis = new ioredis_1.default({
            host: this.configService.get('redis.host') || 'localhost',
            port: this.configService.get('redis.port') || 6379,
            password: this.configService.get('redis.password') || undefined,
            db: this.configService.get('redis.db') || 0,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        this.redis.on('connect', () => {
            this.logger.log('Connected to Redis for search caching');
        });
        this.redis.on('error', (error) => {
            this.logger.error('Redis connection error:', error);
        });
    }
    async cacheSearchResults(key, results) {
        try {
            const ttl = this.configService.get('elasticsearch.search.cacheTtl');
            const cacheKey = this.buildCacheKey('search', key);
            await this.redis.setex(cacheKey, ttl, JSON.stringify(results));
            this.logger.debug(`Cached search results for key: ${key}`);
        }
        catch (error) {
            this.logger.error(`Failed to cache search results for key ${key}:`, error);
        }
    }
    async getCachedSearchResults(key) {
        try {
            const cacheKey = this.buildCacheKey('search', key);
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit for search key: ${key}`);
                return JSON.parse(cached);
            }
            this.logger.debug(`Cache miss for search key: ${key}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to get cached search results for key ${key}:`, error);
            return null;
        }
    }
    async cacheSuggestions(query, suggestions) {
        try {
            const ttl = this.configService.get('elasticsearch.search.suggestionsCacheTtl');
            const cacheKey = this.buildCacheKey('suggest', query);
            await this.redis.setex(cacheKey, ttl, JSON.stringify(suggestions));
            this.logger.debug(`Cached suggestions for query: ${query}`);
        }
        catch (error) {
            this.logger.error(`Failed to cache suggestions for query ${query}:`, error);
        }
    }
    async getCachedSuggestions(query) {
        try {
            const cacheKey = this.buildCacheKey('suggest', query);
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit for suggestions query: ${query}`);
                return JSON.parse(cached);
            }
            this.logger.debug(`Cache miss for suggestions query: ${query}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to get cached suggestions for query ${query}:`, error);
            return null;
        }
    }
    async cacheFacets(key, facets) {
        try {
            const ttl = this.configService.get('elasticsearch.search.facetsCacheTtl');
            const cacheKey = this.buildCacheKey('facets', key);
            await this.redis.setex(cacheKey, ttl, JSON.stringify(facets));
            this.logger.debug(`Cached facets for key: ${key}`);
        }
        catch (error) {
            this.logger.error(`Failed to cache facets for key ${key}:`, error);
        }
    }
    async getCachedFacets(key) {
        try {
            const cacheKey = this.buildCacheKey('facets', key);
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit for facets key: ${key}`);
                return JSON.parse(cached);
            }
            this.logger.debug(`Cache miss for facets key: ${key}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to get cached facets for key ${key}:`, error);
            return null;
        }
    }
    async cachePopularSearches(searches) {
        try {
            const ttl = this.configService.get('elasticsearch.search.facetsCacheTtl');
            const cacheKey = this.buildCacheKey('popular', 'searches');
            await this.redis.setex(cacheKey, ttl, JSON.stringify(searches));
            this.logger.debug('Cached popular searches');
        }
        catch (error) {
            this.logger.error('Failed to cache popular searches:', error);
        }
    }
    async getCachedPopularSearches() {
        try {
            const cacheKey = this.buildCacheKey('popular', 'searches');
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug('Cache hit for popular searches');
                return JSON.parse(cached);
            }
            this.logger.debug('Cache miss for popular searches');
            return null;
        }
        catch (error) {
            this.logger.error('Failed to get cached popular searches:', error);
            return null;
        }
    }
    async invalidateSearchCache(key) {
        try {
            const cacheKey = this.buildCacheKey('search', key);
            const result = await this.redis.del(cacheKey);
            if (result > 0) {
                this.logger.debug(`Invalidated search cache for key: ${key}`);
            }
            else {
                this.logger.debug(`No cache entry found for key: ${key}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to invalidate search cache for key ${key}:`, error);
        }
    }
    async invalidateByPattern(pattern) {
        try {
            const keys = await this.redis.keys(`${this.getCachePrefix()}:${pattern}`);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.logger.log(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to invalidate cache by pattern ${pattern}:`, error);
        }
    }
    async invalidateAllSearchCache() {
        try {
            await this.invalidateByPattern('search:*');
            await this.invalidateByPattern('suggest:*');
            await this.invalidateByPattern('facets:*');
            this.logger.log('Invalidated all search cache');
        }
        catch (error) {
            this.logger.error('Failed to invalidate all search cache:', error);
        }
    }
    async getCacheStats() {
        try {
            const info = await this.redis.info('memory');
            const keyspace = await this.redis.info('keyspace');
            const memoryUsed = info.match(/used_memory_human:([^\r\n]+)/)?.[1];
            const memoryPeak = info.match(/used_memory_peak_human:([^\r\n]+)/)?.[1];
            const dbInfo = keyspace.match(/db0:keys=(\d+),expires=(\d+)/);
            const totalKeys = dbInfo ? parseInt(dbInfo[1]) : 0;
            const keysWithExpiry = dbInfo ? parseInt(dbInfo[2]) : 0;
            const searchKeys = await this.redis.keys(`${this.getCachePrefix()}:*`);
            return {
                memory: {
                    used: memoryUsed,
                    peak: memoryPeak,
                },
                keys: {
                    total: totalKeys,
                    withExpiry: keysWithExpiry,
                    searchRelated: searchKeys.length,
                },
                connected: this.redis.status === 'ready',
            };
        }
        catch (error) {
            this.logger.error('Failed to get cache stats:', error);
            return {
                memory: { used: 'unknown', peak: 'unknown' },
                keys: { total: 0, withExpiry: 0, searchRelated: 0 },
                connected: false,
                error: error.message,
            };
        }
    }
    async testConnection() {
        try {
            const pong = await this.redis.ping();
            return pong === 'PONG';
        }
        catch (error) {
            this.logger.error('Cache connection test failed:', error);
            return false;
        }
    }
    buildCacheKey(type, key) {
        return `${this.getCachePrefix()}:${type}:${this.hashKey(key)}`;
    }
    getCachePrefix() {
        const prefix = this.configService.get('elasticsearch.indexPrefix') || 'romapi';
        return `${prefix}_search`;
    }
    hashKey(key) {
        if (key.length <= 100) {
            return key;
        }
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `${key.substring(0, 50)}_${Math.abs(hash).toString(36)}`;
    }
    async get(key) {
        try {
            return await this.redis.get(key);
        }
        catch (error) {
            this.logger.error(`Failed to get key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            if (ttl) {
                await this.redis.setex(key, ttl, value);
            }
            else {
                await this.redis.set(key, value);
            }
        }
        catch (error) {
            this.logger.error(`Failed to set key ${key}:`, error);
        }
    }
    async delete(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            this.logger.error(`Failed to delete key ${key}:`, error);
        }
    }
    async getInfo() {
        try {
            const info = await this.redis.info();
            return this.parseRedisInfo(info);
        }
        catch (error) {
            this.logger.error('Failed to get Redis info:', error);
            return { error: error.message };
        }
    }
    parseRedisInfo(info) {
        const result = {};
        const sections = info.split('\r\n\r\n');
        for (const section of sections) {
            const lines = section.split('\r\n');
            const sectionName = lines[0]?.replace('# ', '');
            if (sectionName) {
                result[sectionName] = {};
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    if (line && line.includes(':')) {
                        const [key, value] = line.split(':');
                        result[sectionName][key] = value;
                    }
                }
            }
        }
        return result;
    }
    async onModuleDestroy() {
        await this.redis.quit();
        this.logger.log('Closed Redis connection');
    }
};
exports.SearchCacheService = SearchCacheService;
exports.SearchCacheService = SearchCacheService = SearchCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SearchCacheService);
//# sourceMappingURL=search-cache.service.js.map