import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Cache Keys Strategy
export const CACHE_KEYS = {
  API_RESOURCE: {
    BY_ID: (id: string) => `api-resource:${id}`,
    BY_SLUG: (slug: string) => `api-resource:slug:${slug}`,
    LIST: (filters: string) => `api-resources:list:${filters}`,
    SEARCH: (query: string) => `api-resources:search:${query}`,
  },
  CATEGORIES: 'categories:all',
  USER: {
    BY_ID: (id: string) => `user:${id}`,
    API_USAGE: (userId: string) => `api:usage:${userId}`,
  },
} as const;

// Cache TTL Configuration
export const CACHE_TTL = {
  API_RESOURCE: 3600, // 1 hour
  CATEGORIES: 86400, // 24 hours
  SEARCH: 1800, // 30 minutes
  USER: 1800, // 30 minutes
} as const;

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private metricsService: any; // Lazy loaded to avoid circular dependency

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  // Lazy load metrics service to avoid circular dependency
  private getMetricsService() {
    if (!this.metricsService) {
      try {
        // Use require to avoid circular dependency issues
        const { MetricsService } = require('../services/metrics.service');
        // This will be null if MetricsService is not available
        this.metricsService = global['metricsServiceInstance'] || null;
      } catch (error) {
        // MetricsService not available, continue without metrics
        this.metricsService = null;
      }
    }
    return this.metricsService;
  }

  private recordCacheMetrics(operation: 'get' | 'set' | 'del', result: 'hit' | 'miss' | 'success' | 'error') {
    const metrics = this.getMetricsService();
    if (metrics) {
      metrics.recordCacheOperation(operation, 'redis', result);
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        this.logger.debug(`Cache miss for key: ${key}`);
        this.recordCacheMetrics('get', 'miss');
        return null;
      }
      
      this.logger.debug(`Cache hit for key: ${key}`);
      this.recordCacheMetrics('get', 'hit');
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(`Cache get failed for key ${key}:`, error);
      this.recordCacheMetrics('get', 'error');
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttl && ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
        this.logger.debug(`Cache set with TTL ${ttl}s for key: ${key}`);
      } else {
        await this.redis.set(key, serialized);
        this.logger.debug(`Cache set (no TTL) for key: ${key}`);
      }
      this.recordCacheMetrics('set', 'success');
    } catch (error) {
      this.logger.warn(`Cache set failed for key ${key}:`, error);
      this.recordCacheMetrics('set', 'error');
      // Don't throw error to avoid breaking the application
    }
  }

  /**
   * Delete a specific key from cache
   */
  async del(key: string): Promise<void> {
    try {
      const result = await this.redis.del(key);
      this.logger.debug(`Cache delete for key: ${key}, deleted: ${result}`);
      this.recordCacheMetrics('del', 'success');
    } catch (error) {
      this.logger.warn(`Cache delete failed for key ${key}:`, error);
      this.recordCacheMetrics('del', 'error');
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache invalidated ${keys.length} keys matching pattern: ${pattern}`);
      } else {
        this.logger.debug(`No keys found matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.warn(`Cache invalidation failed for pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.warn(`Cache exists check failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.warn(`Cache TTL check failed for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Set expiration for an existing key
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
      this.logger.debug(`Cache expiration set to ${ttl}s for key: ${key}`);
    } catch (error) {
      this.logger.warn(`Cache expire failed for key ${key}:`, error);
    }
  }

  /**
   * Increment a numeric value in cache
   */
  async increment(key: string, value: number = 1): Promise<number> {
    try {
      const result = await this.redis.incrby(key, value);
      this.logger.debug(`Cache increment by ${value} for key: ${key}, new value: ${result}`);
      return result;
    } catch (error) {
      this.logger.warn(`Cache increment failed for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage: string;
  }> {
    try {
      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();
      
      // Parse memory usage from info string
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return {
        connected: this.redis.status === 'ready',
        keyCount,
        memoryUsage,
      };
    } catch (error) {
      this.logger.warn('Failed to get cache stats:', error);
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: 'unknown',
      };
    }
  }

  /**
   * Get value from cache or set it using factory function (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        this.logger.debug(`Cache hit for getOrSet key: ${key}`);
        return cached;
      }

      // Cache miss - use factory to get value
      this.logger.debug(`Cache miss for getOrSet key: ${key}, calling factory`);
      const value = await factory();

      // Store in cache for future requests
      await this.set(key, value, ttl);
      
      return value;
    } catch (error) {
      this.logger.error(`getOrSet failed for key ${key}:`, error);
      // If cache operations fail, still try to get value from factory
      try {
        return await factory();
      } catch (factoryError) {
        this.logger.error(`Factory function failed for key ${key}:`, factoryError);
        throw factoryError;
      }
    }
  }

  /**
   * Get value from cache or set it using factory function with configurable TTL based on data type
   */
  async getOrSetWithTtl<T>(
    key: string,
    factory: () => Promise<T>,
    dataType: keyof typeof CACHE_TTL,
  ): Promise<T> {
    const ttl = this.getTtlForDataType(dataType);
    return this.getOrSet(key, factory, ttl);
  }

  /**
   * Get TTL configuration for specific data type
   */
  private getTtlForDataType(dataType: keyof typeof CACHE_TTL): number {
    const configTtl = this.configService.get(`cache.${dataType.toLowerCase()}Ttl`);
    return configTtl || CACHE_TTL[dataType];
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.warn('Cache cleared (all keys deleted)');
    } catch (error) {
      this.logger.error('Cache clear failed:', error);
    }
  }
}