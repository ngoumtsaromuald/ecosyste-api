import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
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
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private getErrorCode;
    private handlePrismaError;
}
