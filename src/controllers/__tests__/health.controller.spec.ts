import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthController, HealthCheckResult, ServiceHealth } from '../health.controller';
import { PrismaService } from '../../config/prisma.service';
import { CacheService } from '../../config/cache.service';
import { CustomLoggerService } from '../../config/logger.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;
  let configService: jest.Mocked<ConfigService>;
  let loggerService: jest.Mocked<CustomLoggerService>;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  const mockCacheService = {
    getStats: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get(PrismaService);
    cacheService = module.get(CacheService);
    configService = module.get(ConfigService);
    loggerService = module.get(CustomLoggerService);

    // Setup default mock returns
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        'app.version': '1.0.0',
        'nodeEnv': 'test',
      };
      return config[key] || defaultValue;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return healthy status when all services are up', async () => {
      // Mock successful database check
      prismaService.$queryRaw.mockResolvedValueOnce([{ test: 1 }]);
      prismaService.$queryRaw.mockResolvedValueOnce([{ connections: 5 }]);
      prismaService.$queryRaw.mockResolvedValueOnce([{ size: '10 MB' }]);

      // Mock successful Redis check
      cacheService.getStats.mockResolvedValue({
        connected: true,
        keyCount: 100,
        memoryUsage: '2MB',
      });

      const result = await controller.check();

      expect(result.status).toBe('healthy');
      expect(result.services.database.status).toBe('up');
      expect(result.services.redis.status).toBe('up');
      expect(result.version).toBe('1.0.0');
      expect(result.environment).toBe('test');
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.memoryUsage).toBeDefined();
      expect(result.metrics.cpuUsage).toBeDefined();
    });

    it('should return degraded status when services are slow', async () => {
      // Mock slow database check (simulate delay)
      prismaService.$queryRaw
        .mockImplementationOnce(() => 
          new Promise(resolve => setTimeout(() => resolve([{ test: 1 }]), 1100)) as any
        )
        .mockResolvedValueOnce([{ connections: 5 }])
        .mockResolvedValueOnce([{ size: '10 MB' }]);

      // Mock slow Redis check
      cacheService.getStats.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          connected: true,
          keyCount: 100,
          memoryUsage: '2MB',
        }), 600))
      );

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.services.database.status).toBe('degraded');
      expect(result.services.redis.status).toBe('degraded');
    });

    it('should throw HttpException with 503 status when database is down', async () => {
      // Mock database failure
      prismaService.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      // Mock successful Redis check
      cacheService.getStats.mockResolvedValue({
        connected: true,
        keyCount: 100,
        memoryUsage: '2MB',
      });

      await expect(controller.check()).rejects.toThrow(HttpException);
      
      try {
        await controller.check();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        
        const response = error.getResponse() as HealthCheckResult;
        expect(response.status).toBe('unhealthy');
        expect(response.services.database.status).toBe('down');
        expect(response.services.database.error).toBe('Database connection failed');
      }
    });

    it('should throw HttpException when Redis is down', async () => {
      // Mock successful database check
      prismaService.$queryRaw.mockResolvedValueOnce([{ test: 1 }]);
      prismaService.$queryRaw.mockResolvedValueOnce([{ connections: 5 }]);
      prismaService.$queryRaw.mockResolvedValueOnce([{ size: '10 MB' }]);

      // Mock Redis failure
      cacheService.getStats.mockResolvedValue({
        connected: false,
        keyCount: 0,
        memoryUsage: 'unknown',
      });

      await expect(controller.check()).rejects.toThrow(HttpException);
      
      try {
        await controller.check();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        
        const response = error.getResponse() as HealthCheckResult;
        expect(response.status).toBe('unhealthy');
        expect(response.services.redis.status).toBe('down');
      }
    });

    it('should handle database stats failure gracefully', async () => {
      // Mock successful basic database check
      prismaService.$queryRaw.mockResolvedValueOnce([{ test: 1 }]);
      // Mock stats failure
      prismaService.$queryRaw.mockRejectedValueOnce(new Error('Stats query failed'));
      prismaService.$queryRaw.mockRejectedValueOnce(new Error('Stats query failed'));

      // Mock successful Redis check
      cacheService.getStats.mockResolvedValue({
        connected: true,
        keyCount: 100,
        memoryUsage: '2MB',
      });

      const result = await controller.check();

      expect(result.status).toBe('healthy');
      expect(result.services.database.status).toBe('up');
      expect(result.services.database.details.error).toBe('Stats unavailable');
    });

    it('should include response times in service health', async () => {
      // Mock successful checks
      prismaService.$queryRaw.mockResolvedValueOnce([{ test: 1 }]);
      prismaService.$queryRaw.mockResolvedValueOnce([{ connections: 5 }]);
      prismaService.$queryRaw.mockResolvedValueOnce([{ size: '10 MB' }]);

      cacheService.getStats.mockResolvedValue({
        connected: true,
        keyCount: 100,
        memoryUsage: '2MB',
      });

      const result = await controller.check();

      expect(result.services.database.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.services.redis.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('readiness', () => {
    it('should return ready status when quick checks pass', async () => {
      prismaService.$queryRaw.mockResolvedValue([{ test: 1 }]);
      cacheService.getStats.mockResolvedValue({
        connected: true,
        keyCount: 100,
        memoryUsage: '2MB',
      });

      const result = await controller.readiness();

      expect(result.status).toBe('ready');
      expect(result.timestamp).toBeDefined();
    });

    it('should throw HttpException when database quick check fails', async () => {
      prismaService.$queryRaw.mockRejectedValue(new Error('Database unavailable'));

      await expect(controller.readiness()).rejects.toThrow(HttpException);
      
      try {
        await controller.readiness();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      }
    });

    it('should throw HttpException when Redis quick check fails', async () => {
      prismaService.$queryRaw.mockResolvedValue([{ test: 1 }]);
      cacheService.getStats.mockResolvedValue({
        connected: false,
        keyCount: 0,
        memoryUsage: 'unknown',
      });

      await expect(controller.readiness()).rejects.toThrow(HttpException);
    });
  });

  describe('liveness', () => {
    it('should always return alive status', async () => {
      const result = await controller.liveness();

      expect(result.status).toBe('alive');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should return consistent uptime', async () => {
      const result1 = await controller.liveness();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result2 = await controller.liveness();

      expect(result2.uptime).toBeGreaterThan(result1.uptime);
    });
  });

  describe('private methods behavior', () => {
    it('should handle external service checks', async () => {
      // Mock all services as successful
      prismaService.$queryRaw.mockResolvedValueOnce([{ test: 1 }]);
      prismaService.$queryRaw.mockResolvedValueOnce([{ connections: 5 }]);
      prismaService.$queryRaw.mockResolvedValueOnce([{ size: '10 MB' }]);

      cacheService.getStats.mockResolvedValue({
        connected: true,
        keyCount: 100,
        memoryUsage: '2MB',
      });

      const result = await controller.check();

      // External services should be included but with placeholder implementation
      expect(result.services.external).toBeDefined();
      expect(result.services.external.status).toBe('up');
      expect(result.services.external.details.message).toBe('No external services configured');
    });
  });
});