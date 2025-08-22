#!/usr/bin/env ts-node

/**
 * Search Health Monitoring Script
 * Monitors the health of search services and sends alerts when issues are detected
 */

/// <reference path="./types/elasticsearch.d.ts" />
/// <reference path="./types/redis.d.ts" />

import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import * as fs from 'fs';
import * as path from 'path';
import { Client as PostgresClient } from 'pg';

interface HealthConfig {
  checkInterval: number;
  alertThresholds: {
    elasticsearchResponseTime: number;
    redisResponseTime: number;
    errorRate: number;
    diskUsage: number;
    memoryUsage: number;
  };
  alerting: {
    enabled: boolean;
    webhookUrl?: string;
    emailEnabled: boolean;
    slackEnabled: boolean;
  };
  logFile: string;
}

interface HealthStatus {
  timestamp: Date;
  overall: 'healthy' | 'warning' | 'critical';
  services: {
    elasticsearch: ServiceHealth;
    redis: ServiceHealth;
    database: ServiceHealth;
    searchApi: ServiceHealth;
  };
  metrics: {
    searchLatency: number;
    indexingRate: number;
    cacheHitRate: number;
    errorRate: number;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'warning' | 'critical' | 'down';
  responseTime: number;
  lastCheck: Date;
  errors: string[];
  metrics?: any;
}

class SearchHealthMonitor {
  private prisma: PrismaClient;
  private redis: any;
  private elasticsearch: ElasticsearchClient;
  private config: HealthConfig;
  private isRunning: boolean = false;

  constructor(config: HealthConfig) {
    this.config = config;
    this.prisma = new PrismaClient();

    // Initialize Redis client
    this.redis = createClient({
      url: `redis://:${process.env.REDIS_SEARCH_PASSWORD || ''}@${process.env.REDIS_SEARCH_HOST || 'localhost'}:${process.env.REDIS_SEARCH_PORT || '6380'}/${process.env.REDIS_SEARCH_DB || '0'}`,
    });

    // Initialize Elasticsearch client
    this.elasticsearch = new ElasticsearchClient({
      node: `http://${process.env.ELASTICSEARCH_HOST || 'localhost'}:${process.env.ELASTICSEARCH_PORT || '9200'}`,
      requestTimeout: 10000,
    });
  }

  async initialize(): Promise<void> {
    try {
      if (!this.redis.isOpen) {
        await this.redis.connect();
      }
      console.log('✅ Connected to Redis for monitoring');

      await this.elasticsearch.ping();
      console.log('✅ Connected to Elasticsearch for monitoring');

      // Ensure log directory exists
      const logDir = path.dirname(this.config.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

    } catch (error) {
      console.error('❌ Failed to initialize health monitor:', error);
      throw error;
    }
  }

  async startMonitoring(): Promise<void> {
    console.log('🔍 Starting search health monitoring...');
    this.isRunning = true;

    while (this.isRunning) {
      try {
        const healthStatus = await this.checkHealth();
        await this.logHealthStatus(healthStatus);

        if (healthStatus.overall !== 'healthy') {
          await this.sendAlert(healthStatus);
        }

        // Wait for next check
        await this.sleep(this.config.checkInterval);

      } catch (error) {
        console.error('❌ Health check failed:', error);
        await this.sleep(this.config.checkInterval);
      }
    }
  }

  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date();
    console.log(`🔍 Running health check at ${timestamp.toISOString()}`);

    const healthStatus: HealthStatus = {
      timestamp,
      overall: 'healthy',
      services: {
        elasticsearch: await this.checkElasticsearch(),
        redis: await this.checkRedis(),
        database: await this.checkDatabase(),
        searchApi: await this.checkSearchApi(),
      },
      metrics: await this.collectMetrics(),
    };

    // Determine overall health
    const serviceStatuses = Object.values(healthStatus.services).map(s => s.status);
    if (serviceStatuses.includes('critical') || serviceStatuses.includes('down')) {
      healthStatus.overall = 'critical';
    } else if (serviceStatuses.includes('warning')) {
      healthStatus.overall = 'warning';
    }

    return healthStatus;
  }

