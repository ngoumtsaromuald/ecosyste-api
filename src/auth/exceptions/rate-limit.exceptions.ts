import { HttpException, HttpStatus } from '@nestjs/common';

export class RateLimitExceededException extends HttpException {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly resetTime: Date,
    public readonly remaining: number = 0,
    public readonly limit: number,
  ) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        error: 'Too Many Requests',
        resetTime: resetTime.toISOString(),
        remaining,
        limit,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class UserRateLimitExceededException extends RateLimitExceededException {
  constructor(resetTime: Date, remaining: number, limit: number) {
    super(
      `User rate limit exceeded. Try again after ${resetTime.toISOString()}`,
      resetTime,
      remaining,
      limit,
    );
  }
}

export class ApiKeyRateLimitExceededException extends RateLimitExceededException {
  constructor(resetTime: Date, remaining: number, limit: number) {
    super(
      `API key rate limit exceeded. Try again after ${resetTime.toISOString()}`,
      resetTime,
      remaining,
      limit,
    );
  }
}

export class IPRateLimitExceededException extends RateLimitExceededException {
  constructor(resetTime: Date, remaining: number, limit: number) {
    super(
      `IP rate limit exceeded. Try again after ${resetTime.toISOString()}`,
      resetTime,
      remaining,
      limit,
    );
  }
}

export class GlobalRateLimitExceededException extends RateLimitExceededException {
  constructor(resetTime: Date, remaining: number, limit: number) {
    super(
      `Global rate limit exceeded. Try again after ${resetTime.toISOString()}`,
      resetTime,
      remaining,
      limit,
    );
  }
}