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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionalAuthWithRateLimitGuard = exports.RateLimitOnlyGuard = exports.CombinedAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const api_key_auth_guard_1 = require("./api-key-auth.guard");
const rate_limit_guard_1 = require("./rate-limit.guard");
let CombinedAuthGuard = class CombinedAuthGuard {
    constructor(reflector, rateLimitGuard, jwtAuthGuard, apiKeyAuthGuard) {
        this.reflector = reflector;
        this.rateLimitGuard = rateLimitGuard;
        this.jwtAuthGuard = jwtAuthGuard;
        this.apiKeyAuthGuard = apiKeyAuthGuard;
    }
    async canActivate(context) {
        await this.rateLimitGuard.canActivate(context);
        const request = context.switchToHttp().getRequest();
        const hasApiKey = this.hasApiKeyInRequest(request);
        if (hasApiKey) {
            return await this.apiKeyAuthGuard.canActivate(context);
        }
        else {
            return await this.jwtAuthGuard.canActivate(context);
        }
    }
    hasApiKeyInRequest(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.substring(7).startsWith('rk_')) {
            return true;
        }
        return !!(req.headers['x-api-key'] ||
            req.headers['api-key'] ||
            req.query.api_key ||
            req.query.apiKey ||
            (req.body && (req.body.api_key || req.body.apiKey)));
    }
};
exports.CombinedAuthGuard = CombinedAuthGuard;
exports.CombinedAuthGuard = CombinedAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        rate_limit_guard_1.RateLimitGuard,
        jwt_auth_guard_1.JwtAuthGuard,
        api_key_auth_guard_1.ApiKeyAuthGuard])
], CombinedAuthGuard);
let RateLimitOnlyGuard = class RateLimitOnlyGuard {
    constructor(rateLimitGuard) {
        this.rateLimitGuard = rateLimitGuard;
    }
    async canActivate(context) {
        return await this.rateLimitGuard.canActivate(context);
    }
};
exports.RateLimitOnlyGuard = RateLimitOnlyGuard;
exports.RateLimitOnlyGuard = RateLimitOnlyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rate_limit_guard_1.RateLimitGuard])
], RateLimitOnlyGuard);
let OptionalAuthWithRateLimitGuard = class OptionalAuthWithRateLimitGuard {
    constructor(rateLimitGuard, jwtAuthGuard, apiKeyAuthGuard) {
        this.rateLimitGuard = rateLimitGuard;
        this.jwtAuthGuard = jwtAuthGuard;
        this.apiKeyAuthGuard = apiKeyAuthGuard;
    }
    async canActivate(context) {
        await this.rateLimitGuard.canActivate(context);
        const request = context.switchToHttp().getRequest();
        try {
            const hasApiKey = this.hasApiKeyInRequest(request);
            if (hasApiKey) {
                await this.apiKeyAuthGuard.canActivate(context);
            }
            else {
                await this.jwtAuthGuard.canActivate(context);
            }
        }
        catch (error) {
        }
        return true;
    }
    hasApiKeyInRequest(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.substring(7).startsWith('rk_')) {
            return true;
        }
        return !!(req.headers['x-api-key'] ||
            req.headers['api-key'] ||
            req.query.api_key ||
            req.query.apiKey ||
            (req.body && (req.body.api_key || req.body.apiKey)));
    }
};
exports.OptionalAuthWithRateLimitGuard = OptionalAuthWithRateLimitGuard;
exports.OptionalAuthWithRateLimitGuard = OptionalAuthWithRateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rate_limit_guard_1.RateLimitGuard,
        jwt_auth_guard_1.JwtAuthGuard,
        api_key_auth_guard_1.ApiKeyAuthGuard])
], OptionalAuthWithRateLimitGuard);
//# sourceMappingURL=combined-auth.guard.js.map