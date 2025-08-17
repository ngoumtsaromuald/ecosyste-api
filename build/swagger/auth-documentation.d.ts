import { INestApplication } from '@nestjs/common';
export declare function setupCompleteAuthDocumentation(app: INestApplication): void;
export declare const SwaggerDocUtils: {
    addOperationDoc: (operation: any, summary: string, description: string, examples?: any) => any;
    addRateLimitDoc: (operation: any, limit: number, window?: string) => any;
    addPermissionDoc: (operation: any, permissions: string[]) => any;
};
