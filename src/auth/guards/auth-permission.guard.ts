import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { PermissionGuard } from './permission.guard';

/**
 * Combined guard that handles both authentication and permission checking
 * Supports both JWT and API Key authentication
 */
@Injectable()
export class AuthPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly apiKeyAuthGuard: ApiKeyAuthGuard,
    private readonly permissionGuard: PermissionGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Check if this endpoint allows API key authentication
    const allowApiKey = this.reflector.getAllAndOverride<boolean>(
      'allow_api_key',
      [context.getHandler(), context.getClass()],
    );

    // Try JWT authentication first
    let isAuthenticated = false;
    
    try {
      isAuthenticated = await this.jwtAuthGuard.canActivate(context);
    } catch (jwtError) {
      // If JWT fails and API key is allowed, try API key authentication
      if (allowApiKey) {
        try {
          isAuthenticated = await this.apiKeyAuthGuard.canActivate(context);
        } catch (apiKeyError) {
          throw new UnauthorizedException('Invalid authentication credentials');
        }
      } else {
        throw jwtError;
      }
    }

    if (!isAuthenticated) {
      throw new UnauthorizedException('Authentication required');
    }

    // Now check permissions
    return await this.permissionGuard.canActivate(context);
  }
}

/**
 * Guard that only requires JWT authentication with permissions
 */
@Injectable()
export class JwtPermissionGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly permissionGuard: PermissionGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First authenticate with JWT
    const isAuthenticated = await this.jwtAuthGuard.canActivate(context);
    
    if (!isAuthenticated) {
      return false;
    }

    // Then check permissions
    return await this.permissionGuard.canActivate(context);
  }
}

/**
 * Guard that only requires API Key authentication with permissions
 */
@Injectable()
export class ApiKeyPermissionGuard implements CanActivate {
  constructor(
    private readonly apiKeyAuthGuard: ApiKeyAuthGuard,
    private readonly permissionGuard: PermissionGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First authenticate with API Key
    const isAuthenticated = await this.apiKeyAuthGuard.canActivate(context);
    
    if (!isAuthenticated) {
      return false;
    }

    // Then check permissions
    return await this.permissionGuard.canActivate(context);
  }
}