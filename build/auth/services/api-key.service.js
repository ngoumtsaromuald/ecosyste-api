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
exports.ApiKeyService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const api_key_repository_1 = require("../../repositories/api-key.repository");
const rate_limit_service_1 = require("./rate-limit.service");
const audit_service_1 = require("./audit.service");
let ApiKeyService = class ApiKeyService {
    constructor(apiKeyRepository, rateLimitService, auditService) {
        this.apiKeyRepository = apiKeyRepository;
        this.rateLimitService = rateLimitService;
        this.auditService = auditService;
    }
    async createApiKey(userId, createDto) {
        const isNameUnique = await this.apiKeyRepository.isNameUniqueForUser(userId, createDto.name);
        if (!isNameUnique) {
            throw new common_1.BadRequestException('API key name must be unique for your account');
        }
        const keyValue = this.generateSecureKey();
        const keyPrefix = keyValue.substring(0, 8);
        const keyHash = await bcrypt.hash(keyValue, 12);
        let expiresAt;
        if (createDto.expiresAt) {
            expiresAt = new Date(createDto.expiresAt);
            if (expiresAt <= new Date()) {
                throw new common_1.BadRequestException('Expiration date must be in the future');
            }
        }
        const apiKey = await this.apiKeyRepository.create({
            userId,
            name: createDto.name,
            keyHash,
            keyPrefix,
            permissions: createDto.permissions || [],
            rateLimit: createDto.rateLimit || 1000,
            expiresAt,
        });
        await this.auditService.logApiKeyCreation(userId, apiKey.id);
        return {
            id: apiKey.id,
            name: apiKey.name,
            keyPrefix,
            keyValue,
            permissions: apiKey.permissions,
            rateLimit: apiKey.rateLimit,
            isActive: apiKey.isActive,
            lastUsedAt: apiKey.lastUsedAt,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt,
        };
    }
    async validateApiKey(keyValue) {
        if (!keyValue || !keyValue.startsWith('rk_')) {
            throw new common_1.UnauthorizedException('Invalid API key format');
        }
        const keyPrefix = keyValue.substring(0, 8);
        const apiKey = await this.apiKeyRepository.findByPrefix(keyPrefix, {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    userType: true,
                    plan: true,
                },
            },
        });
        if (!apiKey || !apiKey.isActive) {
            throw new common_1.UnauthorizedException('Invalid or inactive API key');
        }
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
            await this.apiKeyRepository.deactivate(apiKey.id);
            throw new common_1.UnauthorizedException('API key has expired');
        }
        const isValid = await bcrypt.compare(keyValue, apiKey.keyHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        const rateLimitResult = await this.rateLimitService.checkApiKeyLimit(apiKey.id, apiKey.rateLimit);
        if (!rateLimitResult.allowed) {
            throw new common_1.HttpException('API key rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        this.apiKeyRepository.updateLastUsed(apiKey.id).catch(error => {
            console.error('Failed to update API key last used timestamp:', error);
        });
        this.auditService.logApiKeyUsage(apiKey.userId, apiKey.id, 'api_validation').catch(error => {
            console.error('Failed to log API key usage:', error);
        });
        return {
            apiKey: {
                id: apiKey.id,
                name: apiKey.name,
                permissions: apiKey.permissions,
                rateLimit: apiKey.rateLimit,
                userId: apiKey.userId,
            },
            user: {
                id: apiKey.user.id,
                email: apiKey.user.email,
                name: apiKey.user.name,
                userType: apiKey.user.userType,
                plan: apiKey.user.plan,
            },
            rateLimitRemaining: rateLimitResult.remaining,
            rateLimitReset: rateLimitResult.resetTime,
        };
    }
    async listUserApiKeys(userId) {
        const { apiKeys } = await this.apiKeyRepository.findByUserId(userId, { limit: 100 });
        return apiKeys.map(key => ({
            id: key.id,
            name: key.name,
            keyPrefix: key.keyPrefix,
            permissions: key.permissions,
            rateLimit: key.rateLimit,
            isActive: key.isActive,
            lastUsedAt: key.lastUsedAt,
            expiresAt: key.expiresAt,
            createdAt: key.createdAt,
        }));
    }
    async revokeApiKey(userId, keyId) {
        const apiKey = await this.apiKeyRepository.findByIdAndUserId(keyId, userId);
        if (!apiKey) {
            throw new common_1.NotFoundException('API key not found');
        }
        if (!apiKey.isActive) {
            throw new common_1.BadRequestException('API key is already inactive');
        }
        await this.apiKeyRepository.deactivate(keyId);
        await this.auditService.logApiKeyRevocation(userId, keyId);
    }
    async updateApiKey(userId, keyId, updateDto) {
        const apiKey = await this.apiKeyRepository.findByIdAndUserId(keyId, userId);
        if (!apiKey) {
            throw new common_1.NotFoundException('API key not found');
        }
        if (updateDto.name && updateDto.name !== apiKey.name) {
            const isNameUnique = await this.apiKeyRepository.isNameUniqueForUser(userId, updateDto.name, keyId);
            if (!isNameUnique) {
                throw new common_1.BadRequestException('API key name must be unique for your account');
            }
        }
        let expiresAt;
        if (updateDto.expiresAt !== undefined) {
            if (updateDto.expiresAt) {
                expiresAt = new Date(updateDto.expiresAt);
                if (expiresAt <= new Date()) {
                    throw new common_1.BadRequestException('Expiration date must be in the future');
                }
            }
            else {
                expiresAt = undefined;
            }
        }
        const updateData = {};
        if (updateDto.name !== undefined)
            updateData.name = updateDto.name;
        if (updateDto.permissions !== undefined)
            updateData.permissions = updateDto.permissions;
        if (updateDto.rateLimit !== undefined)
            updateData.rateLimit = updateDto.rateLimit;
        if (updateDto.expiresAt !== undefined)
            updateData.expiresAt = expiresAt;
        const updatedApiKey = await this.apiKeyRepository.update(keyId, updateData);
        return {
            id: updatedApiKey.id,
            name: updatedApiKey.name,
            keyPrefix: updatedApiKey.keyPrefix,
            permissions: updatedApiKey.permissions,
            rateLimit: updatedApiKey.rateLimit,
            isActive: updatedApiKey.isActive,
            lastUsedAt: updatedApiKey.lastUsedAt,
            expiresAt: updatedApiKey.expiresAt,
            createdAt: updatedApiKey.createdAt,
        };
    }
    async reactivateApiKey(userId, keyId) {
        const apiKey = await this.apiKeyRepository.findByIdAndUserId(keyId, userId);
        if (!apiKey) {
            throw new common_1.NotFoundException('API key not found');
        }
        if (apiKey.isActive) {
            throw new common_1.BadRequestException('API key is already active');
        }
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Cannot reactivate expired API key');
        }
        await this.apiKeyRepository.reactivate(keyId);
    }
    hasPermission(apiKey, requiredPermission) {
        if (apiKey.permissions.includes('*') || apiKey.permissions.includes('admin:*')) {
            return true;
        }
        if (apiKey.permissions.includes(requiredPermission)) {
            return true;
        }
        for (const permission of apiKey.permissions) {
            if (permission.endsWith(':*')) {
                const prefix = permission.slice(0, -2);
                if (requiredPermission.startsWith(prefix + ':')) {
                    return true;
                }
            }
        }
        return false;
    }
    async getUserApiKeyStats(userId) {
        const { apiKeys } = await this.apiKeyRepository.findByUserId(userId, { limit: 1000 }, true);
        const now = new Date();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const stats = {
            total: apiKeys.length,
            active: 0,
            inactive: 0,
            expired: 0,
            recentlyUsed: 0,
        };
        for (const key of apiKeys) {
            if (key.isActive) {
                if (key.expiresAt && key.expiresAt < now) {
                    stats.expired++;
                }
                else {
                    stats.active++;
                }
            }
            else {
                stats.inactive++;
            }
            if (key.lastUsedAt && key.lastUsedAt > weekAgo) {
                stats.recentlyUsed++;
            }
        }
        return stats;
    }
    generateSecureKey() {
        const prefix = 'rk_';
        const randomBytes = crypto.randomBytes(32).toString('hex');
        return `${prefix}${randomBytes}`;
    }
    async cleanupExpiredKeys() {
        const expiredKeys = await this.apiKeyRepository.getExpiredKeys();
        if (expiredKeys.length > 0) {
            const keyIds = expiredKeys.map(key => key.id);
            await this.apiKeyRepository.bulkDeactivate(keyIds);
        }
        return { deactivated: expiredKeys.length };
    }
    async getKeysExpiringSoon(daysAhead = 7) {
        const keys = await this.apiKeyRepository.getKeysExpiringSoon(daysAhead);
        return keys.map(key => ({
            id: key.id,
            name: key.name,
            expiresAt: key.expiresAt,
            user: {
                id: key.user.id,
                email: key.user.email,
                name: key.user.name,
            },
        }));
    }
};
exports.ApiKeyService = ApiKeyService;
exports.ApiKeyService = ApiKeyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_key_repository_1.ApiKeyRepository,
        rate_limit_service_1.RateLimitService,
        audit_service_1.AuditService])
], ApiKeyService);
//# sourceMappingURL=api-key.service.js.map