"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerExamples = void 0;
const auth_examples_1 = require("./auth-examples");
exports.SwaggerExamples = {
    ...auth_examples_1.AuthSwaggerExamples,
    ApiResource: {
        CreateRequest: {
            name: 'Restaurant Le Palais',
            description: 'Authentic Cameroonian cuisine in the heart of Yaoundé. We offer traditional dishes prepared with fresh local ingredients, creating an unforgettable dining experience.',
            resourceType: 'BUSINESS',
            categoryId: '123e4567-e89b-12d3-a456-426614174000',
            address: {
                addressLine1: '123 Avenue Kennedy',
                addressLine2: 'Near Central Market',
                city: 'Yaoundé',
                region: 'Centre',
                postalCode: '00237',
                country: 'CM',
                latitude: 3.848,
                longitude: 11.502
            },
            contact: {
                phone: '+237123456789',
                email: 'contact@lepalais.cm',
                website: 'https://www.lepalais.cm'
            },
            seo: {
                metaTitle: 'Restaurant Le Palais - Authentic Cameroonian Cuisine',
                metaDescription: 'Experience the best of Cameroonian cuisine at Restaurant Le Palais in Yaoundé. Fresh ingredients, traditional recipes, modern atmosphere.'
            },
            businessHours: [
                { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', isClosed: false },
                { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00', isClosed: false },
                { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00', isClosed: false },
                { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00', isClosed: false },
                { dayOfWeek: 5, openTime: '08:00', closeTime: '23:00', isClosed: false },
                { dayOfWeek: 6, openTime: '09:00', closeTime: '23:00', isClosed: false },
                { dayOfWeek: 0, openTime: '10:00', closeTime: '21:00', isClosed: false }
            ],
            images: [
                {
                    url: 'https://example.com/images/restaurant-exterior.jpg',
                    altText: 'Restaurant Le Palais exterior view',
                    isPrimary: true,
                    orderIndex: 0
                },
                {
                    url: 'https://example.com/images/restaurant-interior.jpg',
                    altText: 'Modern interior with traditional Cameroonian decor',
                    isPrimary: false,
                    orderIndex: 1
                }
            ]
        },
        UpdateRequest: {
            name: 'Restaurant Le Palais - Updated',
            description: 'Updated description with new menu items and services.',
            status: 'ACTIVE',
            plan: 'PREMIUM',
            verified: true
        },
        Response: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: '456e7890-e89b-12d3-a456-426614174000',
            name: 'Restaurant Le Palais',
            slug: 'restaurant-le-palais',
            description: 'Authentic Cameroonian cuisine in the heart of Yaoundé.',
            resourceType: 'BUSINESS',
            categoryId: '789e0123-e89b-12d3-a456-426614174000',
            category: {
                id: '789e0123-e89b-12d3-a456-426614174000',
                name: 'Restaurants',
                slug: 'restaurants',
                description: 'Food and dining establishments',
                icon: 'restaurant',
                parentId: null,
                createdAt: '2024-01-15T10:30:00Z'
            },
            address: {
                addressLine1: '123 Avenue Kennedy',
                city: 'Yaoundé',
                region: 'Centre',
                country: 'CM',
                latitude: 3.848,
                longitude: 11.502
            },
            contact: {
                phone: '+237123456789',
                email: 'contact@lepalais.cm',
                website: 'https://www.lepalais.cm'
            },
            status: 'ACTIVE',
            plan: 'FREE',
            verified: false,
            businessHours: [],
            images: [],
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            publishedAt: '2024-01-15T10:30:00Z'
        }
    },
    Category: {
        CreateRequest: {
            name: 'Restaurants',
            description: 'Food and dining establishments offering various cuisines',
            icon: 'restaurant',
            parentId: null
        },
        UpdateRequest: {
            name: 'Fine Dining Restaurants',
            description: 'Upscale restaurants with premium dining experiences',
            icon: 'restaurant-fine'
        },
        Response: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Restaurants',
            slug: 'restaurants',
            description: 'Food and dining establishments',
            icon: 'restaurant',
            parentId: null,
            createdAt: '2024-01-15T10:30:00Z'
        },
        TreeResponse: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Restaurants',
            slug: 'restaurants',
            description: 'Food and dining establishments',
            icon: 'restaurant',
            parentId: null,
            createdAt: '2024-01-15T10:30:00Z',
            children: [
                {
                    id: '456e7890-e89b-12d3-a456-426614174000',
                    name: 'Fast Food',
                    slug: 'fast-food',
                    description: 'Quick service restaurants',
                    icon: 'fast-food',
                    parentId: '123e4567-e89b-12d3-a456-426614174000',
                    createdAt: '2024-01-15T10:30:00Z',
                    children: []
                }
            ],
            _count: {
                children: 5,
                apiResources: 25
            }
        }
    },
    BulkIngest: {
        Request: {
            resources: [
                {
                    name: 'Restaurant A',
                    description: 'Great food place',
                    resourceType: 'BUSINESS',
                    categoryId: '123e4567-e89b-12d3-a456-426614174000',
                    address: {
                        addressLine1: '123 Main St',
                        city: 'Yaoundé',
                        country: 'CM'
                    }
                },
                {
                    name: 'Restaurant B',
                    description: 'Another great place',
                    resourceType: 'BUSINESS',
                    categoryId: '123e4567-e89b-12d3-a456-426614174000'
                }
            ],
            skipErrors: true,
            skipDuplicates: true,
            batchSize: 50
        },
        Response: {
            total: 100,
            processed: 85,
            failed: 10,
            skipped: 5,
            processingTimeMs: 2500,
            results: [
                {
                    index: 0,
                    name: 'Restaurant A',
                    status: 'success',
                    resourceId: '123e4567-e89b-12d3-a456-426614174000',
                    slug: 'restaurant-a',
                    processingTimeMs: 25
                },
                {
                    index: 1,
                    name: 'Restaurant B',
                    status: 'failed',
                    error: 'Validation failed: Address is required for BUSINESS type',
                    errorType: 'validation_error',
                    processingTimeMs: 15
                }
            ],
            errorSummary: {
                'validation_error': 5,
                'duplicate_error': 3,
                'enrichment_error': 2
            }
        }
    },
    Search: {
        BasicSearch: {
            search: 'restaurant',
            limit: 20,
            offset: 0
        },
        LocationSearch: {
            search: 'restaurant',
            latitude: 3.848,
            longitude: 11.502,
            radius: 10,
            city: 'Yaoundé'
        },
        FilteredSearch: {
            resourceType: 'BUSINESS',
            status: 'ACTIVE',
            plan: 'PREMIUM',
            verified: true,
            categoryId: '123e4567-e89b-12d3-a456-426614174000',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        }
    },
    Responses: {
        Success: {
            success: true,
            data: {},
            timestamp: '2024-01-15T10:30:00Z'
        },
        Error: {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed: Name is required',
                timestamp: '2024-01-15T10:30:00Z',
                path: '/api/v1/api-resources',
                method: 'POST'
            }
        },
        PaginatedList: {
            success: true,
            data: {
                resources: [],
                total: 150,
                page: 1,
                totalPages: 8,
                hasNext: true,
                hasPrev: false
            },
            timestamp: '2024-01-15T10:30:00Z'
        }
    }
};
//# sourceMappingURL=examples.js.map