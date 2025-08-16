import { PrismaService } from '../config/prisma.service';
export declare class MetricsService {
    private readonly prisma;
    private readonly logger;
    private updateInterval;
    private readonly httpRequestsTotal;
    private readonly httpRequestDuration;
    private readonly apiResourcesTotal;
    private readonly cacheHitRate;
    private readonly cacheOperationsTotal;
    private readonly databaseConnectionsActive;
    private readonly databaseQueryDuration;
    constructor(prisma: PrismaService);
    private initializeMetrics;
    recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void;
    recordCacheOperation(operation: 'get' | 'set' | 'del', cacheType: string, result: 'hit' | 'miss' | 'success' | 'error'): void;
    updateCacheHitRate(cacheType: string, hitRate: number): void;
    recordDatabaseQuery(operation: string, duration: number): void;
    updateApiResourceMetrics(): Promise<void>;
    updateDatabaseConnections(activeConnections: number): void;
    getMetrics(): Promise<string>;
    getRegistry(): import("prom-client").Registry<"text/plain; version=0.0.4; charset=utf-8">;
    clearMetrics(): void;
    private startPeriodicUpdates;
}
