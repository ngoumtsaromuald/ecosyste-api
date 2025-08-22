import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../../auth/services/auth.service';
import { JWTService } from '../../../auth/services/jwt.service';
export interface RateLimitConfig {
    authenticatedUser: {
        search: {
            requests: number;
            window: number;
        };
        suggest: {
            requests: number;
            window: number;
        };
        analytics: {
            requests: number;
            window: number;
        };
    };
    anonymous: {
        search: {
            requests: number;
            window: number;
        };
        suggest: {
            requests: number;
            window: number;
        };
        analytics: {
            requests: number;
            window: number;
        };
    };
    session: {
        search: {
            requests: number;
            window: number;
        };
        suggest: {
            requests: number;
            window: number;
        };
    };
    global: {
        search: {
            requests: number;
            window: number;
        };
        suggest: {
            requests: number;
            window: number;
        };
    };
    premium: {
        search: {
            requests: number;
            window: number;
        };
        suggest: {
            requests: number;
            window: number;
        };
        analytics: {
            requests: number;
            window: number;
        };
    };
}
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
    limitType: string;
    limitValue: number;
}
export interface RateLimitContext {
    userId?: string;
    sessionId?: string;
    ipAddress: string;
    userAgent?: string;
    endpoint: string;
    operationType: 'search' | 'suggest' | 'analytics' | 'category' | 'multi-type';
    userTier?: 'free' | 'premium' | 'enterprise';
    isAuthenticated: boolean;
}
export declare class SearchRateLimitService {
    private readonly configService;
    private readonly authService;
    private readonly jwtService;
    private readonly logger;
    private readonly redis;
    private readonly config;
    constructor(configService: ConfigService, authService: AuthService, jwtService: JWTService);
    private initializeRedis;
    checkRateLimit(context: RateLimitContext): Promise<RateLimitResult>;
    checkRateLimitAndThrow(context: RateLimitContext): Promise<RateLimitResult>;
    private checkGlobalLimit;
    private checkUserLimit;
    private checkSessionLimit;
    private checkIPLimit;
    private checkLimit;
    private mapOperationType;
    private createAllowedResult;
    getRateLimitStats(userId?: string, sessionId?: string, ipAddress?: string): Promise<any>;
    resetRateLimits(userId?: string, sessionId?: string, ipAddress?: string): Promise<void>;
    getRateLimitConfig(): RateLimitConfig;
    updateRateLimitConfig(newConfig: Partial<RateLimitConfig>): void;
    healthCheck(): Promise<{
        status: string;
        redis: string;
        config: boolean;
    }>;
    enrichContextWithAuth(context: RateLimitContext, authToken?: string): Promise<RateLimitContext>;
    private determineUserTier;
    checkRateLimitWithAuth(context: Omit<RateLimitContext, 'isAuthenticated'>, authToken?: string): Promise<RateLimitResult>;
    checkApiKeyRateLimit(apiKey: string, operationType: RateLimitContext['operationType'], endpoint: string, ipAddress: string): Promise<RateLimitResult>;
    private getApiKeyLimits;
    private logApiKeyUsage;
    getApiKeyUsageStats(apiKey: string, days?: number): Promise<any>;
    checkDynamicRateLimit(context: RateLimitContext): Promise<RateLimitResult>;
    private getSystemLoad;
    private adjustLimitsForLoad;
    temporaryBlock(identifier: string, type: 'user' | 'ip' | 'session', duration?: number, reason?: string): Promise<void>;
    isTemporarilyBlocked(identifier: string, type: 'user' | 'ip' | 'session'): Promise<boolean>;
    getBlockInfo(identifier: string, type: 'user' | 'ip' | 'session'): Promise<any>;
    removeTemporaryBlock(identifier: string, type: 'user' | 'ip' | 'session'): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
