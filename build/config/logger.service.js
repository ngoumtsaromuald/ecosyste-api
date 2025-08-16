"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CustomLoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLoggerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const winston = require("winston");
let CustomLoggerService = CustomLoggerService_1 = class CustomLoggerService {
    constructor(configService) {
        this.configService = configService;
        this.isProduction = this.configService.get('nodeEnv') === 'production';
        this.logger = this.createLogger();
    }
    createLogger() {
        const logLevel = this.configService.get('LOG_LEVEL', 'info');
        const serviceName = this.configService.get('app.name', 'backend-api-core');
        const version = this.configService.get('app.version', '1.0.0');
        const logFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf((info) => {
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
        }));
        const transports = [];
        if (!this.isProduction) {
            transports.push(new winston.transports.Console({
                level: logLevel,
                format: winston.format.combine(winston.format.colorize(), winston.format.simple(), winston.format.printf((info) => {
                    const { timestamp, level, message, context, ...meta } = info;
                    const contextStr = context ? ` [${context}]` : '';
                    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
                    return `${timestamp} ${level}${contextStr} ${message}${metaStr}`;
                })),
            }));
        }
        else {
            transports.push(new winston.transports.Console({
                level: logLevel,
                format: logFormat,
            }));
        }
        if (this.isProduction) {
            transports.push(new winston.transports.File({
                filename: 'logs/app.log',
                level: 'info',
                format: logFormat,
                maxsize: 10 * 1024 * 1024,
                maxFiles: 5,
            }));
            transports.push(new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: logFormat,
                maxsize: 10 * 1024 * 1024,
                maxFiles: 5,
            }));
            transports.push(new winston.transports.File({
                filename: 'logs/audit.log',
                level: 'info',
                format: logFormat,
                maxsize: 10 * 1024 * 1024,
                maxFiles: 10,
            }));
        }
        return winston.createLogger({
            level: logLevel,
            format: logFormat,
            transports,
            exitOnError: false,
        });
    }
    log(message, context) {
        const logContext = typeof context === 'string' ? { context } : context;
        this.logger.info(message, logContext);
    }
    error(message, trace, context) {
        const logContext = typeof context === 'string' ? { context } : context;
        this.logger.error(message, { ...logContext, trace });
    }
    warn(message, context) {
        const logContext = typeof context === 'string' ? { context } : context;
        this.logger.warn(message, logContext);
    }
    debug(message, context) {
        const logContext = typeof context === 'string' ? { context } : context;
        this.logger.debug(message, logContext);
    }
    verbose(message, context) {
        const logContext = typeof context === 'string' ? { context } : context;
        this.logger.verbose(message, logContext);
    }
    logRequest(method, url, statusCode, duration, context) {
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
        }
        else {
            this.logger.info(logData.message, logData);
        }
    }
    logDatabaseOperation(operation, table, duration, context) {
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
        }
        else {
            this.logger.debug(logData.message, logData);
        }
    }
    logCacheOperation(operation, key, result, duration, context) {
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
        }
        else {
            this.logger.debug(logData.message, logData);
        }
    }
    logAudit(auditData) {
        const logData = {
            message: `Audit: ${auditData.action} on ${auditData.resource} by user ${auditData.userId}`,
            type: 'audit',
            ...auditData,
        };
        this.logger.info(logData.message, logData);
    }
    logSecurity(event, context) {
        const logData = {
            message: `Security event: ${event}`,
            event,
            type: 'security',
            ...context,
        };
        this.logger.warn(logData.message, logData);
    }
    logPerformance(metric, value, unit, context) {
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
    logBusiness(event, data, context) {
        const logData = {
            message: `Business event: ${event}`,
            event,
            type: 'business',
            data,
            ...context,
        };
        this.logger.info(logData.message, logData);
    }
    getWinstonLogger() {
        return this.logger;
    }
    child(context) {
        const childLogger = new CustomLoggerService_1(this.configService);
        childLogger.logger.defaultMeta = { ...childLogger.logger.defaultMeta, ...context };
        return childLogger;
    }
};
exports.CustomLoggerService = CustomLoggerService;
exports.CustomLoggerService = CustomLoggerService = CustomLoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CustomLoggerService);
//# sourceMappingURL=logger.service.js.map