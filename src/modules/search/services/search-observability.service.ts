import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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

@Injectable()
export class SearchObservabilityService implements OnModuleInit {
  private readonly logger = new Logger(SearchObservabilityService.name);
  private config: ObservabilityConfig;
  private activeContexts = new Map<string, SearchObservabilityContext>();

  constructor(
    private readonly configService: ConfigService,
    private readonly searchLogger: SearchLoggerService,
    private readonly searchTracing: SearchTracingService,
    private readonly searchMetrics: SearchMetricsService,
  ) {}

  async onModuleInit() {
    this.config = {
      enableTracing: this.configService.get('search.observability.tracing', true),
      enableMetrics: this.configService.get('search.observability.metrics', true),
      enableLogging: this.configService.get('search.observability.logging', true),
      enableProfiling: this.configService.get('search.observability.profiling', false),
      sampleRate: this.configService.get('search.observability.sampleRate', 1.0),
      debugMode: this.configService.get('search.debug', false),
    };

    this.logger.log('Search observability service initialized', this.config);
  }

  /**
   * Start observing a search operation
   */
  startObservation(
    operationName: string,
    params: SearchParams,
    userId?: string,
    sessionId?: string,
    userAgent?: string,
    ipAddress?: string
  ): SearchObservabilityContext {
    const searchContext = this.searchLogger.createSearchContext(
      params,
      userId,
      sessionId,
      userAgent,
      ipAddress
    );

    const correlationId = this.searchLogger.generateCorrelationId();
    
    const observabilityContext: SearchObservabilityContext = {
      searchContext,
      startTime: Date.now(),
      correlationId,
      tags: {
        operation: operationName,
        language: params.language || 'unknown',
        hasFilters: params.filters ? 'true' : 'false',
        hasGeoFilter: params.filters?.location ? 'true' : 'false',
        personalized: userId ? 'true' : 'false',
      },
      metrics: {},
      events: [],
    };

    // Store context for later reference
    this.activeContexts.set(searchContext.searchId, observabilityContext);

    // Start tracing if enabled
    if (this.config.enableTracing && this.shouldSample()) {
      this.startTracing(observabilityContext, operationName);
    }

    // Log search start
    if (this.config.enableLogging) {
      this.searchLogger.logSearchEvent('search_started', searchContext);
      this.addEvent(observabilityContext, 'search_started', { operationName });
    }

    // Record metrics
    if (this.config.enableMetrics) {
      this.searchMetrics.recordSearchRequest(operationName, 'success', userId ? 'authenticated' : 'anonymous');
    }

    return observabilityContext;
  }

  /**
   * End observation of a search operation
   */
  endObservation(
    searchId: string,
    results?: SearchResults,
    error?: Error
  ): SearchObservabilityContext | null {
    const context = this.activeContexts.get(searchId);
    if (!context) {
      this.logger.warn(`No observability context found for search ${searchId}`);
      return null;
    }

    context.endTime = Date.now();
    context.duration = context.endTime - context.startTime;

    // Update search context with results
    if (results) {
      this.searchLogger.updateSearchContextWithResults(context.searchContext, results);
      context.metrics.resultsCount = results.total;
      context.metrics.took = results.took || 0;
    }

    // Log completion or error
    if (this.config.enableLogging) {
      if (error) {
        context.searchContext.errorCode = error.name;
        context.searchContext.errorMessage = error.message;
        this.searchLogger.logSearchEvent('search_failed', context.searchContext);
        this.addEvent(context, 'search_failed', { error: error.message });
      } else {
        this.searchLogger.logSearchEvent('search_completed', context.searchContext);
        this.addEvent(context, 'search_completed', { 
          resultsCount: results?.total,
          duration: context.duration 
        });
      }
    }

    // Record metrics
    if (this.config.enableMetrics) {
      if (error) {
        this.searchMetrics.recordSearchError(error.name, context.tags.operation);
      } else {
        this.searchMetrics.recordSearchLatency(
          context.duration,
          context.tags.operation,
          'success',
          false
        );
        if (results) {
          this.searchMetrics.recordSearchResults(results.total, context.tags.operation, context.tags.hasFilters === 'true');
        }
      }
    }

    // End tracing
    if (this.config.enableTracing && context.traceId) {
      this.endTracing(context, error);
    }

    // Generate observability summary
    this.generateObservabilitySummary(context);

    // Clean up
    this.activeContexts.delete(searchId);

    return context;
  }

  /**
   * Add a custom event to the observation context
   */
  addEvent(
    context: SearchObservabilityContext,
    eventName: string,
    data: any
  ): void {
    context.events.push({
      timestamp: Date.now(),
      event: eventName,
      data,
    });

    // Add to trace if active
    if (this.config.enableTracing) {
      this.searchTracing.addSpanEvent(eventName, data);
    }
  }

  /**
   * Add custom metrics to the observation context
   */
  addMetric(
    context: SearchObservabilityContext,
    metricName: string,
    value: number
  ): void {
    context.metrics[metricName] = value;

    // Record custom metric
    // Custom metrics would be implemented based on specific needs
    // For now, just store in context
    if (this.config.enableMetrics) {
      // Could extend SearchMetricsService to support custom metrics
    }
  }

