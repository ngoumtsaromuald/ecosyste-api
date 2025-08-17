import { 
  Injectable, 
  ExecutionContext, 
  UnauthorizedException, 
  HttpException,
  HttpStatus,
  SetMetadata,
  CanActivate
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { ApiKeyUser } from '../strategies/api-key.strategy';

// Decorator to specify required permissions for an endpoint
export const RequireApiKeyPermissions = (...permissions: string[]) => 
  SetMetadata('apiKeyPermissions', permissions);

// Decorator to allow API key authentication as optional
export const OptionalApiKey = () => SetMetadata('optionalApiKey', true);

@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOptional = this.reflector.get<boolean>('optionalApiKey', context.getHandler());
    
    try {
      const result = await super.canActivate(context);
      
      if (result) {
        // Check permissions if authentication succeeded
        await this.checkPermissions(context);
        // Set rate limit headers
        this.setRateLimitHeaders(context);
      }
      
      return result as boolean;
    } catch (error) {
      if (isOptional) {
        // If API key auth is optional and fails, allow the request to continue
        return true;
      }
      throw error;
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext): any {
    const isOptional = this.reflector.get<boolean>('optionalApiKey', context.getHandler());
    
    if (err) {
      // Handle specific error types
      if (err instanceof HttpException && err.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw err;
      }
      throw new UnauthorizedException(err.message || 'Invalid API key');
    }

    if (!user) {
      if (isOptional) {
        return null; // Allow request to continue without API key
      }
      throw new UnauthorizedException('API key is required');
    }

    return user;
  }

  /**
   * Check if the API key has the required permissions
   */
  private async checkPermissions(context: ExecutionContext): Promise<void> {
    const requiredPermissions = this.reflector.get<string[]>('apiKeyPermissions', context.getHandler());
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return; // No specific permissions required
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as ApiKeyUser;

    if (!user || !user.apiKey) {
      throw new UnauthorizedException('API key authentication required');
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      if (!this.hasPermission(user.apiKey.permissions, permission)) {
        throw new UnauthorizedException(`Insufficient permissions. Required: ${permission}`);
      }
    }
  }

  /**
   * Check if the API key has a specific permission
   */
  private hasPermission(apiKeyPermissions: string[], requiredPermission: string): boolean {
    // Check for wildcard permissions
    if (apiKeyPermissions.includes('*') || apiKeyPermissions.includes('admin:*')) {
      return true;
    }

    // Check for exact permission match
    if (apiKeyPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check for wildcard pattern matches
    for (const permission of apiKeyPermissions) {
      if (permission.endsWith(':*')) {
        const prefix = permission.slice(0, -2);
        if (requiredPermission.startsWith(prefix + ':')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Set rate limit headers in the response
   */
  private setRateLimitHeaders(context: ExecutionContext): void {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const user = request.user as ApiKeyUser;

    if (user && user.apiKey) {
      response.setHeader('X-RateLimit-Limit', user.apiKey.rateLimit.toString());
      response.setHeader('X-RateLimit-Remaining', user.rateLimitRemaining.toString());
      response.setHeader('X-RateLimit-Reset', Math.floor(user.rateLimitReset.getTime() / 1000).toString());
      
      // Add custom headers for API key info (without sensitive data)
      response.setHeader('X-API-Key-Name', user.apiKey.name);
      response.setHeader('X-API-Key-ID', user.apiKey.id);
    }
  }
}

// Combined guard that allows both JWT and API key authentication
@Injectable()
export class JwtOrApiKeyAuthGuard implements CanActivate {
  private readonly jwtAuthGuard: any;
  
  constructor(
    private readonly apiKeyAuthGuard: ApiKeyAuthGuard,
  ) {
    this.jwtAuthGuard = new (AuthGuard('jwt'))();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Check if request has API key
    const hasApiKey = this.hasApiKeyInRequest(request);
    
    if (hasApiKey) {
      // Try API key authentication
      try {
        return await this.apiKeyAuthGuard.canActivate(context);
      } catch (error) {
        // If API key auth fails, don't try JWT
        throw error;
      }
    } else {
      // Try JWT authentication
      try {
        return await this.jwtAuthGuard.canActivate(context) as boolean;
      } catch (error) {
        throw new UnauthorizedException('Valid JWT token or API key required');
      }
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