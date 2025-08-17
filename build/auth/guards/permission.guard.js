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
exports.PermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permission_service_1 = require("../services/permission.service");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
let PermissionGuard = class PermissionGuard {
    constructor(reflector, permissionService) {
        this.reflector = reflector;
        this.permissionService = permissionService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (!request.user) {
            throw new common_1.UnauthorizedException('Authentication required');
        }
        const requiredPermissions = this.reflector.getAllAndOverride(require_permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const permissionLogic = this.reflector.getAllAndOverride(require_permissions_decorator_1.PERMISSION_LOGIC_KEY, [context.getHandler(), context.getClass()]) || require_permissions_decorator_1.PermissionLogic.AND;
        const ownershipField = this.reflector.getAllAndOverride('ownership_field', [context.getHandler(), context.getClass()]);
        const user = request.user;
        const permissionContext = {
            userId: user.id,
            action: request.method,
            resource: request.route?.path || request.url,
        };
        try {
            if (ownershipField) {
                await this.checkResourceOwnership(request, user, ownershipField);
            }
            if (permissionLogic === require_permissions_decorator_1.PermissionLogic.OR) {
                await this.permissionService.requireAnyPermission(user, requiredPermissions, permissionContext);
            }
            else {
                await this.permissionService.requireAllPermissions(user, requiredPermissions, permissionContext);
            }
            return true;
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
    }
    async checkResourceOwnership(request, user, ownershipField) {
        const resourceId = request.params?.id || request.params?.resourceId;
        if (!resourceId) {
            const resourceUserId = request.body?.[ownershipField];
            if (resourceUserId) {
                const ownershipResult = await this.permissionService.checkResourceOwnership(user, resourceUserId);
                if (!ownershipResult.allowed) {
                    throw new common_1.ForbiddenException(ownershipResult.reason);
                }
            }
            return;
        }
        const ownershipResult = await this.permissionService.checkResourceOwnership(user, resourceId);
        if (!ownershipResult.allowed) {
            throw new common_1.ForbiddenException(ownershipResult.reason);
        }
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        permission_service_1.PermissionService])
], PermissionGuard);
//# sourceMappingURL=permission.guard.js.map