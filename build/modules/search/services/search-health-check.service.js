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
var SearchHealthCheckService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchHealthCheckService = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_service_1 = require("./elasticsearch.service");
const search_cache_service_1 = require("./search-cache.service");
const indexing_service_1 = require("./indexing.service");
const search_analytics_service_1 = require("./search-analytics.service");
const search_metrics_service_1 = require("./search-metrics.service");
let SearchHealthCheckService = SearchHealthCheckService_1 = class SearchHealthCheckService {
    constructor(elasticsearchService, cacheService, indexingService, analyticsService, metricsService) {
        this.elasticsearchService = elasticsearchService;
        this.cacheService = cacheService;
        this.indexingService = indexingService;
        this.analyticsService = analyticsService;
        this.metricsService = metricsService;
        this.logger = new common_1.Logger(SearchHealthCheckService_1.name);
        this.startTime = Date.now();
        this.healthHistory = [];
        this.maxHistorySize = 100;
        this.thresholds = {
            responseTime: {
                warning: 500,
                critical: 2000
            },
            errorRate: {
                warning: 0.05,
                critical: 0.15
            },
            cacheHitRate: {
                warning: 0.7,
                critical: 0.5
            },
            indexDocuments: {
                warning: 0.9,
                critical: 0.7
            }
        };
        this.logger.log('SearchHealthCheckService initialized');
    }
    async performHealthCheck() {
        const startTime = Date.now();
        const timestamp = new Date();
        const uptime = Date.now() - this.startTime;
        this.logger.debug('Starting comprehensive search health check');
        try {
            const healthChecks = await Promise.allSettled([
                this.checkElasticsearch(),
                this.checkRedis(),
                this.checkIndexing(),
                this.checkAnalytics(),
                this.checkCache()
            ]);
            const [elasticsearchResult, redisResult, indexingResult, analyticsResult, cacheResult] = healthChecks;
            const checks = {
                elasticsearch: this.extractHealthResult(elasticsearchResult),
                redis: this.extractHealthResult(redisResult),
                indexing: this.extractHealthResult(indexingResult),
                analytics: this.extractHealthResult(analyticsResult),
                cache: this.extractHealthResult(cacheResult)
            };
            const status = this.determineOverallStatus(checks);
            const metrics = await this.collectHealthMetrics();
            const alerts = this.generateAlerts(checks, metrics);
            const healthStatus = {
                status,
                timestamp,
                uptime,
                checks,
                metrics,
                alerts
            };
            this.addToHistory(healthStatus);
            this.updateHealthMetrics(healthStatus);
            const duration = Date.now() - startTime;
            this.logger.log(`Health check completed in ${duration}ms: ${status}`, {
                status,
                duration,
                alertsCount: alerts.length
            });
            return healthStatus;
        }
        catch (error) {
            this.logger.error('Health check failed:', error);
            const errorStatus = {
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
    async checkElasticsearch() {
        const startTime = Date.now();
        try {
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
        }
        catch (error) {
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
    async checkRedis() {
        const startTime = Date.now();
        try {
            const isConnected = await this.cacheService.testConnection();
            const responseTime = Date.now() - startTime;
            const redisInfo = await this.cacheService.getInfo();
            return {
                status: isConnected ? 'up' : 'down',
                responseTime,
                lastCheck: new Date(),
                details: redisInfo
            };
        }
        catch (error) {
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
    async checkIndexing() {
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
        }
        catch (error) {
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
    async checkAnalytics() {
        const startTime = Date.now();
        try {
            const recentMetrics = await this.analyticsService.getSearchMetrics({
                from: new Date(Date.now() - 60000),
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
        }
        catch (error) {
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
    async checkCache() {
        const startTime = Date.now();
        try {
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
        }
        catch (error) {
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
    async collectHealthMetrics() {
        try {
            const metrics = await this.analyticsService.getSearchMetrics({
                from: new Date(Date.now() - 3600000),
                to: new Date(),
                granularity: 'hour'
            });
            const indexHealth = await this.indexingService.checkIndexHealth();
            return {
                totalSearches: metrics.totalSearches || 0,
                averageResponseTime: metrics.averageResponseTime || 0,
                errorRate: 0,
                cacheHitRate: 0,
                indexHealth: indexHealth.status,
                activeConnections: 0
            };
        }
        catch (error) {
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
    generateAlerts(checks, metrics) {
        const alerts = [];
        const timestamp = new Date();
        Object.entries(checks).forEach(([component, health]) => {
            if (health.status === 'down') {
                alerts.push({
                    level: 'critical',
                    component,
                    message: `${component} is down: ${health.error || 'Unknown error'}`,
                    timestamp
                });
            }
            else if (health.status === 'degraded') {
                alerts.push({
                    level: 'warning',
                    component,
                    message: `${component} is degraded`,
                    timestamp
                });
            }
            if (health.responseTime > this.thresholds.responseTime.critical) {
                alerts.push({
                    level: 'critical',
                    component,
                    message: `${component} response time is critical`,
                    timestamp,
                    threshold: this.thresholds.responseTime.critical,
                    currentValue: health.responseTime
                });
            }
            else if (health.responseTime > this.thresholds.responseTime.warning) {
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
        if (metrics.errorRate > this.thresholds.errorRate.critical) {
            alerts.push({
                level: 'critical',
                component: 'search_metrics',
                message: 'Search error rate is critical',
                timestamp,
                threshold: this.thresholds.errorRate.critical,
                currentValue: metrics.errorRate
            });
        }
        else if (metrics.errorRate > this.thresholds.errorRate.warning) {
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
        }
        else if (metrics.cacheHitRate < this.thresholds.cacheHitRate.warning) {
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
    determineOverallStatus(checks) {
        const statuses = Object.values(checks).map(check => check.status);
        if (statuses.includes('down')) {
            return 'unhealthy';
        }
        if (statuses.includes('degraded')) {
            return 'degraded';
        }
        return 'healthy';
    }
    extractHealthResult(result) {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        else {
            return {
                status: 'down',
                responseTime: 0,
                lastCheck: new Date(),
                error: result.reason?.message || 'Unknown error'
            };
        }
    }
    addToHistory(status) {
        this.healthHistory.push(status);
        if (this.healthHistory.length > this.maxHistorySize) {
            this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
        }
    }
    updateHealthMetrics(status) {
        try {
            Object.entries(status.checks).forEach(([component, health]) => {
                const healthScore = health.status === 'up' ? 1 : health.status === 'degraded' ? 0.5 : 0;
            });
            const overallHealthScore = status.status === 'healthy' ? 1 : status.status === 'degraded' ? 0.5 : 0;
        }
        catch (error) {
            this.logger.error('Failed to update health metrics:', error);
        }
    }
    getHealthHistory(limit = 10) {
        return this.healthHistory.slice(-limit);
    }
    getCurrentAlerts() {
        const latestStatus = this.healthHistory[this.healthHistory.length - 1];
        return latestStatus?.alerts || [];
    }
    async isHealthy() {
        try {
            const status = await this.performHealthCheck();
            return status.status === 'healthy';
        }
        catch (error) {
            this.logger.error('Health check failed:', error);
            return false;
        }
    }
};
exports.SearchHealthCheckService = SearchHealthCheckService;
exports.SearchHealthCheckService = SearchHealthCheckService = SearchHealthCheckService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [elasticsearch_service_1.ElasticsearchService,
        search_cache_service_1.SearchCacheService,
        indexing_service_1.IndexingService,
        search_analytics_service_1.SearchAnalyticsService,
        search_metrics_service_1.SearchMetricsService])
], SearchHealthCheckService);
//# sourceMappingURL=search-health-check.service.js.map