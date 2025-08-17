"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RateLimitService = class RateLimitService {
    constructor(redis) {
        this.redis = redis;
    }
    async checkUserLimit(userId, limit, windowMs) {
        const key = `rate_limit:user:${userId}`;
        return this.checkLimit(key, limit, windowMs);
    }
    async checkApiKeyLimit(apiKeyId, limit) {
        const key = `rate_limit:api_key:${apiKeyId}`;
        const windowMs = 60 * 60 * 1000;
        return this.checkLimit(key, limit, windowMs);
    }
    async checkIPLimit(ipAddress, limit, windowMs) {
        const key = `rate_limit:ip:${ipAddress}`;
        return this.checkLimit(key, limit, windowMs);
    }
    async checkLoginAttempts(identifier, limit = 5, windowMs = 15 * 60 * 1000) {
        const key = `login_attempts:${identifier}`;
        return this.checkLimit(key, limit, windowMs);
    }
    async checkPasswordResetAttempts(email, limit = 3, windowMs = 60 * 60 * 1000) {
        const key = `password_reset:${email}`;
        return this.checkLimit(key, limit, windowMs);
    }
    async checkLimit(key, limit, windowMs) {
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
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            return {
                allowed: true,
                remaining: limit,
                resetTime: new Date(now + windowMs),
                current: 0,
            };
        }
    }
    async resetLimit(key) {
        try {
            const pattern = `${key}:*`;
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error('Error resetting rate limit:', error);
        }
    }
    async getRemainingAttempts(key, limit, windowMs) {
        const now = Date.now();
        const window = Math.floor(now / windowMs);
        const windowKey = `${key}:${window}`;
        try {
            const current = await this.redis.get(windowKey);
            const currentCount = current ? parseInt(current) : 0;
            return Math.max(0, limit - currentCount);
        }
        catch (error) {
            console.error('Error getting remaining attempts:', error);
            return limit;
        }
    }
    async checkSlidingWindowLimit(key, limit, windowMs) {
        const now = Date.now();
        const windowStart = now - windowMs;
        try {
            await this.redis.zremrangebyscore(key, 0, windowStart);
            const current = await this.redis.zcard(key);
            if (current < limit) {
                await this.redis.zadd(key, now, `${now}-${Math.random()}`);
                await this.redis.expire(key, Math.ceil(windowMs / 1000));
                return {
                    allowed: true,
                    remaining: limit - current - 1,
                    resetTime: new Date(now + windowMs),
                    current: current + 1,
                };
            }
            else {
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: new Date(now + windowMs),
                    current,
                };
            }
        }
        catch (error) {
            console.error('Sliding window rate limiting error:', error);
            return {
                allowed: true,
                remaining: limit,
                resetTime: new Date(now + windowMs),
                current: 0,
            };
        }
    }
};
exports.RateLimitService = RateLimitService;
exports.RateLimitService = RateLimitService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.Redis])
], RateLimitService);
//# sourceMappingURL=rate-limit.service.js.map