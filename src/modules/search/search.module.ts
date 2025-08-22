import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../../auth/auth.module';

// Repositories
import { CategoryRepository } from '../../repositories/category.repository';
import { ApiResourceRepository } from '../../repositories/api-resource.repository';

// Services
import { ElasticsearchService } from './services/elasticsearch.service';
import { IndexManagerService } from './services/index-manager.service';
import { IndexingService } from './services/indexing.service';
import { SearchCacheService } from './services/search-cache.service';
import { SearchService } from './services/search.service';
import { CategorySearchService } from './services/category-search.service';
import { MultiTypeSearchService } from './services/multi-type-search.service';
import { SearchFilterPersistenceService } from './services/search-filter-persistence.service';
import { SearchErrorHandler } from './services/search-error-handler.service';
import { GeocodingService } from './services/geocoding.service';
import { SearchAnalyticsService } from './services/search-analytics.service';
import { PersonalizedSearchService } from './services/personalized-search.service';
import { SavedSearchService } from './services/saved-search.service';
import { LanguageDetectionService } from './services/language-detection.service';
import { SearchValidationService } from './services/search-validation.service';
import { SearchRateLimitService } from './services/search-rate-limit.service';
import { SearchLoggerService } from './services/search-logger.service';
import { SearchTracingService } from './services/search-tracing.service';
import { SearchDebugService } from './services/search-debug.service';
import { SearchObservabilityService } from './services/search-observability.service';
import { SearchMetricsService } from './services/search-metrics.service';
import { SearchHealthCheckService } from './services/search-health-check.service';

// Processors
import { IndexingProcessor } from './processors/indexing.processor';

// Middleware
import { 
  SearchValidationMiddleware, 
  SuggestionValidationMiddleware, 
  GeoValidationMiddleware 
} from './middleware/search-validation.middleware';
import { 
  SearchRateLimitMiddleware, 
  SuggestionRateLimitMiddleware, 
  AnalyticsRateLimitMiddleware, 
  GlobalRateLimitMiddleware,
  ApiKeyRateLimitMiddleware,
  AdaptiveRateLimitMiddleware
} from './middleware/search-rate-limit.middleware';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
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
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: 'indexing-queue',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        name: configService.get('queue.indexing.name'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    CategoryRepository,
    ApiResourceRepository,
    ElasticsearchService,
    IndexManagerService,
    IndexingService,
    SearchCacheService,
    SearchService,
    CategorySearchService,
    MultiTypeSearchService,
    SearchFilterPersistenceService,
    SearchErrorHandler,
    GeocodingService,
    SearchAnalyticsService,
    PersonalizedSearchService,
    SavedSearchService,
    LanguageDetectionService,
    SearchValidationService,
    SearchRateLimitService,
    SearchLoggerService,
    SearchTracingService,
    SearchDebugService,
    SearchObservabilityService,
    SearchMetricsService,
    SearchHealthCheckService,
    IndexingProcessor,
    SearchValidationMiddleware,
    SuggestionValidationMiddleware,
    GeoValidationMiddleware,
    SearchRateLimitMiddleware,
    SuggestionRateLimitMiddleware,
    AnalyticsRateLimitMiddleware,
    GlobalRateLimitMiddleware,
    ApiKeyRateLimitMiddleware,
    AdaptiveRateLimitMiddleware,
  ],
  exports: [
    BullModule,
    ElasticsearchService,
    IndexManagerService,
    IndexingService,
    SearchCacheService,
    SearchService,
    CategorySearchService,
    MultiTypeSearchService,
    SearchFilterPersistenceService,
    SearchErrorHandler,
    GeocodingService,
    SearchAnalyticsService,
    PersonalizedSearchService,
    SavedSearchService,
    LanguageDetectionService,
    SearchValidationService,
    SearchRateLimitService,
    SearchLoggerService,
    SearchTracingService,
    SearchDebugService,
    SearchObservabilityService,
    SearchMetricsService,
    SearchHealthCheckService,
    SearchValidationMiddleware,
    SuggestionValidationMiddleware,
    GeoValidationMiddleware,
    SearchRateLimitMiddleware,
    SuggestionRateLimitMiddleware,
    AnalyticsRateLimitMiddleware,
    GlobalRateLimitMiddleware,
    ApiKeyRateLimitMiddleware,
    AdaptiveRateLimitMiddleware,
  ],
})
export class SearchModule {}