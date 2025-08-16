"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'INTERNAL_ERROR';
        let details = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                code = this.getErrorCode(status);
            }
            else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse;
                message = responseObj.message || message;
                code = responseObj.code || this.getErrorCode(status);
                details = responseObj.errors || responseObj.details;
            }
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            const prismaError = this.handlePrismaError(exception);
            status = prismaError.status;
            message = prismaError.message;
            code = prismaError.code;
        }
        else if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = 'Database validation error';
            code = 'DATABASE_VALIDATION_ERROR';
        }
        else if (exception instanceof Error) {
            message = exception.message || 'Internal server error';
            if (process.env.NODE_ENV === 'production') {
                message = 'Internal server error';
            }
        }
        const errorResponse = {
            success: false,
            error: {
                code,
                message,
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method,
                ...(details && { details }),
            },
        };
        const logContext = {
            method: request.method,
            url: request.url,
            userAgent: request.get('User-Agent'),
            ip: request.ip,
            userId: request.user?.id,
            statusCode: status,
        };
        if (status >= 500) {
            this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`, exception instanceof Error ? exception.stack : exception, logContext);
        }
        else if (status >= 400) {
            this.logger.warn(`${request.method} ${request.url} - ${status} - ${message}`, logContext);
        }
        response.status(status).json(errorResponse);
    }
    getErrorCode(status) {
        const codes = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'VALIDATION_ERROR',
            429: 'RATE_LIMIT_EXCEEDED',
            500: 'INTERNAL_ERROR',
            502: 'BAD_GATEWAY',
            503: 'SERVICE_UNAVAILABLE',
            504: 'GATEWAY_TIMEOUT',
        };
        return codes[status] || 'UNKNOWN_ERROR';
    }
    handlePrismaError(error) {
        switch (error.code) {
            case 'P2002':
                const target = error.meta?.target;
                const field = target?.[0] || 'field';
                return {
                    status: common_1.HttpStatus.CONFLICT,
                    message: `A record with this ${field} already exists`,
                    code: 'DUPLICATE_ENTRY',
                };
            case 'P2025':
                return {
                    status: common_1.HttpStatus.NOT_FOUND,
                    message: 'Record not found',
                    code: 'RECORD_NOT_FOUND',
                };
            case 'P2003':
                return {
                    status: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Invalid reference to related record',
                    code: 'FOREIGN_KEY_CONSTRAINT',
                };
            case 'P2014':
                return {
                    status: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Required relation is missing',
                    code: 'REQUIRED_RELATION_MISSING',
                };
            default:
                return {
                    status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database error occurred',
                    code: 'DATABASE_ERROR',
                };
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map