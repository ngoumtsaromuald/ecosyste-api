import { HttpException } from '@nestjs/common';
export declare class RateLimitExceededException extends HttpException {
    readonly resetTime: Date;
    readonly remaining: number;
    readonly limit: number;
    constructor(message: string, resetTime: Date, remaining: number, limit: number);
}
export declare class UserRateLimitExceededException extends RateLimitExceededException {
    constructor(resetTime: Date, remaining: number, limit: number);
}
export declare class ApiKeyRateLimitExceededException extends RateLimitExceededException {
    constructor(resetTime: Date, remaining: number, limit: number);
}
export declare class IPRateLimitExceededException extends RateLimitExceededException {
    constructor(resetTime: Date, remaining: number, limit: number);
}
export declare class GlobalRateLimitExceededException extends RateLimitExceededException {
    constructor(resetTime: Date, remaining: number, limit: number);
}
