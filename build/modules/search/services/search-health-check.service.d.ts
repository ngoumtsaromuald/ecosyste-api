import { ElasticsearchService } from './elasticsearch.service';
import { SearchCacheService } from './search-cache.service';
import { IndexingService } from './indexing.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { SearchMetricsService } from './search-metrics.service';
export interface SearchHealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Date;
    uptime: number;
    checks: {
        elasticsearch: SearchComponentHealth;
        redis: SearchComponentHealth;
        indexing: SearchComponentHealth;
        analytics: SearchComponentHealth;
        cache: SearchComponentHealth;
    };
    metrics: SearchHealthMetrics;
    alerts: SearchHealthAlert[];
}
export interface SearchComponentHealth {
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    lastCheck: Date;
    error?: string;
    details?: Record<string, any>;
}
export interface SearchHealthMetrics {
    totalSearches: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    indexHealth: string;
    activeConnections: number;
}
export interface SearchHealthAlert {
    level: 'warning' | 'critical';
    component: string;
    message: string;
    timestamp: Date;
    threshold?: number;
    currentValue?: number;
}
export declare class SearchHealthCheckService {
    private readonly elasticsearchService;
    private readonly cacheService;
    private readonly indexingService;
    private readonly analyticsService;
    private readonly metricsService;
    private readonly logger;
    private readonly startTime;
    private healthHistory;
    private readonly maxHistorySize;
    private readonly thresholds;
    constructor(elasticsearchService: ElasticsearchService, cacheService: SearchCacheService, indexingService: IndexingService, analyticsService: SearchAnalyticsService, metricsService: SearchMetricsService);
    performHealthCheck(): Promise<SearchHealthStatus>;
    private checkElasticsearch;
    private checkRedis;
    private checkIndexing;
    private checkAnalytics;
    private checkCache;
    private collectHealthMetrics;
    private generateAlerts;
    private determineOverallStatus;
    private extractHealthResult;
    private addToHistory;
    private updateHealthMetrics;
    getHealthHistory(limit?: number): SearchHealthStatus[];
    getCurrentAlerts(): SearchHealthAlert[];
    isHealthy(): Promise<boolean>;
}
