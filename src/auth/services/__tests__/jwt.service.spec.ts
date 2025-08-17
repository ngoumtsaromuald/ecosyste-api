import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JWTService, JWTPayload, TokenPair, User } from '../jwt.service';
import { SessionService } from '../session.service';
import { AuditService } from '../audit.service';
import { UserRepository } from '../../../repositories/user.repository';
import { UserType, Plan } from '@prisma/client';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  TokenExpiredError: class TokenExpiredError extends Error {
    constructor(message: string, expiredAt: Date) {
      super(message);
      this.name = 'TokenExpiredError';
    }
  },
}));

const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('JWTService', () => {
  let service: JWTService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let sessionService: SessionService;
  let auditService: AuditService;
  let userRepository: UserRepository;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    userType: UserType.INDIVIDUAL,
    plan: Plan.FREE,
  };

  const mockJWTPayload: JWTPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    userType: UserType.INDIVIDUAL,
    plan: Plan.FREE,
    permissions: ['read:profile', 'update:profile'],
    iat: Math.floor(Date.now() / 1000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JWTService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_ACCESS_EXPIRES: '15m',
                JWT_REFRESH_EXPIRES: '7d',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: SessionService,
          useValue: {
            isTokenBlacklisted: jest.fn(),
            validateRefreshToken: jest.fn(),
            updateSession: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logTokenGeneration: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JWTService>(JWTService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    sessionService = module.get<SessionService>(SessionService);
    auditService = module.get<AuditService>(AuditService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens successfully', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      (jwtService.sign as jest.Mock).mockReturnValue(mockAccessToken);
      (mockJwt.sign as jest.Mock).mockReturnValue(mockRefreshToken);
      (auditService.logTokenGeneration as jest.Mock).mockResolvedValue(undefined);

      const result = await service.generateTokens(mockUser);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresIn: 900, // 15 minutes in seconds
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          userType: mockUser.userType,
          plan: mockUser.plan,
          permissions: ['read:profile', 'update:profile'],
        }),
        { expiresIn: '15m' }
      );

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, type: 'refresh' },
        'test-refresh-secret',
        { expiresIn: '7d' }
      );

      expect(auditService.logTokenGeneration).toHaveBeenCalledWith(
        mockUser.id,
        'access_token'
      );
    });

    it('should include business permissions for business users', async () => {
      const businessUser: User = {
        ...mockUser,
        userType: UserType.BUSINESS,
      };

      (jwtService.sign as jest.Mock).mockReturnValue('token');
      (mockJwt.sign as jest.Mock).mockReturnValue('refresh-token');
      (auditService.logTokenGeneration as jest.Mock).mockResolvedValue(undefined);

      await service.generateTokens(businessUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: expect.arrayContaining([
            'read:profile',
            'update:profile',
            'read:business',
            'update:business',
          ]),
        }),
        { expiresIn: '15m' }
      );
    });

    it('should include admin permissions for admin users', async () => {
      const adminUser: User = {
        ...mockUser,
        userType: UserType.ADMIN,
      };

      (jwtService.sign as jest.Mock).mockReturnValue('token');
      (mockJwt.sign as jest.Mock).mockReturnValue('refresh-token');
      (auditService.logTokenGeneration as jest.Mock).mockResolvedValue(undefined);

      await service.generateTokens(adminUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: expect.arrayContaining([
            'read:profile',
            'update:profile',
            'admin:*',
          ]),
        }),
        { expiresIn: '15m' }
      );
    });
  });

  describe('validateToken', () => {
    const mockToken = 'valid-token';

    it('should validate token successfully', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue(mockJWTPayload);
      (sessionService.isTokenBlacklisted as jest.Mock).mockResolvedValue(false);

      const result = await service.validateToken(mockToken);

      expect(result).toEqual(mockJWTPayload);
      expect(jwtService.verify).toHaveBeenCalledWith(mockToken);
      expect(sessionService.isTokenBlacklisted).toHaveBeenCalledWith(mockToken);
    });

    it('should throw UnauthorizedException for blacklisted token', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue(mockJWTPayload);
      (sessionService.isTokenBlacklisted as jest.Mock).mockResolvedValue(true);

      await expect(service.validateToken(mockToken)).rejects.toThrow(
        'Token has been revoked'
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const expiredError = new jwt.TokenExpiredError('Token expired', new Date());
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      await expect(service.validateToken(mockToken)).rejects.toThrow(
        'Token has expired'
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(mockToken)).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('refreshTokens', () => {
    const mockRefreshToken = 'valid-refresh-token';
    const mockSessionForRefresh = {
      id: 'session-123',
      userId: 'user-123',
      refreshToken: mockRefreshToken,
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    it('should refresh tokens successfully', async () => {
      const refreshPayload = { sub: 'user-123', type: 'refresh' };
      const newTokens: TokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(refreshPayload);
      (sessionService.validateRefreshToken as jest.Mock).mockResolvedValue(mockSessionForRefresh);
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue(newTokens.accessToken);
      (mockJwt.sign as jest.Mock).mockReturnValue(newTokens.refreshToken);
      (auditService.logTokenGeneration as jest.Mock).mockResolvedValue(undefined);
      (sessionService.updateSession as jest.Mock).mockResolvedValue(undefined);

      const result = await service.refreshTokens(mockRefreshToken);

      expect(result).toEqual(newTokens);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        mockRefreshToken,
        'test-refresh-secret'
      );
      expect(sessionService.validateRefreshToken).toHaveBeenCalledWith(
        'user-123',
        mockRefreshToken
      );
      expect(userRepository.findById).toHaveBeenCalledWith('user-123');
      expect(sessionService.updateSession).toHaveBeenCalledWith(
        mockSessionForRefresh.id,
        newTokens.refreshToken
      );
    });

    it('should throw UnauthorizedException for invalid refresh token type', async () => {
      const invalidPayload = { sub: 'user-123', type: 'access' };
      (mockJwt.verify as jest.Mock).mockReturnValue(invalidPayload);

      await expect(service.refreshTokens(mockRefreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const expiredError = new jwt.TokenExpiredError('Token expired', new Date());
      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      await expect(service.refreshTokens(mockRefreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw UnauthorizedException when session not found', async () => {
      const refreshPayload = { sub: 'user-123', type: 'refresh' };
      (mockJwt.verify as jest.Mock).mockReturnValue(refreshPayload);
      (sessionService.validateRefreshToken as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshTokens(mockRefreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const refreshPayload = { sub: 'user-123', type: 'refresh' };
      (mockJwt.verify as jest.Mock).mockReturnValue(refreshPayload);
      (sessionService.validateRefreshToken as jest.Mock).mockResolvedValue(mockSessionForRefresh);
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshTokens(mockRefreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('getTokenExpiration', () => {
    it('should parse seconds correctly', () => {
      (configService.get as jest.Mock).mockReturnValue('30s');
      const result = service['getTokenExpiration']('JWT_ACCESS_EXPIRES');
      expect(result).toBe(30);
    });

    it('should parse minutes correctly', () => {
      (configService.get as jest.Mock).mockReturnValue('15m');
      const result = service['getTokenExpiration']('JWT_ACCESS_EXPIRES');
      expect(result).toBe(900); // 15 * 60
    });

    it('should parse hours correctly', () => {
      (configService.get as jest.Mock).mockReturnValue('2h');
      const result = service['getTokenExpiration']('JWT_ACCESS_EXPIRES');
      expect(result).toBe(7200); // 2 * 3600
    });

    it('should parse days correctly', () => {
      (configService.get as jest.Mock).mockReturnValue('1d');
      const result = service['getTokenExpiration']('JWT_ACCESS_EXPIRES');
      expect(result).toBe(86400); // 1 * 86400
    });

    it('should return default value for invalid format', () => {
      (configService.get as jest.Mock).mockReturnValue('invalid');
      const result = service['getTokenExpiration']('JWT_ACCESS_EXPIRES');
      expect(result).toBe(900); // default 15 minutes
    });
  });

  describe('getUserPermissions', () => {
    it('should return base permissions for individual users', async () => {
      const permissions = await service['getUserPermissions'](mockUser);
      expect(permissions).toEqual(['read:profile', 'update:profile']);
    });

    it('should return business permissions for business users', async () => {
      const businessUser: User = { ...mockUser, userType: UserType.BUSINESS };
      const permissions = await service['getUserPermissions'](businessUser);
      expect(permissions).toEqual([
        'read:profile',
        'update:profile',
        'read:business',
        'update:business',
      ]);
    });

    it('should return admin permissions for admin users', async () => {
      const adminUser: User = { ...mockUser, userType: UserType.ADMIN };
      const permissions = await service['getUserPermissions'](adminUser);
      expect(permissions).toEqual([
        'read:profile',
        'update:profile',
        'admin:*',
      ]);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service['getUserById']('user-123');

      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service['getUserById']('user-123')).rejects.toThrow(
        new UnauthorizedException('User not found')
      );
    });
  });

  describe('error handling', () => {
    it('should handle audit service errors during token generation', async () => {
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');
      (mockJwt.sign as jest.Mock).mockReturnValue('refresh-token');
      (auditService.logTokenGeneration as jest.Mock).mockRejectedValue(
        new Error('Audit service error')
      );

      // Should still throw the audit error since it's not caught in the service
      await expect(service.generateTokens(mockUser)).rejects.toThrow('Audit service error');
    });

    it('should handle session service errors during token validation', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue(mockJWTPayload);
      (sessionService.isTokenBlacklisted as jest.Mock).mockRejectedValue(
        new Error('Redis connection error')
      );

      await expect(service.validateToken('token')).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete token lifecycle', async () => {
      // Generate tokens
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');
      (mockJwt.sign as jest.Mock).mockReturnValue('refresh-token');
      (auditService.logTokenGeneration as jest.Mock).mockResolvedValue(undefined);

      const tokens = await service.generateTokens(mockUser);

      // Validate access token
      (jwtService.verify as jest.Mock).mockReturnValue(mockJWTPayload);
      (sessionService.isTokenBlacklisted as jest.Mock).mockResolvedValue(false);

      const payload = await service.validateToken(tokens.accessToken);

      // Refresh tokens
      const refreshPayload = { sub: mockUser.id, type: 'refresh' };
      const mockSessionForIntegration = {
        id: 'session-123',
        userId: mockUser.id,
        refreshToken: tokens.refreshToken,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      (mockJwt.verify as jest.Mock).mockReturnValue(refreshPayload);
      (sessionService.validateRefreshToken as jest.Mock).mockResolvedValue(mockSessionForIntegration);
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (sessionService.updateSession as jest.Mock).mockResolvedValue(undefined);

      const newTokens = await service.refreshTokens(tokens.refreshToken);

      expect(tokens).toBeDefined();
      expect(payload).toEqual(mockJWTPayload);
      expect(newTokens).toBeDefined();
    });
  });
});