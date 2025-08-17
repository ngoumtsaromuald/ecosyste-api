import { Strategy } from 'passport-custom';
import { ApiKeyService } from '../services/api-key.service';
import { Request } from 'express';
export interface ApiKeyUser {
    id: string;
    email: string;
    name: string;
    userType: string;
    plan: string;
    apiKey: {
        id: string;
        name: string;
        permissions: string[];
        rateLimit: number;
    };
    rateLimitRemaining: number;
    rateLimitReset: Date;
}
declare const ApiKeyStrategy_base: new () => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class ApiKeyStrategy extends ApiKeyStrategy_base {
    private readonly apiKeyService;
    constructor(apiKeyService: ApiKeyService);
    validate(req: Request): Promise<ApiKeyUser | null>;
    private extractApiKey;
}
export {};
