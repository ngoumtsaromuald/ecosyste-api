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
var RateLimitGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rate_limit_service_1 = require("../services/rate-limit.service");
const rate_limit_decorators_1 = require("../decorators/rate-limit.decorators");
const rate_limit_exceptions_1 = require("../exceptions/rate-limit.exceptions");
let RateLimitGuard = RateLimitGuard_1 = class RateLimitGuard {
    constructor(reflector, rateLimitService) {
        this.reflector = reflector;
        this.rateLimitService = rateLimitService;
        this.logger = new common_1.Logger(RateLimitGuard_1.name);
    }
    async canActivate(context) {
        const skipRateLimit = this.reflector.get(rate_limit_decorators_1.SKIP_RATE_LIMIT_KEY, context.getHandler());
        if (skipRateLimit) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        await this.applyIPRateLimit(request, response, context);
        await this.applyGeneralRateLimit(request, response, context);
        await this.applyUserRateLimit(request, response, context);
        await this.applyApiKeyRateLimit(request, response, context);
        return true;
    }
    async applyIPRateLimit(request, response, context) {
        const ipRateLimitOptions = this.reflector.get(rate_limit_decorators_1.IP_RATE_LIMIT_KEY, context.getHandler());
        if (!ipRateLimitOptions) {
            return;
        }
        const clientIP = this.getClientIP(request);
        const result = await this.rateLimitService.checkIPLimit(clientIP, ipRateLimitOptions.limit, ipRateLimitOptions.windowMs);
        this.setRateLimitHeaders(response, result, 'IP');
        if (!result.allowed) {
            this.logger.warn(`IP rate limit exceeded for ${clientIP}`);
            throw new rate_limit_exceptions_1.IPRateLimitExceededException(result.resetTime, result.remaining, ipRateLimitOptions.limit);
        }
    }
    async applyGeneralRateLimit(request, response, context) {
        const rateLimitOptions = this.reflector.get(rate_limit_decorators_1.RATE_LIMIT_KEY, context.getHandler());
        if (!rateLimitOptions) {
            return;
        }
        const key = rateLimitOptions.keyGenerator
            ? rateLimitOptions.keyGenerator(request)
            : this.getDefaultKey(request);
        const result = await this.rateLimitService.checkLimit(`general:${key}`, rateLimitOptions.limit, rateLimitOptions.windowMs);
        this.setRateLimitHeaders(response, result, 'General');
        if (!result.allowed) {
            this.logger.warn(`General rate limit exceeded for key: ${key}`);
            throw new rate_limit_exceptions_1.RateLimitExceededException(rateLimitOptions.message || 'Rate limit exceeded', result.resetTime, result.remaining, rateLimitOptions.limit);
        }
    }
    async applyUserRateLimit(request, response, context) {
        const userRateLimitOptions = this.reflector.get(rate_limit_decorators_1.USER_RATE_LIMIT_KEY, context.getHandler());
        if (!userRateLimitOptions) {
            return;
        }
        const user = request.user;
        if (!user || !user.id) {
            return;
        }
        const result = await this.rateLimitService.checkUserLimit(user.id, userRateLimitOptions.limit, userRateLimitOptions.windowMs);
        this.setRateLimitHeaders(response, result, 'User');
        if (!result.allowed) {
            this.logger.warn(`User rate limit exceeded for user: ${user.id}`);
            throw new rate_limit_exceptions_1.UserRateLimitExceededException(result.resetTime, result.remaining, userRateLimitOptions.limit);
        }
    }
    async applyApiKeyRateLimit(request, response, context) {
        const apiKeyRateLimitOptions = this.reflector.get(rate_limit_decorators_1.API_KEY_RATE_LIMIT_KEY, context.getHandler());
        if (!apiKeyRateLimitOptions) {
            return;
        }
        const apiKeyUser = request.user;
        if (!apiKeyUser || !apiKeyUser.apiKey) {
            return;
        }
        const result = await this.rateLimitService.checkApiKeyLimit(apiKeyUser.apiKey.id, apiKeyRateLimitOptions.limit);
        this.setRateLimitHeaders(response, result, 'ApiKey');
        if (!result.allowed) {
            this.logger.warn(`API key rate limit exceeded for key: ${apiKeyUser.apiKey.id}`);
            throw new rate_limit_exceptions_1.ApiKeyRateLimitExceededException(result.resetTime, result.remaining, apiKeyRateLimitOptions.limit);
        }
    }
    setRateLimitHeaders(response, result, type) {
        const prefix = `X-RateLimit-${type}`;
        response.setHeader(`${prefix}-Limit`, result.limit || 'N/A');
        response.setHeader(`${prefix}-Remaining`, result.remaining.toString());
        response.setHeader(`${prefix}-Reset`, Math.floor(result.resetTime.getTime() / 1000).toString());
        response.setHeader(`${prefix}-Current`, result.current.toString());
    }
    getClientIP(request) {
        return (request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            request.headers['x-real-ip'] ||
            request.connection?.remoteAddress ||
            request.socket?.remoteAddress ||
            'unknown');
    }
    getDefaultKey(request) {
        const user = request.user;
        if (user && user.id) {
            return `user:${user.id}`;
        }
        const apiKeyUser = request.user;
        if (apiKeyUser && apiKeyUser.apiKey) {
            return `apikey:${apiKeyUser.apiKey.id}`;
        }
        return `ip:${this.getClientIP(request)}`;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = RateLimitGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        rate_limit_service_1.RateLimitService])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map