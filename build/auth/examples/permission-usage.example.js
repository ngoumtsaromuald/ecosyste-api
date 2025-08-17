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
exports.PermissionExampleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
const auth_permission_guard_1 = require("../guards/auth-permission.guard");
let PermissionExampleController = class PermissionExampleController {
    async getProfile() {
        return { message: 'Profile data accessible with read:profile permission' };
    }
    async updateProfile(updateData) {
        return { message: 'Profile updated - required both read:profile AND update:profile' };
    }
    async getDashboard() {
        return { message: 'Dashboard accessible with business dashboard OR admin permission' };
    }
    async listAllUsers() {
        return { message: 'Admin-only endpoint - requires admin:* permission' };
    }
    async getBusinessAnalytics() {
        return { message: 'Business analytics - requires business dashboard permission' };
    }
    async getPremiumFeatures() {
        return { message: 'Premium features - requires premium plan permissions' };
    }
    async getResource(id) {
        return { message: `Resource ${id} - ownership verified` };
    }
    async getPublicData() {
        return { message: 'Public data accessible with JWT or API key' };
    }
    async receiveWebhook(webhookData) {
        return { message: 'Webhook received - API key authentication only' };
    }
    async deleteResource(id) {
        return { message: `Resource ${id} deleted - admin permission and ownership verified` };
    }
    async bulkImport(importData) {
        return {
            message: 'Bulk import completed - enterprise plan with bulk operations permission'
        };
    }
    async getPublicInfo() {
        return { message: 'Public information - no authentication required' };
    }
};
exports.PermissionExampleController = PermissionExampleController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(auth_permission_guard_1.JwtPermissionGuard),
    (0, require_permissions_decorator_1.RequirePermissions)('read:profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile - requires read:profile permission' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, common_1.UseGuards)(auth_permission_guard_1.JwtPermissionGuard),
    (0, require_permissions_decorator_1.RequireAllPermissions)('read:profile', 'update:profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update profile - requires both read and update permissions' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(auth_permission_guard_1.JwtPermissionGuard),
    (0, require_permissions_decorator_1.RequireAnyPermission)('read:business:dashboard', 'admin:*'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Access dashboard - requires business dashboard OR admin permission' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('admin/users'),
    (0, common_1.UseGuards)(auth_permission_guard_1.JwtPermissionGuard),
    (0, require_permissions_decorator_1.RequireAdmin)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all users - admin only' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "listAllUsers", null);
__decorate([
    (0, common_1.Get)('business/analytics'),
    (0, common_1.UseGuards)(auth_permission_guard_1.JwtPermissionGuard),
    (0, require_permissions_decorator_1.RequireBusiness)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Business analytics - business users only' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "getBusinessAnalytics", null);
__decorate([
    (0, common_1.Get)('premium/features'),
    (0, common_1.UseGuards)(auth_permission_guard_1.JwtPermissionGuard),
    (0, require_permissions_decorator_1.RequirePlan)('PREMIUM'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Premium features - requires premium plan' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "getPremiumFeatures", null);
__decorate([
    (0, common_1.Get)('resources/:id'),
    (0, common_1.UseGuards)(auth_permission_guard_1.JwtPermissionGuard),
    (0, require_permissions_decorator_1.RequirePermissions)('read:own:resources'),
    (0, require_permissions_decorator_1.RequireOwnership)('userId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get resource - requires ownership check' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "getResource", null);
__decorate([
    (0, common_1.Get)('public/data'),
    (0, common_1.UseGuards)(auth_permission_guard_1.AuthPermissionGuard),
    (0, require_permissions_decorator_1.AllowApiKey)(),
    (0, require_permissions_decorator_1.RequirePermissions)('read:public:data'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Public data - allows both JWT and API key auth' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "getPublicData", null);
__decorate([
    (0, common_1.Post)('api/webhook'),
    (0, common_1.UseGuards)(auth_permission_guard_1.ApiKeyPermissionGuard),
    (0, require_permissions_decorator_1.RequirePermissions)('webhook:receive'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook endpoint - API key only' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "receiveWebhook", null);
__decorate([
    (0, common_1.Delete)('admin/resources/:id'),
    (0, common_1.UseGuards)(auth_permission_guard_1.JwtPermissionGuard),
    (0, require_permissions_decorator_1.RequireAnyPermission)('admin:*', 'admin:resources:delete'),
    (0, require_permissions_decorator_1.RequireOwnership)('userId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete resource - requires admin permission AND ownership check'
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "deleteResource", null);
__decorate([
    (0, common_1.Post)('bulk/import'),
    (0, common_1.UseGuards)(auth_permission_guard_1.JwtPermissionGuard),
    (0, require_permissions_decorator_1.RequireAllPermissions)('bulk:operations', 'import:data'),
    (0, require_permissions_decorator_1.RequirePlan)('ENTERPRISE'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk import - enterprise plan with bulk operations permission' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Get)('public/info'),
    (0, swagger_1.ApiOperation)({ summary: 'Public information - no authentication required' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionExampleController.prototype, "getPublicInfo", null);
exports.PermissionExampleController = PermissionExampleController = __decorate([
    (0, common_1.Controller)('examples/permissions'),
    (0, swagger_1.ApiTags)('Permission Examples')
], PermissionExampleController);
//# sourceMappingURL=permission-usage.example.js.map