  /**
   * Add custom tags to the observation context
   */
  addTag(
    context: SearchObservabilityContext,
    key: string,
    value: string
  ): void {
    context.tags[key] = value;

    // Add to trace if active
    if (this.config.enableTracing) {
      this.searchTracing.addSpanAttributes({ [key]: value });
    }
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(
    context: SearchObservabilityContext,
    operation: 'hit' | 'miss' | 'set' | 'delete',
    cacheKey: string,
    duration?: number
  ): void {
    this.addEvent(context, `cache_${operation}`, { cacheKey, duration });

    if (this.config.enableMetrics) {
      if (operation === 'hit') {
        this.searchTracing.recordCacheHit(cacheKey, 'search');
      } else if (operation === 'miss') {
        this.searchTracing.recordCacheMiss(cacheKey, 'search');
      }
    }

    if (this.config.enableLogging) {
      this.searchLogger.logCacheOperation(
        operation === 'hit' || operation === 'miss' ? 'get' : operation,
        cacheKey,
        context.searchContext,
        operation !== 'miss',
        duration
      );
    }
  }

  /**
   * Record user interaction
   */
  recordUserInteraction(
    context: SearchObservabilityContext,
    interaction: string,
    details: any
  ): void {
    this.addEvent(context, `user_${interaction}`, details);

    if (this.config.enableLogging) {
      this.searchLogger.logUserInteraction(
        interaction as any,
        context.searchContext,
        details
      );
    }

    // User interactions would be implemented based on specific needs
    if (this.config.enableMetrics) {
      // Could extend SearchMetricsService to support user interactions
    }
  }

  /**
   * Record performance bottleneck
   */
  recordBottleneck(
    context: SearchObservabilityContext,
    component: string,
    duration: number,
    threshold: number
  ): void {
    if (duration > threshold) {
      this.addEvent(context, 'performance_bottleneck', {
        component,
        duration,
        threshold,
        severity: duration > threshold * 2 ? 'high' : 'medium',
      });

      if (this.config.enableLogging) {
        this.logger.warn(`Performance bottleneck detected in ${component}`, {
          searchId: context.searchContext.searchId,
          component,
          duration,
          threshold,
          correlationId: context.correlationId,
        });
      }
    }
  }

  /**
   * Get observability context by search ID
   */
  getContext(searchId: string): SearchObservabilityContext | null {
    return this.activeContexts.get(searchId) || null;
  }

  /**
   * Get all active contexts (for monitoring)
   */
  getActiveContexts(): SearchObservabilityContext[] {
    return Array.from(this.activeContexts.values());
  }

  /**
   * Generate health check data
   */
  getHealthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeSearches: number;
    averageResponseTime: number;
    errorRate: number;
    components: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
  } {
    const activeSearches = this.activeContexts.size;
    const contexts = Array.from(this.activeContexts.values());
    
    const averageResponseTime = contexts.length > 0
      ? contexts.reduce((sum, ctx) => sum + (Date.now() - ctx.startTime), 0) / contexts.length
      : 0;

    return {
      status: activeSearches > 100 ? 'degraded' : 'healthy',
      activeSearches,
      averageResponseTime,
      errorRate: 0, // Would be calculated from metrics
      components: {
        tracing: this.config.enableTracing ? 'healthy' : 'degraded',
        metrics: this.config.enableMetrics ? 'healthy' : 'degraded',
        logging: this.config.enableLogging ? 'healthy' : 'degraded',
      },
    };
  }

  /**
   * Start distributed tracing
   */
  private startTracing(
    context: SearchObservabilityContext,
    operationName: string
  ): void {
    // This would integrate with the tracing service
    // For now, just record trace context
    const traceContext = this.searchTracing.getCurrentTraceContext();
    if (traceContext) {
      context.traceId = traceContext.traceId;
      context.spanId = traceContext.spanId;
      context.searchContext.traceId = traceContext.traceId;
      context.searchContext.spanId = traceContext.spanId;
    }
  }

  /**
   * End distributed tracing
   */
  private endTracing(
    context: SearchObservabilityContext,
    error?: Error
  ): void {
    // This would end the trace span
    if (error) {
      this.searchTracing.addSpanEvent('error', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Check if request should be sampled
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Generate comprehensive observability summary
   */
  private generateObservabilitySummary(context: SearchObservabilityContext): void {
    if (!this.config.debugMode) {
      return;
    }

    const summary = {
      searchId: context.searchContext.searchId,
      correlationId: context.correlationId,
      duration: context.duration,
      query: context.searchContext.query,
      resultsCount: context.searchContext.resultsCount,
      tags: context.tags,
      metrics: context.metrics,
      eventCount: context.events.length,
      traceId: context.traceId,
      performance: {
        totalTime: context.duration,
        eventsProcessed: context.events.length,
        metricsRecorded: Object.keys(context.metrics).length,
      },
    };

    this.logger.debug('Search observability summary', summary);
  }
}