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
export declare class PermissionService {
    private readonly auditService;
    constructor(auditService: AuditService);
    checkPermission(user: User, permission: string, context?: PermissionContext): Promise<PermissionCheckResult>;
    getUserPermissions(user: User): Promise<string[]>;
    hasPermission(user: User, permission: string, context?: PermissionContext): Promise<boolean>;
    requirePermission(user: User, permission: string, context?: PermissionContext): Promise<void>;
    requireAllPermissions(user: User, permissions: string[], context?: PermissionContext): Promise<void>;
    requireAnyPermission(user: User, permissions: string[], context?: PermissionContext): Promise<void>;
    checkResourceOwnership(user: User, resourceUserId: string, context?: PermissionContext): Promise<PermissionCheckResult>;
    getPermissionHierarchy(basePermission: string): string[];
    isHierarchicalMatch(userPermission: string, requiredPermission: string): boolean;
}
