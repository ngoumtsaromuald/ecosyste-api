import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
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
export declare class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T> | PaginatedResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T> | PaginatedResponse<T>>;
    private isPaginatedResponse;
}
