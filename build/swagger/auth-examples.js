"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSwaggerExamples = void 0;
const client_1 = require("@prisma/client");
exports.AuthSwaggerExamples = {
    Auth: {
        RegisterRequest: {
            email: 'john.doe@example.com',
            password: 'SecurePass123!',
            name: 'John Doe',
            userType: client_1.UserType.INDIVIDUAL
        },
        RegisterBusinessRequest: {
            email: 'admin@company.com',
            password: 'BusinessPass456!',
            name: 'Jane Smith',
            userType: client_1.UserType.BUSINESS
        },
        LoginRequest: {
            email: 'john.doe@example.com',
            password: 'SecurePass123!'
        },
        RefreshTokenRequest: {
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNTQxNjAwMCwiZXhwIjoxNzA2MDIwODAwfQ.example_refresh_token_signature'
        },
        ForgotPasswordRequest: {
            email: 'john.doe@example.com'
        },
        ResetPasswordRequest: {
            token: 'reset_token_abc123def456',
            newPassword: 'NewSecurePass789!'
        },
        AuthResponse: {
            user: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'john.doe@example.com',
                name: 'John Doe',
                userType: client_1.UserType.INDIVIDUAL,
                plan: client_1.Plan.FREE,
                emailVerified: true,
                createdAt: '2024-01-15T10:30:00Z'
            },
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwidXNlclR5cGUiOiJJTkRJVklEVUFMIiwicGxhbiI6IkZSRUUiLCJwZXJtaXNzaW9ucyI6WyJyZWFkOnByb2ZpbGUiLCJ1cGRhdGU6cHJvZmlsZSJdLCJpYXQiOjE3MDU0MTYwMDAsImV4cCI6MTcwNTQxNjkwMH0.example_access_token_signature',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNTQxNjAwMCwiZXhwIjoxNzA2MDIwODAwfQ.example_refresh_token_signature',
            expiresIn: 900
        },
        TokenResponse: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwidXNlclR5cGUiOiJJTkRJVklEVUFMIiwicGxhbiI6IkZSRUUiLCJwZXJtaXNzaW9ucyI6WyJyZWFkOnByb2ZpbGUiLCJ1cGRhdGU6cHJvZmlsZSJdLCJpYXQiOjE3MDU0MTYwMDAsImV4cCI6MTcwNTQxNjkwMH0.example_access_token_signature',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNTQxNjAwMCwiZXhwIjoxNzA2MDIwODAwfQ.example_refresh_token_signature',
            expiresIn: 900
        }
    },
    ApiKeys: {
        CreateRequest: {
            name: 'Production API Key',
            permissions: ['read:resources', 'write:resources'],
            rateLimit: 1000,
            expiresAt: '2025-01-15T10:30:00Z'
        },
        CreateDevelopmentRequest: {
            name: 'Development Testing',
            permissions: ['read:resources'],
            rateLimit: 100
        },
        UpdateRequest: {
            name: 'Updated Production Key',
            permissions: ['read:resources', 'write:resources', 'delete:resources'],
            rateLimit: 2000,
            expiresAt: '2025-06-15T10:30:00Z'
        },
        CreateResponse: {
            id: '456e7890-e89b-12d3-a456-426614174000',
            name: 'Production API Key',
            keyPrefix: 'rk_abc123',
            keyValue: 'rk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890abcdef123456',
            permissions: ['read:resources', 'write:resources'],
            rateLimit: 1000,
            expiresAt: '2025-01-15T10:30:00Z',
            createdAt: '2024-01-15T10:30:00Z'
        },
        ListResponse: [
            {
                id: '456e7890-e89b-12d3-a456-426614174000',
                name: 'Production API Key',
                keyPrefix: 'rk_abc123',
                permissions: ['read:resources', 'write:resources'],
                rateLimit: 1000,
                isActive: true,
                lastUsedAt: '2024-01-15T09:45:00Z',
                expiresAt: '2025-01-15T10:30:00Z',
                createdAt: '2024-01-15T10:30:00Z'
            },
            {
                id: '789e0123-e89b-12d3-a456-426614174000',
                name: 'Development Key',
                keyPrefix: 'rk_def456',
                permissions: ['read:resources'],
                rateLimit: 100,
                isActive: true,
                lastUsedAt: null,
                expiresAt: null,
                createdAt: '2024-01-10T14:20:00Z'
            }
        ],
        StatsResponse: {
            total: 5,
            active: 3,
            inactive: 1,
            expired: 1,
            recentlyUsed: 2
        }
    },
    OAuth: {
        InitiateResponse: {
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=123456789.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fapi.romapi.com%2Foauth%2Fgoogle%2Fcallback&response_type=code&scope=openid%20email%20profile&state=abc123def456ghi789',
            state: 'abc123def456ghi789'
        },
        LinkRequest: {
            provider: client_1.OAuthProvider.GOOGLE,
            code: 'oauth_authorization_code_from_provider',
            state: 'abc123def456ghi789'
        },
        AccountResponse: {
            id: '789e0123-e89b-12d3-a456-426614174000',
            provider: client_1.OAuthProvider.GOOGLE,
            providerId: '1234567890',
            email: 'john.doe@gmail.com',
            name: 'John Doe',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
        },
        AccountsListResponse: [
            {
                id: '789e0123-e89b-12d3-a456-426614174000',
                provider: client_1.OAuthProvider.GOOGLE,
                providerId: '1234567890',
                email: 'john.doe@gmail.com',
                name: 'John Doe',
                createdAt: '2024-01-15T10:30:00Z',
                updatedAt: '2024-01-15T10:30:00Z'
            },
            {
                id: '012e3456-e89b-12d3-a456-426614174000',
                provider: client_1.OAuthProvider.GITHUB,
                providerId: 'johndoe',
                email: 'john.doe@users.noreply.github.com',
                name: 'John Doe',
                createdAt: '2024-01-10T14:20:00Z',
                updatedAt: '2024-01-10T14:20:00Z'
            }
        ]
    },
    Errors: {
        ValidationError: {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: [
                    {
                        field: 'email',
                        message: 'Email must be a valid email address'
                    },
                    {
                        field: 'password',
                        message: 'Password must be at least 8 characters long'
                    }
                ],
                timestamp: '2024-01-15T10:30:00Z',
                path: '/auth/register',
                method: 'POST'
            }
        },
        UnauthorizedError: {
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid credentials',
                timestamp: '2024-01-15T10:30:00Z',
                path: '/auth/login',
                method: 'POST'
            }
        },
        ForbiddenError: {
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions',
                timestamp: '2024-01-15T10:30:00Z',
                path: '/api-keys',
                method: 'POST'
            }
        },
        RateLimitError: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Rate limit exceeded. Try again in 60 seconds.',
                timestamp: '2024-01-15T10:30:00Z',
                path: '/auth/login',
                method: 'POST'
            },
            headers: {
                'X-RateLimit-Limit': '10',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': '1705416060'
            }
        },
        ConflictError: {
            success: false,
            error: {
                code: 'CONFLICT',
                message: 'Email already registered',
                timestamp: '2024-01-15T10:30:00Z',
                path: '/auth/register',
                method: 'POST'
            }
        },
        NotFoundError: {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'API key not found',
                timestamp: '2024-01-15T10:30:00Z',
                path: '/api-keys/456e7890-e89b-12d3-a456-426614174000',
                method: 'DELETE'
            }
        }
    },
    SecurityHeaders: {
        RateLimitHeaders: {
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': '999',
            'X-RateLimit-Reset': '1705416060',
            'X-RateLimit-Window': '3600'
        },
        AuthHeaders: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'X-API-Key': 'rk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890abcdef123456'
        }
    },
    Permissions: {
        IndividualUser: [
            'read:profile',
            'update:profile',
            'read:resources',
            'create:resources'
        ],
        BusinessUser: [
            'read:profile',
            'update:profile',
            'read:business',
            'update:business',
            'read:resources',
            'create:resources',
            'update:resources',
            'read:analytics'
        ],
        AdminUser: [
            'admin:*',
            'read:*',
            'write:*',
            'delete:*'
        ],
        ApiKeyPermissions: [
            'read:resources',
            'write:resources',
            'delete:resources',
            'read:analytics',
            'manage:webhooks'
        ]
    }
};
//# sourceMappingURL=auth-examples.js.map