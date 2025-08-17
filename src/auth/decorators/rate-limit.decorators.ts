import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  message?: string;
}

export interface UserRateLimitOptions extends Omit<RateLimitOptions, 'keyGenerator'> {
  // User-specific rate limiting options
}

export interface ApiKeyRateLimitOptions extends Omit<RateLimitOptions, 'keyGenerator'> {
  // API key-specific rate limiting options
}

export interface IPRateLimitOptions extends Omit<RateLimitOptions, 'keyGenerator'> {
  // IP-specific rate limiting options
}

// Metadata keys
export const RATE_LIMIT_KEY = 'rate_limit';
export const USER_RATE_LIMIT_KEY = 'user_rate_limit';
export const API_KEY_RATE_LIMIT_KEY = 'api_key_rate_limit';
export const IP_RATE_LIMIT_KEY = 'ip_rate_limit';
export const SKIP_RATE_LIMIT_KEY = 'skip_rate_limit';

/**
 * Apply general rate limiting to an endpoint
 * @param options Rate limit configuration
 */
export const RateLimit = (options: RateLimitOptions) => 
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Apply user-specific rate limiting to an endpoint
 * @param options User rate limit configuration
 */
export const UserRateLimit = (options: UserRateLimitOptions) => 
  SetMetadata(USER_RATE_LIMIT_KEY, options);

/**
 * Apply API key-specific rate limiting to an endpoint
 * @param options API key rate limit configuration
 */
export const ApiKeyRateLimit = (options: ApiKeyRateLimitOptions) => 
  SetMetadata(API_KEY_RATE_LIMIT_KEY, options);

/**
 * Apply IP-specific rate limiting to an endpoint
 * @param options IP rate limit configuration
 */
export const IPRateLimit = (options: IPRateLimitOptions) => 
  SetMetadata(IP_RATE_LIMIT_KEY, options);

/**
 * Skip rate limiting for this endpoint
 */
export const SkipRateLimit = () => 
  SetMetadata(SKIP_RATE_LIMIT_KEY, true);

/**
 * Common rate limit presets
 */
export const RateLimitPresets = {
  // Very strict - for sensitive operations
  STRICT: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  
  // Conservative - for login/auth endpoints
  CONSERVATIVE: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 requests per 15 minutes
  
  // Standard - for regular API endpoints
  STANDARD: { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  
  // Generous - for read-only operations
  GENEROUS: { limit: 1000, windowMs: 15 * 60 * 1000 }, // 1000 requests per 15 minutes
  
  // Per minute limits
  PER_MINUTE_STRICT: { limit: 5, windowMs: 60 * 1000 }, // 5 requests per minute
  PER_MINUTE_STANDARD: { limit: 60, windowMs: 60 * 1000 }, // 60 requests per minute
  PER_MINUTE_GENEROUS: { limit: 300, windowMs: 60 * 1000 }, // 300 requests per minute
  
  // Per hour limits
  PER_HOUR_STRICT: { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 requests per hour
  PER_HOUR_STANDARD: { limit: 1000, windowMs: 60 * 60 * 1000 }, // 1000 requests per hour
  PER_HOUR_GENEROUS: { limit: 10000, windowMs: 60 * 60 * 1000 }, // 10000 requests per hour
};

/**
 * Convenience decorators using presets
 */
export const StrictRateLimit = () => RateLimit(RateLimitPresets.STRICT);
export const ConservativeRateLimit = () => RateLimit(RateLimitPresets.CONSERVATIVE);
export const StandardRateLimit = () => RateLimit(RateLimitPresets.STANDARD);
export const GenerousRateLimit = () => RateLimit(RateLimitPresets.GENEROUS);

export const StrictUserRateLimit = () => UserRateLimit(RateLimitPresets.STRICT);
export const ConservativeUserRateLimit = () => UserRateLimit(RateLimitPresets.CONSERVATIVE);
export const StandardUserRateLimit = () => UserRateLimit(RateLimitPresets.STANDARD);

export const StrictIPRateLimit = () => IPRateLimit(RateLimitPresets.PER_MINUTE_STRICT);
export const StandardIPRateLimit = () => IPRateLimit(RateLimitPresets.PER_MINUTE_STANDARD);