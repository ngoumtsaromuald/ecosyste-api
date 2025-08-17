import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ApiKeyService } from '../services/api-key.service';
import { Request } from 'express';

export interface ApiKeyUser {
  id: string;
  email: string;
  name: string;
  userType: string;
  plan: string;
  apiKey: {
    id: string;
    name: string;
    permissions: string[];
    rateLimit: number;
  };
  rateLimitRemaining: number;
  rateLimitReset: Date;
}

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super();
  }

  async validate(req: Request): Promise<ApiKeyUser | null> {
    // Extract API key from multiple possible locations
    const apiKey = this.extractApiKey(req);
    
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      // Validate the API key using the service
      const validationResult = await this.apiKeyService.validateApiKey(apiKey);
      
      // Return user object with API key information
      return {
        id: validationResult.user.id,
        email: validationResult.user.email,
        name: validationResult.user.name,
        userType: validationResult.user.userType,
        plan: validationResult.user.plan,
        apiKey: validationResult.apiKey,
        rateLimitRemaining: validationResult.rateLimitRemaining,
        rateLimitReset: validationResult.rateLimitReset,
      };
    } catch (error) {
      // Let the error bubble up to be handled by the guard
      throw error;
    }
  }

  /**
   * Extract API key from request headers, query parameters, or body
   */
  private extractApiKey(req: Request): string | null {
    // 1. Check Authorization header with Bearer scheme
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Check if it's an API key (starts with rk_)
      if (token.startsWith('rk_')) {
        return token;
      }
    }

    // 2. Check X-API-Key header (most common for API keys)
    const apiKeyHeader = req.headers['x-api-key'] as string;
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // 3. Check custom API-Key header
    const customApiKeyHeader = req.headers['api-key'] as string;
    if (customApiKeyHeader) {
      return customApiKeyHeader;
    }

    // 4. Check query parameter (less secure, but sometimes used)
    const queryApiKey = req.query.api_key as string || req.query.apiKey as string;
    if (queryApiKey) {
      return queryApiKey;
    }

    // 5. Check request body (for POST requests)
    if (req.body && typeof req.body === 'object') {
      const bodyApiKey = req.body.api_key || req.body.apiKey;
      if (bodyApiKey && typeof bodyApiKey === 'string') {
        return bodyApiKey;
      }
    }

    return null;
  }
}