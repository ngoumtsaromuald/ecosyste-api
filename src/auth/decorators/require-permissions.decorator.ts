import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSION_LOGIC_KEY = 'permission_logic';

export enum PermissionLogic {
  AND = 'AND', // All permissions required
  OR = 'OR',   // Any permission required
}

export interface PermissionOptions {
  permissions: string[];
  logic?: PermissionLogic;
  checkOwnership?: boolean;
  ownershipField?: string; // Field name to check for ownership (default: 'userId')
}

/**
 * Decorator to require specific permissions for accessing an endpoint
 * @param permissions - Array of required permissions
 * @param logic - Logic for multiple permissions (AND/OR)
 */
export const RequirePermissions = (
  permissions: string | string[],
  logic: PermissionLogic = PermissionLogic.AND
) => {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(PERMISSIONS_KEY, permissionArray)(target, propertyKey, descriptor);
    SetMetadata(PERMISSION_LOGIC_KEY, logic)(target, propertyKey, descriptor);
  };
};

/**
 * Decorator to require any of the specified permissions
 */
export const RequireAnyPermission = (...permissions: string[]) => 
  RequirePermissions(permissions, PermissionLogic.OR);

/**
 * Decorator to require all of the specified permissions
 */
export const RequireAllPermissions = (...permissions: string[]) => 
  RequirePermissions(permissions, PermissionLogic.AND);

/**
 * Decorator to require resource ownership check
 */
export const RequireOwnership = (ownershipField: string = 'userId') => 
  SetMetadata('ownership_field', ownershipField);

/**
 * Decorator to require admin permissions
 */
export const RequireAdmin = () => RequirePermissions('admin:*');

/**
 * Decorator to require business user permissions
 */
export const RequireBusiness = () => RequirePermissions(['read:business:dashboard']);

/**
 * Decorator to require specific plan permissions
 */
export const RequirePlan = (plan: 'PRO' | 'PREMIUM' | 'ENTERPRISE') => {
  const planPermissions = {
    PRO: 'read:advanced:analytics',
    PREMIUM: 'white:label',
    ENTERPRISE: 'bulk:operations',
  };
  
  return RequirePermissions(planPermissions[plan]);
};

/**
 * Decorator to allow API key authentication for this endpoint
 */
export const AllowApiKey = () => SetMetadata('allow_api_key', true);