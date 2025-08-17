import { Redis } from 'ioredis';
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    current: number;
}
export declare class RateLimitService {
    private readonly redis;
    constructor(redis: Redis);
    checkUserLimit(userId: string, limit: number, windowMs: number): Promise<RateLimitResult>;
    checkApiKeyLimit(apiKeyId: string, limit: number): Promise<RateLimitResult>;
    checkIPLimit(ipAddress: string, limit: number, windowMs: number): Promise<RateLimitResult>;
    checkLoginAttempts(identifier: string, limit?: number, windowMs?: number): Promise<RateLimitResult>;
    checkPasswordResetAttempts(email: string, limit?: number, windowMs?: number): Promise<RateLimitResult>;
    resetLimit(key: string): Promise<void>;
    getRemainingAttempts(key: string, limit: number, windowMs: number): Promise<number>;
    checkSlidingWindowLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}
