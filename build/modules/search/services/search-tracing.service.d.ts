import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface TracingConfig {
    serviceName: string;
    serviceVersion: string;
    environment: string;
    jaegerEndpoint?: string;
    prometheusPort?: number;
    enableConsoleExporter?: boolean;
    sampleRate?: number;
}
export declare class SearchTracingService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private sdk;
    private tracer;
    private meter;
    private isInitialized;
    private searchDurationHistogram;
    private searchRequestsCounter;
    private searchErrorsCounter;
    private cacheHitsCounter;
    private cacheMissesCounter;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private initializeTracing;
    private getTracingConfig;
    traceSearchOperation<T>(operationName: string, attributes: Record<string, string | number | boolean>, operation: (span: any) => Promise<T>): Promise<T>;
    traceSubOperation<T>(operationName: string, attributes: Record<string, string | number | boolean>, operation: (span: any) => Promise<T>): Promise<T>;
    recordCacheHit(cacheKey: string, operation: string): void;
    recordCacheMiss(cacheKey: string, operation: string): void;
    addSpanAttributes(attributes: Record<string, string | number | boolean>): void;
    addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>): void;
    getCurrentTraceContext(): {
        traceId: string;
        spanId: string;
    } | null;
    recordCustomMetric(name: string, value: number, attributes: Record<string, string | number | boolean>): void;
    shutdown(): Promise<void>;
}
