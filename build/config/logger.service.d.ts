import { LoggerService } from '@nestjs/common';
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
export declare class CustomLoggerService implements LoggerService {
    private readonly configService;
    private readonly logger;
    private readonly isProduction;
    constructor(configService: ConfigService);
    private createLogger;
    log(message: string, context?: string | LogContext): void;
    error(message: string, trace?: string, context?: string | LogContext): void;
    warn(message: string, context?: string | LogContext): void;
    debug(message: string, context?: string | LogContext): void;
    verbose(message: string, context?: string | LogContext): void;
    logRequest(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void;
    logDatabaseOperation(operation: string, table: string, duration: number, context?: LogContext): void;
    logCacheOperation(operation: 'get' | 'set' | 'del' | 'invalidate', key: string, result: 'hit' | 'miss' | 'success' | 'error', duration?: number, context?: LogContext): void;
    logAudit(auditData: AuditLogData): void;
    logSecurity(event: 'authentication_failed' | 'authorization_failed' | 'suspicious_activity' | 'rate_limit_exceeded', context: LogContext): void;
    logPerformance(metric: string, value: number, unit: 'ms' | 'bytes' | 'count', context?: LogContext): void;
    logBusiness(event: string, data: Record<string, any>, context?: LogContext): void;
    getWinstonLogger(): winston.Logger;
    child(context: LogContext): CustomLoggerService;
}
