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
exports.ApiKeyStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_custom_1 = require("passport-custom");
const api_key_service_1 = require("../services/api-key.service");
let ApiKeyStrategy = class ApiKeyStrategy extends (0, passport_1.PassportStrategy)(passport_custom_1.Strategy, 'api-key') {
    constructor(apiKeyService) {
        super();
        this.apiKeyService = apiKeyService;
    }
    async validate(req) {
        const apiKey = this.extractApiKey(req);
        if (!apiKey) {
            throw new common_1.UnauthorizedException('API key is required');
        }
        try {
            const validationResult = await this.apiKeyService.validateApiKey(apiKey);
            return {
                id: validationResult.user.id,
                email: validationResult.user.email,
                name: validationResult.user.name,
                userType: validationResult.user.userType,
                plan: validationResult.user.plan,
                apiKey: validationResult.apiKey,
                rateLimitRemaining: validationResult.rateLimitRemaining,
                rateLimitReset: validationResult.rateLimitReset,
            };
        }
        catch (error) {
            throw error;
        }
    }
    extractApiKey(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (token.startsWith('rk_')) {
                return token;
            }
        }
        const apiKeyHeader = req.headers['x-api-key'];
        if (apiKeyHeader) {
            return apiKeyHeader;
        }
        const customApiKeyHeader = req.headers['api-key'];
        if (customApiKeyHeader) {
            return customApiKeyHeader;
        }
        const queryApiKey = req.query.api_key || req.query.apiKey;
        if (queryApiKey) {
            return queryApiKey;
        }
        if (req.body && typeof req.body === 'object') {
            const bodyApiKey = req.body.api_key || req.body.apiKey;
            if (bodyApiKey && typeof bodyApiKey === 'string') {
                return bodyApiKey;
            }
        }
        return null;
    }
};
exports.ApiKeyStrategy = ApiKeyStrategy;
exports.ApiKeyStrategy = ApiKeyStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_key_service_1.ApiKeyService])
], ApiKeyStrategy);
//# sourceMappingURL=api-key.strategy.js.map