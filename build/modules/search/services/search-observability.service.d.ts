import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchLoggerService, SearchContext } from './search-logger.service';
import { SearchTracingService } from './search-tracing.service';
import { SearchMetricsService } from './search-metrics.service';
import { SearchParams, SearchResults } from '../interfaces/search.interfaces';
export interface ObservabilityConfig {
    enableTracing: boolean;
    enableMetrics: boolean;
    enableLogging: boolean;
    enableProfiling: boolean;
    sampleRate: number;
    debugMode: boolean;
}
export interface SearchObservabilityContext {
    searchContext: SearchContext;
    startTime: number;
    endTime?: number;
    duration?: number;
    traceId?: string;
    spanId?: string;
    correlationId: string;
    tags: Record<string, string>;
    metrics: Record<string, number>;
    events: Array<{
        timestamp: number;
        event: string;
        data: any;
    }>;
}
export declare class SearchObservabilityService implements OnModuleInit {
    private readonly configService;
    private readonly searchLogger;
    private readonly searchTracing;
    private readonly searchMetrics;
    private readonly logger;
    private config;
    private activeContexts;
    constructor(configService: ConfigService, searchLogger: SearchLoggerService, searchTracing: SearchTracingService, searchMetrics: SearchMetricsService);
    onModuleInit(): Promise<void>;
    startObservation(operationName: string, params: SearchParams, userId?: string, sessionId?: string, userAgent?: string, ipAddress?: string): SearchObservabilityContext;
    endObservation(searchId: string, results?: SearchResults, error?: Error): SearchObservabilityContext | null;
    addEvent(context: SearchObservabilityContext, eventName: string, data: any): void;
    addMetric(context: SearchObservabilityContext, metricName: string, value: number): void;
    addTag(context: SearchObservabilityContext, key: string, value: string): void;
    recordCacheOperation(context: SearchObservabilityContext, operation: 'hit' | 'miss' | 'set' | 'delete', cacheKey: string, duration?: number): void;
    recordUserInteraction(context: SearchObservabilityContext, interaction: string, details: any): void;
    recordBottleneck(context: SearchObservabilityContext, component: string, duration: number, threshold: number): void;
    getContext(searchId: string): SearchObservabilityContext | null;
    getActiveContexts(): SearchObservabilityContext[];
    getHealthCheck(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        activeSearches: number;
        averageResponseTime: number;
        errorRate: number;
        components: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
    };
    private startTracing;
    private endTracing;
    private shouldSample;
    private generateObservabilitySummary;
}
