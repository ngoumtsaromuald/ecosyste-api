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
exports.ApiKeyPermissionGuard = exports.JwtPermissionGuard = exports.AuthPermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const api_key_auth_guard_1 = require("./api-key-auth.guard");
const permission_guard_1 = require("./permission.guard");
let AuthPermissionGuard = class AuthPermissionGuard {
    constructor(reflector, jwtAuthGuard, apiKeyAuthGuard, permissionGuard) {
        this.reflector = reflector;
        this.jwtAuthGuard = jwtAuthGuard;
        this.apiKeyAuthGuard = apiKeyAuthGuard;
        this.permissionGuard = permissionGuard;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const allowApiKey = this.reflector.getAllAndOverride('allow_api_key', [context.getHandler(), context.getClass()]);
        let isAuthenticated = false;
        try {
            isAuthenticated = await this.jwtAuthGuard.canActivate(context);
        }
        catch (jwtError) {
            if (allowApiKey) {
                try {
                    isAuthenticated = await this.apiKeyAuthGuard.canActivate(context);
                }
                catch (apiKeyError) {
                    throw new common_1.UnauthorizedException('Invalid authentication credentials');
                }
            }
            else {
                throw jwtError;
            }
        }
        if (!isAuthenticated) {
            throw new common_1.UnauthorizedException('Authentication required');
        }
        return await this.permissionGuard.canActivate(context);
    }
};
exports.AuthPermissionGuard = AuthPermissionGuard;
exports.AuthPermissionGuard = AuthPermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_auth_guard_1.JwtAuthGuard,
        api_key_auth_guard_1.ApiKeyAuthGuard,
        permission_guard_1.PermissionGuard])
], AuthPermissionGuard);
let JwtPermissionGuard = class JwtPermissionGuard {
    constructor(jwtAuthGuard, permissionGuard) {
        this.jwtAuthGuard = jwtAuthGuard;
        this.permissionGuard = permissionGuard;
    }
    async canActivate(context) {
        const isAuthenticated = await this.jwtAuthGuard.canActivate(context);
        if (!isAuthenticated) {
            return false;
        }
        return await this.permissionGuard.canActivate(context);
    }
};
exports.JwtPermissionGuard = JwtPermissionGuard;
exports.JwtPermissionGuard = JwtPermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_auth_guard_1.JwtAuthGuard,
        permission_guard_1.PermissionGuard])
], JwtPermissionGuard);
let ApiKeyPermissionGuard = class ApiKeyPermissionGuard {
    constructor(apiKeyAuthGuard, permissionGuard) {
        this.apiKeyAuthGuard = apiKeyAuthGuard;
        this.permissionGuard = permissionGuard;
    }
    async canActivate(context) {
        const isAuthenticated = await this.apiKeyAuthGuard.canActivate(context);
        if (!isAuthenticated) {
            return false;
        }
        return await this.permissionGuard.canActivate(context);
    }
};
exports.ApiKeyPermissionGuard = ApiKeyPermissionGuard;
exports.ApiKeyPermissionGuard = ApiKeyPermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_key_auth_guard_1.ApiKeyAuthGuard,
        permission_guard_1.PermissionGuard])
], ApiKeyPermissionGuard);
//# sourceMappingURL=auth-permission.guard.js.map