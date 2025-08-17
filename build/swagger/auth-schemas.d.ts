import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
export declare const AuthSwaggerSchemas: Record<string, SchemaObject>;
export declare const AuthResponseHeaders: {
    RateLimit: {
        'X-RateLimit-Limit': {
            description: string;
            schema: {
                type: string;
                example: string;
            };
        };
        'X-RateLimit-Remaining': {
            description: string;
            schema: {
                type: string;
                example: string;
            };
        };
        'X-RateLimit-Reset': {
            description: string;
            schema: {
                type: string;
                example: string;
            };
        };
        'X-RateLimit-Window': {
            description: string;
            schema: {
                type: string;
                example: string;
            };
        };
    };
    Security: {
        'X-Content-Type-Options': {
            description: string;
            schema: {
                type: string;
                example: string;
            };
        };
        'X-Frame-Options': {
            description: string;
            schema: {
                type: string;
                example: string;
            };
        };
        'X-XSS-Protection': {
            description: string;
            schema: {
                type: string;
                example: string;
            };
        };
    };
};
