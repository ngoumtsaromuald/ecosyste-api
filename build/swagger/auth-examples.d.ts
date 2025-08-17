export declare const AuthSwaggerExamples: {
    Auth: {
        RegisterRequest: {
            email: string;
            password: string;
            name: string;
            userType: "INDIVIDUAL";
        };
        RegisterBusinessRequest: {
            email: string;
            password: string;
            name: string;
            userType: "BUSINESS";
        };
        LoginRequest: {
            email: string;
            password: string;
        };
        RefreshTokenRequest: {
            refreshToken: string;
        };
        ForgotPasswordRequest: {
            email: string;
        };
        ResetPasswordRequest: {
            token: string;
            newPassword: string;
        };
        AuthResponse: {
            user: {
                id: string;
                email: string;
                name: string;
                userType: "INDIVIDUAL";
                plan: "FREE";
                emailVerified: boolean;
                createdAt: string;
            };
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
        TokenResponse: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
    };
    ApiKeys: {
        CreateRequest: {
            name: string;
            permissions: string[];
            rateLimit: number;
            expiresAt: string;
        };
        CreateDevelopmentRequest: {
            name: string;
            permissions: string[];
            rateLimit: number;
        };
        UpdateRequest: {
            name: string;
            permissions: string[];
            rateLimit: number;
            expiresAt: string;
        };
        CreateResponse: {
            id: string;
            name: string;
            keyPrefix: string;
            keyValue: string;
            permissions: string[];
            rateLimit: number;
            expiresAt: string;
            createdAt: string;
        };
        ListResponse: {
            id: string;
            name: string;
            keyPrefix: string;
            permissions: string[];
            rateLimit: number;
            isActive: boolean;
            lastUsedAt: string;
            expiresAt: string;
            createdAt: string;
        }[];
        StatsResponse: {
            total: number;
            active: number;
            inactive: number;
            expired: number;
            recentlyUsed: number;
        };
    };
    OAuth: {
        InitiateResponse: {
            authUrl: string;
            state: string;
        };
        LinkRequest: {
            provider: "GOOGLE";
            code: string;
            state: string;
        };
        AccountResponse: {
            id: string;
            provider: "GOOGLE";
            providerId: string;
            email: string;
            name: string;
            createdAt: string;
            updatedAt: string;
        };
        AccountsListResponse: ({
            id: string;
            provider: "GOOGLE";
            providerId: string;
            email: string;
            name: string;
            createdAt: string;
            updatedAt: string;
        } | {
            id: string;
            provider: "GITHUB";
            providerId: string;
            email: string;
            name: string;
            createdAt: string;
            updatedAt: string;
        })[];
    };
    Errors: {
        ValidationError: {
            success: boolean;
            error: {
                code: string;
                message: string;
                details: {
                    field: string;
                    message: string;
                }[];
                timestamp: string;
                path: string;
                method: string;
            };
        };
        UnauthorizedError: {
            success: boolean;
            error: {
                code: string;
                message: string;
                timestamp: string;
                path: string;
                method: string;
            };
        };
        ForbiddenError: {
            success: boolean;
            error: {
                code: string;
                message: string;
                timestamp: string;
                path: string;
                method: string;
            };
        };
        RateLimitError: {
            success: boolean;
            error: {
                code: string;
                message: string;
                timestamp: string;
                path: string;
                method: string;
            };
            headers: {
                'X-RateLimit-Limit': string;
                'X-RateLimit-Remaining': string;
                'X-RateLimit-Reset': string;
            };
        };
        ConflictError: {
            success: boolean;
            error: {
                code: string;
                message: string;
                timestamp: string;
                path: string;
                method: string;
            };
        };
        NotFoundError: {
            success: boolean;
            error: {
                code: string;
                message: string;
                timestamp: string;
                path: string;
                method: string;
            };
        };
    };
    SecurityHeaders: {
        RateLimitHeaders: {
            'X-RateLimit-Limit': string;
            'X-RateLimit-Remaining': string;
            'X-RateLimit-Reset': string;
            'X-RateLimit-Window': string;
        };
        AuthHeaders: {
            Authorization: string;
            'X-API-Key': string;
        };
    };
    Permissions: {
        IndividualUser: string[];
        BusinessUser: string[];
        AdminUser: string[];
        ApiKeyPermissions: string[];
    };
};
