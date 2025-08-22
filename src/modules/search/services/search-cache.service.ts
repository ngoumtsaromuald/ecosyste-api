import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class SearchCacheService {
  private readonly logger = new Logger(SearchCacheService.name);
  private readonly redis: Redis;

  /**
   * Get Redis instance for advanced operations
   */
  get redisClient(): Redis {
    return this.redis;
  }

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
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

  /**
   * Cache search results
   */
  async cacheSearchResults(key: string, results: any): Promise<void> {
    try {
      const ttl = this.configService.get('elasticsearch.search.cacheTtl');
      const cacheKey = this.buildCacheKey('search', key);
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(results));
      this.logger.debug(`Cached search results for key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to cache search results for key ${key}:`, error);
    }
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(key: string): Promise<any | null> {
    try {
      const cacheKey = this.buildCacheKey('search', key);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        this.logger.debug(`Cache hit for search key: ${key}`);
        return JSON.parse(cached);
      }
      
      this.logger.debug(`Cache miss for search key: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to get cached search results for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Cache suggestions
   */
  async cacheSuggestions(query: string, suggestions: any[]): Promise<void> {
    try {
      const ttl = this.configService.get('elasticsearch.search.suggestionsCacheTtl');
      const cacheKey = this.buildCacheKey('suggest', query);
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(suggestions));
      this.logger.debug(`Cached suggestions for query: ${query}`);
    } catch (error) {
      this.logger.error(`Failed to cache suggestions for query ${query}:`, error);
    }
  }

  /**
   * Get cached suggestions
   */
  async getCachedSuggestions(query: string): Promise<any[] | null> {
    try {
      const cacheKey = this.buildCacheKey('suggest', query);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        this.logger.debug(`Cache hit for suggestions query: ${query}`);
        return JSON.parse(cached);
      }
      
      this.logger.debug(`Cache miss for suggestions query: ${query}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to get cached suggestions for query ${query}:`, error);
      return null;
    }
  }

  /**
   * Cache facets
   */
  async cacheFacets(key: string, facets: any): Promise<void> {
    try {
      const ttl = this.configService.get('elasticsearch.search.facetsCacheTtl');
      const cacheKey = this.buildCacheKey('facets', key);
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(facets));
      this.logger.debug(`Cached facets for key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to cache facets for key ${key}:`, error);
    }
  }

  /**
   * Get cached facets
   */
  async getCachedFacets(key: string): Promise<any | null> {
    try {
      const cacheKey = this.buildCacheKey('facets', key);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        this.logger.debug(`Cache hit for facets key: ${key}`);
        return JSON.parse(cached);
      }
      
      this.logger.debug(`Cache miss for facets key: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to get cached facets for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Cache popular searches
   */
  async cachePopularSearches(searches: any[]): Promise<void> {
    try {
      const ttl = this.configService.get('elasticsearch.search.facetsCacheTtl'); // Use same TTL as facets
      const cacheKey = this.buildCacheKey('popular', 'searches');
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(searches));
      this.logger.debug('Cached popular searches');
    } catch (error) {
      this.logger.error('Failed to cache popular searches:', error);
    }
  }

  /**
   * Get cached popular searches
   */
  async getCachedPopularSearches(): Promise<any[] | null> {
    try {
      const cacheKey = this.buildCacheKey('popular', 'searches');
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        this.logger.debug('Cache hit for popular searches');
        return JSON.parse(cached);
      }
      
      this.logger.debug('Cache miss for popular searches');
      return null;
    } catch (error) {
      this.logger.error('Failed to get cached popular searches:', error);
      return null;
    }
  }

  /**
   * Invalidate specific search cache entry
   */
  async invalidateSearchCache(key: string): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey('search', key);
      const result = await this.redis.del(cacheKey);
      
      if (result > 0) {
        this.logger.debug(`Invalidated search cache for key: ${key}`);
      } else {
        this.logger.debug(`No cache entry found for key: ${key}`);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate search cache for key ${key}:`, error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.getCachePrefix()}:${pattern}`);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate cache by pattern ${pattern}:`, error);
    }
  }

  /**
   * Invalidate all search cache
   */
  async invalidateAllSearchCache(): Promise<void> {
    try {
      await this.invalidateByPattern('search:*');
      await this.invalidateByPattern('suggest:*');
      await this.invalidateByPattern('facets:*');
      this.logger.log('Invalidated all search cache');
    } catch (error) {
      this.logger.error('Failed to invalidate all search cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      // Parse memory info
      const memoryUsed = info.match(/used_memory_human:([^\r\n]+)/)?.[1];
      const memoryPeak = info.match(/used_memory_peak_human:([^\r\n]+)/)?.[1];
      
      // Parse keyspace info
      const dbInfo = keyspace.match(/db0:keys=(\d+),expires=(\d+)/);
      const totalKeys = dbInfo ? parseInt(dbInfo[1]) : 0;
      const keysWithExpiry = dbInfo ? parseInt(dbInfo[2]) : 0;
      
      // Count search-related keys
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
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        memory: { used: 'unknown', peak: 'unknown' },
        keys: { total: 0, withExpiry: 0, searchRelated: 0 },
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Test cache connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch (error) {
      this.logger.error('Cache connection test failed:', error);
      return false;
    }
  }

  /**
   * Build cache key with prefix
   */
  private buildCacheKey(type: string, key: string): string {
    return `${this.getCachePrefix()}:${type}:${this.hashKey(key)}`;
  }

  /**
   * Get cache prefix
   */
  private getCachePrefix(): string {
    const prefix = this.configService.get('elasticsearch.indexPrefix') || 'romapi';
    return `${prefix}_search`;
  }

  /**
   * Hash long keys to avoid Redis key length limits
   */
  private hashKey(key: string): string {
    if (key.length <= 100) {
      return key;
    }
    
    // Simple hash for long keys
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `${key.substring(0, 50)}_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Generic get method for health checks
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      return null;
    }
  }

  /**
   * Generic set method for health checks
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
    }
  }

  /**
   * Generic delete method for health checks
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error);
    }
  }

  /**
   * Get Redis info for health checks
   */
  async getInfo(): Promise<any> {
    try {
      const info = await this.redis.info();
      return this.parseRedisInfo(info);
    } catch (error) {
      this.logger.error('Failed to get Redis info:', error);
      return { error: error.message };
    }
  }

  /**
   * Parse Redis info string into object
   */
  private parseRedisInfo(info: string): any {
    const result: any = {};
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

  /**
   * Close Redis connection
   */
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Closed Redis connection');
  }
}