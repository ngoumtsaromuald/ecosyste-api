import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  RateLimit,
  UserRateLimit,
  ApiKeyRateLimit,
  IPRateLimit,
  StrictRateLimit,
  ConservativeRateLimit,
  StandardRateLimit,
  SkipRateLimit,
  RateLimitPresets,
} from '../decorators/rate-limit.decorators';
import {
  RateLimitGuard,
  CombinedAuthGuard,
  RateLimitOnlyGuard,
  OptionalAuthWithRateLimitGuard,
} from '../guards';

/**
 * Example controller demonstrating various rate limiting patterns
 */
@Controller('examples')
@ApiTags('Rate Limiting Examples')
export class RateLimitExampleController {

  /**
   * Example 1: Basic rate limiting without authentication
   */
  @Get('public')
  @UseGuards(RateLimitOnlyGuard)
  @RateLimit({ limit: 100, windowMs: 15 * 60 * 1000 }) // 100 requests per 15 minutes
  @ApiOperation({ summary: 'Public endpoint with basic rate limiting' })
  async publicEndpoint() {
    return { message: 'This is a public endpoint with rate limiting' };
  }

  /**
   * Example 2: IP-based rate limiting for sensitive operations
   */
  @Post('sensitive')
  @UseGuards(RateLimitOnlyGuard)
  @IPRateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }) // 5 requests per IP per 15 minutes
  @ApiOperation({ summary: 'Sensitive operation with IP rate limiting' })
  async sensitiveOperation(@Body() data: any) {
    return { message: 'Sensitive operation completed', data };
  }

  /**
   * Example 3: Combined authentication and rate limiting
   */
  @Get('protected')
  @UseGuards(CombinedAuthGuard)
  @UserRateLimit({ limit: 1000, windowMs: 60 * 60 * 1000 }) // 1000 requests per user per hour
  @ApiKeyRateLimit({ limit: 5000, windowMs: 60 * 60 * 1000 }) // 5000 requests per API key per hour
  @ApiOperation({ summary: 'Protected endpoint with user and API key rate limiting' })
  async protectedEndpoint() {
    return { message: 'This is a protected endpoint with rate limiting' };
  }

  /**
   * Example 4: Multiple rate limiting layers
   */
  @Post('multi-layer')
  @UseGuards(CombinedAuthGuard)
  @IPRateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per IP per minute
  @UserRateLimit({ limit: 100, windowMs: 15 * 60 * 1000 }) // 100 requests per user per 15 minutes
  @RateLimit({ limit: 50, windowMs: 5 * 60 * 1000 }) // 50 requests per 5 minutes (general)
  @ApiOperation({ summary: 'Endpoint with multiple rate limiting layers' })
  async multiLayerEndpoint(@Body() data: any) {
    return { 
      message: 'Multi-layer rate limiting applied',
      layers: ['IP', 'User', 'General'],
      data 
    };
  }

  /**
   * Example 5: Using preset rate limits
   */
  @Get('strict')
  @UseGuards(RateLimitOnlyGuard)
  @StrictRateLimit() // 5 requests per 15 minutes
  @ApiOperation({ summary: 'Endpoint with strict rate limiting preset' })
  async strictEndpoint() {
    return { message: 'Strict rate limiting applied' };
  }

  @Get('conservative')
  @UseGuards(CombinedAuthGuard)
  @ConservativeRateLimit() // 10 requests per 15 minutes
  @ApiOperation({ summary: 'Endpoint with conservative rate limiting preset' })
  async conservativeEndpoint() {
    return { message: 'Conservative rate limiting applied' };
  }

  @Get('standard')
  @UseGuards(CombinedAuthGuard)
  @StandardRateLimit() // 100 requests per 15 minutes
  @ApiOperation({ summary: 'Endpoint with standard rate limiting preset' })
  async standardEndpoint() {
    return { message: 'Standard rate limiting applied' };
  }

  /**
   * Example 6: Optional authentication with rate limiting
   */
  @Get('optional-auth')
  @UseGuards(OptionalAuthWithRateLimitGuard)
  @RateLimit({ limit: 200, windowMs: 15 * 60 * 1000 }) // 200 requests per 15 minutes
  @UserRateLimit({ limit: 500, windowMs: 15 * 60 * 1000 }) // 500 requests per authenticated user
  @ApiOperation({ summary: 'Endpoint with optional authentication and rate limiting' })
  async optionalAuthEndpoint() {
    return { 
      message: 'Optional authentication with rate limiting',
      note: 'Authenticated users get higher limits'
    };
  }

  /**
   * Example 7: Custom rate limiting with key generator
   */
  @Post('custom')
  @UseGuards(RateLimitOnlyGuard)
  @RateLimit({
    limit: 20,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => `custom:${req.body?.category || 'default'}:${req.ip}`,
    message: 'Custom rate limit exceeded for this category'
  })
  @ApiOperation({ summary: 'Endpoint with custom rate limiting key generator' })
  async customRateLimitEndpoint(@Body() data: { category?: string }) {
    return { 
      message: 'Custom rate limiting applied',
      category: data.category || 'default'
    };
  }

  /**
   * Example 8: Skip rate limiting for admin operations
   */
  @Post('admin')
  @UseGuards(CombinedAuthGuard)
  @SkipRateLimit() // No rate limiting applied
  @ApiOperation({ summary: 'Admin endpoint with no rate limiting' })
  async adminEndpoint(@Body() data: any) {
    return { 
      message: 'Admin operation - no rate limiting',
      data 
    };
  }

  /**
   * Example 9: Different limits for different HTTP methods
   */
  @Get('resource')
  @UseGuards(CombinedAuthGuard)
  @RateLimit(RateLimitPresets.GENEROUS) // 1000 requests per 15 minutes for GET
  @ApiOperation({ summary: 'GET endpoint with generous rate limiting' })
  async getResource() {
    return { message: 'Resource retrieved with generous rate limiting' };
  }

  @Post('resource')
  @UseGuards(CombinedAuthGuard)
  @RateLimit(RateLimitPresets.CONSERVATIVE) // 10 requests per 15 minutes for POST
  @ApiOperation({ summary: 'POST endpoint with conservative rate limiting' })
  async createResource(@Body() data: any) {
    return { 
      message: 'Resource created with conservative rate limiting',
      data 
    };
  }

  /**
   * Example 10: Time-based rate limiting (per minute vs per hour)
   */
  @Get('per-minute')
  @UseGuards(RateLimitOnlyGuard)
  @RateLimit(RateLimitPresets.PER_MINUTE_STANDARD) // 60 requests per minute
  @ApiOperation({ summary: 'Endpoint with per-minute rate limiting' })
  async perMinuteEndpoint() {
    return { message: 'Per-minute rate limiting applied' };
  }

  @Get('per-hour')
  @UseGuards(RateLimitOnlyGuard)
  @RateLimit(RateLimitPresets.PER_HOUR_STANDARD) // 1000 requests per hour
  @ApiOperation({ summary: 'Endpoint with per-hour rate limiting' })
  async perHourEndpoint() {
    return { message: 'Per-hour rate limiting applied' };
  }
}

