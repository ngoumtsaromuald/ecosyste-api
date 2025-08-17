# Rate Limiting Guards

This directory contains comprehensive rate limiting guards for the ROMAPI authentication system. The guards provide flexible rate limiting capabilities that can be applied at different levels (IP, user, API key, general) and integrated with various authentication methods.

## Overview

The rate limiting system consists of:

1. **RateLimitGuard** - Core rate limiting functionality
2. **CombinedAuthGuard** - Authentication + rate limiting
3. **RateLimitOnlyGuard** - Rate limiting without authentication
4. **OptionalAuthWithRateLimitGuard** - Optional authentication + rate limiting

## Core Components

### RateLimitGuard

The main guard that applies rate limiting based on decorators:

```typescript
import { RateLimitGuard } from './guards/rate-limit.guard';
import { RateLimit, UserRateLimit, IPRateLimit } from './decorators/rate-limit.decorators';

@Controller('api')
export class ApiController {
  @Get('data')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 100, windowMs: 15 * 60 * 1000 }) // 100 requests per 15 minutes
  async getData() {
    return { data: 'example' };
  }
}
```

### Rate Limiting Decorators

#### Basic Rate Limiting

```typescript
// General rate limiting
@RateLimit({ limit: 100, windowMs: 15 * 60 * 1000 })

// User-specific rate limiting (requires authentication)
@UserRateLimit({ limit: 1000, windowMs: 60 * 60 * 1000 })

// API key-specific rate limiting (requires API key auth)
@ApiKeyRateLimit({ limit: 5000, windowMs: 60 * 60 * 1000 })

// IP-based rate limiting
@IPRateLimit({ limit: 10, windowMs: 60 * 1000 })

// Skip rate limiting
@SkipRateLimit()
```

#### Preset Rate Limits

```typescript
// Predefined rate limit configurations
@StrictRateLimit()      // 5 requests per 15 minutes
@ConservativeRateLimit() // 10 requests per 15 minutes
@StandardRateLimit()     // 100 requests per 15 minutes
@GenerousRateLimit()     // 1000 requests per 15 minutes
```

#### Custom Key Generation

```typescript
@RateLimit({
  limit: 50,
  windowMs: 60 * 1000,
  keyGenerator: (req) => `custom:${req.body?.category}:${req.ip}`,
  message: 'Custom rate limit exceeded'
})
```

## Guard Types

### 1. RateLimitOnlyGuard

Applies rate limiting without requiring authentication:

```typescript
@Get('public')
@UseGuards(RateLimitOnlyGuard)
@RateLimit({ limit: 100, windowMs: 15 * 60 * 1000 })
async publicEndpoint() {
  return { message: 'Public endpoint with rate limiting' };
}
```

### 2. CombinedAuthGuard

Applies both authentication and rate limiting:

```typescript
@Get('protected')
@UseGuards(CombinedAuthGuard)
@UserRateLimit({ limit: 1000, windowMs: 60 * 60 * 1000 })
@ApiKeyRateLimit({ limit: 5000, windowMs: 60 * 60 * 1000 })
async protectedEndpoint() {
  return { message: 'Protected endpoint with rate limiting' };
}
```

### 3. OptionalAuthWithRateLimitGuard

Applies rate limiting with optional authentication (higher limits for authenticated users):

```typescript
@Get('optional')
@UseGuards(OptionalAuthWithRateLimitGuard)
@RateLimit({ limit: 100, windowMs: 15 * 60 * 1000 }) // Anonymous users
@UserRateLimit({ limit: 500, windowMs: 15 * 60 * 1000 }) // Authenticated users
async optionalAuthEndpoint() {
  return { message: 'Optional auth with different rate limits' };
}
```

## Rate Limiting Layers

You can apply multiple rate limiting layers to a single endpoint:

```typescript
@Post('multi-layer')
@UseGuards(CombinedAuthGuard)
@IPRateLimit({ limit: 10, windowMs: 60 * 1000 })        // 10 per IP per minute
@UserRateLimit({ limit: 100, windowMs: 15 * 60 * 1000 }) // 100 per user per 15 min
@RateLimit({ limit: 50, windowMs: 5 * 60 * 1000 })      // 50 general per 5 min
async multiLayerEndpoint() {
  return { message: 'Multiple rate limiting layers applied' };
}
```

## Response Headers

The guards automatically set rate limiting headers in responses:

```
X-RateLimit-IP-Limit: 10
X-RateLimit-IP-Remaining: 8
X-RateLimit-IP-Reset: 1640995200
X-RateLimit-IP-Current: 2

X-RateLimit-User-Limit: 100
X-RateLimit-User-Remaining: 95
X-RateLimit-User-Reset: 1640995800
X-RateLimit-User-Current: 5
```

