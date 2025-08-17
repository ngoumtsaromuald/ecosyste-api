import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserType, Plan } from '@prisma/client';
import { AuditService } from './audit.service';

export interface User {
    id: string;
    email: string;
    userType: UserType;
    plan: Plan;
}

export interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
}

export interface PermissionContext {
    userId?: string;
    resourceId?: string;
    action: string;
    resource: string;
}

@Injectable()
export class PermissionService {
    constructor(private readonly auditService: AuditService) { }

    /**
     * Check if user has specific permission
     */
    async checkPermission(
        user: User,
        permission: string,
        context?: PermissionContext
    ): Promise<PermissionCheckResult> {
        const userPermissions = await this.getUserPermissions(user);

        // Check for wildcard admin permission
        if (userPermissions.includes('admin:*')) {
            await this.auditService.logPermissionCheck(
                user.id,
                permission,
                true,
                context
            );
            return { allowed: true };
        }

        // Check for exact permission match
        if (userPermissions.includes(permission)) {
            await this.auditService.logPermissionCheck(
                user.id,
                permission,
                true,
                context
            );
            return { allowed: true };
        }

        // Check for hierarchical permissions (e.g., 'admin:users' includes 'admin:users:read')
        const hasHierarchicalPermission = userPermissions.some(userPerm => {
            if (userPerm.endsWith(':*')) {
                const basePermission = userPerm.slice(0, -2);
                return permission.startsWith(basePermission + ':');
            }
            return false;
        });

        if (hasHierarchicalPermission) {
            await this.auditService.logPermissionCheck(
                user.id,
                permission,
                true,
                context
            );
            return { allowed: true };
        }

        // Permission denied
        await this.auditService.logPermissionCheck(
            user.id,
            permission,
            false,
            context
        );

        return {
            allowed: false,
            reason: `Insufficient permissions. Required: ${permission}`
        };
    }

    /**
     * Get all permissions for a user based on userType and plan
     */
    async getUserPermissions(user: User): Promise<string[]> {
        const permissions: string[] = [];

        // Base permissions for all users
        permissions.push(
            'read:profile',
            'update:profile',
            'read:own:api-keys',
            'create:own:api-keys',
            'delete:own:api-keys'
        );

        // UserType-based permissions
        switch (user.userType) {
            case UserType.INDIVIDUAL:
                permissions.push(
                    'read:own:resources',
                    'create:own:resources',
                    'update:own:resources',
                    'delete:own:resources'
                );
                break;

            case UserType.BUSINESS:
                permissions.push(
                    'read:own:resources',
                    'create:own:resources',
                    'update:own:resources',
                    'delete:own:resources',
                    'read:business:dashboard',
                    'read:business:analytics',
                    'manage:business:team'
                );
                break;

            case UserType.ADMIN:
                permissions.push('admin:*'); // Wildcard permission for all admin actions
                break;
        }

        // Plan-based permissions
        switch (user.plan) {
            case Plan.FREE:
                // Free plan has basic permissions only
                break;

            case Plan.PRO:
                permissions.push(
                    'read:advanced:analytics',
                    'export:data',
                    'priority:support'
                );
                break;

            case Plan.PREMIUM:
                permissions.push(
                    'read:advanced:analytics',
                    'export:data',
                    'priority:support',
                    'white:label',
                    'custom:integrations'
                );
                break;

            case Plan.ENTERPRISE:
                permissions.push(
                    'read:advanced:analytics',
                    'export:data',
                    'priority:support',
                    'white:label',
                    'custom:integrations',
                    'bulk:operations',
                    'dedicated:support'
                );
                break;
        }

        return [...new Set(permissions)]; // Remove duplicates
    }

    /**
     * Check if user has permission (boolean result)
     */
    async hasPermission(
        user: User,
        permission: string,
        context?: PermissionContext
    ): Promise<boolean> {
        const result = await this.checkPermission(user, permission, context);
        return result.allowed;
    }

    /**
     * Require permission or throw exception
     */
    async requirePermission(
        user: User,
        permission: string,
        context?: PermissionContext
    ): Promise<void> {
        const result = await this.checkPermission(user, permission, context);

        if (!result.allowed) {
            throw new ForbiddenException(result.reason || 'Insufficient permissions');
        }
    }

    /**
     * Check multiple permissions (all must be satisfied)
     */
    async requireAllPermissions(
        user: User,
        permissions: string[],
        context?: PermissionContext
    ): Promise<void> {
        for (const permission of permissions) {
            await this.requirePermission(user, permission, context);
        }
    }

    /**
     * Check multiple permissions (at least one must be satisfied)
     */
    async requireAnyPermission(
        user: User,
        permissions: string[],
        context?: PermissionContext
    ): Promise<void> {
        const results = await Promise.all(
            permissions.map(permission =>
                this.checkPermission(user, permission, context)
            )
        );

        const hasAnyPermission = results.some(result => result.allowed);

        if (!hasAnyPermission) {
            throw new ForbiddenException(
                `Insufficient permissions. Required one of: ${permissions.join(', ')}`
            );
        }
    }

    /**
     * Check resource ownership
     */
    async checkResourceOwnership(
        user: User,
        resourceUserId: string,
        context?: PermissionContext
    ): Promise<PermissionCheckResult> {
        // Admin can access any resource
        if (user.userType === UserType.ADMIN) {
            return { allowed: true };
        }

        // User can only access their own resources
        if (user.id === resourceUserId) {
            return { allowed: true };
        }

        await this.auditService.logPermissionCheck(
            user.id,
            'resource:ownership',
            false,
            { ...context, resourceId: resourceUserId }
        );

        return {
            allowed: false,
            reason: 'You can only access your own resources'
        };
    }

    /**
     * Get permission hierarchy for a base permission
     */
    getPermissionHierarchy(basePermission: string): string[] {
        const parts = basePermission.split(':');
        const hierarchy: string[] = [];

        for (let i = 1; i <= parts.length; i++) {
            hierarchy.push(parts.slice(0, i).join(':'));
        }

        return hierarchy;
    }

    /**
     * Check if permission is hierarchical match
     */
    isHierarchicalMatch(userPermission: string, requiredPermission: string): boolean {
        if (userPermission.endsWith(':*')) {
            const basePermission = userPermission.slice(0, -2);
            return requiredPermission.startsWith(basePermission + ':');
        }
        return false;
    }
}