import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    path: string;
    method: string;
    details?: any;
  };
}

/**
 * Global exception filter to standardize error responses
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any = undefined;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.getErrorCode(status);
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        code = responseObj.code || this.getErrorCode(status);
        details = responseObj.errors || responseObj.details;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma database errors
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      code = prismaError.code;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database validation error';
      code = 'DATABASE_VALIDATION_ERROR';
    } else if (exception instanceof Error) {
      // Handle generic errors
      message = exception.message || 'Internal server error';
      
      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'production') {
        message = 'Internal server error';
      }
    }

    const errorResponse: ErrorResponse = {
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

    // Log error with context
    const logContext = {
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      userId: (request as any).user?.id,
      statusCode: status,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : exception,
        logContext
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
        logContext
      );
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const codes: Record<number, string> = {
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

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    code: string;
  } {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with this ${field} already exists`,
          code: 'DUPLICATE_ENTRY',
        };
      
      case 'P2025':
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          code: 'RECORD_NOT_FOUND',
        };
      
      case 'P2003':
        // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid reference to related record',
          code: 'FOREIGN_KEY_CONSTRAINT',
        };
      
      case 'P2014':
        // Required relation violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Required relation is missing',
          code: 'REQUIRED_RELATION_MISSING',
        };
      
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error occurred',
          code: 'DATABASE_ERROR',
        };
    }
  }
}