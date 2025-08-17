import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from '../local.strategy';
import { AuthService } from '../../services/auth.service';
import { User, UserType, Plan, PricingTier } from '@prisma/client';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    userType: UserType.INDIVIDUAL,
    plan: Plan.FREE,
    apiQuota: 1000,
    apiUsage: 0,
    pricingTier: PricingTier.STANDARD,
    passwordHash: 'hashed-password',
    emailVerified: true,
    emailVerifiedAt: new Date(),
    lastLoginAt: new Date(),
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate user credentials and return user object', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      authService.validateUser.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(email, password);

      // Assert
      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when AuthService.validateUser fails', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const authError = new UnauthorizedException('Invalid credentials');
      authService.validateUser.mockRejectedValue(authError);

      // Act & Assert
      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException
      );
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';
      const authError = new UnauthorizedException('Invalid credentials');
      authService.validateUser.mockRejectedValue(authError);

      // Act & Assert
      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException
      );
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when account is locked', async () => {
      // Arrange
      const email = 'locked@example.com';
      const password = 'password123';
      const authError = new UnauthorizedException('Account is locked until 2024-01-01T12:00:00.000Z');
      authService.validateUser.mockRejectedValue(authError);

      // Act & Assert
      await expect(strategy.validate(email, password)).rejects.toThrow(
        'Account is locked until 2024-01-01T12:00:00.000Z'
      );
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should re-throw original error from AuthService', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const customError = new UnauthorizedException('Custom auth error message');
      authService.validateUser.mockRejectedValue(customError);

      // Act & Assert
      await expect(strategy.validate(email, password)).rejects.toThrow(
        'Custom auth error message'
      );
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should delegate all validation logic to AuthService', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      authService.validateUser.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(email, password);

      // Assert
      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
      expect(authService.validateUser).toHaveBeenCalledTimes(1);
    });

    it('should handle different types of authentication errors', async () => {
      // Test different error scenarios that AuthService might throw
      const testCases = [
        {
          error: new UnauthorizedException('Invalid credentials'),
          expectedMessage: 'Invalid credentials',
        },
        {
          error: new UnauthorizedException('Account is locked until 2024-12-31T23:59:59.000Z'),
          expectedMessage: 'Account is locked until 2024-12-31T23:59:59.000Z',
        },
      ];

      for (const testCase of testCases) {
        // Arrange
        authService.validateUser.mockRejectedValue(testCase.error);

        // Act & Assert
        await expect(strategy.validate('test@example.com', 'password')).rejects.toThrow(
          testCase.expectedMessage
        );
        
        // Reset mock for next iteration
        authService.validateUser.mockReset();
      }
    });
  });
});