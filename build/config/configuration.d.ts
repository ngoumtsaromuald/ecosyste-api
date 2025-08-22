export interface AppConfig {
    port: number;
    nodeEnv: string;
    database: DatabaseConfig;
    redis: RedisConfig;
    elasticsearch: ElasticsearchConfig;
    jwt: JwtConfig;
    api: ApiConfig;
    rateLimit: RateLimitConfig;
    cache: CacheConfig;
    logging: LoggingConfig;
    security: SecurityConfig;
    monitoring: MonitoringConfig;
    performance: PerformanceConfig;
    ssl: SslConfig;
}
export interface DatabaseConfig {
    url: string;
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
}
export interface ElasticsearchConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
    indexPrefix: string;
    maxRetries: number;
    requestTimeout: number;
    indices: {
        resources: string;
        suggestions: string;
    };
    search: {
        cacheTtl: number;
        suggestionsCacheTtl: number;
        facetsCacheTtl: number;
        maxResults: number;
        defaultSize: number;
    };
}
export interface JwtConfig {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
}
export interface ApiConfig {
    prefix: string;
    corsOrigins: string[];
}
export interface RateLimitConfig {
    ttl: number;
    limit: number;
}
export interface CacheConfig {
    apiResourceTtl: number;
    categoriesTtl: number;
    searchTtl: number;
    userTtl: number;
}
export interface LoggingConfig {
    level: string;
    format: string;
}
export interface SecurityConfig {
    helmetEnabled: boolean;
    trustProxy: boolean;
}
export interface MonitoringConfig {
    metricsEnabled: boolean;
    healthCheckEnabled: boolean;
}
export interface PerformanceConfig {
    maxRequestSize: string;
    requestTimeout: number;
}
export interface SslConfig {
    enabled: boolean;
}
declare const _default: () => AppConfig;
export default _default;
