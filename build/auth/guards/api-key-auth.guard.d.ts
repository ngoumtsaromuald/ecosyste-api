import { ExecutionContext, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const RequireApiKeyPermissions: (...permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const OptionalApiKey: () => import("@nestjs/common").CustomDecorator<string>;
declare const ApiKeyAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class ApiKeyAuthGuard extends ApiKeyAuthGuard_base implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    handleRequest(err: any, user: any, info: any, context: ExecutionContext): any;
    private checkPermissions;
    private hasPermission;
    private setRateLimitHeaders;
}
export declare class JwtOrApiKeyAuthGuard implements CanActivate {
    private readonly apiKeyAuthGuard;
    private readonly jwtAuthGuard;
    constructor(apiKeyAuthGuard: ApiKeyAuthGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private hasApiKeyInRequest;
}
export {};
