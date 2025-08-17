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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const audit_repository_1 = require("../repositories/audit.repository");
let AuditService = class AuditService {
    constructor(auditRepository) {
        this.auditRepository = auditRepository;
    }
    async logLogin(userId, ipAddress, userAgent, success = true) {
        await this.auditRepository.create({
            userId,
            action: success ? 'auth.login.success' : 'auth.login.failed',
            resource: 'auth',
            details: {
                success,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logLogout(userId, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.logout',
            resource: 'auth',
            details: {
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logTokenGeneration(userId, tokenType, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.token.generated',
            resource: 'auth',
            details: {
                tokenType,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logApiKeyCreation(userId, apiKeyId, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'api_key.created',
            resource: 'api_key',
            details: {
                apiKeyId,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logApiKeyRevocation(userId, apiKeyId, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'api_key.revoked',
            resource: 'api_key',
            details: {
                apiKeyId,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logApiKeyUsage(userId, apiKeyId, endpoint, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'api_key.used',
            resource: 'api_key',
            details: {
                apiKeyId,
                endpoint,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logOAuthLogin(userId, provider, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.oauth.login',
            resource: 'auth',
            details: {
                provider,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logPermissionCheck(userId, permission, granted, context, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.permission.check',
            resource: context?.resource || 'permission',
            details: {
                permission,
                granted,
                context,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logSuspiciousActivity(userId, activity, details, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'security.suspicious_activity',
            resource: 'security',
            details: {
                activity,
                ...details,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logPasswordChange(userId, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.password.changed',
            resource: 'auth',
            details: {
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logAccountLocked(userId, reason, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.account.locked',
            resource: 'auth',
            details: {
                reason,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logAccountUnlocked(userId, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.account.unlocked',
            resource: 'auth',
            details: {
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logUserRegistration(userId, email, method = 'email', ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.user.registered',
            resource: 'auth',
            details: {
                email,
                method,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logOAuthAccountLinked(userId, provider, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.oauth.account.linked',
            resource: 'auth',
            details: {
                provider,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logOAuthAccountUnlinked(userId, provider, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.oauth.account.unlinked',
            resource: 'auth',
            details: {
                provider,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logFailedLogin(email, reason, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId: null,
            action: 'auth.login.failed',
            resource: 'auth',
            details: {
                email,
                reason,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logSuccessfulLogin(userId, email, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.login.success',
            resource: 'auth',
            details: {
                email,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logPasswordResetRequest(userId, email, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.password.reset.requested',
            resource: 'auth',
            details: {
                email,
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logPasswordReset(userId, ipAddress, userAgent) {
        await this.auditRepository.create({
            userId,
            action: 'auth.password.reset.completed',
            resource: 'auth',
            details: {
                timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_repository_1.AuditRepository])
], AuditService);
//# sourceMappingURL=audit.service.js.map