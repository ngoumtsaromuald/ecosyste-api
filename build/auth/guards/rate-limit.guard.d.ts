import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../services/rate-limit.service';
export declare class RateLimitGuard implements CanActivate {
    private readonly reflector;
    private readonly rateLimitService;
    private readonly logger;
    constructor(reflector: Reflector, rateLimitService: RateLimitService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private applyIPRateLimit;
    private applyGeneralRateLimit;
    private applyUserRateLimit;
    private applyApiKeyRateLimit;
    private setRateLimitHeaders;
    private getClientIP;
    private getDefaultKey;
}
declare module '../services/rate-limit.service' {
    interface RateLimitService {
        checkLimit(key: string, limit: number, windowMs: number): Promise<any>;
    }
}
