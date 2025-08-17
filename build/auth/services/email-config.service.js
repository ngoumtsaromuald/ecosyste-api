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
var EmailConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let EmailConfigService = EmailConfigService_1 = class EmailConfigService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EmailConfigService_1.name);
    }
    validateEmailConfiguration() {
        const requiredConfigs = [
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_USER',
            'SMTP_PASS',
            'EMAIL_FROM',
        ];
        const missingConfigs = requiredConfigs.filter(config => !this.configService.get(config));
        if (missingConfigs.length > 0) {
            this.logger.error(`Missing email configuration: ${missingConfigs.join(', ')}`);
            return false;
        }
        this.logger.log('Email configuration validation passed');
        return true;
    }
    getEmailConfiguration() {
        return {
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT', 587),
            secure: this.configService.get('SMTP_SECURE', false),
            user: this.configService.get('SMTP_USER'),
            from: this.configService.get('EMAIL_FROM'),
            frontendUrl: this.configService.get('FRONTEND_URL', 'http://localhost:3000'),
        };
    }
};
exports.EmailConfigService = EmailConfigService;
exports.EmailConfigService = EmailConfigService = EmailConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailConfigService);
//# sourceMappingURL=email-config.service.js.map