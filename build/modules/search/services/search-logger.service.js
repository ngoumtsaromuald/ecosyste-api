"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SearchLoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchLoggerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const api_1 = require("@opentelemetry/api");
let SearchLoggerService = SearchLoggerService_1 = class SearchLoggerService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SearchLoggerService_1.name);
        this.tracer = api_1.trace.getTracer('search-service');
        this.debugMode = this.configService.get('search.debug', false);
    }
    logSearchEvent(event, searchContext, debugInfo) {
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
    createSearchSpan(operationName, searchContext, operation) {
        return this.tracer.startActiveSpan(operationName, {
            kind: api_1.SpanKind.SERVER,
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
                const spanContext = span.spanContext();
                searchContext.traceId = spanContext.traceId;
                searchContext.spanId = spanContext.spanId;
                const result = await operation(span);
                if (searchContext.resultsCount !== undefined) {
                    span.setAttributes({
                        'search.results_count': searchContext.resultsCount,
                        'search.took_ms': searchContext.took || 0,
                        'search.cached': searchContext.cached || false,
                    });
                }
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                return result;
            }
            catch (error) {
                span.recordException(error);
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error.message,
                });
                searchContext.errorCode = error.code || 'UNKNOWN_ERROR';
                searchContext.errorMessage = error.message;
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    logPerformanceMetrics(searchContext, debugInfo) {
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
        if (debugInfo.performance.totalTime > 1000) {
            this.logger.warn('Slow search detected', performanceData);
        }
        else if (debugInfo.performance.totalTime > 500) {
            this.logger.log('Search performance notice', performanceData);
        }
        else if (this.debugMode) {
            this.logger.debug('Search performance', performanceData);
        }
    }
    logDebugInfo(searchContext, debugInfo) {
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
    logSearchError(error, searchContext, debugInfo) {
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
    generateSearchId() {
        return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    createSearchContext(params, userId, sessionId, userAgent, ipAddress) {
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
    updateSearchContextWithResults(searchContext, results, cached = false) {
        searchContext.resultsCount = results.total;
        searchContext.took = results.took;
        searchContext.cached = cached;
    }
    logQueryAnalysis(searchContext, analysis) {
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
    logCacheOperation(operation, cacheKey, searchContext, success, ttl) {
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
    logUserInteraction(interaction, searchContext, details) {
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
    logSearchQuality(searchContext, qualityMetrics) {
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
    logABTestEvent(testName, variant, searchContext, outcome, value) {
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
    logSecurityEvent(event, searchContext, details) {
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
    logBusinessMetric(metric, searchContext, value, metadata) {
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
    generateCorrelationId() {
        return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    logSystemHealth(component, status, metrics, searchContext) {
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
    batchLogEvents(events) {
        const batchData = {
            event: 'batch_log',
            count: events.length,
            timestamp: new Date().toISOString(),
            events,
        };
        this.logger.log(`Batch logging ${events.length} events`, batchData);
    }
};
exports.SearchLoggerService = SearchLoggerService;
exports.SearchLoggerService = SearchLoggerService = SearchLoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SearchLoggerService);
//# sourceMappingURL=search-logger.service.js.map