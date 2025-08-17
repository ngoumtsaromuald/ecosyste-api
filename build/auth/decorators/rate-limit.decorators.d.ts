export interface RateLimitOptions {
    limit: number;
    windowMs: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: any) => string;
    message?: string;
}
export interface UserRateLimitOptions extends Omit<RateLimitOptions, 'keyGenerator'> {
}
export interface ApiKeyRateLimitOptions extends Omit<RateLimitOptions, 'keyGenerator'> {
}
export interface IPRateLimitOptions extends Omit<RateLimitOptions, 'keyGenerator'> {
}
export declare const RATE_LIMIT_KEY = "rate_limit";
export declare const USER_RATE_LIMIT_KEY = "user_rate_limit";
export declare const API_KEY_RATE_LIMIT_KEY = "api_key_rate_limit";
export declare const IP_RATE_LIMIT_KEY = "ip_rate_limit";
export declare const SKIP_RATE_LIMIT_KEY = "skip_rate_limit";
export declare const RateLimit: (options: RateLimitOptions) => import("@nestjs/common").CustomDecorator<string>;
export declare const UserRateLimit: (options: UserRateLimitOptions) => import("@nestjs/common").CustomDecorator<string>;
export declare const ApiKeyRateLimit: (options: ApiKeyRateLimitOptions) => import("@nestjs/common").CustomDecorator<string>;
export declare const IPRateLimit: (options: IPRateLimitOptions) => import("@nestjs/common").CustomDecorator<string>;
export declare const SkipRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RateLimitPresets: {
    STRICT: {
        limit: number;
        windowMs: number;
    };
    CONSERVATIVE: {
        limit: number;
        windowMs: number;
    };
    STANDARD: {
        limit: number;
        windowMs: number;
    };
    GENEROUS: {
        limit: number;
        windowMs: number;
    };
    PER_MINUTE_STRICT: {
        limit: number;
        windowMs: number;
    };
    PER_MINUTE_STANDARD: {
        limit: number;
        windowMs: number;
    };
    PER_MINUTE_GENEROUS: {
        limit: number;
        windowMs: number;
    };
    PER_HOUR_STRICT: {
        limit: number;
        windowMs: number;
    };
    PER_HOUR_STANDARD: {
        limit: number;
        windowMs: number;
    };
    PER_HOUR_GENEROUS: {
        limit: number;
        windowMs: number;
    };
};
export declare const StrictRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const ConservativeRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const StandardRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const GenerousRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const StrictUserRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const ConservativeUserRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const StandardUserRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const StrictIPRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const StandardIPRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
