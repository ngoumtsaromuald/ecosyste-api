/**
 * Comprehensive Swagger schemas for Authentication API
 */

import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const AuthSwaggerSchemas: Record<string, SchemaObject> = {
  // Security Schemes
  BearerAuth: {
    type: 'object',
    properties: {
      Authorization: {
        type: 'string',
        description: 'JWT access token for user authentication',
        example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    },
    required: ['Authorization']
  },

  ApiKeyAuth: {
    type: 'object',
    properties: {
      'X-API-Key': {
        type: 'string',
        description: 'API key for service-to-service authentication',
        example: 'ak_1234567890abcdef'
      }
    },
    required: ['X-API-Key']
  },

  // Error Response Schemas
  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
        description: 'Indicates if the request was successful'
      },
      error: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR',
            description: 'Error code for programmatic handling'
          },
          message: {
            type: 'string',
            example: 'Validation failed',
            description: 'Human-readable error message'
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email',
                  description: 'Field that failed validation'
                },
                message: {
                  type: 'string',
                  example: 'Email must be a valid email address',
                  description: 'Specific validation error message'
                }
              }
            },
            description: 'Detailed validation errors (for validation failures)'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z',
            description: 'Error occurrence timestamp'
          },
          path: {
            type: 'string',
            example: '/auth/register',
            description: 'API endpoint where error occurred'
          },
          method: {
            type: 'string',
            example: 'POST',
            description: 'HTTP method used'
          }
        },
        required: ['code', 'message', 'timestamp']
      }
    },
    required: ['success', 'error']
  },

  ValidationErrorResponse: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: ['VALIDATION_ERROR'],
                example: 'VALIDATION_ERROR'
              },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' }
                  }
                },
                minItems: 1
              }
            },
            required: ['details']
          }
        }
      }
    ]
  },

  UnauthorizedErrorResponse: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: ['UNAUTHORIZED', 'TOKEN_EXPIRED', 'INVALID_TOKEN', 'INVALID_CREDENTIALS'],
                example: 'UNAUTHORIZED'
              }
            }
          }
        }
      }
    ]
  },

  ForbiddenErrorResponse: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: ['FORBIDDEN', 'INSUFFICIENT_PERMISSIONS'],
                example: 'FORBIDDEN'
              }
            }
          }
        }
      }
    ]
  },

  RateLimitErrorResponse: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: ['RATE_LIMIT_EXCEEDED'],
                example: 'RATE_LIMIT_EXCEEDED'
              }
            }
          },
          headers: {
            type: 'object',
            properties: {
              'X-RateLimit-Limit': {
                type: 'string',
                example: '1000',
                description: 'Request limit per window'
              },
              'X-RateLimit-Remaining': {
                type: 'string',
                example: '0',
                description: 'Remaining requests in current window'
              },
              'X-RateLimit-Reset': {
                type: 'string',
                example: '1705416060',
                description: 'Unix timestamp when limit resets'
              }
            }
          }
        }
      }
    ]
  },

  ConflictErrorResponse: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: ['CONFLICT', 'EMAIL_ALREADY_EXISTS', 'OAUTH_ACCOUNT_LINKED'],
                example: 'CONFLICT'
              }
            }
          }
        }
      }
    ]
  },

  NotFoundErrorResponse: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: ['NOT_FOUND', 'USER_NOT_FOUND', 'API_KEY_NOT_FOUND', 'OAUTH_ACCOUNT_NOT_FOUND'],
                example: 'NOT_FOUND'
              }
            }
          }
        }
      }
    ]
  },

  // Success Response Schemas
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
        description: 'Indicates if the request was successful'
      },
      message: {
        type: 'string',
        example: 'Operation completed successfully',
        description: 'Success message'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00Z',
        description: 'Response timestamp'
      }
    },
    required: ['success']
  },

  // Rate Limiting Headers
  RateLimitHeaders: {
    type: 'object',
    properties: {
      'X-RateLimit-Limit': {
        type: 'string',
        description: 'Request limit per window',
        example: '1000'
      },
      'X-RateLimit-Remaining': {
        type: 'string',
        description: 'Remaining requests in current window',
        example: '999'
      },
      'X-RateLimit-Reset': {
        type: 'string',
        description: 'Unix timestamp when limit resets',
        example: '1705416060'
      },
      'X-RateLimit-Window': {
        type: 'string',
        description: 'Rate limit window in seconds',
        example: '3600'
      }
    }
  },

  // JWT Token Payload Schema
  JWTPayload: {
    type: 'object',
    properties: {
      sub: {
        type: 'string',
        format: 'uuid',
        description: 'Subject (user ID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'user@example.com'
      },
      userType: {
        type: 'string',
        enum: ['INDIVIDUAL', 'BUSINESS', 'ADMIN'],
        description: 'Type of user account',
        example: 'INDIVIDUAL'
      },
      plan: {
        type: 'string',
        enum: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
        description: 'User subscription plan',
        example: 'FREE'
      },
      permissions: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'User permissions',
        example: ['read:profile', 'update:profile']
      },
      iat: {
        type: 'number',
        description: 'Issued at timestamp',
        example: 1705416000
      },
      exp: {
        type: 'number',
        description: 'Expiration timestamp',
        example: 1705416900
      }
    },
    required: ['sub', 'email', 'userType', 'plan', 'permissions', 'iat', 'exp']
  },

  // Permission Schemas
  PermissionList: {
    type: 'array',
    items: {
      type: 'string',
      pattern: '^[a-z]+:[a-z*]+$',
      description: 'Permission in format "resource:action"'
    },
    example: ['read:profile', 'update:profile', 'read:resources'],
    description: 'List of permissions granted to the user or API key'
  },

  // OAuth Provider Schema
  OAuthProviderEnum: {
    type: 'string',
    enum: ['GOOGLE', 'GITHUB', 'LINKEDIN'],
    description: 'Supported OAuth providers'
  },

  // User Type Schema
  UserTypeEnum: {
    type: 'string',
    enum: ['INDIVIDUAL', 'BUSINESS', 'ADMIN'],
    description: 'Types of user accounts'
  },

  // Plan Schema
  PlanEnum: {
    type: 'string',
    enum: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
    description: 'Available subscription plans'
  }
};

// Response Headers for different scenarios
export const AuthResponseHeaders = {
  RateLimit: {
    'X-RateLimit-Limit': {
      description: 'Request limit per window',
      schema: { type: 'string', example: '1000' }
    },
    'X-RateLimit-Remaining': {
      description: 'Remaining requests in current window',
      schema: { type: 'string', example: '999' }
    },
    'X-RateLimit-Reset': {
      description: 'Unix timestamp when limit resets',
      schema: { type: 'string', example: '1705416060' }
    },
    'X-RateLimit-Window': {
      description: 'Rate limit window in seconds',
      schema: { type: 'string', example: '3600' }
    }
  },

  Security: {
    'X-Content-Type-Options': {
      description: 'Prevents MIME type sniffing',
      schema: { type: 'string', example: 'nosniff' }
    },
    'X-Frame-Options': {
      description: 'Prevents clickjacking attacks',
      schema: { type: 'string', example: 'DENY' }
    },
    'X-XSS-Protection': {
      description: 'Enables XSS filtering',
      schema: { type: 'string', example: '1; mode=block' }
    }
  }
};