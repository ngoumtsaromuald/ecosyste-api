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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logger_service_1 = require("../config/logger.service");
const uuid_1 = require("uuid");
let LoggingInterceptor = class LoggingInterceptor {
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        const requestId = request.headers['x-request-id'] || (0, uuid_1.v4)();
        request.headers['x-request-id'] = requestId;
        response.setHeader('x-request-id', requestId);
        const userId = request.user?.id || 'anonymous';
        const userAgent = request.headers['user-agent'] || 'unknown';
        const ip = request.ip || request.connection.remoteAddress || 'unknown';
        const logContext = {
            requestId,
            userId,
            ip,
            userAgent,
            method: request.method,
            url: request.url,
            query: request.query,
            body: this.sanitizeBody(request.body),
        };
        this.logger.log(`Incoming ${request.method} ${request.url}`, {
            ...logContext,
            type: 'request_start',
        });
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode;
                this.logger.logRequest(request.method, request.url, statusCode, duration, {
                    ...logContext,
                    responseSize: JSON.stringify(data).length,
                    type: 'request_success',
                });
                if (duration > 1000) {
                    this.logger.logPerformance('slow_request', duration, 'ms', {
                        ...logContext,
                        threshold: 1000,
                    });
                }
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode || 500;
                this.logger.error(`Request failed: ${request.method} ${request.url} - ${error.message}`, error.stack, {
                    ...logContext,
                    statusCode,
                    duration,
                    error: {
                        name: error.name,
                        message: error.message,
                        stack: error.stack,
                    },
                    type: 'request_error',
                });
            },
        }));
    }
    sanitizeBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }
        const sensitiveFields = [
            'password',
            'token',
            'secret',
            'key',
            'authorization',
            'auth',
            'credential',
            'apiKey',
            'api_key',
        ];
        const sanitized = { ...body };
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.CustomLoggerService])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map