"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nest_winston_1 = require("nest-winston");
const logger_service_1 = require("./logger.service");
const winston = require("winston");
let LoggerModule = class LoggerModule {
};
exports.LoggerModule = LoggerModule;
exports.LoggerModule = LoggerModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            nest_winston_1.WinstonModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const logLevel = configService.get('LOG_LEVEL', 'info');
                    const serviceName = configService.get('app.name', 'backend-api-core');
                    const version = configService.get('app.version', '1.0.0');
                    const isProduction = configService.get('nodeEnv') === 'production';
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
                    if (!isProduction) {
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
                    if (isProduction) {
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
                    return {
                        level: logLevel,
                        format: logFormat,
                        transports,
                        exitOnError: false,
                    };
                },
            }),
        ],
        providers: [logger_service_1.CustomLoggerService],
        exports: [logger_service_1.CustomLoggerService],
    })
], LoggerModule);
//# sourceMappingURL=logger.module.js.map