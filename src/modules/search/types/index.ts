// Export all search types

export * from './suggestion.types';
export * from './facet.types';

// Additional common types
export interface SearchError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface SearchContext {
  userId?: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  language?: string;
  timezone?: string;
}

export interface SearchResponse<T = any> {
  success: boolean;
  data?: T;
  error?: SearchError;
  metadata?: {
    took: number;
    total: number;
    page?: number;
    limit?: number;
  };
}

export interface CacheOptions {
  ttl: number; // Time to live in seconds
  key: string;
  tags?: string[];
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (context: SearchContext) => string;
}