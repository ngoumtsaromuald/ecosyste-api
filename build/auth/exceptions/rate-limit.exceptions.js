"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalRateLimitExceededException = exports.IPRateLimitExceededException = exports.ApiKeyRateLimitExceededException = exports.UserRateLimitExceededException = exports.RateLimitExceededException = void 0;
const common_1 = require("@nestjs/common");
class RateLimitExceededException extends common_1.HttpException {
    constructor(message = 'Rate limit exceeded', resetTime, remaining = 0, limit) {
        super({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            message,
            error: 'Too Many Requests',
            resetTime: resetTime.toISOString(),
            remaining,
            limit,
        }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        this.resetTime = resetTime;
        this.remaining = remaining;
        this.limit = limit;
    }
}
exports.RateLimitExceededException = RateLimitExceededException;
class UserRateLimitExceededException extends RateLimitExceededException {
    constructor(resetTime, remaining, limit) {
        super(`User rate limit exceeded. Try again after ${resetTime.toISOString()}`, resetTime, remaining, limit);
    }
}
exports.UserRateLimitExceededException = UserRateLimitExceededException;
class ApiKeyRateLimitExceededException extends RateLimitExceededException {
    constructor(resetTime, remaining, limit) {
        super(`API key rate limit exceeded. Try again after ${resetTime.toISOString()}`, resetTime, remaining, limit);
    }
}
exports.ApiKeyRateLimitExceededException = ApiKeyRateLimitExceededException;
class IPRateLimitExceededException extends RateLimitExceededException {
    constructor(resetTime, remaining, limit) {
        super(`IP rate limit exceeded. Try again after ${resetTime.toISOString()}`, resetTime, remaining, limit);
    }
}
exports.IPRateLimitExceededException = IPRateLimitExceededException;
class GlobalRateLimitExceededException extends RateLimitExceededException {
    constructor(resetTime, remaining, limit) {
        super(`Global rate limit exceeded. Try again after ${resetTime.toISOString()}`, resetTime, remaining, limit);
    }
}
exports.GlobalRateLimitExceededException = GlobalRateLimitExceededException;
//# sourceMappingURL=rate-limit.exceptions.js.map