import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { PermissionGuard } from './permission.guard';
export declare class AuthPermissionGuard implements CanActivate {
    private readonly reflector;
    private readonly jwtAuthGuard;
    private readonly apiKeyAuthGuard;
    private readonly permissionGuard;
    constructor(reflector: Reflector, jwtAuthGuard: JwtAuthGuard, apiKeyAuthGuard: ApiKeyAuthGuard, permissionGuard: PermissionGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class JwtPermissionGuard implements CanActivate {
    private readonly jwtAuthGuard;
    private readonly permissionGuard;
    constructor(jwtAuthGuard: JwtAuthGuard, permissionGuard: PermissionGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class ApiKeyPermissionGuard implements CanActivate {
    private readonly apiKeyAuthGuard;
    private readonly permissionGuard;
    constructor(apiKeyAuthGuard: ApiKeyAuthGuard, permissionGuard: PermissionGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
