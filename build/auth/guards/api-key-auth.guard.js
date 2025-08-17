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
exports.JwtOrApiKeyAuthGuard = exports.ApiKeyAuthGuard = exports.OptionalApiKey = exports.RequireApiKeyPermissions = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const passport_1 = require("@nestjs/passport");
const RequireApiKeyPermissions = (...permissions) => (0, common_1.SetMetadata)('apiKeyPermissions', permissions);
exports.RequireApiKeyPermissions = RequireApiKeyPermissions;
const OptionalApiKey = () => (0, common_1.SetMetadata)('optionalApiKey', true);
exports.OptionalApiKey = OptionalApiKey;
let ApiKeyAuthGuard = class ApiKeyAuthGuard extends (0, passport_1.AuthGuard)('api-key') {
    constructor(reflector) {
        super();
        this.reflector = reflector;
    }
    async canActivate(context) {
        const isOptional = this.reflector.get('optionalApiKey', context.getHandler());
        try {
            const result = await super.canActivate(context);
            if (result) {
                await this.checkPermissions(context);
                this.setRateLimitHeaders(context);
            }
            return result;
        }
        catch (error) {
            if (isOptional) {
                return true;
            }
            throw error;
        }
    }
    handleRequest(err, user, info, context) {
        const isOptional = this.reflector.get('optionalApiKey', context.getHandler());
        if (err) {
            if (err instanceof common_1.HttpException && err.getStatus() === common_1.HttpStatus.TOO_MANY_REQUESTS) {
                throw err;
            }
            throw new common_1.UnauthorizedException(err.message || 'Invalid API key');
        }
        if (!user) {
            if (isOptional) {
                return null;
            }
            throw new common_1.UnauthorizedException('API key is required');
        }
        return user;
    }
    async checkPermissions(context) {
        const requiredPermissions = this.reflector.get('apiKeyPermissions', context.getHandler());
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.apiKey) {
            throw new common_1.UnauthorizedException('API key authentication required');
        }
        for (const permission of requiredPermissions) {
            if (!this.hasPermission(user.apiKey.permissions, permission)) {
                throw new common_1.UnauthorizedException(`Insufficient permissions. Required: ${permission}`);
            }
        }
    }
    hasPermission(apiKeyPermissions, requiredPermission) {
        if (apiKeyPermissions.includes('*') || apiKeyPermissions.includes('admin:*')) {
            return true;
        }
        if (apiKeyPermissions.includes(requiredPermission)) {
            return true;
        }
        for (const permission of apiKeyPermissions) {
            if (permission.endsWith(':*')) {
                const prefix = permission.slice(0, -2);
                if (requiredPermission.startsWith(prefix + ':')) {
                    return true;
                }
            }
        }
        return false;
    }
    setRateLimitHeaders(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const user = request.user;
        if (user && user.apiKey) {
            response.setHeader('X-RateLimit-Limit', user.apiKey.rateLimit.toString());
            response.setHeader('X-RateLimit-Remaining', user.rateLimitRemaining.toString());
            response.setHeader('X-RateLimit-Reset', Math.floor(user.rateLimitReset.getTime() / 1000).toString());
            response.setHeader('X-API-Key-Name', user.apiKey.name);
            response.setHeader('X-API-Key-ID', user.apiKey.id);
        }
    }
};
exports.ApiKeyAuthGuard = ApiKeyAuthGuard;
exports.ApiKeyAuthGuard = ApiKeyAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], ApiKeyAuthGuard);
let JwtOrApiKeyAuthGuard = class JwtOrApiKeyAuthGuard {
    constructor(apiKeyAuthGuard) {
        this.apiKeyAuthGuard = apiKeyAuthGuard;
        this.jwtAuthGuard = new ((0, passport_1.AuthGuard)('jwt'))();
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const hasApiKey = this.hasApiKeyInRequest(request);
        if (hasApiKey) {
            try {
                return await this.apiKeyAuthGuard.canActivate(context);
            }
            catch (error) {
                throw error;
            }
        }
        else {
            try {
                return await this.jwtAuthGuard.canActivate(context);
            }
            catch (error) {
                throw new common_1.UnauthorizedException('Valid JWT token or API key required');
            }
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
exports.JwtOrApiKeyAuthGuard = JwtOrApiKeyAuthGuard;
exports.JwtOrApiKeyAuthGuard = JwtOrApiKeyAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ApiKeyAuthGuard])
], JwtOrApiKeyAuthGuard);
//# sourceMappingURL=api-key-auth.guard.js.map