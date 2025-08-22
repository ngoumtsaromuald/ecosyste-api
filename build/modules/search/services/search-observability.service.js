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
var SearchObservabilityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchObservabilityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const search_logger_service_1 = require("./search-logger.service");
const search_tracing_service_1 = require("./search-tracing.service");
const search_metrics_service_1 = require("./search-metrics.service");
let SearchObservabilityService = SearchObservabilityService_1 = class SearchObservabilityService {
    constructor(configService, searchLogger, searchTracing, searchMetrics) {
        this.configService = configService;
        this.searchLogger = searchLogger;
        this.searchTracing = searchTracing;
        this.searchMetrics = searchMetrics;
        this.logger = new common_1.Logger(SearchObservabilityService_1.name);
        this.activeContexts = new Map();
    }
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
    startObservation(operationName, params, userId, sessionId, userAgent, ipAddress) {
        const searchContext = this.searchLogger.createSearchContext(params, userId, sessionId, userAgent, ipAddress);
        const correlationId = this.searchLogger.generateCorrelationId();
        const observabilityContext = {
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
        this.activeContexts.set(searchContext.searchId, observabilityContext);
        if (this.config.enableTracing && this.shouldSample()) {
            this.startTracing(observabilityContext, operationName);
        }
        if (this.config.enableLogging) {
            this.searchLogger.logSearchEvent('search_started', searchContext);
            this.addEvent(observabilityContext, 'search_started', { operationName });
        }
        if (this.config.enableMetrics) {
            this.searchMetrics.recordSearchRequest(operationName, 'success', userId ? 'authenticated' : 'anonymous');
        }
        return observabilityContext;
    }
    endObservation(searchId, results, error) {
        const context = this.activeContexts.get(searchId);
        if (!context) {
            this.logger.warn(`No observability context found for search ${searchId}`);
            return null;
        }
        context.endTime = Date.now();
        context.duration = context.endTime - context.startTime;
        if (results) {
            this.searchLogger.updateSearchContextWithResults(context.searchContext, results);
            context.metrics.resultsCount = results.total;
            context.metrics.took = results.took || 0;
        }
        if (this.config.enableLogging) {
            if (error) {
                context.searchContext.errorCode = error.name;
                context.searchContext.errorMessage = error.message;
                this.searchLogger.logSearchEvent('search_failed', context.searchContext);
                this.addEvent(context, 'search_failed', { error: error.message });
            }
            else {
                this.searchLogger.logSearchEvent('search_completed', context.searchContext);
                this.addEvent(context, 'search_completed', {
                    resultsCount: results?.total,
                    duration: context.duration
                });
            }
        }
        if (this.config.enableMetrics) {
            if (error) {
                this.searchMetrics.recordSearchError(error.name, context.tags.operation);
            }
            else {
                this.searchMetrics.recordSearchLatency(context.duration, context.tags.operation, 'success', false);
                if (results) {
                    this.searchMetrics.recordSearchResults(results.total, context.tags.operation, context.tags.hasFilters === 'true');
                }
            }
        }
        if (this.config.enableTracing && context.traceId) {
            this.endTracing(context, error);
        }
        this.generateObservabilitySummary(context);
        this.activeContexts.delete(searchId);
        return context;
    }
    addEvent(context, eventName, data) {
        context.events.push({
            timestamp: Date.now(),
            event: eventName,
            data,
        });
        if (this.config.enableTracing) {
            this.searchTracing.addSpanEvent(eventName, data);
        }
    }
    addMetric(context, metricName, value) {
        context.metrics[metricName] = value;
        if (this.config.enableMetrics) {
        }
    }
    addTag(context, key, value) {
        context.tags[key] = value;
        if (this.config.enableTracing) {
            this.searchTracing.addSpanAttributes({ [key]: value });
        }
    }
    recordCacheOperation(context, operation, cacheKey, duration) {
        this.addEvent(context, `cache_${operation}`, { cacheKey, duration });
        if (this.config.enableMetrics) {
            if (operation === 'hit') {
                this.searchTracing.recordCacheHit(cacheKey, 'search');
            }
            else if (operation === 'miss') {
                this.searchTracing.recordCacheMiss(cacheKey, 'search');
            }
        }
        if (this.config.enableLogging) {
            this.searchLogger.logCacheOperation(operation === 'hit' || operation === 'miss' ? 'get' : operation, cacheKey, context.searchContext, operation !== 'miss', duration);
        }
    }
    recordUserInteraction(context, interaction, details) {
        this.addEvent(context, `user_${interaction}`, details);
        if (this.config.enableLogging) {
            this.searchLogger.logUserInteraction(interaction, context.searchContext, details);
        }
        if (this.config.enableMetrics) {
        }
    }
    recordBottleneck(context, component, duration, threshold) {
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
    getContext(searchId) {
        return this.activeContexts.get(searchId) || null;
    }
    getActiveContexts() {
        return Array.from(this.activeContexts.values());
    }
    getHealthCheck() {
        const activeSearches = this.activeContexts.size;
        const contexts = Array.from(this.activeContexts.values());
        const averageResponseTime = contexts.length > 0
            ? contexts.reduce((sum, ctx) => sum + (Date.now() - ctx.startTime), 0) / contexts.length
            : 0;
        return {
            status: activeSearches > 100 ? 'degraded' : 'healthy',
            activeSearches,
            averageResponseTime,
            errorRate: 0,
            components: {
                tracing: this.config.enableTracing ? 'healthy' : 'degraded',
                metrics: this.config.enableMetrics ? 'healthy' : 'degraded',
                logging: this.config.enableLogging ? 'healthy' : 'degraded',
            },
        };
    }
    startTracing(context, operationName) {
        const traceContext = this.searchTracing.getCurrentTraceContext();
        if (traceContext) {
            context.traceId = traceContext.traceId;
            context.spanId = traceContext.spanId;
            context.searchContext.traceId = traceContext.traceId;
            context.searchContext.spanId = traceContext.spanId;
        }
    }
    endTracing(context, error) {
        if (error) {
            this.searchTracing.addSpanEvent('error', {
                error: error.message,
                stack: error.stack,
            });
        }
    }
    shouldSample() {
        return Math.random() < this.config.sampleRate;
    }
    generateObservabilitySummary(context) {
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
};
exports.SearchObservabilityService = SearchObservabilityService;
exports.SearchObservabilityService = SearchObservabilityService = SearchObservabilityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        search_logger_service_1.SearchLoggerService,
        search_tracing_service_1.SearchTracingService,
        search_metrics_service_1.SearchMetricsService])
], SearchObservabilityService);
//# sourceMappingURL=search-observability.service.js.map