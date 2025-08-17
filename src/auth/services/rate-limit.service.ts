import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  current: number;
}

@Injectable()
export class RateLimitService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async checkUserLimit(userId: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const key = `rate_limit:user:${userId}`;
    return this.checkLimit(key, limit, windowMs);
  }

  async checkApiKeyLimit(apiKeyId: string, limit: number): Promise<RateLimitResult> {
    const key = `rate_limit:api_key:${apiKeyId}`;
    const windowMs = 60 * 60 * 1000; // 1 hour
    return this.checkLimit(key, limit, windowMs);
  }

  async checkIPLimit(ipAddress: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const key = `rate_limit:ip:${ipAddress}`;
    return this.checkLimit(key, limit, windowMs);
  }

  async checkLoginAttempts(identifier: string, limit: number = 5, windowMs: number = 15 * 60 * 1000): Promise<RateLimitResult> {
    const key = `login_attempts:${identifier}`;
    return this.checkLimit(key, limit, windowMs);
  }

  async checkPasswordResetAttempts(email: string, limit: number = 3, windowMs: number = 60 * 60 * 1000): Promise<RateLimitResult> {
    const key = `password_reset:${email}`;
    return this.checkLimit(key, limit, windowMs);
  }

  async checkLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const windowKey = `${key}:${window}`;

    try {
      const current = await this.redis.incr(windowKey);
      
      if (current === 1) {
        await this.redis.expire(windowKey, Math.ceil(windowMs / 1000));
      }

      const remaining = Math.max(0, limit - current);
      const resetTime = new Date((window + 1) * windowMs);

      return {
        allowed: current <= limit,
        remaining,
        resetTime,
        current,
      };
    } catch (error) {
      // If Redis is down, allow the request but log the error
      console.error('Rate limiting error:', error);
      return {
        allowed: true,
        remaining: limit,
        resetTime: new Date(now + windowMs),
        current: 0,
      };
    }
  }

  async resetLimit(key: string): Promise<void> {
    try {
      const pattern = `${key}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }

  async getRemainingAttempts(key: string, limit: number, windowMs: number): Promise<number> {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const windowKey = `${key}:${window}`;

    try {
      const current = await this.redis.get(windowKey);
      const currentCount = current ? parseInt(current) : 0;
      return Math.max(0, limit - currentCount);
    } catch (error) {
      console.error('Error getting remaining attempts:', error);
      return limit;
    }
  }



  // Sliding window rate limiter (more accurate but more complex)
  async checkSlidingWindowLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Remove old entries
      await this.redis.zremrangebyscore(key, 0, windowStart);
      
      // Count current entries
      const current = await this.redis.zcard(key);
      
      if (current < limit) {
        // Add current request
        await this.redis.zadd(key, now, `${now}-${Math.random()}`);
        await this.redis.expire(key, Math.ceil(windowMs / 1000));
        
        return {
          allowed: true,
          remaining: limit - current - 1,
          resetTime: new Date(now + windowMs),
          current: current + 1,
        };
      } else {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(now + windowMs),
          current,
        };
      }
    } catch (error) {
      console.error('Sliding window rate limiting error:', error);
      return {
        allowed: true,
        remaining: limit,
        resetTime: new Date(now + windowMs),
        current: 0,
      };
    }
  }
}