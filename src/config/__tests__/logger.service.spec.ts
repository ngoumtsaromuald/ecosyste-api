import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService, LogContext, AuditLogData } from '../logger.service';
import * as winston from 'winston';

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

describe('CustomLoggerService', () => {
  let service: CustomLoggerService;
  let configService: jest.Mocked<ConfigService>;
  let mockWinstonLogger: jest.Mocked<winston.Logger>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Mock winston logger
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      defaultMeta: {},
    } as any;

    (winston.createLogger as jest.Mock).mockReturnValue(mockWinstonLogger);
    (winston.format.combine as jest.Mock).mockReturnValue({});
    (winston.format.timestamp as jest.Mock).mockReturnValue({});
    (winston.format.errors as jest.Mock).mockReturnValue({});
    (winston.format.json as jest.Mock).mockReturnValue({});
    (winston.format.printf as jest.Mock).mockReturnValue({});
    (winston.format.colorize as jest.Mock).mockReturnValue({});
    (winston.format.simple as jest.Mock).mockReturnValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomLoggerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CustomLoggerService>(CustomLoggerService);
    configService = module.get(ConfigService);

    // Setup default config returns
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        'nodeEnv': 'test',
        'LOG_LEVEL': 'debug',
        'app.name': 'test-service',
        'app.version': '1.0.0',
      };
      return config[key] || defaultValue;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create logger with correct configuration', () => {
      expect(winston.createLogger).toHaveBeenCalled();
      expect(configService.get).toHaveBeenCalledWith('nodeEnv');
      expect(configService.get).toHaveBeenCalledWith('LOG_LEVEL', 'info');
    });

    it('should configure different transports for production vs development', () => {
      // Test is already in test mode, so it should use development config
      expect(winston.transports.Console).toHaveBeenCalled();
    });
  });

  describe('basic logging methods', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      const context = 'TestContext';

      service.log(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, { context });
    });

    it('should log error messages with trace', () => {
      const message = 'Test error message';
      const trace = 'Error stack trace';
      const context = 'TestContext';

      service.error(message, trace, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        context,
        trace,
      });
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';
      const context: LogContext = { userId: 'user123', requestId: 'req456' };

      service.warn(message, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, context);
    });

    it('should log debug messages', () => {
      const message = 'Test debug message';
      const context = 'TestContext';

      service.debug(message, context);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, { context });
    });

    it('should log verbose messages', () => {
      const message = 'Test verbose message';
      const context: LogContext = { action: 'test_action' };

      service.verbose(message, context);

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith(message, context);
    });
  });

  describe('specialized logging methods', () => {
    it('should log HTTP requests with success status', () => {
      const method = 'GET';
      const url = '/api/test';
      const statusCode = 200;
      const duration = 150;
      const context: LogContext = { userId: 'user123' };

      service.logRequest(method, url, statusCode, duration, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `${method} ${url} ${statusCode} - ${duration}ms`,
        expect.objectContaining({
          method,
          url,
          statusCode,
          duration,
          type: 'http_request',
          userId: 'user123',
        })
      );
    });

    it('should log HTTP requests with error status as warning', () => {
      const method = 'POST';
      const url = '/api/test';
      const statusCode = 400;
      const duration = 100;

      service.logRequest(method, url, statusCode, duration);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        `${method} ${url} ${statusCode} - ${duration}ms`,
        expect.objectContaining({
          method,
          url,
          statusCode,
          duration,
          type: 'http_request',
        })
      );
    });

    it('should log database operations', () => {
      const operation = 'SELECT';
      const table = 'users';
      const duration = 50;
      const context: LogContext = { requestId: 'req123' };

      service.logDatabaseOperation(operation, table, duration, context);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
        `Database ${operation} on ${table} - ${duration}ms`,
        expect.objectContaining({
          operation,
          table,
          duration,
          type: 'database_operation',
          requestId: 'req123',
        })
      );
    });

    it('should log slow database operations as warning', () => {
      const operation = 'SELECT';
      const table = 'users';
      const duration = 1500; // > 1000ms

      service.logDatabaseOperation(operation, table, duration);

      expect(mockWinstonLogger.warn).toHaveBeenCalled();
    });

    it('should log cache operations', () => {
      const operation = 'get';
      const key = 'user:123';
      const result = 'hit';
      const duration = 5;

      service.logCacheOperation(operation, key, result, duration);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
        `Cache ${operation} ${key} - ${result} (${duration}ms)`,
        expect.objectContaining({
          operation,
          key,
          result,
          duration,
          type: 'cache_operation',
        })
      );
    });

    it('should log cache errors as warning', () => {
      const operation = 'set';
      const key = 'user:123';
      const result = 'error';

      service.logCacheOperation(operation, key, result);

      expect(mockWinstonLogger.warn).toHaveBeenCalled();
    });

    it('should log audit events', () => {
      const auditData: AuditLogData = {
        action: 'UPDATE_USER',
        resource: 'user',
        userId: 'user123',
        requestId: 'req456',
        changes: { name: 'new name' },
        previousValues: { name: 'old name' },
        newValues: { name: 'new name' },
      };

      service.logAudit(auditData);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Audit: ${auditData.action} on ${auditData.resource} by user ${auditData.userId}`,
        expect.objectContaining({
          type: 'audit',
          ...auditData,
        })
      );
    });

    it('should log security events', () => {
      const event = 'authentication_failed';
      const context: LogContext = {
        userId: 'user123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      service.logSecurity(event, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        `Security event: ${event}`,
        expect.objectContaining({
          event,
          type: 'security',
          ...context,
        })
      );
    });

    it('should log performance metrics', () => {
      const metric = 'response_time';
      const value = 250;
      const unit = 'ms';
      const context: LogContext = { requestId: 'req123' };

      service.logPerformance(metric, value, unit, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Performance: ${metric} = ${value}${unit}`,
        expect.objectContaining({
          metric,
          value,
          unit,
          type: 'performance',
          ...context,
        })
      );
    });

    it('should log business events', () => {
      const event = 'USER_REGISTERED';
      const data = { userId: 'user123', plan: 'premium' };
      const context: LogContext = { requestId: 'req456' };

      service.logBusiness(event, data, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Business event: ${event}`,
        expect.objectContaining({
          event,
          type: 'business',
          data,
          ...context,
        })
      );
    });
  });

  describe('utility methods', () => {
    it('should return winston logger instance', () => {
      const winstonLogger = service.getWinstonLogger();
      expect(winstonLogger).toBe(mockWinstonLogger);
    });

    it('should create child logger with additional context', () => {
      const context: LogContext = { userId: 'user123', requestId: 'req456' };
      
      const childLogger = service.child(context);
      
      expect(childLogger).toBeInstanceOf(CustomLoggerService);
      // Note: Testing the actual context inheritance would require more complex mocking
    });
  });

  describe('context handling', () => {
    it('should handle string context', () => {
      const message = 'Test message';
      const context = 'StringContext';

      service.log(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, { context });
    });

    it('should handle object context', () => {
      const message = 'Test message';
      const context: LogContext = {
        userId: 'user123',
        requestId: 'req456',
        action: 'test_action',
      };

      service.log(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, context);
    });

    it('should handle undefined context', () => {
      const message = 'Test message';

      service.log(message);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, undefined);
    });
  });
});