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
exports.AuthEmailIntegration = exports.EmailUsageExample = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("../services/email.service");
let EmailUsageExample = class EmailUsageExample {
    constructor(emailService) {
        this.emailService = emailService;
    }
    async handleUserRegistration(email, name, verificationToken) {
        try {
            await this.emailService.sendVerificationEmail(email, name, verificationToken);
            console.log(`Verification email sent to ${email}`);
        }
        catch (error) {
            console.error('Failed to send verification email:', error);
        }
    }
    async handlePasswordResetRequest(email, name, resetToken) {
        try {
            await this.emailService.sendPasswordResetEmail(email, name, resetToken);
            console.log(`Password reset email sent to ${email}`);
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
        }
    }
    async handleSuspiciousLogin(email, loginDetails) {
        const loginData = {
            name: loginDetails.userName,
            loginTime: new Date().toLocaleString('fr-FR'),
            ipAddress: loginDetails.ipAddress,
            location: loginDetails.location || 'Unknown',
            device: loginDetails.device || 'Unknown',
            browser: loginDetails.userAgent || 'Unknown',
            securityUrl: 'https://romapi.com/security',
        };
        try {
            await this.emailService.sendLoginNotification(email, loginData);
            console.log(`Login notification sent to ${email}`);
        }
        catch (error) {
            console.error('Failed to send login notification:', error);
        }
    }
    async handleQuotaWarning(email, quotaInfo) {
        const quotaData = {
            name: quotaInfo.userName,
            usagePercentage: Math.round((quotaInfo.used / quotaInfo.total) * 100),
            usedRequests: quotaInfo.used,
            totalRequests: quotaInfo.total,
            remainingRequests: quotaInfo.total - quotaInfo.used,
            resetDate: quotaInfo.resetDate.toLocaleDateString('fr-FR'),
            isNearLimit: quotaInfo.used / quotaInfo.total >= 0.8,
            dashboardUrl: 'https://romapi.com/dashboard',
            upgradeUrl: 'https://romapi.com/pricing',
        };
        try {
            await this.emailService.sendQuotaWarning(email, quotaData);
            console.log(`Quota warning sent to ${email} (${quotaData.usagePercentage}% usage)`);
        }
        catch (error) {
            console.error('Failed to send quota warning:', error);
        }
    }
    async sendBatchEmails(emailList) {
        const results = [];
        for (const user of emailList) {
            try {
                await this.emailService.sendVerificationEmail(user.email, user.name, user.token);
                results.push({ email: user.email, status: 'sent' });
            }
            catch (error) {
                results.push({ email: user.email, status: 'failed', error: error.message });
            }
        }
        return results;
    }
    async safeEmailSend(email, name, token) {
        const isConfigValid = await this.emailService.testEmailConfiguration();
        if (!isConfigValid) {
            throw new Error('Email configuration is invalid');
        }
        await this.emailService.sendVerificationEmail(email, name, token);
    }
};
exports.EmailUsageExample = EmailUsageExample;
exports.EmailUsageExample = EmailUsageExample = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailUsageExample);
let AuthEmailIntegration = class AuthEmailIntegration {
    constructor(emailService) {
        this.emailService = emailService;
    }
    async onUserRegistered(user, verificationToken) {
        await this.emailService.sendVerificationEmail(user.email, user.name, verificationToken);
    }
    async onPasswordResetRequested(user, resetToken) {
        await this.emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    }
    async onSuspiciousLoginDetected(user, loginContext) {
        const loginData = {
            name: user.name,
            loginTime: new Date().toLocaleString('fr-FR'),
            ipAddress: loginContext.ip,
            location: loginContext.location,
            device: loginContext.device,
            browser: loginContext.userAgent,
            securityUrl: `${process.env.FRONTEND_URL}/security`,
        };
        await this.emailService.sendLoginNotification(user.email, loginData);
    }
    async onQuotaThresholdReached(user, usage) {
        const quotaData = {
            name: user.name,
            usagePercentage: usage.percentage,
            usedRequests: usage.used,
            totalRequests: usage.total,
            remainingRequests: usage.remaining,
            resetDate: usage.resetDate.toLocaleDateString('fr-FR'),
            isNearLimit: usage.percentage >= 80,
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
            upgradeUrl: `${process.env.FRONTEND_URL}/pricing`,
        };
        await this.emailService.sendQuotaWarning(user.email, quotaData);
    }
};
exports.AuthEmailIntegration = AuthEmailIntegration;
exports.AuthEmailIntegration = AuthEmailIntegration = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], AuthEmailIntegration);
//# sourceMappingURL=email-usage.example.js.map