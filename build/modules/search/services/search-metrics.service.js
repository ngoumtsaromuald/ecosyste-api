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
var SearchMetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchMetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let SearchMetricsService = SearchMetricsService_1 = class SearchMetricsService {
    constructor() {
        this.logger = new common_1.Logger(SearchMetricsService_1.name);
        this.searchLatency = new prom_client_1.Histogram({
            name: 'search_duration_seconds',
            help: 'Duration of search requests in seconds',
            labelNames: ['search_type', 'status', 'cache_hit'],
            buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
        });
        this.searchRequestsTotal = new prom_client_1.Counter({
            name: 'search_requests_total',
            help: 'Total number of search requests',
            labelNames: ['search_type', 'status', 'user_type']
        });
        this.searchResultsCount = new prom_client_1.Histogram({
            name: 'search_results_count',
            help: 'Number of results returned by search queries',
            labelNames: ['search_type', 'has_filters'],
            buckets: [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000]
        });
        this.searchErrorsTotal = new prom_client_1.Counter({
            name: 'search_errors_total',
            help: 'Total number of search errors',
            labelNames: ['error_type', 'search_type', 'component']
        });
        this.searchCacheHitRate = new prom_client_1.Gauge({
            name: 'search_cache_hit_rate',
            help: 'Search cache hit rate percentage',
            labelNames: ['cache_type']
        });
        this.searchActiveQueries = new prom_client_1.Gauge({
            name: 'search_active_queries',
            help: 'Number of currently active search queries'
        });
        this.searchIndexHealth = new prom_client_1.Gauge({
            name: 'search_index_health_score',
            help: 'Search index health score (0=red, 1=yellow, 2=green)',
            labelNames: ['index_name']
        });
        this.searchSuggestionLatency = new prom_client_1.Histogram({
            name: 'search_suggestion_duration_seconds',
            help: 'Duration of search suggestion requests in seconds',
            labelNames: ['suggestion_type'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5]
        });
        this.searchGeographicQueries = new prom_client_1.Counter({
            name: 'search_geographic_queries_total',
            help: 'Total number of geographic search queries',
            labelNames: ['location_type', 'radius_range']
        });
        this.searchPersonalizedQueries = new prom_client_1.Counter({
            name: 'search_personalized_queries_total',
            help: 'Total number of personalized search queries',
            labelNames: ['personalization_type', 'user_segment']
        });
        this.searchQueryLength = new prom_client_1.Histogram({
            name: 'search_query_length_chars',
            help: 'Length of search queries in characters',
            buckets: [0, 5, 10, 20, 50, 100, 200]
        });
        this.searchFilterUsage = new prom_client_1.Counter({
            name: 'search_filter_usage_total',
            help: 'Usage count of different search filters',
            labelNames: ['filter_type', 'filter_value']
        });
        this.logger.log('SearchMetricsService initialized with Prometheus metrics');
    }
    recordSearchLatency(duration, searchType, status, cacheHit = false) {
        this.searchLatency
            .labels(searchType, status, cacheHit ? 'hit' : 'miss')
            .observe(duration / 1000);
    }
    recordSearchRequest(searchType, status, userType = 'anonymous') {
        this.searchRequestsTotal
            .labels(searchType, status, userType)
            .inc();
    }
    recordSearchResults(resultsCount, searchType, hasFilters = false) {
        this.searchResultsCount
            .labels(searchType, hasFilters ? 'with_filters' : 'no_filters')
            .observe(resultsCount);
    }
    recordSearchError(errorType, searchType, component = 'search_service') {
        this.searchErrorsTotal
            .labels(errorType, searchType, component)
            .inc();
    }
    updateCacheHitRate(cacheType, hitRate) {
        this.searchCacheHitRate
            .labels(cacheType)
            .set(hitRate);
    }
    updateActiveQueries(count) {
        this.searchActiveQueries.set(count);
    }
    updateIndexHealth(indexName, healthStatus) {
        const healthScore = healthStatus === 'green' ? 2 : healthStatus === 'yellow' ? 1 : 0;
        this.searchIndexHealth
            .labels(indexName)
            .set(healthScore);
    }
    recordSuggestionLatency(duration, suggestionType) {
        this.searchSuggestionLatency
            .labels(suggestionType)
            .observe(duration / 1000);
    }
    recordGeographicQuery(locationType, radiusKm) {
        const radiusRange = this.getRadiusRange(radiusKm);
        this.searchGeographicQueries
            .labels(locationType, radiusRange)
            .inc();
    }
    recordPersonalizedQuery(personalizationType, userSegment) {
        this.searchPersonalizedQueries
            .labels(personalizationType, userSegment)
            .inc();
    }
    recordQueryCharacteristics(params) {
        if (params.query) {
            this.searchQueryLength.observe(params.query.length);
        }
        if (params.filters) {
            if (params.filters.categories?.length) {
                this.searchFilterUsage.labels('category', 'multiple').inc();
            }
            if (params.filters.resourceTypes?.length) {
                this.searchFilterUsage.labels('resource_type', 'multiple').inc();
            }
            if (params.filters.plans?.length) {
                this.searchFilterUsage.labels('plan', 'multiple').inc();
            }
            if (params.filters.location) {
                this.searchFilterUsage.labels('location', 'geographic').inc();
            }
            if (params.filters.priceRange) {
                this.searchFilterUsage.labels('price', 'range').inc();
            }
        }
    }
    recordSearchMetrics(params, results, duration, searchType, cacheHit = false, userType = 'anonymous') {
        this.recordSearchLatency(duration, searchType, 'success', cacheHit);
        this.recordSearchRequest(searchType, 'success', userType);
        this.recordSearchResults(results.total, searchType, !!params.filters);
        this.recordQueryCharacteristics(params);
        if (params.filters?.location) {
            this.recordGeographicQuery('user_location', 10);
        }
    }
    async getMetrics() {
        try {
            return await prom_client_1.register.metrics();
        }
        catch (error) {
            this.logger.error('Failed to get search metrics:', error);
            return '';
        }
    }
    getSearchMetricsSummary() {
        return {
            searchLatency: this.searchLatency,
            searchRequestsTotal: this.searchRequestsTotal,
            searchResultsCount: this.searchResultsCount,
            searchErrorsTotal: this.searchErrorsTotal,
            searchCacheHitRate: this.searchCacheHitRate,
            searchActiveQueries: this.searchActiveQueries,
            searchIndexHealth: this.searchIndexHealth,
            searchSuggestionLatency: this.searchSuggestionLatency,
            searchGeographicQueries: this.searchGeographicQueries,
            searchPersonalizedQueries: this.searchPersonalizedQueries
        };
    }
    clearMetrics() {
        prom_client_1.register.clear();
        this.logger.debug('Search metrics cleared');
    }
    getRadiusRange(radiusKm) {
        if (radiusKm <= 1)
            return '0-1km';
        if (radiusKm <= 5)
            return '1-5km';
        if (radiusKm <= 10)
            return '5-10km';
        if (radiusKm <= 25)
            return '10-25km';
        if (radiusKm <= 50)
            return '25-50km';
        return '50km+';
    }
};
exports.SearchMetricsService = SearchMetricsService;
exports.SearchMetricsService = SearchMetricsService = SearchMetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SearchMetricsService);
//# sourceMappingURL=search-metrics.service.js.map