import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MetricsService } from '../services/metrics.service';
export declare class MetricsInterceptor implements NestInterceptor {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private getRoute;
}
