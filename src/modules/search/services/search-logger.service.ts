import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
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

@Injectable()
export class SearchLoggerService {
  private readonly logger = new Logger(SearchLoggerService.name);
  private readonly tracer = trace.getTracer('search-service');
  private readonly debugMode: boolean;

  constructor(private readonly configService: ConfigService) {
    this.debugMode = this.configService.get('search.debug', false);
  }

  /**
   * Log structured search event with context
   */
  logSearchEvent(
    event: 'search_started' | 'search_completed' | 'search_failed' | 'suggestion_requested' | 'cache_hit' | 'cache_miss',
    searchContext: SearchContext,
    debugInfo?: Partial<SearchDebugInfo>
  ): void {
    const logData = {
      event,
      searchId: searchContext.searchId,
      userId: searchContext.userId,
      sessionId: searchContext.sessionId,
      timestamp: searchContext.timestamp.toISOString(),
      query: searchContext.query,
      resultsCount: searchContext.resultsCount,
      took: searchContext.took,
      language: searchContext.language,
      personalized: searchContext.personalized,
      cached: searchContext.cached,
      traceId: searchContext.traceId,
      spanId: searchContext.spanId,
      ...(debugInfo && this.debugMode && { debug: debugInfo })
    };

    switch (event) {
      case 'search_started':
        this.logger.log(`Search started: ${searchContext.query}`, logData);
        break;
      case 'search_completed':
        this.logger.log(`Search completed: ${searchContext.resultsCount} results in ${searchContext.took}ms`, logData);
        break;
      case 'search_failed':
        this.logger.error(`Search failed: ${searchContext.errorMessage}`, logData);
        break;
      case 'suggestion_requested':
        this.logger.debug(`Suggestions requested: ${searchContext.query}`, logData);
        break;
      case 'cache_hit':
        this.logger.debug(`Cache hit for search: ${searchContext.query}`, logData);
        break;
      case 'cache_miss':
        this.logger.debug(`Cache miss for search: ${searchContext.query}`, logData);
        break;
    }
  }

