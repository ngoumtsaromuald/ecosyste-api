export interface paths {
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["app_getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api-resources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["apiresource_findAll"];
        put?: never;
        post: operations["apiresource_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api-resources/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["apiresource_search"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api-resources/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["apiresource_findById"];
        put: operations["apiresource_update"];
        post?: never;
        delete: operations["apiresource_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api-resources/ingest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["apiresource_ingest"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api-resources/statistics/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["apiresource_getStatistics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api-resources/user/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["apiresource_findByUserId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api-resources/category/{categoryId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["apiresource_findByCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api-resources/slug/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["apiresource_findBySlug"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["category_findAll"];
        put?: never;
        post: operations["category_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/categories/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["category_search"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/categories/statistics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["category_getStatistics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/categories/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["category_findById"];
        put: operations["category_update"];
        post?: never;
        delete: operations["category_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/categories/slug/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["category_findBySlug"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/categories/{id}/children": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["category_getChildren"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/categories/{id}/path": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["category_getCategoryPath"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ResourceTypeDto: {
            value: "BUSINESS" | "SERVICE" | "DATA" | "API";
        };
        ResourceStatusDto: {
            value: "ACTIVE" | "PENDING" | "SUSPENDED";
        };
        ResourcePlanDto: {
            value: "FREE" | "PREMIUM" | "FEATURED";
        };
        UserTypeDto: {
            value: "INDIVIDUAL" | "BUSINESS" | "ADMIN";
        };
        PlanDto: {
            value: "FREE" | "PRO" | "PREMIUM" | "ENTERPRISE";
        };
        PricingTierDto: {
            value: "STANDARD" | "BUSINESS" | "ENTERPRISE";
        };
        CategoryResponseDto: {
            id: string;
            name: string;
            slug: string;
            description?: string;
            icon?: string;
            parentId?: string;
            createdAt: string;
        };
        AddressDto: {
            addressLine1?: string;
            addressLine2?: string;
            city?: string;
            region?: string;
            postalCode?: string;
            country: string;
            latitude?: number;
            longitude?: number;
        };
        ContactDto: {
            phone?: string;
            email?: string;
            website?: string;
        };
        SeoDataDto: {
            metaTitle?: string;
            metaDescription?: string;
        };
        BusinessHourDto: {
            dayOfWeek: number;
            openTime?: string;
            closeTime?: string;
            isClosed: boolean;
        };
        ResourceImageDto: {
            id: string;
            url: string;
            altText?: string;
            isPrimary: boolean;
            orderIndex: number;
            createdAt: string;
        };
        ApiResourceResponseDto: {
            id: string;
            userId: string;
            name: string;
            slug: string;
            description?: string;
            resourceType: "BUSINESS" | "SERVICE" | "DATA" | "API";
            categoryId: string;
            category: components["schemas"]["CategoryResponseDto"];
            address?: components["schemas"]["AddressDto"];
            contact?: components["schemas"]["ContactDto"];
            status: "ACTIVE" | "PENDING" | "SUSPENDED";
            plan: "FREE" | "PREMIUM" | "FEATURED";
            verified: boolean;
            seo?: components["schemas"]["SeoDataDto"];
            businessHours: components["schemas"]["BusinessHourDto"][];
            images: components["schemas"]["ResourceImageDto"][];
            createdAt: string;
            updatedAt: string;
            publishedAt?: string;
        };
        CreateResourceImageDto: {
            url: string;
            altText?: string;
            isPrimary: boolean;
            orderIndex: number;
        };
        CreateApiResourceDto: {
            name: string;
            description?: string;
            resourceType: "BUSINESS" | "SERVICE" | "DATA" | "API";
            categoryId: string;
            address?: components["schemas"]["AddressDto"];
            contact?: components["schemas"]["ContactDto"];
            seo?: components["schemas"]["SeoDataDto"];
            businessHours?: components["schemas"]["BusinessHourDto"][];
            images?: components["schemas"]["CreateResourceImageDto"][];
        };
        UpdateApiResourceDto: {
            name?: string;
            description?: string;
            resourceType?: "BUSINESS" | "SERVICE" | "DATA" | "API";
            categoryId?: string;
            address?: components["schemas"]["AddressDto"];
            contact?: components["schemas"]["ContactDto"];
            seo?: components["schemas"]["SeoDataDto"];
            businessHours?: components["schemas"]["BusinessHourDto"][];
            images?: components["schemas"]["CreateResourceImageDto"][];
            slug?: string;
            status?: "ACTIVE" | "PENDING" | "SUSPENDED";
            plan?: "FREE" | "PREMIUM" | "FEATURED";
            verified?: boolean;
        };
        IngestApiResourcesDto: {
            resources: components["schemas"]["CreateApiResourceDto"][];
            skipErrors: boolean;
            skipDuplicates: boolean;
            batchSize: number;
        };
        IngestItemResultDto: {
            index: number;
            name: string;
            status: "success" | "failed" | "skipped";
            resourceId?: string;
            slug?: string;
            error?: string;
            errorType?: string;
            skipReason?: string;
            processingTimeMs: number;
        };
        IngestResultDto: {
            total: number;
            processed: number;
            failed: number;
            skipped: number;
            processingTimeMs: number;
            results: components["schemas"]["IngestItemResultDto"][];
            errorSummary: Record<string, never>;
        };
        CategoryTreeResponseDto: {
            id: string;
            name: string;
            slug: string;
            description?: string;
            icon?: string;
            parentId?: string;
            createdAt: string;
            children?: components["schemas"]["CategoryTreeResponseDto"][];
            parent?: components["schemas"]["CategoryResponseDto"];
            _count?: Record<string, never>;
        };
        CreateCategoryDto: {
            name: string;
            description?: string;
            icon?: string;
            parentId?: string;
        };
        UpdateCategoryDto: {
            name?: string;
            description?: string;
            icon?: string;
            parentId?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    app_getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        data?: {
                            message?: string;
                            timestamp?: string;
                            version?: string;
                            environment?: string;
                        };
                        timestamp?: string;
                    };
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        error?: {
                            code?: string;
                            message?: string;
                            timestamp?: string;
                        };
                    };
                };
            };
        };
    };
    apiresource_findAll: {
        parameters: {
            query: {
                search?: string;
                resourceType?: "BUSINESS" | "SERVICE" | "DATA" | "API";
                status?: "ACTIVE" | "PENDING" | "SUSPENDED";
                plan?: "FREE" | "PREMIUM" | "FEATURED";
                categoryId?: string;
                city?: string;
                region?: string;
                country?: string;
                verified?: boolean;
                latitude?: number;
                longitude?: number;
                radius?: number;
                limit: number;
                offset: number;
                sortBy?: "name" | "createdAt" | "updatedAt" | "publishedAt";
                sortOrder: "asc" | "desc";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        data?: {
                            resources?: components["schemas"]["ApiResourceResponseDto"][];
                            total?: number;
                            page?: number;
                            totalPages?: number;
                            hasNext?: boolean;
                            hasPrev?: boolean;
                        };
                        timestamp?: string;
                    };
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    apiresource_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateApiResourceDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResourceResponseDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    apiresource_search: {
        parameters: {
            query: {
                search?: string;
                resourceType?: "BUSINESS" | "SERVICE" | "DATA" | "API";
                status?: "ACTIVE" | "PENDING" | "SUSPENDED";
                plan?: "FREE" | "PREMIUM" | "FEATURED";
                categoryId?: string;
                city?: string;
                region?: string;
                country?: string;
                verified?: boolean;
                latitude?: number;
                longitude?: number;
                radius?: number;
                limit: number;
                offset: number;
                sortBy?: "name" | "createdAt" | "updatedAt" | "publishedAt";
                sortOrder: "asc" | "desc";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        data?: {
                            resources?: components["schemas"]["ApiResourceResponseDto"][];
                            total?: number;
                            page?: number;
                            totalPages?: number;
                            hasNext?: boolean;
                            hasPrev?: boolean;
                        };
                        timestamp?: string;
                    };
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    apiresource_findById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResourceResponseDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    apiresource_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateApiResourceDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResourceResponseDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    apiresource_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    apiresource_ingest: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IngestApiResourcesDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IngestResultDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    apiresource_getStatistics: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        data?: {
                            total?: number;
                            byStatus?: {
                                ACTIVE?: number;
                                PENDING?: number;
                                SUSPENDED?: number;
                            };
                            byPlan?: {
                                FREE?: number;
                                PREMIUM?: number;
                                FEATURED?: number;
                            };
                            byType?: {
                                BUSINESS?: number;
                                SERVICE?: number;
                                DATA?: number;
                                API?: number;
                            };
                            recentCount?: number;
                        };
                        timestamp?: string;
                    };
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    apiresource_findByUserId: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
            };
            header?: never;
            path: {
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        data?: {
                            resources?: components["schemas"]["ApiResourceResponseDto"][];
                            total?: number;
                            page?: number;
                            totalPages?: number;
                            hasNext?: boolean;
                            hasPrev?: boolean;
                        };
                        timestamp?: string;
                    };
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    apiresource_findByCategory: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
            };
            header?: never;
            path: {
                categoryId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        data?: {
                            resources?: components["schemas"]["ApiResourceResponseDto"][];
                            total?: number;
                            page?: number;
                            totalPages?: number;
                            hasNext?: boolean;
                            hasPrev?: boolean;
                        };
                        timestamp?: string;
                    };
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    apiresource_findBySlug: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResourceResponseDto"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    category_findAll: {
        parameters: {
            query?: {
                tree?: boolean;
                rootsOnly?: boolean;
                includeChildren?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        data?: components["schemas"]["CategoryResponseDto"][];
                        timestamp?: string;
                    };
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    category_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCategoryDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryResponseDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    category_search: {
        parameters: {
            query: {
                q: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        data?: components["schemas"]["CategoryResponseDto"][];
                        timestamp?: string;
                    };
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    category_getStatistics: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        data?: {
                            total?: number;
                            rootCategories?: number;
                            maxDepth?: number;
                            avgResourcesPerCategory?: number;
                        };
                        timestamp?: string;
                    };
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    category_findById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryResponseDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    category_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCategoryDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryResponseDto"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    category_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    category_findBySlug: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryResponseDto"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    category_getChildren: {
        parameters: {
            query?: {
                includeGrandchildren?: boolean;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoryTreeResponseDto"][];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    category_getCategoryPath: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success?: boolean;
                        data?: components["schemas"]["CategoryResponseDto"][];
                        timestamp?: string;
                    };
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
