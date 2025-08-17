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
exports.ApiKeyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_key_service_1 = require("../services/api-key.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const dto_1 = require("../dto");
let ApiKeyController = class ApiKeyController {
    constructor(apiKeyService) {
        this.apiKeyService = apiKeyService;
    }
    async listApiKeys(req) {
        return this.apiKeyService.listUserApiKeys(req.user.id);
    }
    async createApiKey(req, createDto) {
        return this.apiKeyService.createApiKey(req.user.id, createDto);
    }
    async updateApiKey(req, keyId, updateDto) {
        return this.apiKeyService.updateApiKey(req.user.id, keyId, updateDto);
    }
    async revokeApiKey(req, keyId) {
        await this.apiKeyService.revokeApiKey(req.user.id, keyId);
    }
    async reactivateApiKey(req, keyId) {
        await this.apiKeyService.reactivateApiKey(req.user.id, keyId);
    }
    async getApiKeyStats(req) {
        return this.apiKeyService.getUserApiKeyStats(req.user.id);
    }
};
exports.ApiKeyController = ApiKeyController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List user API keys',
        description: 'Retrieve all API keys for the authenticated user. The full key value is never returned in list operations.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'API keys retrieved successfully',
        type: [dto_1.ApiKeyListResponseDto]
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Invalid or missing authentication token' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "listApiKeys", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new API key',
        description: 'Create a new API key for the authenticated user. The full key value is only returned once during creation.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'API key created successfully',
        type: dto_1.ApiKeyResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid input data or duplicate key name' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Invalid or missing authentication token' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateApiKeyDto]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "createApiKey", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update API key',
        description: 'Update an existing API key\'s properties such as name, permissions, rate limit, or expiration date.'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'API key ID', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'API key updated successfully',
        type: dto_1.ApiKeyListResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid input data or duplicate key name' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'API key not found' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Invalid or missing authentication token' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateApiKeyDto]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "updateApiKey", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({
        summary: 'Revoke API key',
        description: 'Permanently revoke (deactivate) an API key. This action cannot be undone.'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'API key ID', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'API key revoked successfully'
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'API key not found' }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'API key is already inactive' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Invalid or missing authentication token' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "revokeApiKey", null);
__decorate([
    (0, common_1.Post)(':id/reactivate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({
        summary: 'Reactivate API key',
        description: 'Reactivate a previously deactivated API key. Cannot reactivate expired keys.'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'API key ID', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'API key reactivated successfully'
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'API key not found' }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'API key is already active or has expired' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Invalid or missing authentication token' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "reactivateApiKey", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get API key statistics',
        description: 'Get statistics about the user\'s API keys including total count, active/inactive counts, and usage information.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'API key statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number', description: 'Total number of API keys' },
                active: { type: 'number', description: 'Number of active API keys' },
                inactive: { type: 'number', description: 'Number of inactive API keys' },
                expired: { type: 'number', description: 'Number of expired API keys' },
                recentlyUsed: { type: 'number', description: 'Number of keys used in the last 7 days' },
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Invalid or missing authentication token' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiKeyController.prototype, "getApiKeyStats", null);
exports.ApiKeyController = ApiKeyController = __decorate([
    (0, common_1.Controller)('api-keys'),
    (0, swagger_1.ApiTags)('API Keys'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [api_key_service_1.ApiKeyService])
], ApiKeyController);
//# sourceMappingURL=api-key.controller.js.map