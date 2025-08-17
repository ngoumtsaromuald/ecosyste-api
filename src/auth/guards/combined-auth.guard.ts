import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { RateLimitGuard } from './rate-limit.guard';

/**
 * Combined guard that applies rate limiting and supports multiple authentication methods
 * Order of execution:
 * 1. Rate limiting (always applied first)
 * 2. Authentication (JWT or API Key based on request)
 */
@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitGuard: RateLimitGuard,
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly apiKeyAuthGuard: ApiKeyAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Apply rate limiting first
    await this.rateLimitGuard.canActivate(context);

    const request = context.switchToHttp().getRequest<Request>();
    
    // Determine authentication method based on request
    const hasApiKey = this.hasApiKeyInRequest(request);
    
    if (hasApiKey) {
      // Use API key authentication
      return await this.apiKeyAuthGuard.canActivate(context);
    } else {
      // Use JWT authentication
      return await this.jwtAuthGuard.canActivate(context);
    }
  }

  private hasApiKeyInRequest(req: Request): boolean {
    // Check various locations where API key might be present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.substring(7).startsWith('rk_')) {
      return true;
    }

    return !!(
      req.headers['x-api-key'] ||
      req.headers['api-key'] ||
      req.query.api_key ||
      req.query.apiKey ||
      (req.body && (req.body.api_key || req.body.apiKey))
    );
  }
}

/**
 * Guard that applies only rate limiting without authentication
 */
@Injectable()
export class RateLimitOnlyGuard implements CanActivate {
  constructor(private readonly rateLimitGuard: RateLimitGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return await this.rateLimitGuard.canActivate(context);
  }
}

/**
 * Guard that applies rate limiting with optional authentication
 * If authentication fails, the request is still allowed but without user context
 */
@Injectable()
export class OptionalAuthWithRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitGuard: RateLimitGuard,
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly apiKeyAuthGuard: ApiKeyAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Apply rate limiting first
    await this.rateLimitGuard.canActivate(context);

    const request = context.switchToHttp().getRequest<Request>();
    
    try {
      // Try to authenticate but don't fail if it doesn't work
      const hasApiKey = this.hasApiKeyInRequest(request);
      
      if (hasApiKey) {
        await this.apiKeyAuthGuard.canActivate(context);
      } else {
        await this.jwtAuthGuard.canActivate(context);
      }
    } catch (error) {
      // Authentication failed, but we allow the request to continue
      // The endpoint can check if req.user exists to determine if authenticated
    }

    return true;
  }

  private hasApiKeyInRequest(req: Request): boolean {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.substring(7).startsWith('rk_')) {
      return true;
    }

    return !!(
      req.headers['x-api-key'] ||
      req.headers['api-key'] ||
      req.query.api_key ||
      req.query.apiKey ||
      (req.body && (req.body.api_key || req.body.apiKey))
    );
  }
}