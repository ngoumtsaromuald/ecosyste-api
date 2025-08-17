"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const auth_controller_1 = require("./controllers/auth.controller");
const api_key_controller_1 = require("./controllers/api-key.controller");
const oauth_controller_1 = require("./controllers/oauth.controller");
const email_health_controller_1 = require("./controllers/email-health.controller");
const auth_service_1 = require("./services/auth.service");
const jwt_service_1 = require("./services/jwt.service");
const password_service_1 = require("./services/password.service");
const session_service_1 = require("./services/session.service");
const rate_limit_service_1 = require("./services/rate-limit.service");
const audit_service_1 = require("./services/audit.service");
const api_key_service_1 = require("./services/api-key.service");
const oauth_service_1 = require("./services/oauth.service");
const email_service_1 = require("./services/email.service");
const email_config_service_1 = require("./services/email-config.service");
const permission_service_1 = require("./services/permission.service");
const repositories_1 = require("./repositories");
const repositories_2 = require("../repositories");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const local_strategy_1 = require("./strategies/local.strategy");
const api_key_strategy_1 = require("./strategies/api-key.strategy");
const guards_1 = require("./guards");
const database_module_1 = require("../config/database.module");
const redis_module_1 = require("../config/redis.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('jwt.secret'),
                    signOptions: {
                        expiresIn: configService.get('JWT_ACCESS_EXPIRES', '15m'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [
            auth_controller_1.AuthController,
            api_key_controller_1.ApiKeyController,
            oauth_controller_1.OAuthController,
            email_health_controller_1.EmailHealthController,
        ],
        providers: [
            auth_service_1.AuthService,
            jwt_service_1.JWTService,
            password_service_1.PasswordService,
            session_service_1.SessionService,
            rate_limit_service_1.RateLimitService,
            audit_service_1.AuditService,
            api_key_service_1.ApiKeyService,
            oauth_service_1.OAuthService,
            email_service_1.EmailService,
            email_config_service_1.EmailConfigService,
            permission_service_1.PermissionService,
            repositories_1.SessionRepository,
            repositories_1.AuditRepository,
            repositories_1.PasswordResetRepository,
            repositories_2.UserRepository,
            repositories_2.ApiKeyRepository,
            repositories_2.OAuthRepository,
            jwt_strategy_1.JwtStrategy,
            local_strategy_1.LocalStrategy,
            api_key_strategy_1.ApiKeyStrategy,
            guards_1.JwtAuthGuard,
            guards_1.ApiKeyAuthGuard,
            guards_1.LocalAuthGuard,
            guards_1.RateLimitGuard,
            guards_1.CombinedAuthGuard,
            guards_1.RateLimitOnlyGuard,
            guards_1.OptionalAuthWithRateLimitGuard,
            guards_1.PermissionGuard,
            guards_1.AuthPermissionGuard,
            guards_1.JwtPermissionGuard,
            guards_1.ApiKeyPermissionGuard,
        ],
        exports: [
            auth_service_1.AuthService,
            jwt_service_1.JWTService,
            password_service_1.PasswordService,
            session_service_1.SessionService,
            api_key_service_1.ApiKeyService,
            oauth_service_1.OAuthService,
            permission_service_1.PermissionService,
            guards_1.JwtAuthGuard,
            guards_1.ApiKeyAuthGuard,
            guards_1.LocalAuthGuard,
            guards_1.RateLimitGuard,
            guards_1.CombinedAuthGuard,
            guards_1.RateLimitOnlyGuard,
            guards_1.OptionalAuthWithRateLimitGuard,
            guards_1.PermissionGuard,
            guards_1.AuthPermissionGuard,
            guards_1.JwtPermissionGuard,
            guards_1.ApiKeyPermissionGuard,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map