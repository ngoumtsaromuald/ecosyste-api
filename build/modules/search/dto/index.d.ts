export * from './search.dto';
export * from './suggestion.dto';
export * from './analytics.dto';
export declare class HealthCheckParamsDto {
    component?: string;
    detailed?: boolean;
}
export declare class CacheParamsDto {
    key: string;
    ttl?: number;
}
export declare class RateLimitParamsDto {
    identifier: string;
    windowMs?: number;
    maxRequests?: number;
}
