export declare const SwaggerExamples: {
    ApiResource: {
        CreateRequest: {
            name: string;
            description: string;
            resourceType: string;
            categoryId: string;
            address: {
                addressLine1: string;
                addressLine2: string;
                city: string;
                region: string;
                postalCode: string;
                country: string;
                latitude: number;
                longitude: number;
            };
            contact: {
                phone: string;
                email: string;
                website: string;
            };
            seo: {
                metaTitle: string;
                metaDescription: string;
            };
            businessHours: {
                dayOfWeek: number;
                openTime: string;
                closeTime: string;
                isClosed: boolean;
            }[];
            images: {
                url: string;
                altText: string;
                isPrimary: boolean;
                orderIndex: number;
            }[];
        };
        UpdateRequest: {
            name: string;
            description: string;
            status: string;
            plan: string;
            verified: boolean;
        };
        Response: {
            id: string;
            userId: string;
            name: string;
            slug: string;
            description: string;
            resourceType: string;
            categoryId: string;
            category: {
                id: string;
                name: string;
                slug: string;
                description: string;
                icon: string;
                parentId: any;
                createdAt: string;
            };
            address: {
                addressLine1: string;
                city: string;
                region: string;
                country: string;
                latitude: number;
                longitude: number;
            };
            contact: {
                phone: string;
                email: string;
                website: string;
            };
            status: string;
            plan: string;
            verified: boolean;
            businessHours: any[];
            images: any[];
            createdAt: string;
            updatedAt: string;
            publishedAt: string;
        };
    };
    Category: {
        CreateRequest: {
            name: string;
            description: string;
            icon: string;
            parentId: any;
        };
        UpdateRequest: {
            name: string;
            description: string;
            icon: string;
        };
        Response: {
            id: string;
            name: string;
            slug: string;
            description: string;
            icon: string;
            parentId: any;
            createdAt: string;
        };
        TreeResponse: {
            id: string;
            name: string;
            slug: string;
            description: string;
            icon: string;
            parentId: any;
            createdAt: string;
            children: {
                id: string;
                name: string;
                slug: string;
                description: string;
                icon: string;
                parentId: string;
                createdAt: string;
                children: any[];
            }[];
            _count: {
                children: number;
                apiResources: number;
            };
        };
    };
    BulkIngest: {
        Request: {
            resources: ({
                name: string;
                description: string;
                resourceType: string;
                categoryId: string;
                address: {
                    addressLine1: string;
                    city: string;
                    country: string;
                };
            } | {
                name: string;
                description: string;
                resourceType: string;
                categoryId: string;
                address?: undefined;
            })[];
            skipErrors: boolean;
            skipDuplicates: boolean;
            batchSize: number;
        };
        Response: {
            total: number;
            processed: number;
            failed: number;
            skipped: number;
            processingTimeMs: number;
            results: ({
                index: number;
                name: string;
                status: string;
                resourceId: string;
                slug: string;
                processingTimeMs: number;
                error?: undefined;
                errorType?: undefined;
            } | {
                index: number;
                name: string;
                status: string;
                error: string;
                errorType: string;
                processingTimeMs: number;
                resourceId?: undefined;
                slug?: undefined;
            })[];
            errorSummary: {
                validation_error: number;
                duplicate_error: number;
                enrichment_error: number;
            };
        };
    };
    Search: {
        BasicSearch: {
            search: string;
            limit: number;
            offset: number;
        };
        LocationSearch: {
            search: string;
            latitude: number;
            longitude: number;
            radius: number;
            city: string;
        };
        FilteredSearch: {
            resourceType: string;
            status: string;
            plan: string;
            verified: boolean;
            categoryId: string;
            sortBy: string;
            sortOrder: string;
        };
    };
    Responses: {
        Success: {
            success: boolean;
            data: {};
            timestamp: string;
        };
        Error: {
            success: boolean;
            error: {
                code: string;
                message: string;
                timestamp: string;
                path: string;
                method: string;
            };
        };
        PaginatedList: {
            success: boolean;
            data: {
                resources: any[];
                total: number;
                page: number;
                totalPages: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
            timestamp: string;
        };
    };
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
