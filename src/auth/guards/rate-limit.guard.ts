import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService } from '../services/rate-limit.service';
import {
  RateLimitOptions,
  UserRateLimitOptions,
  ApiKeyRateLimitOptions,
  IPRateLimitOptions,
  RATE_LIMIT_KEY,
  USER_RATE_LIMIT_KEY,
  API_KEY_RATE_LIMIT_KEY,
  IP_RATE_LIMIT_KEY,
  SKIP_RATE_LIMIT_KEY,
} from '../decorators/rate-limit.decorators';
import {
  RateLimitExceededException,
  UserRateLimitExceededException,
  ApiKeyRateLimitExceededException,
  IPRateLimitExceededException,
} from '../exceptions/rate-limit.exceptions';
import { ApiKeyUser } from '../strategies/api-key.strategy';

interface AuthenticatedUser {
  id: string;
  email: string;
  userType: string;
  plan?: string;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if rate limiting should be skipped
    const skipRateLimit = this.reflector.get<boolean>(
      SKIP_RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (skipRateLimit) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Apply different types of rate limiting
    await this.applyIPRateLimit(request, response, context);
    await this.applyGeneralRateLimit(request, response, context);
    await this.applyUserRateLimit(request, response, context);
    await this.applyApiKeyRateLimit(request, response, context);

    return true;
  }

  /**
   * Apply IP-based rate limiting
   */
  private async applyIPRateLimit(
    request: Request,
    response: Response,
    context: ExecutionContext,
  ): Promise<void> {
    const ipRateLimitOptions = this.reflector.get<IPRateLimitOptions>(
      IP_RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!ipRateLimitOptions) {
      return;
    }

    const clientIP = this.getClientIP(request);
    const result = await this.rateLimitService.checkIPLimit(
      clientIP,
      ipRateLimitOptions.limit,
      ipRateLimitOptions.windowMs,
    );

    this.setRateLimitHeaders(response, result, 'IP');

    if (!result.allowed) {
      this.logger.warn(`IP rate limit exceeded for ${clientIP}`);
      throw new IPRateLimitExceededException(
        result.resetTime,
        result.remaining,
        ipRateLimitOptions.limit,
      );
    }
  }

  /**
   * Apply general rate limiting
   */
  private async applyGeneralRateLimit(
    request: Request,
    response: Response,
    context: ExecutionContext,
  ): Promise<void> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return;
    }

    const key = rateLimitOptions.keyGenerator
      ? rateLimitOptions.keyGenerator(request)
      : this.getDefaultKey(request);

    const result = await this.rateLimitService.checkLimit(
      `general:${key}`,
      rateLimitOptions.limit,
      rateLimitOptions.windowMs,
    );

    this.setRateLimitHeaders(response, result, 'General');

    if (!result.allowed) {
      this.logger.warn(`General rate limit exceeded for key: ${key}`);
      throw new RateLimitExceededException(
        rateLimitOptions.message || 'Rate limit exceeded',
        result.resetTime,
        result.remaining,
        rateLimitOptions.limit,
      );
    }
  }

  /**
   * Apply user-specific rate limiting
   */
  private async applyUserRateLimit(
    request: Request,
    response: Response,
    context: ExecutionContext,
  ): Promise<void> {
    const userRateLimitOptions = this.reflector.get<UserRateLimitOptions>(
      USER_RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!userRateLimitOptions) {
      return;
    }

    const user = request.user as AuthenticatedUser;
    if (!user || !user.id) {
      // No authenticated user, skip user rate limiting
      return;
    }

    const result = await this.rateLimitService.checkUserLimit(
      user.id,
      userRateLimitOptions.limit,
      userRateLimitOptions.windowMs,
    );

    this.setRateLimitHeaders(response, result, 'User');

    if (!result.allowed) {
      this.logger.warn(`User rate limit exceeded for user: ${user.id}`);
      throw new UserRateLimitExceededException(
        result.resetTime,
        result.remaining,
        userRateLimitOptions.limit,
      );
    }
  }

  /**
   * Apply API key-specific rate limiting
   */
  private async applyApiKeyRateLimit(
    request: Request,
    response: Response,
    context: ExecutionContext,
  ): Promise<void> {
    const apiKeyRateLimitOptions = this.reflector.get<ApiKeyRateLimitOptions>(
      API_KEY_RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!apiKeyRateLimitOptions) {
      return;
    }

    const apiKeyUser = request.user as ApiKeyUser;
    if (!apiKeyUser || !apiKeyUser.apiKey) {
      // No API key authentication, skip API key rate limiting
      return;
    }

    const result = await this.rateLimitService.checkApiKeyLimit(
      apiKeyUser.apiKey.id,
      apiKeyRateLimitOptions.limit,
    );

    this.setRateLimitHeaders(response, result, 'ApiKey');

    if (!result.allowed) {
      this.logger.warn(`API key rate limit exceeded for key: ${apiKeyUser.apiKey.id}`);
      throw new ApiKeyRateLimitExceededException(
        result.resetTime,
        result.remaining,
        apiKeyRateLimitOptions.limit,
      );
    }
  }

  /**
   * Set rate limit headers in the response
   */
  private setRateLimitHeaders(
    response: Response,
    result: any,
    type: string,
  ): void {
    const prefix = `X-RateLimit-${type}`;
    response.setHeader(`${prefix}-Limit`, result.limit || 'N/A');
    response.setHeader(`${prefix}-Remaining`, result.remaining.toString());
    response.setHeader(`${prefix}-Reset`, Math.floor(result.resetTime.getTime() / 1000).toString());
    response.setHeader(`${prefix}-Current`, result.current.toString());
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Generate default key for rate limiting
   */
  private getDefaultKey(request: Request): string {
    const user = request.user as AuthenticatedUser;
    if (user && user.id) {
      return `user:${user.id}`;
    }

    const apiKeyUser = request.user as ApiKeyUser;
    if (apiKeyUser && apiKeyUser.apiKey) {
      return `apikey:${apiKeyUser.apiKey.id}`;
    }

    return `ip:${this.getClientIP(request)}`;
  }
}

/**
 * Extended RateLimitService with additional method needed by the guard
 */
declare module '../services/rate-limit.service' {
  interface RateLimitService {
    checkLimit(key: string, limit: number, windowMs: number): Promise<any>;
  }
}