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
exports.AuthControllerWithRateLimit = exports.RateLimitExampleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rate_limit_decorators_1 = require("../decorators/rate-limit.decorators");
const guards_1 = require("../guards");
let RateLimitExampleController = class RateLimitExampleController {
    async publicEndpoint() {
        return { message: 'This is a public endpoint with rate limiting' };
    }
    async sensitiveOperation(data) {
        return { message: 'Sensitive operation completed', data };
    }
    async protectedEndpoint() {
        return { message: 'This is a protected endpoint with rate limiting' };
    }
    async multiLayerEndpoint(data) {
        return {
            message: 'Multi-layer rate limiting applied',
            layers: ['IP', 'User', 'General'],
            data
        };
    }
    async strictEndpoint() {
        return { message: 'Strict rate limiting applied' };
    }
    async conservativeEndpoint() {
        return { message: 'Conservative rate limiting applied' };
    }
    async standardEndpoint() {
        return { message: 'Standard rate limiting applied' };
    }
    async optionalAuthEndpoint() {
        return {
            message: 'Optional authentication with rate limiting',
            note: 'Authenticated users get higher limits'
        };
    }
    async customRateLimitEndpoint(data) {
        return {
            message: 'Custom rate limiting applied',
            category: data.category || 'default'
        };
    }
    async adminEndpoint(data) {
        return {
            message: 'Admin operation - no rate limiting',
            data
        };
    }
    async getResource() {
        return { message: 'Resource retrieved with generous rate limiting' };
    }
    async createResource(data) {
        return {
            message: 'Resource created with conservative rate limiting',
            data
        };
    }
    async perMinuteEndpoint() {
        return { message: 'Per-minute rate limiting applied' };
    }
    async perHourEndpoint() {
        return { message: 'Per-hour rate limiting applied' };
    }
};
exports.RateLimitExampleController = RateLimitExampleController;
__decorate([
    (0, common_1.Get)('public'),
    (0, common_1.UseGuards)(guards_1.RateLimitOnlyGuard),
    (0, rate_limit_decorators_1.RateLimit)({ limit: 100, windowMs: 15 * 60 * 1000 }),
    (0, swagger_1.ApiOperation)({ summary: 'Public endpoint with basic rate limiting' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "publicEndpoint", null);
__decorate([
    (0, common_1.Post)('sensitive'),
    (0, common_1.UseGuards)(guards_1.RateLimitOnlyGuard),
    (0, rate_limit_decorators_1.IPRateLimit)({ limit: 5, windowMs: 15 * 60 * 1000 }),
    (0, swagger_1.ApiOperation)({ summary: 'Sensitive operation with IP rate limiting' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "sensitiveOperation", null);
__decorate([
    (0, common_1.Get)('protected'),
    (0, common_1.UseGuards)(guards_1.CombinedAuthGuard),
    (0, rate_limit_decorators_1.UserRateLimit)({ limit: 1000, windowMs: 60 * 60 * 1000 }),
    (0, rate_limit_decorators_1.ApiKeyRateLimit)({ limit: 5000, windowMs: 60 * 60 * 1000 }),
    (0, swagger_1.ApiOperation)({ summary: 'Protected endpoint with user and API key rate limiting' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "protectedEndpoint", null);
__decorate([
    (0, common_1.Post)('multi-layer'),
    (0, common_1.UseGuards)(guards_1.CombinedAuthGuard),
    (0, rate_limit_decorators_1.IPRateLimit)({ limit: 10, windowMs: 60 * 1000 }),
    (0, rate_limit_decorators_1.UserRateLimit)({ limit: 100, windowMs: 15 * 60 * 1000 }),
    (0, rate_limit_decorators_1.RateLimit)({ limit: 50, windowMs: 5 * 60 * 1000 }),
    (0, swagger_1.ApiOperation)({ summary: 'Endpoint with multiple rate limiting layers' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "multiLayerEndpoint", null);
__decorate([
    (0, common_1.Get)('strict'),
    (0, common_1.UseGuards)(guards_1.RateLimitOnlyGuard),
    (0, rate_limit_decorators_1.StrictRateLimit)(),
    (0, swagger_1.ApiOperation)({ summary: 'Endpoint with strict rate limiting preset' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "strictEndpoint", null);
__decorate([
    (0, common_1.Get)('conservative'),
    (0, common_1.UseGuards)(guards_1.CombinedAuthGuard),
    (0, rate_limit_decorators_1.ConservativeRateLimit)(),
    (0, swagger_1.ApiOperation)({ summary: 'Endpoint with conservative rate limiting preset' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "conservativeEndpoint", null);
__decorate([
    (0, common_1.Get)('standard'),
    (0, common_1.UseGuards)(guards_1.CombinedAuthGuard),
    (0, rate_limit_decorators_1.StandardRateLimit)(),
    (0, swagger_1.ApiOperation)({ summary: 'Endpoint with standard rate limiting preset' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "standardEndpoint", null);
__decorate([
    (0, common_1.Get)('optional-auth'),
    (0, common_1.UseGuards)(guards_1.OptionalAuthWithRateLimitGuard),
    (0, rate_limit_decorators_1.RateLimit)({ limit: 200, windowMs: 15 * 60 * 1000 }),
    (0, rate_limit_decorators_1.UserRateLimit)({ limit: 500, windowMs: 15 * 60 * 1000 }),
    (0, swagger_1.ApiOperation)({ summary: 'Endpoint with optional authentication and rate limiting' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "optionalAuthEndpoint", null);
__decorate([
    (0, common_1.Post)('custom'),
    (0, common_1.UseGuards)(guards_1.RateLimitOnlyGuard),
    (0, rate_limit_decorators_1.RateLimit)({
        limit: 20,
        windowMs: 60 * 1000,
        keyGenerator: (req) => `custom:${req.body?.category || 'default'}:${req.ip}`,
        message: 'Custom rate limit exceeded for this category'
    }),
    (0, swagger_1.ApiOperation)({ summary: 'Endpoint with custom rate limiting key generator' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "customRateLimitEndpoint", null);
__decorate([
    (0, common_1.Post)('admin'),
    (0, common_1.UseGuards)(guards_1.CombinedAuthGuard),
    (0, rate_limit_decorators_1.SkipRateLimit)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin endpoint with no rate limiting' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "adminEndpoint", null);
__decorate([
    (0, common_1.Get)('resource'),
    (0, common_1.UseGuards)(guards_1.CombinedAuthGuard),
    (0, rate_limit_decorators_1.RateLimit)(rate_limit_decorators_1.RateLimitPresets.GENEROUS),
    (0, swagger_1.ApiOperation)({ summary: 'GET endpoint with generous rate limiting' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "getResource", null);
__decorate([
    (0, common_1.Post)('resource'),
    (0, common_1.UseGuards)(guards_1.CombinedAuthGuard),
    (0, rate_limit_decorators_1.RateLimit)(rate_limit_decorators_1.RateLimitPresets.CONSERVATIVE),
    (0, swagger_1.ApiOperation)({ summary: 'POST endpoint with conservative rate limiting' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "createResource", null);
__decorate([
    (0, common_1.Get)('per-minute'),
    (0, common_1.UseGuards)(guards_1.RateLimitOnlyGuard),
    (0, rate_limit_decorators_1.RateLimit)(rate_limit_decorators_1.RateLimitPresets.PER_MINUTE_STANDARD),
    (0, swagger_1.ApiOperation)({ summary: 'Endpoint with per-minute rate limiting' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "perMinuteEndpoint", null);
__decorate([
    (0, common_1.Get)('per-hour'),
    (0, common_1.UseGuards)(guards_1.RateLimitOnlyGuard),
    (0, rate_limit_decorators_1.RateLimit)(rate_limit_decorators_1.RateLimitPresets.PER_HOUR_STANDARD),
    (0, swagger_1.ApiOperation)({ summary: 'Endpoint with per-hour rate limiting' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RateLimitExampleController.prototype, "perHourEndpoint", null);
exports.RateLimitExampleController = RateLimitExampleController = __decorate([
    (0, common_1.Controller)('examples'),
    (0, swagger_1.ApiTags)('Rate Limiting Examples')
], RateLimitExampleController);
let AuthControllerWithRateLimit = class AuthControllerWithRateLimit {
    async login(loginDto) {
        return { message: 'Login successful' };
    }
    async register(registerDto) {
        return { message: 'Registration successful' };
    }
    async forgotPassword(forgotDto) {
        return { message: 'Password reset email sent' };
    }
    async getProfile() {
        return { message: 'Profile retrieved' };
    }
};
exports.AuthControllerWithRateLimit = AuthControllerWithRateLimit;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.UseGuards)(guards_1.RateLimitOnlyGuard),
    (0, rate_limit_decorators_1.IPRateLimit)({ limit: 5, windowMs: 15 * 60 * 1000 }),
    (0, rate_limit_decorators_1.RateLimit)({ limit: 10, windowMs: 15 * 60 * 1000 }),
    (0, swagger_1.ApiOperation)({ summary: 'User login with rate limiting' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthControllerWithRateLimit.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UseGuards)(guards_1.RateLimitOnlyGuard),
    (0, rate_limit_decorators_1.IPRateLimit)({ limit: 3, windowMs: 60 * 60 * 1000 }),
    (0, swagger_1.ApiOperation)({ summary: 'User registration with rate limiting' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthControllerWithRateLimit.prototype, "register", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.UseGuards)(guards_1.RateLimitOnlyGuard),
    (0, rate_limit_decorators_1.IPRateLimit)({ limit: 3, windowMs: 60 * 60 * 1000 }),
    (0, swagger_1.ApiOperation)({ summary: 'Password reset request with rate limiting' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthControllerWithRateLimit.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(guards_1.CombinedAuthGuard),
    (0, rate_limit_decorators_1.UserRateLimit)({ limit: 100, windowMs: 15 * 60 * 1000 }),
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile with rate limiting' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthControllerWithRateLimit.prototype, "getProfile", null);
exports.AuthControllerWithRateLimit = AuthControllerWithRateLimit = __decorate([
    (0, common_1.Controller)('auth'),
    (0, swagger_1.ApiTags)('Authentication')
], AuthControllerWithRateLimit);
//# sourceMappingURL=rate-limit-usage.example.js.map