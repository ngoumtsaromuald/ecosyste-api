export declare class RateLimitExampleController {
    publicEndpoint(): Promise<{
        message: string;
    }>;
    sensitiveOperation(data: any): Promise<{
        message: string;
        data: any;
    }>;
    protectedEndpoint(): Promise<{
        message: string;
    }>;
    multiLayerEndpoint(data: any): Promise<{
        message: string;
        layers: string[];
        data: any;
    }>;
    strictEndpoint(): Promise<{
        message: string;
    }>;
    conservativeEndpoint(): Promise<{
        message: string;
    }>;
    standardEndpoint(): Promise<{
        message: string;
    }>;
    optionalAuthEndpoint(): Promise<{
        message: string;
        note: string;
    }>;
    customRateLimitEndpoint(data: {
        category?: string;
    }): Promise<{
        message: string;
        category: string;
    }>;
    adminEndpoint(data: any): Promise<{
        message: string;
        data: any;
    }>;
    getResource(): Promise<{
        message: string;
    }>;
    createResource(data: any): Promise<{
        message: string;
        data: any;
    }>;
    perMinuteEndpoint(): Promise<{
        message: string;
    }>;
    perHourEndpoint(): Promise<{
        message: string;
    }>;
}
export declare class AuthControllerWithRateLimit {
    login(loginDto: any): Promise<{
        message: string;
    }>;
    register(registerDto: any): Promise<{
        message: string;
    }>;
    forgotPassword(forgotDto: any): Promise<{
        message: string;
    }>;
    getProfile(): Promise<{
        message: string;
    }>;
}