## Error Handling

The guards throw specific exceptions when rate limits are exceeded:

- `IPRateLimitExceededException` - IP rate limit exceeded
- `UserRateLimitExceededException` - User rate limit exceeded
- `ApiKeyRateLimitExceededException` - API key rate limit exceeded
- `RateLimitExceededException` - General rate limit exceeded

All exceptions include:
- HTTP 429 status code
- Reset time
- Remaining requests
- Limit information

## Common Patterns

### Authentication Endpoints

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @UseGuards(RateLimitOnlyGuard)
  @IPRateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }) // Prevent brute force
  async login() { /* ... */ }

  @Post('register')
  @UseGuards(RateLimitOnlyGuard)
  @IPRateLimit({ limit: 3, windowMs: 60 * 60 * 1000 }) // Prevent spam registration
  async register() { /* ... */ }

  @Post('forgot-password')
  @UseGuards(RateLimitOnlyGuard)
  @IPRateLimit({ limit: 3, windowMs: 60 * 60 * 1000 }) // Prevent abuse
  async forgotPassword() { /* ... */ }
}
```

### API Endpoints

```typescript
@Controller('api')
export class ApiController {
  // Read operations - generous limits
  @Get('data')
  @UseGuards(CombinedAuthGuard)
  @GenerousRateLimit()
  async getData() { /* ... */ }

  // Write operations - conservative limits
  @Post('data')
  @UseGuards(CombinedAuthGuard)
  @ConservativeRateLimit()
  async createData() { /* ... */ }

  // Sensitive operations - strict limits
  @Delete('data/:id')
  @UseGuards(CombinedAuthGuard)
  @StrictRateLimit()
  async deleteData() { /* ... */ }
}
```

### Public vs Protected Endpoints

```typescript
// Public endpoint with IP-based rate limiting
@Get('public')
@UseGuards(RateLimitOnlyGuard)
@IPRateLimit({ limit: 100, windowMs: 15 * 60 * 1000 })
async publicEndpoint() { /* ... */ }

// Protected endpoint with user-based rate limiting
@Get('protected')
@UseGuards(CombinedAuthGuard)
@UserRateLimit({ limit: 1000, windowMs: 15 * 60 * 1000 })
async protectedEndpoint() { /* ... */ }
```

## Configuration

Rate limiting is configured through:

1. **Decorators** - Applied at the endpoint level
2. **Redis** - Used for storing rate limit counters
3. **Environment variables** - For default limits and Redis connection

### Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Default rate limits (optional)
DEFAULT_RATE_LIMIT=1000
DEFAULT_RATE_WINDOW_MS=900000
DEFAULT_IP_RATE_LIMIT=100
DEFAULT_USER_RATE_LIMIT=1000
```

## Testing

The guards include comprehensive tests covering:

- Basic rate limiting functionality
- Multiple rate limiting layers
- Different authentication methods
- Error scenarios
- Header setting
- IP extraction

Run tests with:

```bash
npm test -- rate-limit.guard.spec.ts
```

## Best Practices

1. **Layer Rate Limits**: Apply multiple layers (IP, user, general) for comprehensive protection
2. **Different Limits for Different Operations**: Use stricter limits for write operations
3. **Authentication-Aware Limits**: Provide higher limits for authenticated users
4. **Graceful Degradation**: Handle Redis failures gracefully
5. **Monitor and Alert**: Set up monitoring for rate limit violations
6. **Document Limits**: Clearly document rate limits in API documentation

## Integration with Other Guards

The rate limiting guards can be combined with other guards:

```typescript
@UseGuards(CombinedAuthGuard, PermissionGuard)
@UserRateLimit({ limit: 100, windowMs: 15 * 60 * 1000 })
@RequirePermissions('admin:read')
async adminEndpoint() { /* ... */ }
```

## Troubleshooting

### Common Issues

1. **Redis Connection**: Ensure Redis is running and accessible
2. **Header Conflicts**: Check for conflicting rate limit headers
3. **Key Collisions**: Use unique key generators to avoid collisions
4. **Clock Skew**: Ensure server clocks are synchronized

### Debugging

Enable debug logging:

```typescript
// In your module
import { Logger } from '@nestjs/common';

const logger = new Logger('RateLimit');
logger.debug('Rate limit check', { key, limit, current });
```

### Performance Considerations

- Use Redis clustering for high-traffic applications
- Consider using sliding window for more accurate rate limiting
- Monitor Redis memory usage
- Use appropriate TTL values for rate limit keys