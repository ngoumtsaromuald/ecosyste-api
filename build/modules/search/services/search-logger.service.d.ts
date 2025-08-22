import { ConfigService } from '@nestjs/config';
import { SearchParams, SearchResults } from '../interfaces/search.interfaces';
export interface SearchContext {
    searchId: string;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    ipAddress?: string;
    timestamp: Date;
    query?: string;
    filters?: any;
    resultsCount?: number;
    took?: number;
    language?: string;
    personalized?: boolean;
    cached?: boolean;
    errorCode?: string;
    errorMessage?: string;
    traceId?: string;
    spanId?: string;
}
export interface SearchDebugInfo {
    elasticsearchQuery: any;
    cacheKey?: string;
    cacheHit?: boolean;
    fallbackUsed?: boolean;
    personalizationApplied?: boolean;
    languageDetected?: string;
    geoLocation?: {
        latitude?: number;
        longitude?: number;
        city?: string;
        region?: string;
    };
    performance: {
        totalTime: number;
        elasticsearchTime?: number;
        cacheTime?: number;
        processingTime?: number;
    };
}
export declare class SearchLoggerService {
    private readonly configService;
    private readonly logger;
    private readonly tracer;
    private readonly debugMode;
    constructor(configService: ConfigService);
    logSearchEvent(event: 'search_started' | 'search_completed' | 'search_failed' | 'suggestion_requested' | 'cache_hit' | 'cache_miss', searchContext: SearchContext, debugInfo?: Partial<SearchDebugInfo>): void;
    createSearchSpan<T>(operationName: string, searchContext: SearchContext, operation: (span: any) => Promise<T>): Promise<T>;
    logPerformanceMetrics(searchContext: SearchContext, debugInfo: SearchDebugInfo): void;
    logDebugInfo(searchContext: SearchContext, debugInfo: SearchDebugInfo): void;
    logSearchError(error: Error, searchContext: SearchContext, debugInfo?: Partial<SearchDebugInfo>): void;
    generateSearchId(): string;
    createSearchContext(params: SearchParams, userId?: string, sessionId?: string, userAgent?: string, ipAddress?: string): SearchContext;
    updateSearchContextWithResults(searchContext: SearchContext, results: SearchResults, cached?: boolean): void;
    logQueryAnalysis(searchContext: SearchContext, analysis: {
        queryComplexity: 'simple' | 'medium' | 'complex';
        filterCount: number;
        hasGeoFilter: boolean;
        hasTextSearch: boolean;
        hasFacets: boolean;
        estimatedCost: number;
    }): void;
    logCacheOperation(operation: 'get' | 'set' | 'delete' | 'expire', cacheKey: string, searchContext: SearchContext, success: boolean, ttl?: number): void;
    logUserInteraction(interaction: 'search_click' | 'suggestion_click' | 'filter_applied' | 'page_navigation', searchContext: SearchContext, details: {
        resourceId?: string;
        position?: number;
        filterType?: string;
        filterValue?: string;
        page?: number;
        suggestion?: string;
    }): void;
    logSearchQuality(searchContext: SearchContext, qualityMetrics: {
        relevanceScore: number;
        diversityScore: number;
        freshnessScore: number;
        completenessScore: number;
        userSatisfactionScore?: number;
    }): void;
    logABTestEvent(testName: string, variant: string, searchContext: SearchContext, outcome: 'impression' | 'click' | 'conversion', value?: number): void;
    logSecurityEvent(event: 'rate_limit_exceeded' | 'suspicious_query' | 'blocked_request' | 'validation_failed', searchContext: SearchContext, details: {
        reason?: string;
        severity: 'low' | 'medium' | 'high';
        action: 'logged' | 'blocked' | 'throttled';
        riskScore?: number;
    }): void;
    logBusinessMetric(metric: 'search_conversion' | 'api_discovery' | 'user_engagement' | 'revenue_attribution', searchContext: SearchContext, value: number, metadata?: Record<string, any>): void;
    generateCorrelationId(): string;
    logSystemHealth(component: 'elasticsearch' | 'redis' | 'database' | 'queue', status: 'healthy' | 'degraded' | 'unhealthy', metrics: {
        responseTime?: number;
        errorRate?: number;
        throughput?: number;
        availability?: number;
    }, searchContext?: SearchContext): void;
    batchLogEvents(events: Array<{
        level: 'debug' | 'info' | 'warn' | 'error';
        message: string;
        data: any;
    }>): void;
}
