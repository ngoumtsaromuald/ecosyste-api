import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CustomLoggerService } from '../config/logger.service';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: CustomLoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private sanitizeBody;
}
