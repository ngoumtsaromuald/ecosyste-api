import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { RateLimitGuard } from './rate-limit.guard';
export declare class CombinedAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly rateLimitGuard;
    private readonly jwtAuthGuard;
    private readonly apiKeyAuthGuard;
    constructor(reflector: Reflector, rateLimitGuard: RateLimitGuard, jwtAuthGuard: JwtAuthGuard, apiKeyAuthGuard: ApiKeyAuthGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private hasApiKeyInRequest;
}
export declare class RateLimitOnlyGuard implements CanActivate {
    private readonly rateLimitGuard;
    constructor(rateLimitGuard: RateLimitGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class OptionalAuthWithRateLimitGuard implements CanActivate {
    private readonly rateLimitGuard;
    private readonly jwtAuthGuard;
    private readonly apiKeyAuthGuard;
    constructor(rateLimitGuard: RateLimitGuard, jwtAuthGuard: JwtAuthGuard, apiKeyAuthGuard: ApiKeyAuthGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private hasApiKeyInRequest;
}
