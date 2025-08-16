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
var MetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
const prisma_service_1 = require("../config/prisma.service");
let MetricsService = MetricsService_1 = class MetricsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MetricsService_1.name);
        this.updateInterval = null;
        this.httpRequestsTotal = new prom_client_1.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
        });
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route'],
            buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
        });
        this.apiResourcesTotal = new prom_client_1.Gauge({
            name: 'api_resources_total',
            help: 'Total number of API resources',
            labelNames: ['status', 'plan', 'type'],
        });
        this.cacheHitRate = new prom_client_1.Gauge({
            name: 'cache_hit_rate',
            help: 'Cache hit rate percentage',
            labelNames: ['cache_type'],
        });
        this.cacheOperationsTotal = new prom_client_1.Counter({
            name: 'cache_operations_total',
            help: 'Total number of cache operations',
            labelNames: ['operation', 'cache_type', 'result'],
        });
        this.databaseConnectionsActive = new prom_client_1.Gauge({
            name: 'database_connections_active',
            help: 'Number of active database connections',
        });
        this.databaseQueryDuration = new prom_client_1.Histogram({
            name: 'database_query_duration_seconds',
            help: 'Duration of database queries in seconds',
            labelNames: ['operation'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
        });
        this.initializeMetrics();
    }
    initializeMetrics() {
        prom_client_1.register.clear();
        prom_client_1.register.registerMetric(this.httpRequestsTotal);
        prom_client_1.register.registerMetric(this.httpRequestDuration);
        prom_client_1.register.registerMetric(this.apiResourcesTotal);
        prom_client_1.register.registerMetric(this.cacheHitRate);
        prom_client_1.register.registerMetric(this.cacheOperationsTotal);
        prom_client_1.register.registerMetric(this.databaseConnectionsActive);
        prom_client_1.register.registerMetric(this.databaseQueryDuration);
        this.startPeriodicUpdates();
    }
    recordHttpRequest(method, route, statusCode, duration) {
        this.httpRequestsTotal.inc({
            method: method.toUpperCase(),
            route,
            status_code: statusCode.toString()
        });
        this.httpRequestDuration.observe({ method: method.toUpperCase(), route }, duration / 1000);
    }
    recordCacheOperation(operation, cacheType, result) {
        this.cacheOperationsTotal.inc({ operation, cache_type: cacheType, result });
    }
    updateCacheHitRate(cacheType, hitRate) {
        this.cacheHitRate.set({ cache_type: cacheType }, hitRate);
    }
    recordDatabaseQuery(operation, duration) {
        this.databaseQueryDuration.observe({ operation }, duration / 1000);
    }
    async updateApiResourceMetrics() {
        try {
            const stats = await this.prisma.apiResource.groupBy({
                by: ['status', 'plan', 'resourceType'],
                _count: true,
                where: { deletedAt: null },
            });
            this.apiResourcesTotal.reset();
            stats.forEach(stat => {
                this.apiResourcesTotal.set({
                    status: stat.status.toLowerCase(),
                    plan: stat.plan.toLowerCase(),
                    type: stat.resourceType.toLowerCase()
                }, stat._count);
            });
            this.logger.debug('Updated API resource metrics');
        }
        catch (error) {
            this.logger.error('Failed to update API resource metrics:', error);
        }
    }
    updateDatabaseConnections(activeConnections) {
        this.databaseConnectionsActive.set(activeConnections);
    }
    async getMetrics() {
        try {
            await this.updateApiResourceMetrics();
            return await prom_client_1.register.metrics();
        }
        catch (error) {
            this.logger.error('Failed to get metrics:', error);
            return '';
        }
    }
    getRegistry() {
        return prom_client_1.register;
    }
    clearMetrics() {
        prom_client_1.register.clear();
    }
    startPeriodicUpdates() {
        setInterval(async () => {
            await this.updateApiResourceMetrics();
        }, 30000);
        this.logger.log('Started periodic metrics updates');
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = MetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map