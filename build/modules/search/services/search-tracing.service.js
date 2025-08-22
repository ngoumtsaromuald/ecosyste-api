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
var SearchTracingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchTracingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const exporter_jaeger_1 = require("@opentelemetry/exporter-jaeger");
const api_1 = require("@opentelemetry/api");
let SearchTracingService = SearchTracingService_1 = class SearchTracingService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SearchTracingService_1.name);
        this.tracer = api_1.trace.getTracer('search-service');
        this.meter = api_1.metrics.getMeter('search-service');
        this.isInitialized = false;
        this.searchDurationHistogram = this.meter.createHistogram('search_duration_seconds', {
            description: 'Duration of search operations in seconds',
            unit: 's',
        });
        this.searchRequestsCounter = this.meter.createCounter('search_requests_total', {
            description: 'Total number of search requests',
        });
        this.searchErrorsCounter = this.meter.createCounter('search_errors_total', {
            description: 'Total number of search errors',
        });
        this.cacheHitsCounter = this.meter.createCounter('search_cache_hits_total', {
            description: 'Total number of search cache hits',
        });
        this.cacheMissesCounter = this.meter.createCounter('search_cache_misses_total', {
            description: 'Total number of search cache misses',
        });
    }
    async onModuleInit() {
        await this.initializeTracing();
    }
    async initializeTracing() {
        try {
            const config = this.getTracingConfig();
            const resource = {
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
                [semantic_conventions_1.SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
            };
            const exporters = [];
            if (config.jaegerEndpoint) {
                exporters.push(new exporter_jaeger_1.JaegerExporter({
                    endpoint: config.jaegerEndpoint,
                }));
            }
            if (config.enableConsoleExporter) {
                const { ConsoleSpanExporter } = await Promise.resolve().then(() => require('@opentelemetry/sdk-trace-base'));
                exporters.push(new ConsoleSpanExporter());
            }
            this.isInitialized = true;
            this.logger.log(`OpenTelemetry tracing initialized for ${config.serviceName}`);
        }
        catch (error) {
            this.logger.error('Failed to initialize OpenTelemetry tracing', error);
        }
    }
    getTracingConfig() {
        return {
            serviceName: this.configService.get('app.name', 'romapi-search'),
            serviceVersion: this.configService.get('app.version', '1.0.0'),
            environment: this.configService.get('app.environment', 'development'),
            jaegerEndpoint: this.configService.get('tracing.jaeger.endpoint'),
            prometheusPort: this.configService.get('tracing.prometheus.port', 9464),
            enableConsoleExporter: this.configService.get('tracing.console.enabled', false),
            sampleRate: this.configService.get('tracing.sampleRate', 1.0),
        };
    }
    async traceSearchOperation(operationName, attributes, operation) {
        if (!this.isInitialized) {
            this.logger.warn('Tracing not initialized, executing operation without tracing');
            return operation(null);
        }
        return this.tracer.startActiveSpan(operationName, {
            kind: api_1.SpanKind.SERVER,
            attributes,
        }, async (span) => {
            const startTime = Date.now();
            try {
                this.searchRequestsCounter.add(1, {
                    operation: operationName,
                    ...attributes,
                });
                const result = await operation(span);
                const duration = (Date.now() - startTime) / 1000;
                this.searchDurationHistogram.record(duration, {
                    operation: operationName,
                    status: 'success',
                    ...attributes,
                });
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                return result;
            }
            catch (error) {
                this.searchErrorsCounter.add(1, {
                    operation: operationName,
                    error_type: error.constructor.name,
                    ...attributes,
                });
                const duration = (Date.now() - startTime) / 1000;
                this.searchDurationHistogram.record(duration, {
                    operation: operationName,
                    status: 'error',
                    ...attributes,
                });
                span.recordException(error);
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error.message,
                });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    async traceSubOperation(operationName, attributes, operation) {
        if (!this.isInitialized) {
            return operation(null);
        }
        return this.tracer.startActiveSpan(operationName, {
            kind: api_1.SpanKind.INTERNAL,
            attributes,
        }, async (span) => {
            try {
                const result = await operation(span);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                return result;
            }
            catch (error) {
                span.recordException(error);
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error.message,
                });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    recordCacheHit(cacheKey, operation) {
        this.cacheHitsCounter.add(1, {
            cache_key: cacheKey,
            operation,
        });
        const activeSpan = api_1.trace.getActiveSpan();
        if (activeSpan) {
            activeSpan.addEvent('cache_hit', {
                cache_key: cacheKey,
                operation,
            });
        }
    }
    recordCacheMiss(cacheKey, operation) {
        this.cacheMissesCounter.add(1, {
            cache_key: cacheKey,
            operation,
        });
        const activeSpan = api_1.trace.getActiveSpan();
        if (activeSpan) {
            activeSpan.addEvent('cache_miss', {
                cache_key: cacheKey,
                operation,
            });
        }
    }
    addSpanAttributes(attributes) {
        const activeSpan = api_1.trace.getActiveSpan();
        if (activeSpan) {
            activeSpan.setAttributes(attributes);
        }
    }
    addSpanEvent(name, attributes) {
        const activeSpan = api_1.trace.getActiveSpan();
        if (activeSpan) {
            activeSpan.addEvent(name, attributes);
        }
    }
    getCurrentTraceContext() {
        const activeSpan = api_1.trace.getActiveSpan();
        if (activeSpan) {
            const spanContext = activeSpan.spanContext();
            return {
                traceId: spanContext.traceId,
                spanId: spanContext.spanId,
            };
        }
        return null;
    }
    recordCustomMetric(name, value, attributes) {
        try {
            const counter = this.meter.createCounter(`search_${name}_total`, {
                description: `Custom search metric: ${name}`,
            });
            counter.add(value, attributes);
        }
        catch (error) {
            this.logger.warn(`Failed to record custom metric ${name}`, error);
        }
    }
    async shutdown() {
        if (this.sdk) {
            try {
                await this.sdk.shutdown();
                this.logger.log('OpenTelemetry tracing shutdown completed');
            }
            catch (error) {
                this.logger.error('Error during tracing shutdown', error);
            }
        }
    }
};
exports.SearchTracingService = SearchTracingService;
exports.SearchTracingService = SearchTracingService = SearchTracingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SearchTracingService);
//# sourceMappingURL=search-tracing.service.js.map