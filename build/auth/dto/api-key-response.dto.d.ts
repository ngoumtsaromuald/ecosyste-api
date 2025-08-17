export declare class ApiKeyResponseDto {
    id: string;
    name: string;
    keyPrefix: string;
    keyValue?: string;
    permissions: string[];
    rateLimit: number;
    isActive: boolean;
    lastUsedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
}
export declare class ApiKeyListResponseDto {
    id: string;
    name: string;
    keyPrefix: string;
    permissions: string[];
    rateLimit: number;
    isActive: boolean;
    lastUsedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
}
export declare class ApiKeyValidationResult {
    apiKey: {
        id: string;
        name: string;
        permissions: string[];
        rateLimit: number;
        userId: string;
    };
    user: {
        id: string;
        email: string;
        name: string;
        userType: string;
        plan: string;
    };
    rateLimitRemaining: number;
    rateLimitReset: Date;
}
