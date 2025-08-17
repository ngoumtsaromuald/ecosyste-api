import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserRepository } from '../../../repositories/user.repository';
import { PasswordService } from '../password.service';
import { EmailService } from '../email.service';
import { AuditService } from '../audit.service';
import { PasswordResetRepository } from '../../repositories/password-reset.repository';
import { RegisterDto } from '../../dto/register.dto';
import { UserType, Plan, PricingTier } from '@prisma/client';
import * as crypto from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let emailService: jest.Mocked<EmailService>;
  let auditService: jest.Mocked<AuditService>;
  let passwordResetRepository: jest.Mocked<PasswordResetRepository>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    userType: UserType.INDIVIDUAL,
    plan: Plan.FREE,
    apiQuota: 1000,
    apiUsage: 0,
    pricingTier: PricingTier.STANDARD,
    passwordHash: 'hashed-password',
    emailVerified: false,
    emailVerifiedAt: null,
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockRegisterDto: RegisterDto = {
    email: 'test@example.com',
    password: 'SecurePass123!',
    name: 'Test User',
    userType: UserType.INDIVIDUAL,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
    };

    const mockPasswordService = {
      validatePasswordStrength: jest.fn(),
      hashPassword: jest.fn(),
      validatePassword: jest.fn(),
    };

    const mockEmailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendPasswordResetConfirmation: jest.fn(),
    };

    const mockAuditService = {
      logUserRegistration: jest.fn(),
      logFailedLogin: jest.fn(),
      logSuccessfulLogin: jest.fn(),
      logPasswordResetRequest: jest.fn(),
      logPasswordReset: jest.fn(),
    };

    const mockPasswordResetRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      markAsUsed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: PasswordResetRepository,
          useValue: mockPasswordResetRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    passwordService = module.get(PasswordService);
    emailService = module.get(EmailService);
    auditService = module.get(AuditService);
    passwordResetRepository = module.get(PasswordResetRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue('hashed-password');
      userRepository.create.mockResolvedValue(mockUser);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);
      auditService.logUserRegistration.mockResolvedValue(undefined);

      // Act
      const result = await service.register(mockRegisterDto);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(mockRegisterDto.email);
      expect(passwordService.validatePasswordStrength).toHaveBeenCalledWith(mockRegisterDto.password);
      expect(passwordService.hashPassword).toHaveBeenCalledWith(mockRegisterDto.password);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: mockRegisterDto.email,
        passwordHash: 'hashed-password',
        name: mockRegisterDto.name,
        userType: mockRegisterDto.userType,
      });
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(mockUser.email, mockUser.name);
      expect(auditService.logUserRegistration).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(mockRegisterDto.email);
      expect(passwordService.validatePasswordStrength).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password is weak', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must contain uppercase letter'],
      });

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(BadRequestException);
      expect(passwordService.validatePasswordStrength).toHaveBeenCalledWith(mockRegisterDto.password);
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should validate user successfully', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordService.validatePassword.mockResolvedValue(true);
      userRepository.update.mockResolvedValue(undefined);
      auditService.logSuccessfulLogin.mockResolvedValue(undefined);

      // Act
      const result = await service.validateUser('test@example.com', 'password');

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordService.validatePassword).toHaveBeenCalledWith('password', mockUser.passwordHash);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        lastLoginAt: expect.any(Date),
      });
      expect(auditService.logSuccessfulLogin).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      auditService.logFailedLogin.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(UnauthorizedException);
      expect(auditService.logFailedLogin).toHaveBeenCalledWith('test@example.com', 'User not found');
    });

    it('should throw UnauthorizedException if account is locked', async () => {
      // Arrange
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 10000), // 10 seconds in future
      };
      userRepository.findByEmail.mockResolvedValue(lockedUser);
      auditService.logFailedLogin.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(UnauthorizedException);
      expect(auditService.logFailedLogin).toHaveBeenCalledWith('test@example.com', 'Account locked');
    });

    it('should throw UnauthorizedException if no password hash (OAuth user)', async () => {
      // Arrange
      const oauthUser = {
        ...mockUser,
        passwordHash: null,
      };
      userRepository.findByEmail.mockResolvedValue(oauthUser);
      auditService.logFailedLogin.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(UnauthorizedException);
      expect(auditService.logFailedLogin).toHaveBeenCalledWith('test@example.com', 'No password set (OAuth user)');
    });

    it('should increment login attempts on invalid password', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordService.validatePassword.mockResolvedValue(false);
      userRepository.update.mockResolvedValue(undefined);
      auditService.logFailedLogin.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.validateUser('test@example.com', 'wrong-password')).rejects.toThrow(UnauthorizedException);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        loginAttempts: 1,
      });
      expect(auditService.logFailedLogin).toHaveBeenCalledWith('test@example.com', 'Invalid password (attempt 1)');
    });

    it('should lock account after 5 failed attempts', async () => {
      // Arrange
      const userWithAttempts = {
        ...mockUser,
        loginAttempts: 4,
      };
      userRepository.findByEmail.mockResolvedValue(userWithAttempts);
      passwordService.validatePassword.mockResolvedValue(false);
      userRepository.update.mockResolvedValue(undefined);
      auditService.logFailedLogin.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.validateUser('test@example.com', 'wrong-password')).rejects.toThrow(UnauthorizedException);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        loginAttempts: 0,
        lockedUntil: expect.any(Date),
      });
      expect(auditService.logFailedLogin).toHaveBeenCalledWith('test@example.com', 'Invalid password (attempt 5)');
    });

    it('should reset login attempts on successful login after previous failures', async () => {
      // Arrange
      const userWithAttempts = {
        ...mockUser,
        loginAttempts: 3,
        lockedUntil: new Date(Date.now() - 10000), // Past date
      };
      userRepository.findByEmail.mockResolvedValue(userWithAttempts);
      passwordService.validatePassword.mockResolvedValue(true);
      userRepository.update.mockResolvedValue(undefined);
      auditService.logSuccessfulLogin.mockResolvedValue(undefined);

      // Act
      await service.validateUser('test@example.com', 'password');

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: expect.any(Date),
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('should create password reset request successfully', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(crypto, 'randomBytes').mockImplementation(() => Buffer.from('random-token-bytes'));
      passwordResetRepository.create.mockResolvedValue(undefined);
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);
      auditService.logPasswordResetRequest.mockResolvedValue(undefined);

      // Act
      await service.requestPasswordReset('test@example.com');

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(passwordResetRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        token: '72616e646f6d2d746f6b656e2d6279746573', // hex representation of 'random-token-bytes'
        expiresAt: expect.any(Date),
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.name,
        '72616e646f6d2d746f6b656e2d6279746573'
      );
      expect(auditService.logPasswordResetRequest).toHaveBeenCalledWith(mockUser.id, mockUser.email);
    });

    it('should not reveal if email does not exist', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act
      await service.requestPasswordReset('nonexistent@example.com');

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(passwordResetRepository.create).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(auditService.logPasswordResetRequest).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const mockResetRecord = {
      id: 'reset-123',
      userId: 'user-123',
      token: 'reset-token',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour in future
      usedAt: null,
      createdAt: new Date('2024-01-01'),
    };

    it('should reset password successfully', async () => {
      // Arrange
      passwordResetRepository.findByToken.mockResolvedValue(mockResetRecord);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');
      userRepository.update.mockResolvedValue(undefined);
      passwordResetRepository.markAsUsed.mockResolvedValue(undefined);
      auditService.logPasswordReset.mockResolvedValue(undefined);
      userRepository.findById.mockResolvedValue(mockUser);
      emailService.sendPasswordResetConfirmation.mockResolvedValue(undefined);

      // Act
      await service.resetPassword('reset-token', 'NewSecurePass123!');

      // Assert
      expect(passwordResetRepository.findByToken).toHaveBeenCalledWith('reset-token');
      expect(passwordService.validatePasswordStrength).toHaveBeenCalledWith('NewSecurePass123!');
      expect(passwordService.hashPassword).toHaveBeenCalledWith('NewSecurePass123!');
      expect(userRepository.update).toHaveBeenCalledWith(mockResetRecord.userId, {
        passwordHash: 'new-hashed-password',
        loginAttempts: 0,
        lockedUntil: null,
      });
      expect(passwordResetRepository.markAsUsed).toHaveBeenCalledWith(mockResetRecord.id);
      expect(auditService.logPasswordReset).toHaveBeenCalledWith(mockResetRecord.userId);
      expect(emailService.sendPasswordResetConfirmation).toHaveBeenCalledWith(mockUser.email, mockUser.name);
    });

    it('should throw BadRequestException if token not found', async () => {
      // Arrange
      passwordResetRepository.findByToken.mockResolvedValue(null);

      // Act & Assert
      await expect(service.resetPassword('invalid-token', 'NewSecurePass123!')).rejects.toThrow(BadRequestException);
      expect(passwordService.validatePasswordStrength).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if token already used', async () => {
      // Arrange
      const usedResetRecord = {
        ...mockResetRecord,
        usedAt: new Date(),
      };
      passwordResetRepository.findByToken.mockResolvedValue(usedResetRecord);

      // Act & Assert
      await expect(service.resetPassword('used-token', 'NewSecurePass123!')).rejects.toThrow(BadRequestException);
      expect(passwordService.validatePasswordStrength).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if token expired', async () => {
      // Arrange
      const expiredResetRecord = {
        ...mockResetRecord,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour in past
      };
      passwordResetRepository.findByToken.mockResolvedValue(expiredResetRecord);

      // Act & Assert
      await expect(service.resetPassword('expired-token', 'NewSecurePass123!')).rejects.toThrow(BadRequestException);
      expect(passwordService.validatePasswordStrength).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if new password is weak', async () => {
      // Arrange
      passwordResetRepository.findByToken.mockResolvedValue(mockResetRecord);
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password too weak'],
      });

      // Act & Assert
      await expect(service.resetPassword('reset-token', 'weak')).rejects.toThrow(BadRequestException);
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
    });
  });

  describe('toUserResponseDto', () => {
    it('should convert user to response DTO correctly', () => {
      // Act
      const result = service.toUserResponseDto(mockUser);

      // Assert
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        userType: mockUser.userType,
        plan: mockUser.plan,
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
      });
    });

    it('should handle emailVerified as false when null', () => {
      // Arrange
      const userWithNullEmailVerified = {
        ...mockUser,
        emailVerified: null,
      };

      // Act
      const result = service.toUserResponseDto(userWithNullEmailVerified as any);

      // Assert
      expect(result.emailVerified).toBe(false);
    });
  });
});