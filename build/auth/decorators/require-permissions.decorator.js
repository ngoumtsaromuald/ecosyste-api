"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllowApiKey = exports.RequirePlan = exports.RequireBusiness = exports.RequireAdmin = exports.RequireOwnership = exports.RequireAllPermissions = exports.RequireAnyPermission = exports.RequirePermissions = exports.PermissionLogic = exports.PERMISSION_LOGIC_KEY = exports.PERMISSIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PERMISSIONS_KEY = 'permissions';
exports.PERMISSION_LOGIC_KEY = 'permission_logic';
var PermissionLogic;
(function (PermissionLogic) {
    PermissionLogic["AND"] = "AND";
    PermissionLogic["OR"] = "OR";
})(PermissionLogic || (exports.PermissionLogic = PermissionLogic = {}));
const RequirePermissions = (permissions, logic = PermissionLogic.AND) => {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
    return (target, propertyKey, descriptor) => {
        (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, permissionArray)(target, propertyKey, descriptor);
        (0, common_1.SetMetadata)(exports.PERMISSION_LOGIC_KEY, logic)(target, propertyKey, descriptor);
    };
};
exports.RequirePermissions = RequirePermissions;
const RequireAnyPermission = (...permissions) => (0, exports.RequirePermissions)(permissions, PermissionLogic.OR);
exports.RequireAnyPermission = RequireAnyPermission;
const RequireAllPermissions = (...permissions) => (0, exports.RequirePermissions)(permissions, PermissionLogic.AND);
exports.RequireAllPermissions = RequireAllPermissions;
const RequireOwnership = (ownershipField = 'userId') => (0, common_1.SetMetadata)('ownership_field', ownershipField);
exports.RequireOwnership = RequireOwnership;
const RequireAdmin = () => (0, exports.RequirePermissions)('admin:*');
exports.RequireAdmin = RequireAdmin;
const RequireBusiness = () => (0, exports.RequirePermissions)(['read:business:dashboard']);
exports.RequireBusiness = RequireBusiness;
const RequirePlan = (plan) => {
    const planPermissions = {
        PRO: 'read:advanced:analytics',
        PREMIUM: 'white:label',
        ENTERPRISE: 'bulk:operations',
    };
    return (0, exports.RequirePermissions)(planPermissions[plan]);
};
exports.RequirePlan = RequirePlan;
const AllowApiKey = () => (0, common_1.SetMetadata)('allow_api_key', true);
exports.AllowApiKey = AllowApiKey;
//# sourceMappingURL=require-permissions.decorator.js.map