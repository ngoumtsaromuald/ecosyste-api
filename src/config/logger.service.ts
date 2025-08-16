import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  url?: string;
  [key: string]: any;
}

export interface AuditLogData extends LogContext {
  action: string;
  resource: string;
  userId: string;
  changes?: Record<string, any>;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly logger: winston.Logger;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('nodeEnv') === 'production';
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    const serviceName = this.configService.get('app.name', 'backend-api-core');
    const version = this.configService.get('app.version', '1.0.0');

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf((info) => {
        const { timestamp, level, message, context, trace, ...meta } = info;
        
        const logEntry = {
          timestamp,
          level: level.toUpperCase(),
          service: serviceName,
          version,
          message,
          ...(context && { context }),
          ...(trace && { trace }),
          ...meta,
        };

        return JSON.stringify(logEntry);
      })
    );

    // Configure transports
    const transports: winston.transport[] = [];

    // Console transport
    if (!this.isProduction) {
      transports.push(
        new winston.transports.Console({
          level: logLevel,
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf((info) => {
              const { timestamp, level, message, context, ...meta } = info;
              const contextStr = context ? ` [${context}]` : '';
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} ${level}${contextStr} ${message}${metaStr}`;
            })
          ),
        })
      );
    } else {
      transports.push(
        new winston.transports.Console({
          level: logLevel,
          format: logFormat,
        })
      );
    }

    // File transports for production
    if (this.isProduction) {
      // Application logs
      transports.push(
        new winston.transports.File({
          filename: 'logs/app.log',
          level: 'info',
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        })
      );

      // Error logs
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        })
      );

      // Audit logs
      transports.push(
        new winston.transports.File({
          filename: 'logs/audit.log',
          level: 'info',
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 10,
        })
      );
    }

    return winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      // Don't exit on handled exceptions
      exitOnError: false,
    });
  }

  /**
   * Log a message with optional context
   */
  log(message: string, context?: string | LogContext): void {
    const logContext = typeof context === 'string' ? { context } : context;
    this.logger.info(message, logContext);
  }

  /**
   * Log an error message
   */
  error(message: string, trace?: string, context?: string | LogContext): void {
    const logContext = typeof context === 'string' ? { context } : context;
    this.logger.error(message, { ...logContext, trace });
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string | LogContext): void {
    const logContext = typeof context === 'string' ? { context } : context;
    this.logger.warn(message, logContext);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string | LogContext): void {
    const logContext = typeof context === 'string' ? { context } : context;
    this.logger.debug(message, logContext);
  }

  /**
   * Log a verbose message
   */
  verbose(message: string, context?: string | LogContext): void {
    const logContext = typeof context === 'string' ? { context } : context;
    this.logger.verbose(message, logContext);
  }

  /**
   * Log HTTP request information
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const logData = {
      message: `${method} ${url} ${statusCode} - ${duration}ms`,
      method,
      url,
      statusCode,
      duration,
      type: 'http_request',
      ...context,
    };

    if (statusCode >= 400) {
      this.logger.warn(logData.message, logData);
    } else {
      this.logger.info(logData.message, logData);
    }
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    context?: LogContext
  ): void {
    const logData = {
      message: `Database ${operation} on ${table} - ${duration}ms`,
      operation,
      table,
      duration,
      type: 'database_operation',
      ...context,
    };

    if (duration > 1000) {
      this.logger.warn(logData.message, logData);
    } else {
      this.logger.debug(logData.message, logData);
    }
  }

  /**
   * Log cache operations
   */
  logCacheOperation(
    operation: 'get' | 'set' | 'del' | 'invalidate',
    key: string,
    result: 'hit' | 'miss' | 'success' | 'error',
    duration?: number,
    context?: LogContext
  ): void {
    const logData = {
      message: `Cache ${operation} ${key} - ${result}${duration ? ` (${duration}ms)` : ''}`,
      operation,
      key,
      result,
      duration,
      type: 'cache_operation',
      ...context,
    };

    if (result === 'error') {
      this.logger.warn(logData.message, logData);
    } else {
      this.logger.debug(logData.message, logData);
    }
  }

  /**
   * Log audit events for sensitive actions
   */
  logAudit(auditData: AuditLogData): void {
    const logData = {
      message: `Audit: ${auditData.action} on ${auditData.resource} by user ${auditData.userId}`,
      type: 'audit',
      ...auditData,
    };

    // Always log audit events at info level
    this.logger.info(logData.message, logData);
  }

  /**
   * Log security events
   */
  logSecurity(
    event: 'authentication_failed' | 'authorization_failed' | 'suspicious_activity' | 'rate_limit_exceeded',
    context: LogContext
  ): void {
    const logData = {
      message: `Security event: ${event}`,
      event,
      type: 'security',
      ...context,
    };

    this.logger.warn(logData.message, logData);
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    metric: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count',
    context?: LogContext
  ): void {
    const logData = {
      message: `Performance: ${metric} = ${value}${unit}`,
      metric,
      value,
      unit,
      type: 'performance',
      ...context,
    };

    this.logger.info(logData.message, logData);
  }

  /**
   * Log business events
   */
  logBusiness(
    event: string,
    data: Record<string, any>,
    context?: LogContext
  ): void {
    const logData = {
      message: `Business event: ${event}`,
      event,
      type: 'business',
      data,
      ...context,
    };

    this.logger.info(logData.message, logData);
  }

  /**
   * Get the underlying Winston logger instance
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): CustomLoggerService {
    const childLogger = new CustomLoggerService(this.configService);
    childLogger.logger.defaultMeta = { ...childLogger.logger.defaultMeta, ...context };
    return childLogger;
  }
}