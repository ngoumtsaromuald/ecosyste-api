"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("../../auth/auth.module");
const category_repository_1 = require("../../repositories/category.repository");
const api_resource_repository_1 = require("../../repositories/api-resource.repository");
const elasticsearch_service_1 = require("./services/elasticsearch.service");
const index_manager_service_1 = require("./services/index-manager.service");
const indexing_service_1 = require("./services/indexing.service");
const search_cache_service_1 = require("./services/search-cache.service");
const search_service_1 = require("./services/search.service");
const category_search_service_1 = require("./services/category-search.service");
const multi_type_search_service_1 = require("./services/multi-type-search.service");
const search_filter_persistence_service_1 = require("./services/search-filter-persistence.service");
const search_error_handler_service_1 = require("./services/search-error-handler.service");
const geocoding_service_1 = require("./services/geocoding.service");
const search_analytics_service_1 = require("./services/search-analytics.service");
const personalized_search_service_1 = require("./services/personalized-search.service");
const saved_search_service_1 = require("./services/saved-search.service");
const language_detection_service_1 = require("./services/language-detection.service");
const search_validation_service_1 = require("./services/search-validation.service");
const search_rate_limit_service_1 = require("./services/search-rate-limit.service");
const search_logger_service_1 = require("./services/search-logger.service");
const search_tracing_service_1 = require("./services/search-tracing.service");
const search_debug_service_1 = require("./services/search-debug.service");
const search_observability_service_1 = require("./services/search-observability.service");
const search_metrics_service_1 = require("./services/search-metrics.service");
const search_health_check_service_1 = require("./services/search-health-check.service");
const indexing_processor_1 = require("./processors/indexing.processor");
const search_validation_middleware_1 = require("./middleware/search-validation.middleware");
const search_rate_limit_middleware_1 = require("./middleware/search-rate-limit.middleware");
let SearchModule = class SearchModule {
};
exports.SearchModule = SearchModule;
exports.SearchModule = SearchModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            auth_module_1.AuthModule,
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    redis: {
                        host: configService.get('queue.redis.host'),
                        port: configService.get('queue.redis.port'),
                        password: configService.get('queue.redis.password'),
                        db: configService.get('queue.redis.db'),
                    },
                    defaultJobOptions: {
                        removeOnComplete: configService.get('queue.indexing.removeOnComplete'),
                        removeOnFail: configService.get('queue.indexing.removeOnFail'),
                        attempts: configService.get('queue.indexing.attempts'),
                        backoff: {
                            type: 'exponential',
                            delay: configService.get('queue.indexing.backoffDelay'),
                        },
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            bull_1.BullModule.registerQueueAsync({
                name: 'indexing-queue',
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    name: configService.get('queue.indexing.name'),
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [
            category_repository_1.CategoryRepository,
            api_resource_repository_1.ApiResourceRepository,
            elasticsearch_service_1.ElasticsearchService,
            index_manager_service_1.IndexManagerService,
            indexing_service_1.IndexingService,
            search_cache_service_1.SearchCacheService,
            search_service_1.SearchService,
            category_search_service_1.CategorySearchService,
            multi_type_search_service_1.MultiTypeSearchService,
            search_filter_persistence_service_1.SearchFilterPersistenceService,
            search_error_handler_service_1.SearchErrorHandler,
            geocoding_service_1.GeocodingService,
            search_analytics_service_1.SearchAnalyticsService,
            personalized_search_service_1.PersonalizedSearchService,
            saved_search_service_1.SavedSearchService,
            language_detection_service_1.LanguageDetectionService,
            search_validation_service_1.SearchValidationService,
            search_rate_limit_service_1.SearchRateLimitService,
            search_logger_service_1.SearchLoggerService,
            search_tracing_service_1.SearchTracingService,
            search_debug_service_1.SearchDebugService,
            search_observability_service_1.SearchObservabilityService,
            search_metrics_service_1.SearchMetricsService,
            search_health_check_service_1.SearchHealthCheckService,
            indexing_processor_1.IndexingProcessor,
            search_validation_middleware_1.SearchValidationMiddleware,
            search_validation_middleware_1.SuggestionValidationMiddleware,
            search_validation_middleware_1.GeoValidationMiddleware,
            search_rate_limit_middleware_1.SearchRateLimitMiddleware,
            search_rate_limit_middleware_1.SuggestionRateLimitMiddleware,
            search_rate_limit_middleware_1.AnalyticsRateLimitMiddleware,
            search_rate_limit_middleware_1.GlobalRateLimitMiddleware,
            search_rate_limit_middleware_1.ApiKeyRateLimitMiddleware,
            search_rate_limit_middleware_1.AdaptiveRateLimitMiddleware,
        ],
        exports: [
            bull_1.BullModule,
            elasticsearch_service_1.ElasticsearchService,
            index_manager_service_1.IndexManagerService,
            indexing_service_1.IndexingService,
            search_cache_service_1.SearchCacheService,
            search_service_1.SearchService,
            category_search_service_1.CategorySearchService,
            multi_type_search_service_1.MultiTypeSearchService,
            search_filter_persistence_service_1.SearchFilterPersistenceService,
            search_error_handler_service_1.SearchErrorHandler,
            geocoding_service_1.GeocodingService,
            search_analytics_service_1.SearchAnalyticsService,
            personalized_search_service_1.PersonalizedSearchService,
            saved_search_service_1.SavedSearchService,
            language_detection_service_1.LanguageDetectionService,
            search_validation_service_1.SearchValidationService,
            search_rate_limit_service_1.SearchRateLimitService,
            search_logger_service_1.SearchLoggerService,
            search_tracing_service_1.SearchTracingService,
            search_debug_service_1.SearchDebugService,
            search_observability_service_1.SearchObservabilityService,
            search_metrics_service_1.SearchMetricsService,
            search_health_check_service_1.SearchHealthCheckService,
            search_validation_middleware_1.SearchValidationMiddleware,
            search_validation_middleware_1.SuggestionValidationMiddleware,
            search_validation_middleware_1.GeoValidationMiddleware,
            search_rate_limit_middleware_1.SearchRateLimitMiddleware,
            search_rate_limit_middleware_1.SuggestionRateLimitMiddleware,
            search_rate_limit_middleware_1.AnalyticsRateLimitMiddleware,
            search_rate_limit_middleware_1.GlobalRateLimitMiddleware,
            search_rate_limit_middleware_1.ApiKeyRateLimitMiddleware,
            search_rate_limit_middleware_1.AdaptiveRateLimitMiddleware,
        ],
    })
], SearchModule);
//# sourceMappingURL=search.module.js.map