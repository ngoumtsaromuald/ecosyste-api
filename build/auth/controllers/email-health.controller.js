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
exports.EmailHealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const email_service_1 = require("../services/email.service");
const email_config_service_1 = require("../services/email-config.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const permission_guard_1 = require("../guards/permission.guard");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
let EmailHealthController = class EmailHealthController {
    constructor(emailService, emailConfigService) {
        this.emailService = emailService;
        this.emailConfigService = emailConfigService;
    }
    async checkEmailHealth() {
        const configValid = this.emailConfigService.validateEmailConfiguration();
        const connectionValid = await this.emailService.testEmailConfiguration();
        return {
            status: configValid && connectionValid ? 'healthy' : 'unhealthy',
            configuration: configValid ? 'valid' : 'invalid',
            connection: connectionValid ? 'connected' : 'failed',
            timestamp: new Date().toISOString(),
        };
    }
    async getEmailConfig() {
        const config = this.emailConfigService.getEmailConfiguration();
        return {
            host: config.host,
            port: config.port,
            secure: config.secure,
            from: config.from,
            frontendUrl: config.frontendUrl,
            user: config.user ? `${config.user.substring(0, 3)}***` : 'not configured',
        };
    }
};
exports.EmailHealthController = EmailHealthController;
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Check email service health' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email service status' }),
    (0, require_permissions_decorator_1.RequirePermissions)('admin:email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailHealthController.prototype, "checkEmailHealth", null);
__decorate([
    (0, common_1.Get)('config'),
    (0, swagger_1.ApiOperation)({ summary: 'Get email configuration (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email configuration details' }),
    (0, require_permissions_decorator_1.RequirePermissions)('admin:email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailHealthController.prototype, "getEmailConfig", null);
exports.EmailHealthController = EmailHealthController = __decorate([
    (0, common_1.Controller)('auth/email'),
    (0, swagger_1.ApiTags)('Email Health'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [email_service_1.EmailService,
        email_config_service_1.EmailConfigService])
], EmailHealthController);
//# sourceMappingURL=email-health.controller.js.map