  private async checkElasticsearch(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const health: ServiceHealth = {
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date(),
      errors: [],
    };

    try {
      // Check cluster health
      const clusterHealth = await this.elasticsearch.cluster.health();
      health.responseTime = Date.now() - startTime;

      const clusterStatus = clusterHealth.status;
      if (clusterStatus === 'red') {
        health.status = 'critical';
        health.errors.push('Elasticsearch cluster status is red');
      } else if (clusterStatus === 'yellow') {
        health.status = 'warning';
        health.errors.push('Elasticsearch cluster status is yellow');
      }

      // Check response time
      if (health.responseTime > this.config.alertThresholds.elasticsearchResponseTime) {
        health.status = health.status === 'critical' ? 'critical' : 'warning';
        health.errors.push(`High response time: ${health.responseTime}ms`);
      }

      // Get additional metrics
      const stats = await this.elasticsearch.cluster.stats();
      health.metrics = {
        nodes: stats.nodes.count.total,
        indices: stats.indices.count,
        docs: stats.indices.docs.count,
        storeSize: stats.indices.store.size_in_bytes,
      };

      // Check disk usage
      const nodeStats = await this.elasticsearch.nodes.stats();
      const nodes = Object.values(nodeStats.nodes) as any[];
      const maxDiskUsage = Math.max(...nodes.map(node =>
        (node.fs.total.total_in_bytes - node.fs.total.available_in_bytes) / node.fs.total.total_in_bytes * 100
      ));

      if (maxDiskUsage > this.config.alertThresholds.diskUsage) {
        health.status = health.status === 'critical' ? 'critical' : 'warning';
        health.errors.push(`High disk usage: ${maxDiskUsage.toFixed(1)}%`);
      }

    } catch (error) {
      health.status = 'down';
      health.responseTime = Date.now() - startTime;
      health.errors.push(`Connection failed: ${error.message}`);
    }

    return health;
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const health: ServiceHealth = {
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date(),
      errors: [],
    };

    try {
      // Ping Redis
      const pong = await this.redis.ping();
      health.responseTime = Date.now() - startTime;

      if (pong !== 'PONG') {
        health.status = 'critical';
        health.errors.push('Redis ping failed');
      }

      // Check response time
      if (health.responseTime > this.config.alertThresholds.redisResponseTime) {
        health.status = health.status === 'critical' ? 'critical' : 'warning';
        health.errors.push(`High response time: ${health.responseTime}ms`);
      }

      // Get Redis info
      const info = await this.redis.info();
      const infoLines = info.split('\r\n');
      const infoObj = {};

      infoLines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          infoObj[key] = value;
        }
      });

      health.metrics = {
        connectedClients: parseInt(infoObj['connected_clients'] || '0'),
        usedMemory: parseInt(infoObj['used_memory'] || '0'),
        totalKeys: await this.redis.dbsize(),
      };

