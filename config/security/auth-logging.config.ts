/**
 * Production Security Logging Configuration for Auth System
 * Configures Winston logger for security events and audit trails
 */

import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';

// Log levels for security events
export enum SecurityLogLevel {
  EMERGENCY = 'emerg',
  ALERT = 'alert',
  CRITICAL = 'crit',
  ERROR = 'error',
  WARNING = 'warning',
  NOTICE = 'notice',
  INFO = 'info',
  DEBUG = 'debug'
}

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGIN_BLOCKED = 'login_blocked',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  PASSWORD_CHANGE = 'password_change',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_USED = 'api_key_used',
  API_KEY_REVOKED = 'api_key_revoked',
  OAUTH_LOGIN = 'oauth_login',
  OAUTH_LINK = 'oauth_link',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  PERMISSION_DENIED = 'permission_denied',
  SESSION_CREATED = 'session_created',
  SESSION_EXPIRED = 'session_expired',
  SESSION_INVALIDATED = 'session_invalidated',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked'
}

// Production logging configuration
export const createSecurityLoggerConfig = () => {
  const logDir = process.env.SECURITY_LOG_DIR || './logs/security';
  const logLevel = process.env.AUDIT_LOG_LEVEL || 'info';
  const isProduction = process.env.NODE_ENV === 'production';

  // Custom format for security logs
  const securityFormat = winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta,
        environment: process.env.NODE_ENV,
        service: 'auth-system'
      });
    })
  );

  // Console format for development
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}] ${message} ${metaStr}`;
    })
  );

  const transports: winston.transport[] = [];

  // Console transport (always enabled in development)
  if (!isProduction) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
      })
    );
  }

  // File transports for production
  if (isProduction) {
    // General security log
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'auth-security.log'),
        format: securityFormat,
        level: logLevel,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10,
        tailable: true
      })
    );

    // Error-only log
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'auth-errors.log'),
        format: securityFormat,
        level: 'error',
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 5,
        tailable: true
      })
    );

    // Critical security events
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'auth-critical.log'),
        format: securityFormat,
        level: 'crit',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 20,
        tailable: true
      })
    );

    // Audit trail (all security events)
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'auth-audit.log'),
        format: securityFormat,
        level: 'info',
        maxsize: 100 * 1024 * 1024, // 100MB
        maxFiles: 30,
        tailable: true
      })
    );
  }

  return WinstonModule.createLogger({
    level: logLevel,
    format: securityFormat,
    transports,
    exitOnError: false,
    silent: false
  });
};

// Security log metadata interface
export interface SecurityLogMetadata {
  userId?: string;
  sessionId?: string;
  apiKeyId?: string;
  ipAddress?: string;
  userAgent?: string;
  eventType: SecurityEventType;
  resource?: string;
  action?: string;
  result: 'success' | 'failure' | 'blocked';
  details?: Record<string, any>;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  correlationId?: string;
}

// Helper function to create structured security log entries
export const createSecurityLogEntry = (
  message: string,
  metadata: SecurityLogMetadata
): any => {
  return {
    message,
    ...metadata,
    timestamp: new Date().toISOString(),
    service: 'auth-system',
    version: process.env.npm_package_version || '1.0.0'
  };
};

// Log retention configuration
export const logRetentionConfig = {
  enabled: process.env.LOG_RETENTION_ENABLED === 'true',
  retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90'),
  compressionEnabled: true,
  archiveLocation: process.env.LOG_ARCHIVE_LOCATION || './logs/archive'
};

// Alert thresholds for security monitoring
export const securityAlertThresholds = {
  failedLoginAttempts: parseInt(process.env.FAILED_LOGIN_ALERT_THRESHOLD || '10'),
  rateLimitExceeded: parseInt(process.env.RATE_LIMIT_ALERT_THRESHOLD || '100'),
  suspiciousActivityWindow: parseInt(process.env.SUSPICIOUS_ACTIVITY_WINDOW || '300'), // 5 minutes
  criticalEventsPerHour: parseInt(process.env.CRITICAL_EVENTS_ALERT_THRESHOLD || '50')
};

// Production-specific logger instance
export const securityLogger = createSecurityLoggerConfig();