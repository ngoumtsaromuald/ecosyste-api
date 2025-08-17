import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from '../services/rate-limit.service';
import {
  RateLimitExceededException,
  UserRateLimitExceededException,
  ApiKeyRateLimitExceededException,
  IPRateLimitExceededException,
} from '../exceptions/rate-limit.exceptions';
import {
  RATE_LIMIT_KEY,
  USER_RATE_LIMIT_KEY,
  API_KEY_RATE_LIMIT_KEY,
  IP_RATE_LIMIT_KEY,
  SKIP_RATE_LIMIT_KEY,
} from '../decorators/rate-limit.decorators';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let rateLimitService: jest.Mocked<RateLimitService>;
  let reflector: jest.Mocked<Reflector>;

  let mockExecutionContext: ExecutionContext;

  const mockRequest = {
    user: { id: 'user-123', email: 'test@example.com', userType: 'individual' },
    headers: { 'x-forwarded-for': '192.168.1.1' },
    connection: { remoteAddress: '192.168.1.1' },
  };

  const mockResponse = {
    setHeader: jest.fn(),
  };

  const mockRateLimitResult = {
    allowed: true,
    remaining: 99,
    resetTime: new Date(Date.now() + 900000), // 15 minutes from now
    current: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        {
          provide: RateLimitService,
          useValue: {
            checkIPLimit: jest.fn(),
            checkLimit: jest.fn(),
            checkUserLimit: jest.fn(),
            checkApiKeyLimit: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    rateLimitService = module.get(RateLimitService);
    reflector = module.get(Reflector);

    // Create mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getNext: jest.fn().mockReturnValue({}),
      }),
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn().mockReturnValue({}),
      switchToRpc: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue({}),
        getData: jest.fn().mockReturnValue({}),
      }),
      switchToWs: jest.fn().mockReturnValue({
        getClient: jest.fn().mockReturnValue({}),
        getData: jest.fn().mockReturnValue({}),
      }),
      getType: jest.fn().mockReturnValue('http'),
    } as any;

    // Reset mocks
    jest.clearAllMocks();
    mockResponse.setHeader.mockClear();
  });

  describe('canActivate', () => {
    it('should return true when no rate limiting is configured', async () => {
      reflector.get.mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(rateLimitService.checkIPLimit).not.toHaveBeenCalled();
      expect(rateLimitService.checkLimit).not.toHaveBeenCalled();
      expect(rateLimitService.checkUserLimit).not.toHaveBeenCalled();
      expect(rateLimitService.checkApiKeyLimit).not.toHaveBeenCalled();
    });

    it('should return true when rate limiting is skipped', async () => {
      reflector.get.mockImplementation((key) => {
        if (key === SKIP_RATE_LIMIT_KEY) return true;
        return undefined;
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(rateLimitService.checkIPLimit).not.toHaveBeenCalled();
    });

    it('should apply IP rate limiting when configured', async () => {
      const ipRateLimitOptions = { limit: 10, windowMs: 60000 };
      reflector.get.mockImplementation((key) => {
        if (key === IP_RATE_LIMIT_KEY) return ipRateLimitOptions;
        return undefined;
      });
      rateLimitService.checkIPLimit.mockResolvedValue(mockRateLimitResult);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(rateLimitService.checkIPLimit).toHaveBeenCalledWith(
        '192.168.1.1',
        10,
        60000,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-IP-Limit', 'N/A');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-IP-Remaining', '99');
    });

    it('should throw IPRateLimitExceededException when IP limit is exceeded', async () => {
      const ipRateLimitOptions = { limit: 10, windowMs: 60000 };
      const exceededResult = { ...mockRateLimitResult, allowed: false, remaining: 0 };

      reflector.get.mockImplementation((key) => {
        if (key === IP_RATE_LIMIT_KEY) return ipRateLimitOptions;
        return undefined;
      });
      rateLimitService.checkIPLimit.mockResolvedValue(exceededResult);

      await expect(guard.canActivate(mockExecutionContext))
        .rejects
        .toThrow(IPRateLimitExceededException);
    });

    it('should apply user rate limiting when configured and user is authenticated', async () => {
      const userRateLimitOptions = { limit: 100, windowMs: 900000 };
      reflector.get.mockImplementation((key) => {
        if (key === USER_RATE_LIMIT_KEY) return userRateLimitOptions;
        return undefined;
      });
      rateLimitService.checkUserLimit.mockResolvedValue(mockRateLimitResult);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(rateLimitService.checkUserLimit).toHaveBeenCalledWith(
        'user-123',
        100,
        900000,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-User-Remaining', '99');
    });

    it('should skip user rate limiting when no user is authenticated', async () => {
      const userRateLimitOptions = { limit: 100, windowMs: 900000 };
      const contextWithoutUser = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ ...mockRequest, user: undefined }),
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getNext: jest.fn().mockReturnValue({}),
        }),
      } as any;

      reflector.get.mockImplementation((key) => {
        if (key === USER_RATE_LIMIT_KEY) return userRateLimitOptions;
        return undefined;
      });

      const result = await guard.canActivate(contextWithoutUser);

      expect(result).toBe(true);
      expect(rateLimitService.checkUserLimit).not.toHaveBeenCalled();
    });

    it('should apply API key rate limiting when configured and API key is present', async () => {
      const apiKeyRateLimitOptions = { limit: 1000, windowMs: 3600000 };
      const apiKeyUser = {
        apiKey: { id: 'api-key-123', name: 'Test API Key' },
        user: { id: 'user-123' },
      };
      const contextWithApiKey = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ ...mockRequest, user: apiKeyUser }),
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getNext: jest.fn().mockReturnValue({}),
        }),
      } as any;

      reflector.get.mockImplementation((key) => {
        if (key === API_KEY_RATE_LIMIT_KEY) return apiKeyRateLimitOptions;
        return undefined;
      });
      rateLimitService.checkApiKeyLimit.mockResolvedValue(mockRateLimitResult);

      const result = await guard.canActivate(contextWithApiKey);

      expect(result).toBe(true);
      expect(rateLimitService.checkApiKeyLimit).toHaveBeenCalledWith(
        'api-key-123',
        1000,
      );
    });

    it('should apply general rate limiting with custom key generator', async () => {
      const rateLimitOptions = {
        limit: 50,
        windowMs: 300000,
        keyGenerator: (req: any) => `custom:${req.user?.id || req.connection?.remoteAddress}`,
      };

      reflector.get.mockImplementation((key) => {
        if (key === RATE_LIMIT_KEY) return rateLimitOptions;
        return undefined;
      });
      rateLimitService.checkLimit.mockResolvedValue(mockRateLimitResult);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(rateLimitService.checkLimit).toHaveBeenCalledWith(
        'general:custom:user-123',
        50,
        300000,
      );
    });

    it('should apply multiple rate limiting layers', async () => {
      const ipOptions = { limit: 10, windowMs: 60000 };
      const userOptions = { limit: 100, windowMs: 900000 };
      const generalOptions = { limit: 50, windowMs: 300000 };

      reflector.get.mockImplementation((key) => {
        if (key === IP_RATE_LIMIT_KEY) return ipOptions;
        if (key === USER_RATE_LIMIT_KEY) return userOptions;
        if (key === RATE_LIMIT_KEY) return generalOptions;
        return undefined;
      });

      rateLimitService.checkIPLimit.mockResolvedValue(mockRateLimitResult);
      rateLimitService.checkUserLimit.mockResolvedValue(mockRateLimitResult);
      rateLimitService.checkLimit.mockResolvedValue(mockRateLimitResult);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(rateLimitService.checkIPLimit).toHaveBeenCalled();
      expect(rateLimitService.checkUserLimit).toHaveBeenCalled();
      expect(rateLimitService.checkLimit).toHaveBeenCalled();
    });

    it('should throw the first rate limit exception encountered', async () => {
      const ipOptions = { limit: 10, windowMs: 60000 };
      const exceededResult = { ...mockRateLimitResult, allowed: false, remaining: 0 };

      reflector.get.mockImplementation((key) => {
        if (key === IP_RATE_LIMIT_KEY) return ipOptions;
        return undefined;
      });
      rateLimitService.checkIPLimit.mockResolvedValue(exceededResult);

      await expect(guard.canActivate(mockExecutionContext))
        .rejects
        .toThrow(IPRateLimitExceededException);

      // Should not proceed to other rate limit checks
      expect(rateLimitService.checkUserLimit).not.toHaveBeenCalled();
      expect(rateLimitService.checkLimit).not.toHaveBeenCalled();
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const requestWithForwardedFor = {
        ...mockRequest,
        headers: { 'x-forwarded-for': '203.0.113.1, 192.168.1.1' },
      };
      const context = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(requestWithForwardedFor),
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getNext: jest.fn().mockReturnValue({}),
        }),
      } as any;

      const ipOptions = { limit: 10, windowMs: 60000 };
      reflector.get.mockImplementation((key) => {
        if (key === IP_RATE_LIMIT_KEY) return ipOptions;
        return undefined;
      });
      rateLimitService.checkIPLimit.mockResolvedValue(mockRateLimitResult);

      await guard.canActivate(context);

      expect(rateLimitService.checkIPLimit).toHaveBeenCalledWith(
        '203.0.113.1', // First IP in the forwarded-for chain
        10,
        60000,
      );
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is not available', async () => {
      const requestWithRealIP = {
        ...mockRequest,
        headers: { 'x-real-ip': '203.0.113.2' },
      };
      const context = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(requestWithRealIP),
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getNext: jest.fn().mockReturnValue({}),
        }),
      } as any;

      const ipOptions = { limit: 10, windowMs: 60000 };
      reflector.get.mockImplementation((key) => {
        if (key === IP_RATE_LIMIT_KEY) return ipOptions;
        return undefined;
      });
      rateLimitService.checkIPLimit.mockResolvedValue(mockRateLimitResult);

      await guard.canActivate(context);

      expect(rateLimitService.checkIPLimit).toHaveBeenCalledWith(
        '203.0.113.2',
        10,
        60000,
      );
    });
  });
});