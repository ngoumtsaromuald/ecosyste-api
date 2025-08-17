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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.templatesPath = path.join(process.cwd(), 'src', 'auth', 'templates');
        this.initializeTransporter();
    }
    initializeTransporter() {
        const smtpConfig = {
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT', 587),
            secure: this.configService.get('SMTP_SECURE', false),
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        };
        this.transporter = nodemailer.createTransport(smtpConfig);
        this.transporter.verify((error, success) => {
            if (error) {
                this.logger.error('SMTP configuration error:', error);
            }
            else {
                this.logger.log('SMTP server is ready to take our messages');
            }
        });
    }
    async loadTemplate(templateName, variables) {
        try {
            const htmlPath = path.join(this.templatesPath, `${templateName}.html`);
            const textPath = path.join(this.templatesPath, `${templateName}.txt`);
            let htmlContent = fs.readFileSync(htmlPath, 'utf8');
            let textContent = fs.readFileSync(textPath, 'utf8');
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                htmlContent = htmlContent.replace(regex, variables[key]);
                textContent = textContent.replace(regex, variables[key]);
            });
            htmlContent = this.processConditionals(htmlContent, variables);
            textContent = this.processConditionals(textContent, variables);
            return {
                subject: this.getSubjectForTemplate(templateName, variables),
                html: htmlContent,
                text: textContent,
            };
        }
        catch (error) {
            this.logger.error(`Error loading template ${templateName}:`, error);
            throw new Error(`Failed to load email template: ${templateName}`);
        }
    }
    processConditionals(content, variables) {
        const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
        return content.replace(ifRegex, (match, variable, block) => {
            return variables[variable] ? block : '';
        });
    }
    getSubjectForTemplate(templateName, variables) {
        const subjects = {
            'email-verification': 'Vérifiez votre adresse email - ROMAPI',
            'password-reset': 'Réinitialisation de votre mot de passe - ROMAPI',
            'login-notification': 'Nouvelle connexion détectée - ROMAPI',
            'quota-warning': `Avertissement de quota API (${variables.usagePercentage}%) - ROMAPI`,
        };
        return subjects[templateName] || 'Notification ROMAPI';
    }
    async sendEmail(to, template) {
        try {
            const mailOptions = {
                from: this.configService.get('EMAIL_FROM', 'noreply@romapi.com'),
                to,
                subject: template.subject,
                text: template.text,
                html: template.html,
            };
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent successfully to ${to}. Message ID: ${result.messageId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
    async sendVerificationEmail(email, name, verificationToken) {
        const baseUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken || 'placeholder-token'}`;
        const template = await this.loadTemplate('email-verification', {
            name,
            verificationUrl,
        });
        await this.sendEmail(email, template);
        this.logger.log(`Verification email sent to ${email}`);
    }
    async sendPasswordResetEmail(email, name, resetToken) {
        const baseUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
        const template = await this.loadTemplate('password-reset', {
            name,
            resetUrl,
        });
        await this.sendEmail(email, template);
        this.logger.log(`Password reset email sent to ${email}`);
    }
    async sendLoginNotification(email, data) {
        const template = await this.loadTemplate('login-notification', data);
        await this.sendEmail(email, template);
        this.logger.log(`Login notification sent to ${email}`);
    }
    async sendQuotaWarning(email, data) {
        const template = await this.loadTemplate('quota-warning', data);
        await this.sendEmail(email, template);
        this.logger.log(`Quota warning sent to ${email} (${data.usagePercentage}% usage)`);
    }
    async sendWelcomeEmail(email, name) {
        await this.sendVerificationEmail(email, name);
    }
    async sendEmailVerification(email, token) {
        const name = email.split('@')[0];
        await this.sendVerificationEmail(email, name, token);
    }
    async sendSecurityAlert(email, activity) {
        const name = email.split('@')[0];
        const now = new Date();
        await this.sendLoginNotification(email, {
            name,
            loginTime: now.toLocaleString('fr-FR'),
            ipAddress: 'Unknown',
            location: 'Unknown',
            device: 'Unknown',
            browser: 'Unknown',
            securityUrl: `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/security`,
        });
    }
    async sendPasswordResetConfirmation(email, name) {
        this.logger.log(`Password reset confirmation for ${email} (${name})`);
    }
    async testEmailConfiguration() {
        try {
            await this.transporter.verify();
            return true;
        }
        catch (error) {
            this.logger.error('Email configuration test failed:', error);
            return false;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map