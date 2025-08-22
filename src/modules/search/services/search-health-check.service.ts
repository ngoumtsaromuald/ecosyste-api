import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { SearchCacheService } from './search-cache.service';
import { IndexingService } from './indexing.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { SearchMetricsService } from './search-metrics.service';

export interface SearchHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  checks: {
    elasticsearch: SearchComponentHealth;
    redis: SearchComponentHealth;
    indexing: SearchComponentHealth;
    analytics: SearchComponentHealth;
    cache: SearchComponentHealth;
  };
  metrics: SearchHealthMetrics;
  alerts: SearchHealthAlert[];
}

export interface SearchComponentHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: Date;
  error?: string;
  details?: Record<string, any>;
}

export interface SearchHealthMetrics {
  totalSearches: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  indexHealth: string;
  activeConnections: number;
}

export interface SearchHealthAlert {
  level: 'warning' | 'critical';
  component: string;
  message: string;
  timestamp: Date;
  threshold?: number;
  currentValue?: number;
}

@Injectable()
export class SearchHealthCheckService {
  private readonly logger = new Logger(SearchHealthCheckService.name);
  private readonly startTime = Date.now();
  private healthHistory: SearchHealthStatus[] = [];
  private readonly maxHistorySize = 100;

  // Health check thresholds
  private readonly thresholds = {
    responseTime: {
      warning: 500, // ms
      critical: 2000 // ms
    },
    errorRate: {
      warning: 0.05, // 5%
      critical: 0.15 // 15%
    },
    cacheHitRate: {
      warning: 0.7, // 70%
      critical: 0.5 // 50%
    },
    indexDocuments: {
      warning: 0.9, // 90% of expected
      critical: 0.7 // 70% of expected
    }
  };

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly cacheService: SearchCacheService,
    private readonly indexingService: IndexingService,
    private readonly analyticsService: SearchAnalyticsService,
    private readonly metricsService: SearchMetricsService
  ) {
    this.logger.log('SearchHealthCheckService initialized');
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SearchHealthStatus> {
    const startTime = Date.now();
    const timestamp = new Date();
    const uptime = Date.now() - this.startTime;

    this.logger.debug('Starting comprehensive search health check');

    try {
      // Run all health checks in parallel with timeout
      const healthChecks = await Promise.allSettled([
        this.checkElasticsearch(),
        this.checkRedis(),
        this.checkIndexing(),
        this.checkAnalytics(),
        this.checkCache()
      ]);

      const [
        elasticsearchResult,
        redisResult,
        indexingResult,
        analyticsResult,
        cacheResult
      ] = healthChecks;

      const checks = {
        elasticsearch: this.extractHealthResult(elasticsearchResult),
        redis: this.extractHealthResult(redisResult),
        indexing: this.extractHealthResult(indexingResult),
        analytics: this.extractHealthResult(analyticsResult),
        cache: this.extractHealthResult(cacheResult)
      };

      // Determine overall status
      const status = this.determineOverallStatus(checks);

      // Collect metrics
      const metrics = await this.collectHealthMetrics();

      // Generate alerts
      const alerts = this.generateAlerts(checks, metrics);

      const healthStatus: SearchHealthStatus = {
        status,
        timestamp,
        uptime,
        checks,
        metrics,
        alerts
      };

      // Store in history
      this.addToHistory(healthStatus);

      // Update metrics
      this.updateHealthMetrics(healthStatus);

      const duration = Date.now() - startTime;
      this.logger.log(`Health check completed in ${duration}ms: ${status}`, {
        status,
        duration,
        alertsCount: alerts.length
      });

      return healthStatus;

    } catch (error) {
      this.logger.error('Health check failed:', error);
      
      const errorStatus: SearchHealthStatus = {
        status: 'unhealthy',
        timestamp,
        uptime,
        checks: {
          elasticsearch: { status: 'down', responseTime: 0, lastCheck: timestamp, error: error.message },
          redis: { status: 'down', responseTime: 0, lastCheck: timestamp, error: error.message },
          indexing: { status: 'down', responseTime: 0, lastCheck: timestamp, error: error.message },
          analytics: { status: 'down', responseTime: 0, lastCheck: timestamp, error: error.message },
          cache: { status: 'down', responseTime: 0, lastCheck: timestamp, error: error.message }
        },
        metrics: {
          totalSearches: 0,
          averageResponseTime: 0,
          errorRate: 1,
          cacheHitRate: 0,
          indexHealth: 'red',
          activeConnections: 0
        },
        alerts: [{
          level: 'critical',
          component: 'health_check',
          message: `Health check system failure: ${error.message}`,
          timestamp
        }]
      };

      this.addToHistory(errorStatus);
      return errorStatus;
    }
  }

  /**
   * Check Elasticsearch health
   */
  private async checkElasticsearch(): Promise<SearchComponentHealth> {
    const startTime = Date.now();
    
    try {
      // Check cluster health
      const clusterHealth = await this.elasticsearchService.getClusterHealth();
      const responseTime = Date.now() - startTime;

      const status = clusterHealth.status === 'green' ? 'up' : 
                    clusterHealth.status === 'yellow' ? 'degraded' : 'down';

      return {
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          clusterStatus: clusterHealth.status,
          numberOfNodes: clusterHealth.number_of_nodes,
          numberOfDataNodes: clusterHealth.number_of_data_nodes,
          activePrimaryShards: clusterHealth.active_primary_shards,
          activeShards: clusterHealth.active_shards
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Elasticsearch health check failed:', error);

      return {
        status: 'down',
        responseTime,
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<SearchComponentHealth> {
    const startTime = Date.now();
    
    try {
      const isConnected = await this.cacheService.testConnection();
      const responseTime = Date.now() - startTime;

      // Get Redis info
      const redisInfo = await this.cacheService.getInfo();

      return {
        status: isConnected ? 'up' : 'down',
        responseTime,
        lastCheck: new Date(),
        details: redisInfo
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Redis health check failed:', error);

      return {
        status: 'down',
        responseTime,
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check indexing service health
   */
  private async checkIndexing(): Promise<SearchComponentHealth> {
    const startTime = Date.now();
    
    try {
      const indexHealth = await this.indexingService.checkIndexHealth();
      const responseTime = Date.now() - startTime;

      const status = indexHealth.status === 'green' ? 'up' : 
                    indexHealth.status === 'yellow' ? 'degraded' : 'down';

      return {
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          indexStatus: indexHealth.status,
          totalDocs: indexHealth.totalDocs,
          indexSize: indexHealth.indexSize,
          lastUpdate: indexHealth.lastUpdate,
          errors: indexHealth.errors
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Indexing health check failed:', error);

      return {
        status: 'down',
        responseTime,
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check analytics service health
   */
  private async checkAnalytics(): Promise<SearchComponentHealth> {
    const startTime = Date.now();
    
    try {
      // Test analytics service by getting recent metrics
      const recentMetrics = await this.analyticsService.getSearchMetrics({
        from: new Date(Date.now() - 60000), // Last minute
        to: new Date(),
        granularity: 'hour'
      });

      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        responseTime,
        lastCheck: new Date(),
        details: {
          recentSearches: recentMetrics.totalSearches,
          averageResponseTime: recentMetrics.averageResponseTime
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Analytics health check failed:', error);

      return {
        status: 'down',
        responseTime,
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check cache service health
   */
  private async checkCache(): Promise<SearchComponentHealth> {
    const startTime = Date.now();
    
    try {
      // Test cache operations
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'health_check_value';
      
      await this.cacheService.set(testKey, testValue, 10);
      const retrievedValue = await this.cacheService.get(testKey);
      await this.cacheService.delete(testKey);

      const responseTime = Date.now() - startTime;
      const isWorking = retrievedValue === testValue;

      return {
        status: isWorking ? 'up' : 'degraded',
        responseTime,
        lastCheck: new Date(),
        details: {
          cacheTest: isWorking ? 'passed' : 'failed'
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Cache health check failed:', error);

      return {
        status: 'down',
        responseTime,
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Collect health metrics
   */
  private async collectHealthMetrics(): Promise<SearchHealthMetrics> {
    try {
      const metrics = await this.analyticsService.getSearchMetrics({
        from: new Date(Date.now() - 3600000), // Last hour
        to: new Date(),
        granularity: 'hour'
      });

      const indexHealth = await this.indexingService.checkIndexHealth();
      
      return {
        totalSearches: metrics.totalSearches || 0,
        averageResponseTime: metrics.averageResponseTime || 0,
        errorRate: 0, // TODO: Calculate error rate from metrics
        cacheHitRate: 0, // TODO: Calculate cache hit rate from cache stats
        indexHealth: indexHealth.status,
        activeConnections: 0 // TODO: Implement connection tracking
      };

    } catch (error) {
      this.logger.error('Failed to collect health metrics:', error);
      
      return {
        totalSearches: 0,
        averageResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        indexHealth: 'unknown',
        activeConnections: 0
      };
    }
  }

  /**
   * Generate health alerts
   */
  private generateAlerts(
    checks: SearchHealthStatus['checks'],
    metrics: SearchHealthMetrics
  ): SearchHealthAlert[] {
    const alerts: SearchHealthAlert[] = [];
    const timestamp = new Date();

    // Check component status
    Object.entries(checks).forEach(([component, health]) => {
      if (health.status === 'down') {
        alerts.push({
          level: 'critical',
          component,
          message: `${component} is down: ${health.error || 'Unknown error'}`,
          timestamp
        });
      } else if (health.status === 'degraded') {
        alerts.push({
          level: 'warning',
          component,
          message: `${component} is degraded`,
          timestamp
        });
      }

      // Check response times
      if (health.responseTime > this.thresholds.responseTime.critical) {
        alerts.push({
          level: 'critical',
          component,
          message: `${component} response time is critical`,
          timestamp,
          threshold: this.thresholds.responseTime.critical,
          currentValue: health.responseTime
        });
      } else if (health.responseTime > this.thresholds.responseTime.warning) {
        alerts.push({
          level: 'warning',
          component,
          message: `${component} response time is high`,
          timestamp,
          threshold: this.thresholds.responseTime.warning,
          currentValue: health.responseTime
        });
      }
    });

    // Check metrics thresholds
    if (metrics.errorRate > this.thresholds.errorRate.critical) {
      alerts.push({
        level: 'critical',
        component: 'search_metrics',
        message: 'Search error rate is critical',
        timestamp,
        threshold: this.thresholds.errorRate.critical,
        currentValue: metrics.errorRate
      });
    } else if (metrics.errorRate > this.thresholds.errorRate.warning) {
      alerts.push({
        level: 'warning',
        component: 'search_metrics',
        message: 'Search error rate is high',
        timestamp,
        threshold: this.thresholds.errorRate.warning,
        currentValue: metrics.errorRate
      });
    }

    if (metrics.cacheHitRate < this.thresholds.cacheHitRate.critical) {
      alerts.push({
        level: 'critical',
        component: 'cache_metrics',
        message: 'Cache hit rate is critically low',
        timestamp,
        threshold: this.thresholds.cacheHitRate.critical,
        currentValue: metrics.cacheHitRate
      });
    } else if (metrics.cacheHitRate < this.thresholds.cacheHitRate.warning) {
      alerts.push({
        level: 'warning',
        component: 'cache_metrics',
        message: 'Cache hit rate is low',
        timestamp,
        threshold: this.thresholds.cacheHitRate.warning,
        currentValue: metrics.cacheHitRate
      });
    }

    return alerts;
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(checks: SearchHealthStatus['checks']): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('down')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Extract health result from Promise.allSettled result
   */
  private extractHealthResult(result: PromiseSettledResult<SearchComponentHealth>): SearchComponentHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'down',
        responseTime: 0,
        lastCheck: new Date(),
        error: result.reason?.message || 'Unknown error'
      };
    }
  }

  /**
   * Add health status to history
   */
  private addToHistory(status: SearchHealthStatus): void {
    this.healthHistory.push(status);
    
    // Keep only the last N entries
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Update health metrics in Prometheus
   */
  private updateHealthMetrics(status: SearchHealthStatus): void {
    try {
      // Update component health metrics
      Object.entries(status.checks).forEach(([component, health]) => {
        const healthScore = health.status === 'up' ? 1 : health.status === 'degraded' ? 0.5 : 0;
        // Note: This would require extending SearchMetricsService with component health metrics
      });

      // Update overall health
      const overallHealthScore = status.status === 'healthy' ? 1 : status.status === 'degraded' ? 0.5 : 0;
      
    } catch (error) {
      this.logger.error('Failed to update health metrics:', error);
    }
  }

  /**
   * Get health history
   */
  getHealthHistory(limit: number = 10): SearchHealthStatus[] {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Get current alerts
   */
  getCurrentAlerts(): SearchHealthAlert[] {
    const latestStatus = this.healthHistory[this.healthHistory.length - 1];
    return latestStatus?.alerts || [];
  }

  /**
   * Check if system is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const status = await this.performHealthCheck();
      return status.status === 'healthy';
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}