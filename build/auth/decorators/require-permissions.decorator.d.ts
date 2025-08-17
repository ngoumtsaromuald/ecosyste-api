export declare const PERMISSIONS_KEY = "permissions";
export declare const PERMISSION_LOGIC_KEY = "permission_logic";
export declare enum PermissionLogic {
    AND = "AND",
    OR = "OR"
}
export interface PermissionOptions {
    permissions: string[];
    logic?: PermissionLogic;
    checkOwnership?: boolean;
    ownershipField?: string;
}
export declare const RequirePermissions: (permissions: string | string[], logic?: PermissionLogic) => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare const RequireAnyPermission: (...permissions: string[]) => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare const RequireAllPermissions: (...permissions: string[]) => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare const RequireOwnership: (ownershipField?: string) => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireAdmin: () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare const RequireBusiness: () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare const RequirePlan: (plan: "PRO" | "PREMIUM" | "ENTERPRISE") => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare const AllowApiKey: () => import("@nestjs/common").CustomDecorator<string>;
