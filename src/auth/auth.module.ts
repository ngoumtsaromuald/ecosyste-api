import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { ApiKeyController } from './controllers/api-key.controller';
import { OAuthController } from './controllers/oauth.controller';
import { EmailHealthController } from './controllers/email-health.controller';
import { AuthService } from './services/auth.service';
import { JWTService } from './services/jwt.service';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { RateLimitService } from './services/rate-limit.service';
import { AuditService } from './services/audit.service';
import { ApiKeyService } from './services/api-key.service';
import { OAuthService } from './services/oauth.service';
import { EmailService } from './services/email.service';
import { EmailConfigService } from './services/email-config.service';
import { PermissionService } from './services/permission.service';
import { 
  SessionRepository,
  AuditRepository,
  PasswordResetRepository
} from './repositories';
import { UserRepository, ApiKeyRepository, OAuthRepository } from '../repositories';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { 
  JwtAuthGuard,
  ApiKeyAuthGuard,
  LocalAuthGuard,
  RateLimitGuard,
  CombinedAuthGuard,
  RateLimitOnlyGuard,
  OptionalAuthWithRateLimitGuard,
  PermissionGuard,
  AuthPermissionGuard,
  JwtPermissionGuard,
  ApiKeyPermissionGuard
} from './guards';
import { DatabaseModule } from '../config/database.module';
import { RedisModule } from '../config/redis.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController,
    ApiKeyController,
    OAuthController,
    EmailHealthController,
  ],
  providers: [
    // Services
    AuthService,
    JWTService,
    PasswordService,
    SessionService,
    RateLimitService,
    AuditService,
    ApiKeyService,
    OAuthService,
    EmailService,
    EmailConfigService,
    PermissionService,
    
    // Repositories
    SessionRepository,
    AuditRepository,
    PasswordResetRepository,
    UserRepository,
    ApiKeyRepository,
    OAuthRepository,
    
    // Strategies
    JwtStrategy,
    LocalStrategy,
    ApiKeyStrategy,
    
    // Guards
    JwtAuthGuard,
    ApiKeyAuthGuard,
    LocalAuthGuard,
    RateLimitGuard,
    CombinedAuthGuard,
    RateLimitOnlyGuard,
    OptionalAuthWithRateLimitGuard,
    PermissionGuard,
    AuthPermissionGuard,
    JwtPermissionGuard,
    ApiKeyPermissionGuard,
  ],
  exports: [
    AuthService,
    JWTService,
    PasswordService,
    SessionService,
    ApiKeyService,
    OAuthService,
    PermissionService,
    JwtAuthGuard,
    ApiKeyAuthGuard,
    LocalAuthGuard,
    RateLimitGuard,
    CombinedAuthGuard,
    RateLimitOnlyGuard,
    OptionalAuthWithRateLimitGuard,
    PermissionGuard,
    AuthPermissionGuard,
    JwtPermissionGuard,
    ApiKeyPermissionGuard,
  ],
})
export class AuthModule {}