      // Check memory usage
      const maxMemory = parseInt(infoObj['maxmemory'] || '0');
      if (maxMemory > 0) {
        const memoryUsage = (health.metrics.usedMemory / maxMemory) * 100;
        if (memoryUsage > this.config.alertThresholds.memoryUsage) {
          health.status = health.status === 'critical' ? 'critical' : 'warning';
          health.errors.push(`High memory usage: ${memoryUsage.toFixed(1)}%`);
        }
      }

    } catch (error) {
      health.status = 'down';
      health.responseTime = Date.now() - startTime;
      health.errors.push(`Connection failed: ${error.message}`);
    }

    return health;
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const health: ServiceHealth = {
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date(),
      errors: [],
    };

    try {
      // Simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      health.responseTime = Date.now() - startTime;

      // Get search-related table counts
      const searchLogCount = await this.prisma.searchLog.count();
      const searchClickCount = await this.prisma.searchClick.count();
      const savedSearchCount = await this.prisma.savedSearch.count();

      health.metrics = {
        searchLogs: searchLogCount,
        searchClicks: searchClickCount,
        savedSearches: savedSearchCount,
      };

    } catch (error) {
      health.status = 'down';
      health.responseTime = Date.now() - startTime;
      health.errors.push(`Database connection failed: ${error.message}`);
    }

    return health;
  }

  private async checkSearchApi(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const health: ServiceHealth = {
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date(),
      errors: [],
    };

    try {
      // Make a test search request
      const baseUrl = process.env.SEARCH_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/v1/search/health`);

      health.responseTime = Date.now() - startTime;

      if (!response.ok) {
        health.status = 'critical';
        health.errors.push(`API returned status: ${response.status}`);
      }

      const data = await response.json();
      health.metrics = data;

    } catch (error) {
      health.status = 'down';
      health.responseTime = Date.now() - startTime;
      health.errors.push(`API request failed: ${error.message}`);
    }

    return health;
  }

  private async collectMetrics(): Promise<any> {
    try {
      // Calculate search latency from recent logs
      const recentLogs = await this.prisma.searchLog.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
        select: {
          took: true,
          resultsCount: true,
        },
      });

      const searchLatency = recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + log.took, 0) / recentLogs.length
        : 0;

      // Calculate cache hit rate
      const cacheStats = await this.redis.info('stats');
      const cacheHits = parseInt(cacheStats.match(/keyspace_hits:(\d+)/)?.[1] || '0');
      const cacheMisses = parseInt(cacheStats.match(/keyspace_misses:(\d+)/)?.[1] || '0');
      const cacheHitRate = cacheHits + cacheMisses > 0
        ? (cacheHits / (cacheHits + cacheMisses)) * 100
        : 0;

      // Calculate error rate
      const totalRequests = recentLogs.length;
      const errorRequests = recentLogs.filter(log => log.resultsCount === 0).length;
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

      return {
        searchLatency,
        indexingRate: 0, // Would need to track this separately
        cacheHitRate,
        errorRate,
      };

    } catch (error) {
      console.error('❌ Failed to collect metrics:', error);
      return {
        searchLatency: 0,
        indexingRate: 0,
        cacheHitRate: 0,
        errorRate: 0,
      };
    }
  }

  private async logHealthStatus(healthStatus: HealthStatus): Promise<void> {
    const logEntry = {
      timestamp: healthStatus.timestamp.toISOString(),
      overall: healthStatus.overall,
      services: Object.entries(healthStatus.services).reduce((acc, [name, service]) => {
        acc[name] = {
          status: service.status,
          responseTime: service.responseTime,
          errors: service.errors,
        };
        return acc;
      }, {}),
      metrics: healthStatus.metrics,
    };

    // Append to log file
    fs.appendFileSync(this.config.logFile, JSON.stringify(logEntry) + '\n');

    // Console output
    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      critical: '❌',
    };

    console.log(`${statusEmoji[healthStatus.overall]} Overall status: ${healthStatus.overall}`);

    Object.entries(healthStatus.services).forEach(([name, service]) => {
      const serviceEmoji = {
        healthy: '✅',
        warning: '⚠️',
        critical: '❌',
        down: '🔴',
      };
      console.log(`  ${serviceEmoji[service.status]} ${name}: ${service.status} (${service.responseTime}ms)`);

      if (service.errors.length > 0) {
        service.errors.forEach(error => console.log(`    - ${error}`));
      }
    });
  }

  private async sendAlert(healthStatus: HealthStatus): Promise<void> {
    if (!this.config.alerting.enabled) {
      return;
    }

    const alertMessage = this.formatAlertMessage(healthStatus);

    try {
      // Send webhook alert
      if (this.config.alerting.webhookUrl) {
        await fetch(this.config.alerting.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: alertMessage,
            status: healthStatus.overall,
            timestamp: healthStatus.timestamp,
            services: healthStatus.services,
          }),
        });
      }

      console.log('🚨 Alert sent:', alertMessage);

    } catch (error) {
      console.error('❌ Failed to send alert:', error);
    }
  }

  private formatAlertMessage(healthStatus: HealthStatus): string {
    const criticalServices = Object.entries(healthStatus.services)
      .filter(([_, service]) => service.status === 'critical' || service.status === 'down')
      .map(([name, service]) => `${name}: ${service.status}`);

    const warningServices = Object.entries(healthStatus.services)
      .filter(([_, service]) => service.status === 'warning')
      .map(([name, service]) => `${name}: ${service.status}`);

    let message = `🚨 Search System Health Alert - Status: ${healthStatus.overall.toUpperCase()}`;

    if (criticalServices.length > 0) {
      message += `\n\n❌ Critical Issues:\n${criticalServices.join('\n')}`;
    }

    if (warningServices.length > 0) {
      message += `\n\n⚠️ Warnings:\n${warningServices.join('\n')}`;
    }

    message += `\n\n📊 Metrics:`;
    message += `\n- Search Latency: ${healthStatus.metrics.searchLatency.toFixed(2)}ms`;
    message += `\n- Cache Hit Rate: ${healthStatus.metrics.cacheHitRate.toFixed(1)}%`;
    message += `\n- Error Rate: ${healthStatus.metrics.errorRate.toFixed(1)}%`;

    message += `\n\nTimestamp: ${healthStatus.timestamp.toISOString()}`;

    return message;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stopMonitoring(): Promise<void> {
    console.log('🛑 Stopping search health monitoring...');
    this.isRunning = false;
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      if (this.redis.isOpen) {
        await this.redis.disconnect();
      }
      console.log('✅ Disconnected from all services');
    } catch (error) {
      console.error('❌ Failed to disconnect:', error);
    }
  }
}

// Main execution
async function main() {
  const config: HealthConfig = {
    checkInterval: parseInt(process.env.SEARCH_HEALTH_CHECK_INTERVAL || '60000'), // 1 minute
    alertThresholds: {
      elasticsearchResponseTime: parseInt(process.env.SEARCH_ALERT_ES_RESPONSE_TIME || '1000'),
      redisResponseTime: parseInt(process.env.SEARCH_ALERT_REDIS_RESPONSE_TIME || '100'),
      errorRate: parseFloat(process.env.SEARCH_ALERT_ERROR_RATE || '5.0'),
      diskUsage: parseFloat(process.env.SEARCH_ALERT_DISK_USAGE || '85.0'),
      memoryUsage: parseFloat(process.env.SEARCH_ALERT_MEMORY_USAGE || '90.0'),
    },
    alerting: {
      enabled: process.env.SEARCH_ALERTING_ENABLED !== 'false',
      webhookUrl: process.env.SEARCH_ALERT_WEBHOOK_URL,
      emailEnabled: process.env.SEARCH_ALERT_EMAIL_ENABLED === 'true',
      slackEnabled: process.env.SEARCH_ALERT_SLACK_ENABLED === 'true',
    },
    logFile: process.env.SEARCH_HEALTH_LOG_FILE || './logs/search/health.log',
  };

  const monitor = new SearchHealthMonitor(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await monitor.stopMonitoring();
    await monitor.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await monitor.stopMonitoring();
    await monitor.disconnect();
    process.exit(0);
  });

  try {
    await monitor.initialize();

    const command = process.argv[2];
    if (command === 'check') {
      // Single health check
      const healthStatus = await monitor.checkHealth();
      console.log('\n📊 Health Check Results:');
      console.log(JSON.stringify(healthStatus, null, 2));
    } else {
      // Continuous monitoring
      await monitor.startMonitoring();
    }

  } catch (error) {
    console.error('❌ Health monitoring failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { SearchHealthMonitor };