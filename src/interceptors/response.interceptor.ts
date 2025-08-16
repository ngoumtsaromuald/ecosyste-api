import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface StandardResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    path: string;
    method: string;
    version?: string;
  };
}

export interface PaginatedResponse<T> extends StandardResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Interceptor to standardize all successful API responses
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T> | PaginatedResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T> | PaginatedResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    
    return next.handle().pipe(
      map((data) => {
        const baseResponse = {
          success: true as const,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            version: process.env.API_VERSION || '1.0.0',
          },
        };

        // Check if the response contains pagination metadata
        if (this.isPaginatedResponse(data)) {
          return {
            ...baseResponse,
            data: data.items,
            pagination: {
              page: data.page,
              limit: data.limit,
              total: data.total,
              totalPages: Math.ceil(data.total / data.limit),
              hasNext: data.page * data.limit < data.total,
              hasPrev: data.page > 1,
            },
          } as PaginatedResponse<T>;
        }

        // Standard response
        return {
          ...baseResponse,
          data,
        } as StandardResponse<T>;
      }),
    );
  }

  private isPaginatedResponse(data: any): data is {
    items: T[];
    page: number;
    limit: number;
    total: number;
  } {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.items) &&
      typeof data.page === 'number' &&
      typeof data.limit === 'number' &&
      typeof data.total === 'number'
    );
  }
}