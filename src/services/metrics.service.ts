import { Injectable, Logger } from '@nestjs/common';
import { Counter, Gauge, Histogram, register } from 'prom-client';
import { PrismaService } from '../config/prisma.service';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private updateInterval: NodeJS.Timeout | null = null;

  // HTTP Metrics
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  });

  // Business Metrics
  private readonly apiResourcesTotal = new Gauge({
    name: 'api_resources_total',
    help: 'Total number of API resources',
    labelNames: ['status', 'plan', 'type'],
  });

  private readonly cacheHitRate = new Gauge({
    name: 'cache_hit_rate',
    help: 'Cache hit rate percentage',
    labelNames: ['cache_type'],
  });

  private readonly cacheOperationsTotal = new Counter({
    name: 'cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'cache_type', 'result'],
  });

  // Database Metrics
  private readonly databaseConnectionsActive = new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
  });

  private readonly databaseQueryDuration = new Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  });

  constructor(private readonly prisma: PrismaService) {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // Initialize default metrics
    register.clear();
    
    // Register custom metrics
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.apiResourcesTotal);
    register.registerMetric(this.cacheHitRate);
    register.registerMetric(this.cacheOperationsTotal);
    register.registerMetric(this.databaseConnectionsActive);
    register.registerMetric(this.databaseQueryDuration);

    // Start periodic updates
    this.startPeriodicUpdates();
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestsTotal.inc({ 
      method: method.toUpperCase(), 
      route, 
      status_code: statusCode.toString() 
    });
    
    this.httpRequestDuration.observe(
      { method: method.toUpperCase(), route }, 
      duration / 1000 // Convert to seconds
    );
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(operation: 'get' | 'set' | 'del', cacheType: string, result: 'hit' | 'miss' | 'success' | 'error') {
    this.cacheOperationsTotal.inc({ operation, cache_type: cacheType, result });
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate(cacheType: string, hitRate: number) {
    this.cacheHitRate.set({ cache_type: cacheType }, hitRate);
  }

  /**
   * Record database query duration
   */
  recordDatabaseQuery(operation: string, duration: number) {
    this.databaseQueryDuration.observe({ operation }, duration / 1000);
  }

  /**
   * Update API resources metrics
   */
  async updateApiResourceMetrics() {
    try {
      const stats = await this.prisma.apiResource.groupBy({
        by: ['status', 'plan', 'resourceType'],
        _count: true,
        where: { deletedAt: null },
      });

      // Reset all gauges first
      this.apiResourcesTotal.reset();

      stats.forEach(stat => {
        this.apiResourcesTotal.set(
          { 
            status: stat.status.toLowerCase(), 
            plan: stat.plan.toLowerCase(), 
            type: stat.resourceType.toLowerCase() 
          },
          stat._count
        );
      });

      this.logger.debug('Updated API resource metrics');
    } catch (error) {
      this.logger.error('Failed to update API resource metrics:', error);
    }
  }

  /**
   * Update database connection metrics
   */
  updateDatabaseConnections(activeConnections: number) {
    this.databaseConnectionsActive.set(activeConnections);
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    try {
      // Update business metrics before returning
      await this.updateApiResourceMetrics();
      
      return await register.metrics();
    } catch (error) {
      this.logger.error('Failed to get metrics:', error);
      return '';
    }
  }

  /**
   * Get metrics registry for testing
   */
  getRegistry() {
    return register;
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics() {
    register.clear();
  }

  /**
   * Start periodic metric updates
   */
  private startPeriodicUpdates() {
    // Update API resource metrics every 30 seconds
    setInterval(async () => {
      await this.updateApiResourceMetrics();
    }, 30000);

    this.logger.log('Started periodic metrics updates');
  }
}