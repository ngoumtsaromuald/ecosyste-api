import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const method = request.method;
    const route = this.getRoute(context, request);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.metricsService.recordHttpRequest(
            method,
            route,
            response.statusCode,
            duration
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          this.metricsService.recordHttpRequest(
            method,
            route,
            statusCode,
            duration
          );
        },
      })
    );
  }

  private getRoute(context: ExecutionContext, request: Request): string {
    const handler = context.getHandler();
    const controller = context.getClass();
    
    // Try to get route from handler metadata
    const routePath = Reflect.getMetadata('path', handler);
    const controllerPath = Reflect.getMetadata('path', controller);
    
    if (routePath && controllerPath) {
      return `${controllerPath}${routePath}`.replace(/\/+/g, '/');
    }
    
    // Fallback to request path, but normalize it to avoid high cardinality
    const path = request.route?.path || request.path;
    
    // Replace dynamic segments with placeholders to avoid high cardinality
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[^\/]+\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i, '/:file');
  }
}