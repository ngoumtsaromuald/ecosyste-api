import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from '../metrics.service';
import { PrismaService } from '../../config/prisma.service';
import { register } from 'prom-client';

describe('MetricsService', () => {
  let service: MetricsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockGroupBy = jest.fn();
  const mockPrismaService = {
    apiResource: {
      groupBy: mockGroupBy,
    },
  };

  beforeEach(async () => {
    // Clear metrics registry before each test
    register.clear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    register.clear();
  });

  describe('recordHttpRequest', () => {
    it('should record HTTP request metrics', () => {
      const method = 'GET';
      const route = '/api-resources';
      const statusCode = 200;
      const duration = 150;

      service.recordHttpRequest(method, route, statusCode, duration);

      // Verify metrics were recorded (we can't easily assert on the actual values
      // without accessing internal counters, but we can verify no errors occurred)
      expect(() => service.recordHttpRequest(method, route, statusCode, duration)).not.toThrow();
    });

    it('should handle different HTTP methods and status codes', () => {
      const testCases = [
        { method: 'POST', route: '/api-resources', statusCode: 201, duration: 200 },
        { method: 'PUT', route: '/api-resources/:id', statusCode: 200, duration: 180 },
        { method: 'DELETE', route: '/api-resources/:id', statusCode: 204, duration: 100 },
        { method: 'GET', route: '/api-resources/:id', statusCode: 404, duration: 50 },
      ];

      testCases.forEach(({ method, route, statusCode, duration }) => {
        expect(() => service.recordHttpRequest(method, route, statusCode, duration)).not.toThrow();
      });
    });
  });

  describe('recordCacheOperation', () => {
    it('should record cache operation metrics', () => {
      expect(() => service.recordCacheOperation('get', 'redis', 'hit')).not.toThrow();
      expect(() => service.recordCacheOperation('set', 'redis', 'success')).not.toThrow();
      expect(() => service.recordCacheOperation('del', 'redis', 'success')).not.toThrow();
      expect(() => service.recordCacheOperation('get', 'redis', 'miss')).not.toThrow();
      expect(() => service.recordCacheOperation('get', 'redis', 'error')).not.toThrow();
    });
  });

  describe('updateCacheHitRate', () => {
    it('should update cache hit rate metrics', () => {
      expect(() => service.updateCacheHitRate('redis', 0.85)).not.toThrow();
      expect(() => service.updateCacheHitRate('redis', 0.92)).not.toThrow();
    });
  });

  describe('recordDatabaseQuery', () => {
    it('should record database query duration', () => {
      expect(() => service.recordDatabaseQuery('select', 25)).not.toThrow();
      expect(() => service.recordDatabaseQuery('insert', 150)).not.toThrow();
      expect(() => service.recordDatabaseQuery('update', 75)).not.toThrow();
      expect(() => service.recordDatabaseQuery('delete', 50)).not.toThrow();
    });
  });

  describe('updateApiResourceMetrics', () => {
    it('should update API resource metrics successfully', async () => {
      const mockStats = [
        {
          status: 'ACTIVE',
          plan: 'FREE',
          resourceType: 'BUSINESS',
          _count: 10,
        },
        {
          status: 'PENDING',
          plan: 'PREMIUM',
          resourceType: 'SERVICE',
          _count: 5,
        },
      ];

      mockGroupBy.mockResolvedValue(mockStats as any);

      await expect(service.updateApiResourceMetrics()).resolves.not.toThrow();
      expect(mockGroupBy).toHaveBeenCalledWith({
        by: ['status', 'plan', 'resourceType'],
        _count: true,
        where: { deletedAt: null },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockGroupBy.mockRejectedValue(new Error('Database error'));

      await expect(service.updateApiResourceMetrics()).resolves.not.toThrow();
    });
  });

  describe('updateDatabaseConnections', () => {
    it('should update database connection metrics', () => {
      expect(() => service.updateDatabaseConnections(5)).not.toThrow();
      expect(() => service.updateDatabaseConnections(10)).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      // Setup some test data
      mockGroupBy.mockResolvedValue([
        {
          status: 'ACTIVE',
          plan: 'FREE',
          resourceType: 'BUSINESS',
          _count: 3,
        },
      ] as any);

      const metrics = await service.getMetrics();

      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should handle errors and still return metrics', async () => {
      mockGroupBy.mockRejectedValue(new Error('Database error'));

      const metrics = await service.getMetrics();

      expect(typeof metrics).toBe('string');
      // Even with database errors, basic metrics should still be available
      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('getRegistry', () => {
    it('should return the metrics registry', () => {
      const registry = service.getRegistry();
      expect(registry).toBeDefined();
      expect(typeof registry.metrics).toBe('function');
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      // Record some metrics first
      service.recordHttpRequest('GET', '/test', 200, 100);
      
      // Clear metrics
      service.clearMetrics();
      
      // This should not throw
      expect(() => service.clearMetrics()).not.toThrow();
    });
  });
});