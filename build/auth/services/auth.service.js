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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const user_repository_1 = require("../../repositories/user.repository");
const password_service_1 = require("./password.service");
const email_service_1 = require("./email.service");
const audit_service_1 = require("./audit.service");
const password_reset_repository_1 = require("../repositories/password-reset.repository");
const crypto = require("crypto");
let AuthService = class AuthService {
    constructor(userRepository, passwordService, emailService, auditService, passwordResetRepository) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.emailService = emailService;
        this.auditService = auditService;
        this.passwordResetRepository = passwordResetRepository;
    }
    async register(registerDto) {
        const existingUser = await this.userRepository.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordValidation = this.passwordService.validatePasswordStrength(registerDto.password);
        if (!passwordValidation.isValid) {
            throw new common_1.BadRequestException({
                message: 'Password does not meet security requirements',
                errors: passwordValidation.errors,
            });
        }
        const passwordHash = await this.passwordService.hashPassword(registerDto.password);
        const user = await this.userRepository.create({
            email: registerDto.email,
            passwordHash,
            name: registerDto.name,
            userType: registerDto.userType,
        });
        await this.emailService.sendVerificationEmail(user.email, user.name);
        await this.auditService.logUserRegistration(user.id, user.email);
        return user;
    }
    async validateUser(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            await this.auditService.logFailedLogin(email, 'User not found');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            await this.auditService.logFailedLogin(email, 'Account locked');
            throw new common_1.UnauthorizedException(`Account is locked until ${user.lockedUntil.toISOString()}`);
        }
        if (!user.passwordHash) {
            await this.auditService.logFailedLogin(email, 'No password set (OAuth user)');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await this.passwordService.validatePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            const loginAttempts = (user.loginAttempts || 0) + 1;
            const updateData = { loginAttempts };
            if (loginAttempts >= 5) {
                updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
                updateData.loginAttempts = 0;
            }
            await this.userRepository.update(user.id, updateData);
            await this.auditService.logFailedLogin(email, `Invalid password (attempt ${loginAttempts})`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.loginAttempts > 0 || user.lockedUntil) {
            await this.userRepository.update(user.id, {
                loginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
            });
        }
        else {
            await this.userRepository.update(user.id, {
                lastLoginAt: new Date(),
            });
        }
        await this.auditService.logSuccessfulLogin(user.id, user.email);
        return user;
    }
    async requestPasswordReset(email) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            return;
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.passwordResetRepository.create({
            userId: user.id,
            token,
            expiresAt,
        });
        await this.emailService.sendPasswordResetEmail(user.email, user.name, token);
        await this.auditService.logPasswordResetRequest(user.id, user.email);
    }
    async resetPassword(token, newPassword) {
        const resetRecord = await this.passwordResetRepository.findByToken(token);
        if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            throw new common_1.BadRequestException({
                message: 'Password does not meet security requirements',
                errors: passwordValidation.errors,
            });
        }
        const passwordHash = await this.passwordService.hashPassword(newPassword);
        await this.userRepository.update(resetRecord.userId, {
            passwordHash,
            loginAttempts: 0,
            lockedUntil: null,
        });
        await this.passwordResetRepository.markAsUsed(resetRecord.id);
        await this.auditService.logPasswordReset(resetRecord.userId);
        const user = await this.userRepository.findById(resetRecord.userId);
        if (user) {
            await this.emailService.sendPasswordResetConfirmation(user.email, user.name);
        }
    }
    toUserResponseDto(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: user.userType,
            plan: user.plan,
            emailVerified: user.emailVerified || false,
            createdAt: user.createdAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.UserRepository,
        password_service_1.PasswordService,
        email_service_1.EmailService,
        audit_service_1.AuditService,
        password_reset_repository_1.PasswordResetRepository])
], AuthService);
//# sourceMappingURL=auth.service.js.map