  /**
   * Create distributed trace span for search operations
   */
  createSearchSpan<T>(
    operationName: string,
    searchContext: SearchContext,
    operation: (span: any) => Promise<T>
  ): Promise<T> {
    return this.tracer.startActiveSpan(operationName, {
      kind: SpanKind.SERVER,
      attributes: {
        'search.id': searchContext.searchId,
        'search.query': searchContext.query || '',
        'search.user_id': searchContext.userId || 'anonymous',
        'search.session_id': searchContext.sessionId || '',
        'search.language': searchContext.language || 'unknown',
        'search.personalized': searchContext.personalized || false,
      }
    }, async (span) => {
      try {
        // Update search context with trace information
        const spanContext = span.spanContext();
        searchContext.traceId = spanContext.traceId;
        searchContext.spanId = spanContext.spanId;

        const result = await operation(span);

        // Add result attributes to span
        if (searchContext.resultsCount !== undefined) {
          span.setAttributes({
            'search.results_count': searchContext.resultsCount,
            'search.took_ms': searchContext.took || 0,
            'search.cached': searchContext.cached || false,
          });
        }

        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        
        // Update search context with error info
        searchContext.errorCode = error.code || 'UNKNOWN_ERROR';
        searchContext.errorMessage = error.message;
        
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Log performance metrics for search operations
   */
  logPerformanceMetrics(searchContext: SearchContext, debugInfo: SearchDebugInfo): void {
    const performanceData = {
      searchId: searchContext.searchId,
      query: searchContext.query,
      totalTime: debugInfo.performance.totalTime,
      elasticsearchTime: debugInfo.performance.elasticsearchTime,
      cacheTime: debugInfo.performance.cacheTime,
      processingTime: debugInfo.performance.processingTime,
      resultsCount: searchContext.resultsCount,
      cached: searchContext.cached,
      traceId: searchContext.traceId,
    };

    // Log performance warning if search is slow
    if (debugInfo.performance.totalTime > 1000) {
      this.logger.warn('Slow search detected', performanceData);
    } else if (debugInfo.performance.totalTime > 500) {
      this.logger.log('Search performance notice', performanceData);
    } else if (this.debugMode) {
      this.logger.debug('Search performance', performanceData);
    }
  }

  /**
   * Log debug information for troubleshooting
   */
  logDebugInfo(searchContext: SearchContext, debugInfo: SearchDebugInfo): void {
    if (!this.debugMode) {
      return;
    }

    const debugData = {
      searchId: searchContext.searchId,
      query: searchContext.query,
      elasticsearchQuery: JSON.stringify(debugInfo.elasticsearchQuery, null, 2),
      cacheKey: debugInfo.cacheKey,
      cacheHit: debugInfo.cacheHit,
      fallbackUsed: debugInfo.fallbackUsed,
      personalizationApplied: debugInfo.personalizationApplied,
      languageDetected: debugInfo.languageDetected,
      geoLocation: debugInfo.geoLocation,
      performance: debugInfo.performance,
      traceId: searchContext.traceId,
      spanId: searchContext.spanId,
    };

    this.logger.debug('Search debug information', debugData);
  }

  /**
   * Log error with full context for troubleshooting
   */
  logSearchError(
    error: Error,
    searchContext: SearchContext,
    debugInfo?: Partial<SearchDebugInfo>
  ): void {
    const errorData = {
      searchId: searchContext.searchId,
      userId: searchContext.userId,
      query: searchContext.query,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      traceId: searchContext.traceId,
      spanId: searchContext.spanId,
      timestamp: searchContext.timestamp.toISOString(),
      ...(debugInfo && this.debugMode && { debug: debugInfo })
    };

    this.logger.error(`Search error: ${error.message}`, errorData);
  }

  /**
   * Generate unique search ID for tracking
   */
  generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create search context from request parameters
   */
  createSearchContext(
    params: SearchParams,
    userId?: string,
    sessionId?: string,
    userAgent?: string,
    ipAddress?: string
  ): SearchContext {
    return {
      searchId: this.generateSearchId(),
      userId,
      sessionId,
      userAgent,
      ipAddress,
      timestamp: new Date(),
      query: params.query,
      filters: params.filters,
      language: params.language,
      personalized: !!userId,
    };
  }

  /**
   * Update search context with results
   */
  updateSearchContextWithResults(
    searchContext: SearchContext,
    results: SearchResults,
    cached: boolean = false
  ): void {
    searchContext.resultsCount = results.total;
    searchContext.took = results.took;
    searchContext.cached = cached;
  }

  /**
   * Log query analysis for optimization
   */
  logQueryAnalysis(searchContext: SearchContext, analysis: {
    queryComplexity: 'simple' | 'medium' | 'complex';
    filterCount: number;
    hasGeoFilter: boolean;
    hasTextSearch: boolean;
    hasFacets: boolean;
    estimatedCost: number;
  }): void {
    if (!this.debugMode) {
      return;
    }

    const analysisData = {
      searchId: searchContext.searchId,
      query: searchContext.query,
      queryComplexity: analysis.queryComplexity,
      filterCount: analysis.filterCount,
      hasGeoFilter: analysis.hasGeoFilter,
      hasTextSearch: analysis.hasTextSearch,
      hasFacets: analysis.hasFacets,
      estimatedCost: analysis.estimatedCost,
      traceId: searchContext.traceId,
    };

    this.logger.debug('Query analysis', analysisData);
  }

  /**
   * Log cache operations for monitoring
   */
  logCacheOperation(
    operation: 'get' | 'set' | 'delete' | 'expire',
    cacheKey: string,
    searchContext: SearchContext,
    success: boolean,
    ttl?: number
  ): void {
    if (!this.debugMode) {
      return;
    }

    const cacheData = {
      operation,
      cacheKey,
      searchId: searchContext.searchId,
      success,
      ttl,
      timestamp: new Date().toISOString(),
      traceId: searchContext.traceId,
    };

    this.logger.debug(`Cache ${operation}: ${success ? 'success' : 'failed'}`, cacheData);
  }

  /**
   * Log user interaction events for analytics
   */
  logUserInteraction(
    interaction: 'search_click' | 'suggestion_click' | 'filter_applied' | 'page_navigation',
    searchContext: SearchContext,
    details: {
      resourceId?: string;
      position?: number;
      filterType?: string;
      filterValue?: string;
      page?: number;
      suggestion?: string;
    }
  ): void {
    const interactionData = {
      event: 'user_interaction',
      interaction,
      searchId: searchContext.searchId,
      userId: searchContext.userId,
      sessionId: searchContext.sessionId,
      timestamp: searchContext.timestamp.toISOString(),
      traceId: searchContext.traceId,
      ...details,
    };

    this.logger.log(`User interaction: ${interaction}`, interactionData);
  }

  /**
   * Log search quality metrics
   */
  logSearchQuality(
    searchContext: SearchContext,
    qualityMetrics: {
      relevanceScore: number;
      diversityScore: number;
      freshnessScore: number;
      completenessScore: number;
      userSatisfactionScore?: number;
    }
  ): void {
    const qualityData = {
      event: 'search_quality',
      searchId: searchContext.searchId,
      query: searchContext.query,
      resultsCount: searchContext.resultsCount,
      traceId: searchContext.traceId,
      metrics: qualityMetrics,
      timestamp: searchContext.timestamp.toISOString(),
    };

    this.logger.log('Search quality metrics', qualityData);
  }

  /**
   * Log A/B test events
   */
  logABTestEvent(
    testName: string,
    variant: string,
    searchContext: SearchContext,
    outcome: 'impression' | 'click' | 'conversion',
    value?: number
  ): void {
    const abTestData = {
      event: 'ab_test',
      testName,
      variant,
      outcome,
      value,
      searchId: searchContext.searchId,
      userId: searchContext.userId,
      sessionId: searchContext.sessionId,
      traceId: searchContext.traceId,
      timestamp: searchContext.timestamp.toISOString(),
    };

    this.logger.log(`A/B test event: ${testName}/${variant}/${outcome}`, abTestData);
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    event: 'rate_limit_exceeded' | 'suspicious_query' | 'blocked_request' | 'validation_failed',
    searchContext: SearchContext,
    details: {
      reason?: string;
      severity: 'low' | 'medium' | 'high';
      action: 'logged' | 'blocked' | 'throttled';
      riskScore?: number;
    }
  ): void {
    const securityData = {
      event: 'security_event',
      securityEvent: event,
      searchId: searchContext.searchId,
      userId: searchContext.userId,
      sessionId: searchContext.sessionId,
      ipAddress: searchContext.ipAddress,
      userAgent: searchContext.userAgent,
      traceId: searchContext.traceId,
      timestamp: searchContext.timestamp.toISOString(),
      ...details,
    };

    this.logger.warn(`Security event: ${event}`, securityData);
  }

  /**
   * Log business metrics
   */
  logBusinessMetric(
    metric: 'search_conversion' | 'api_discovery' | 'user_engagement' | 'revenue_attribution',
    searchContext: SearchContext,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const businessData = {
      event: 'business_metric',
      metric,
      value,
      searchId: searchContext.searchId,
      userId: searchContext.userId,
      query: searchContext.query,
      traceId: searchContext.traceId,
      timestamp: searchContext.timestamp.toISOString(),
      metadata,
    };

    this.logger.log(`Business metric: ${metric} = ${value}`, businessData);
  }

  /**
   * Create correlation ID for request tracking
   */
  generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log system health events
   */
  logSystemHealth(
    component: 'elasticsearch' | 'redis' | 'database' | 'queue',
    status: 'healthy' | 'degraded' | 'unhealthy',
    metrics: {
      responseTime?: number;
      errorRate?: number;
      throughput?: number;
      availability?: number;
    },
    searchContext?: SearchContext
  ): void {
    const healthData = {
      event: 'system_health',
      component,
      status,
      metrics,
      timestamp: new Date().toISOString(),
      traceId: searchContext?.traceId,
    };

    const logLevel = status === 'healthy' ? 'debug' : status === 'degraded' ? 'warn' : 'error';
    this.logger[logLevel](`System health: ${component} is ${status}`, healthData);
  }

  /**
   * Batch log multiple events for performance
   */
  batchLogEvents(events: Array<{
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data: any;
  }>): void {
    const batchData = {
      event: 'batch_log',
      count: events.length,
      timestamp: new Date().toISOString(),
      events,
    };

    this.logger.log(`Batch logging ${events.length} events`, batchData);
  }
}