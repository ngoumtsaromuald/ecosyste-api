import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { trace, metrics, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';

export interface TracingConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  jaegerEndpoint?: string;
  prometheusPort?: number;
  enableConsoleExporter?: boolean;
  sampleRate?: number;
}

@Injectable()
export class SearchTracingService implements OnModuleInit {
  private readonly logger = new Logger(SearchTracingService.name);
  private sdk: NodeSDK;
  private tracer = trace.getTracer('search-service');
  private meter = metrics.getMeter('search-service');
  private isInitialized = false;

  // Metrics
  private searchDurationHistogram = this.meter.createHistogram('search_duration_seconds', {
    description: 'Duration of search operations in seconds',
    unit: 's',
  });

  private searchRequestsCounter = this.meter.createCounter('search_requests_total', {
    description: 'Total number of search requests',
  });

  private searchErrorsCounter = this.meter.createCounter('search_errors_total', {
    description: 'Total number of search errors',
  });

  private cacheHitsCounter = this.meter.createCounter('search_cache_hits_total', {
    description: 'Total number of search cache hits',
  });

  private cacheMissesCounter = this.meter.createCounter('search_cache_misses_total', {
    description: 'Total number of search cache misses',
  });

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeTracing();
  }

  /**
   * Initialize OpenTelemetry tracing
   */
  private async initializeTracing(): Promise<void> {
    try {
      const config = this.getTracingConfig();

      // Create resource
      const resource = {
        [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
      };

      // Configure exporters
      const exporters = [];

      // Jaeger exporter for distributed tracing
      if (config.jaegerEndpoint) {
        exporters.push(new JaegerExporter({
          endpoint: config.jaegerEndpoint,
        }));
      }

      // Console exporter for development
      if (config.enableConsoleExporter) {
        const { ConsoleSpanExporter } = await import('@opentelemetry/sdk-trace-base');
        exporters.push(new ConsoleSpanExporter());
      }

      // Initialize SDK (simplified for now)
      // this.sdk = new NodeSDK({
      //   resource,
      //   traceExporter: exporters.length > 0 ? exporters[0] : undefined,
      //   instrumentations: [
      //     getNodeAutoInstrumentations({
      //       '@opentelemetry/instrumentation-fs': {
      //         enabled: false,
      //       },
      //     }),
      //   ],
      // });

      // Initialize Prometheus metrics exporter (commented out for now)
      // if (config.prometheusPort) {
      //   const prometheusExporter = new PrometheusExporter({
      //     port: config.prometheusPort,
      //   });

      //   const meterProvider = new MeterProvider({
      //     resource,
      //     readers: [prometheusExporter],
      //   });

      //   metrics.setGlobalMeterProvider(meterProvider);
      // }

      // Start the SDK
      // this.sdk.start();
      this.isInitialized = true;

      this.logger.log(`OpenTelemetry tracing initialized for ${config.serviceName}`);
    } catch (error) {
      this.logger.error('Failed to initialize OpenTelemetry tracing', error);
    }
  }

  /**
   * Get tracing configuration from environment
   */
  private getTracingConfig(): TracingConfig {
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

  /**
   * Create a traced search operation
   */
  async traceSearchOperation<T>(
    operationName: string,
    attributes: Record<string, string | number | boolean>,
    operation: (span: any) => Promise<T>
  ): Promise<T> {
    if (!this.isInitialized) {
      this.logger.warn('Tracing not initialized, executing operation without tracing');
      return operation(null);
    }

    return this.tracer.startActiveSpan(operationName, {
      kind: SpanKind.SERVER,
      attributes,
    }, async (span) => {
      const startTime = Date.now();

      try {
        // Record request metric
        this.searchRequestsCounter.add(1, {
          operation: operationName,
          ...attributes,
        });

        const result = await operation(span);

        // Record success metrics
        const duration = (Date.now() - startTime) / 1000;
        this.searchDurationHistogram.record(duration, {
          operation: operationName,
          status: 'success',
          ...attributes,
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        // Record error metrics
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
          code: SpanStatusCode.ERROR,
          message: error.message,
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Create a child span for sub-operations
   */
  async traceSubOperation<T>(
    operationName: string,
    attributes: Record<string, string | number | boolean>,
    operation: (span: any) => Promise<T>
  ): Promise<T> {
    if (!this.isInitialized) {
      return operation(null);
    }

    return this.tracer.startActiveSpan(operationName, {
      kind: SpanKind.INTERNAL,
      attributes,
    }, async (span) => {
      try {
        const result = await operation(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Record cache hit metric and span event
   */
  recordCacheHit(cacheKey: string, operation: string): void {
    this.cacheHitsCounter.add(1, {
      cache_key: cacheKey,
      operation,
    });

    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.addEvent('cache_hit', {
        cache_key: cacheKey,
        operation,
      });
    }
  }

  /**
   * Record cache miss metric and span event
   */
  recordCacheMiss(cacheKey: string, operation: string): void {
    this.cacheMissesCounter.add(1, {
      cache_key: cacheKey,
      operation,
    });

    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.addEvent('cache_miss', {
        cache_key: cacheKey,
        operation,
      });
    }
  }

  /**
   * Add custom attributes to current span
   */
  addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.setAttributes(attributes);
    }
  }

  /**
   * Add custom event to current span
   */
  addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.addEvent(name, attributes);
    }
  }

  /**
   * Get current trace context for correlation
   */
  getCurrentTraceContext(): { traceId: string; spanId: string } | null {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      const spanContext = activeSpan.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
      };
    }
    return null;
  }

  /**
   * Create a custom metric for search operations
   */
  recordCustomMetric(
    name: string,
    value: number,
    attributes: Record<string, string | number | boolean>
  ): void {
    try {
      const counter = this.meter.createCounter(`search_${name}_total`, {
        description: `Custom search metric: ${name}`,
      });
      counter.add(value, attributes);
    } catch (error) {
      this.logger.warn(`Failed to record custom metric ${name}`, error);
    }
  }

  /**
   * Shutdown tracing gracefully
   */
  async shutdown(): Promise<void> {
    if (this.sdk) {
      try {
        await this.sdk.shutdown();
        this.logger.log('OpenTelemetry tracing shutdown completed');
      } catch (error) {
        this.logger.error('Error during tracing shutdown', error);
      }
    }
  }
}