/**
 * Example of rate limiting configuration in a real controller
 */
@Controller('auth')
@ApiTags('Authentication')
export class AuthControllerWithRateLimit {

  @Post('login')
  @UseGuards(RateLimitOnlyGuard)
  @IPRateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }) // 5 login attempts per IP per 15 minutes
  @RateLimit({ limit: 10, windowMs: 15 * 60 * 1000 }) // 10 total login attempts per 15 minutes
  @ApiOperation({ summary: 'User login with rate limiting' })
  async login(@Body() loginDto: any) {
    // Login logic here
    return { message: 'Login successful' };
  }

  @Post('register')
  @UseGuards(RateLimitOnlyGuard)
  @IPRateLimit({ limit: 3, windowMs: 60 * 60 * 1000 }) // 3 registrations per IP per hour
  @ApiOperation({ summary: 'User registration with rate limiting' })
  async register(@Body() registerDto: any) {
    // Registration logic here
    return { message: 'Registration successful' };
  }

  @Post('forgot-password')
  @UseGuards(RateLimitOnlyGuard)
  @IPRateLimit({ limit: 3, windowMs: 60 * 60 * 1000 }) // 3 password reset requests per IP per hour
  @ApiOperation({ summary: 'Password reset request with rate limiting' })
  async forgotPassword(@Body() forgotDto: any) {
    // Password reset logic here
    return { message: 'Password reset email sent' };
  }

  @Get('profile')
  @UseGuards(CombinedAuthGuard)
  @UserRateLimit({ limit: 100, windowMs: 15 * 60 * 1000 }) // 100 profile requests per user per 15 minutes
  @ApiOperation({ summary: 'Get user profile with rate limiting' })
  async getProfile() {
    // Profile logic here
    return { message: 'Profile retrieved' };
  }
}