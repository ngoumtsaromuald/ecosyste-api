"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_module_1 = require("./config/database.module");
const redis_module_1 = require("./config/redis.module");
const cache_module_1 = require("./config/cache.module");
const logger_module_1 = require("./config/logger.module");
const auth_module_1 = require("./auth/auth.module");
const search_module_1 = require("./modules/search/search.module");
const api_resource_controller_1 = require("./controllers/api-resource.controller");
const category_controller_1 = require("./controllers/category.controller");
const metrics_controller_1 = require("./controllers/metrics.controller");
const health_controller_1 = require("./controllers/health.controller");
const api_resource_service_1 = require("./services/api-resource.service");
const category_service_1 = require("./services/category.service");
const validation_service_1 = require("./services/validation.service");
const enrichment_service_1 = require("./services/enrichment.service");
const metrics_service_1 = require("./services/metrics.service");
const repositories_1 = require("./repositories");
const global_exception_filter_1 = require("./filters/global-exception.filter");
const response_interceptor_1 = require("./interceptors/response.interceptor");
const metrics_interceptor_1 = require("./interceptors/metrics.interceptor");
const logging_interceptor_1 = require("./interceptors/logging.interceptor");
const configuration_1 = require("./config/configuration");
const elasticsearch_config_1 = require("./config/elasticsearch.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default, elasticsearch_config_1.default],
                envFilePath: ['.env.local', '.env'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            cache_module_1.CacheModule,
            logger_module_1.LoggerModule,
            auth_module_1.AuthModule,
            search_module_1.SearchModule,
        ],
        controllers: [app_controller_1.AppController, api_resource_controller_1.ApiResourceController, category_controller_1.CategoryController, metrics_controller_1.MetricsController, health_controller_1.HealthController],
        providers: [
            app_service_1.AppService,
            api_resource_service_1.ApiResourceService,
            category_service_1.CategoryService,
            validation_service_1.ValidationService,
            enrichment_service_1.EnrichmentService,
            metrics_service_1.MetricsService,
            repositories_1.ApiResourceRepository,
            repositories_1.CategoryRepository,
            repositories_1.UserRepository,
            repositories_1.BusinessHourRepository,
            repositories_1.ResourceImageRepository,
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_interceptor_1.ResponseInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: metrics_interceptor_1.MetricsInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map