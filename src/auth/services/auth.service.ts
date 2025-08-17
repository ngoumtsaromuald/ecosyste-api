import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { PasswordService } from './password.service';
import { EmailService } from './email.service';
import { AuditService } from './audit.service';
import { RegisterDto } from '../dto/register.dto';
import { UserResponseDto } from '../dto/auth-response.dto';
import { User } from '@prisma/client';
import { PasswordResetRepository } from '../repositories/password-reset.repository';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
    private readonly passwordResetRepository: PasswordResetRepository,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(registerDto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(registerDto.password);

    // Create user
    const user = await this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
      userType: registerDto.userType,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, user.name);

    // Log registration
    await this.auditService.logUserRegistration(user.id, user.email);

    return user;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.auditService.logFailedLogin(email, 'User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.auditService.logFailedLogin(email, 'Account locked');
      throw new UnauthorizedException(`Account is locked until ${user.lockedUntil.toISOString()}`);
    }

    // Validate password
    if (!user.passwordHash) {
      await this.auditService.logFailedLogin(email, 'No password set (OAuth user)');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.validatePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment login attempts
      const loginAttempts = (user.loginAttempts || 0) + 1;
      const updateData: any = { loginAttempts };

      // Lock account after 5 failed attempts
      if (loginAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        updateData.loginAttempts = 0; // Reset attempts after locking
      }

      await this.userRepository.update(user.id, updateData);
      await this.auditService.logFailedLogin(email, `Invalid password (attempt ${loginAttempts})`);
      
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0 || user.lockedUntil) {
      await this.userRepository.update(user.id, {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      });
    } else {
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });
    }

    await this.auditService.logSuccessfulLogin(user.id, user.email);
    return user;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return;
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await this.passwordResetRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    // Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, user.name, token);

    // Log password reset request
    await this.auditService.logPasswordResetRequest(user.id, user.email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find valid reset token
    const resetRecord = await this.passwordResetRepository.findByToken(token);
    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate new password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    // Hash new password
    const passwordHash = await this.passwordService.hashPassword(newPassword);

    // Update user password and reset login attempts/locks
    await this.userRepository.update(resetRecord.userId, {
      passwordHash,
      loginAttempts: 0,
      lockedUntil: null,
    });

    // Mark reset token as used
    await this.passwordResetRepository.markAsUsed(resetRecord.id);

    // Log password reset
    await this.auditService.logPasswordReset(resetRecord.userId);

    // Send confirmation email
    const user = await this.userRepository.findById(resetRecord.userId);
    if (user) {
      await this.emailService.sendPasswordResetConfirmation(user.email, user.name);
    }
  }

  toUserResponseDto(user: User): UserResponseDto {
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
}