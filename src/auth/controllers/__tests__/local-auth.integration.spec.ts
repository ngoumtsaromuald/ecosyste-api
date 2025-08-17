import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { LocalAuthGuard } from '../../guards/local-auth.guard';
import { LocalStrategy } from '../../strategies/local.strategy';
import { AuthService } from '../../services/auth.service';
import { User, UserType, Plan, PricingTier } from '@prisma/client';

// Test controller to verify LocalAuthGuard integration
@Controller('test-local-auth')
class TestLocalAuthController {
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: any) {
    return { user: req.user, message: 'Login successful' };
  }
}

describe('LocalStrategy Integration', () => {
  let app: TestingModule;
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

    app = await Test.createTestingModule({
      controllers: [TestLocalAuthController],
      providers: [
        LocalStrategy,
        LocalAuthGuard,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authService = app.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should integrate LocalStrategy with LocalAuthGuard successfully', async () => {
    // Arrange
    authService.validateUser.mockResolvedValue(mockUser);

    const strategy = app.get<LocalStrategy>(LocalStrategy);

    // Act
    const result = await strategy.validate('test@example.com', 'password123');

    // Assert
    expect(result).toEqual(mockUser);
    expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should have LocalAuthGuard properly configured', () => {
    const guard = app.get<LocalAuthGuard>(LocalAuthGuard);
    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(LocalAuthGuard);
  });

  it('should delegate all authentication logic to AuthService', async () => {
    // Arrange
    authService.validateUser.mockResolvedValue(mockUser);
    const strategy = app.get<LocalStrategy>(LocalStrategy);

    // Act
    const result = await strategy.validate('test@example.com', 'password123');

    // Assert
    expect(result).toEqual(mockUser);
    expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(authService.validateUser).toHaveBeenCalledTimes(1);
  });
});