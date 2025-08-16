import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare const CACHE_KEYS: {
    readonly API_RESOURCE: {
        readonly BY_ID: (id: string) => string;
        readonly BY_SLUG: (slug: string) => string;
        readonly LIST: (filters: string) => string;
        readonly SEARCH: (query: string) => string;
    };
    readonly CATEGORIES: "categories:all";
    readonly USER: {
        readonly BY_ID: (id: string) => string;
        readonly API_USAGE: (userId: string) => string;
    };
};
export declare const CACHE_TTL: {
    readonly API_RESOURCE: 3600;
    readonly CATEGORIES: 86400;
    readonly SEARCH: 1800;
    readonly USER: 1800;
};
export declare class CacheService {
    private readonly redis;
    private readonly configService;
    private readonly logger;
    private metricsService;
    constructor(redis: Redis, configService: ConfigService);
    private getMetricsService;
    private recordCacheMetrics;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    invalidatePattern(pattern: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    expire(key: string, ttl: number): Promise<void>;
    increment(key: string, value?: number): Promise<number>;
    getStats(): Promise<{
        connected: boolean;
        keyCount: number;
        memoryUsage: string;
    }>;
    getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
    getOrSetWithTtl<T>(key: string, factory: () => Promise<T>, dataType: keyof typeof CACHE_TTL): Promise<T>;
    private getTtlForDataType;
    clear(): Promise<void>;
}
