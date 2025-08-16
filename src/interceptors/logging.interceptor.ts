import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../config/logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Generate request ID if not present
    const requestId = request.headers['x-request-id'] as string || uuidv4();
    request.headers['x-request-id'] = requestId;
    response.setHeader('x-request-id', requestId);

    // Extract user information if available
    const userId = (request as any).user?.id || 'anonymous';
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

    // Log incoming request
    this.logger.log(
      `Incoming ${request.method} ${request.url}`,
      {
        ...logContext,
        type: 'request_start',
      }
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log successful response
          this.logger.logRequest(
            request.method,
            request.url,
            statusCode,
            duration,
            {
              ...logContext,
              responseSize: JSON.stringify(data).length,
              type: 'request_success',
            }
          );

          // Log performance if request is slow
          if (duration > 1000) {
            this.logger.logPerformance(
              'slow_request',
              duration,
              'ms',
              {
                ...logContext,
                threshold: 1000,
              }
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;

          // Log error response
          this.logger.error(
            `Request failed: ${request.method} ${request.url} - ${error.message}`,
            error.stack,
            {
              ...logContext,
              statusCode,
              duration,
              error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
              },
              type: 'request_error',
            }
          );
        },
      })
    );
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeBody(body: any): any {
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
}