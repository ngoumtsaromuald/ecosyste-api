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
exports.PermissionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_service_1 = require("./audit.service");
let PermissionService = class PermissionService {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async checkPermission(user, permission, context) {
        const userPermissions = await this.getUserPermissions(user);
        if (userPermissions.includes('admin:*')) {
            await this.auditService.logPermissionCheck(user.id, permission, true, context);
            return { allowed: true };
        }
        if (userPermissions.includes(permission)) {
            await this.auditService.logPermissionCheck(user.id, permission, true, context);
            return { allowed: true };
        }
        const hasHierarchicalPermission = userPermissions.some(userPerm => {
            if (userPerm.endsWith(':*')) {
                const basePermission = userPerm.slice(0, -2);
                return permission.startsWith(basePermission + ':');
            }
            return false;
        });
        if (hasHierarchicalPermission) {
            await this.auditService.logPermissionCheck(user.id, permission, true, context);
            return { allowed: true };
        }
        await this.auditService.logPermissionCheck(user.id, permission, false, context);
        return {
            allowed: false,
            reason: `Insufficient permissions. Required: ${permission}`
        };
    }
    async getUserPermissions(user) {
        const permissions = [];
        permissions.push('read:profile', 'update:profile', 'read:own:api-keys', 'create:own:api-keys', 'delete:own:api-keys');
        switch (user.userType) {
            case client_1.UserType.INDIVIDUAL:
                permissions.push('read:own:resources', 'create:own:resources', 'update:own:resources', 'delete:own:resources');
                break;
            case client_1.UserType.BUSINESS:
                permissions.push('read:own:resources', 'create:own:resources', 'update:own:resources', 'delete:own:resources', 'read:business:dashboard', 'read:business:analytics', 'manage:business:team');
                break;
            case client_1.UserType.ADMIN:
                permissions.push('admin:*');
                break;
        }
        switch (user.plan) {
            case client_1.Plan.FREE:
                break;
            case client_1.Plan.PRO:
                permissions.push('read:advanced:analytics', 'export:data', 'priority:support');
                break;
            case client_1.Plan.PREMIUM:
                permissions.push('read:advanced:analytics', 'export:data', 'priority:support', 'white:label', 'custom:integrations');
                break;
            case client_1.Plan.ENTERPRISE:
                permissions.push('read:advanced:analytics', 'export:data', 'priority:support', 'white:label', 'custom:integrations', 'bulk:operations', 'dedicated:support');
                break;
        }
        return [...new Set(permissions)];
    }
    async hasPermission(user, permission, context) {
        const result = await this.checkPermission(user, permission, context);
        return result.allowed;
    }
    async requirePermission(user, permission, context) {
        const result = await this.checkPermission(user, permission, context);
        if (!result.allowed) {
            throw new common_1.ForbiddenException(result.reason || 'Insufficient permissions');
        }
    }
    async requireAllPermissions(user, permissions, context) {
        for (const permission of permissions) {
            await this.requirePermission(user, permission, context);
        }
    }
    async requireAnyPermission(user, permissions, context) {
        const results = await Promise.all(permissions.map(permission => this.checkPermission(user, permission, context)));
        const hasAnyPermission = results.some(result => result.allowed);
        if (!hasAnyPermission) {
            throw new common_1.ForbiddenException(`Insufficient permissions. Required one of: ${permissions.join(', ')}`);
        }
    }
    async checkResourceOwnership(user, resourceUserId, context) {
        if (user.userType === client_1.UserType.ADMIN) {
            return { allowed: true };
        }
        if (user.id === resourceUserId) {
            return { allowed: true };
        }
        await this.auditService.logPermissionCheck(user.id, 'resource:ownership', false, { ...context, resourceId: resourceUserId });
        return {
            allowed: false,
            reason: 'You can only access your own resources'
        };
    }
    getPermissionHierarchy(basePermission) {
        const parts = basePermission.split(':');
        const hierarchy = [];
        for (let i = 1; i <= parts.length; i++) {
            hierarchy.push(parts.slice(0, i).join(':'));
        }
        return hierarchy;
    }
    isHierarchicalMatch(userPermission, requiredPermission) {
        if (userPermission.endsWith(':*')) {
            const basePermission = userPermission.slice(0, -2);
            return requiredPermission.startsWith(basePermission + ':');
        }
        return false;
    }
};
exports.PermissionService = PermissionService;
exports.PermissionService = PermissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], PermissionService);
//# sourceMappingURL=permission.service.js.map