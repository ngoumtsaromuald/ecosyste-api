import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database.module';
import { RedisModule } from './config/redis.module';
import { CacheModule } from './config/cache.module';
import { LoggerModule } from './config/logger.module';
import { ApiResourceController } from './controllers/api-resource.controller';
import { CategoryController } from './controllers/category.controller';
import { MetricsController } from './controllers/metrics.controller';
import { HealthController } from './controllers/health.controller';
import { ApiResourceService } from './services/api-resource.service';
import { CategoryService } from './services/category.service';
import { ValidationService } from './services/validation.service';
import { EnrichmentService } from './services/enrichment.service';
import { MetricsService } from './services/metrics.service';
import { 
  ApiResourceRepository,
  CategoryRepository,
  UserRepository,
  BusinessHourRepository,
  ResourceImageRepository
} from './repositories';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    DatabaseModule,
    RedisModule,
    CacheModule,
    LoggerModule,
  ],
  controllers: [AppController, ApiResourceController, CategoryController, MetricsController, HealthController],
  providers: [
    AppService,
    ApiResourceService,
    CategoryService,
    ValidationService,
    EnrichmentService,
    MetricsService,
    ApiResourceRepository,
    CategoryRepository,
    UserRepository,
    BusinessHourRepository,
    ResourceImageRepository,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}