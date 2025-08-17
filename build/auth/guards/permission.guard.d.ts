import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PermissionService, User } from '../services/permission.service';
export interface AuthenticatedRequest extends Request {
    user: User;
    token?: string;
}
export declare class PermissionGuard implements CanActivate {
    private readonly reflector;
    private readonly permissionService;
    constructor(reflector: Reflector, permissionService: PermissionService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private checkResourceOwnership;
}
