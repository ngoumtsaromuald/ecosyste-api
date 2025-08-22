import { ResourceType, ResourcePlan } from '@prisma/client';
export declare class SearchParamsDto {
    q?: string;
    categories?: string[];
    resourceTypes?: ResourceType[];
    plans?: ResourcePlan[];
    minPrice?: number;
    maxPrice?: number;
    verified?: boolean;
    city?: string;
    region?: string;
    tags?: string[];
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
    facets?: string[];
}
export declare class SearchHitDto {
    id: string;
    name: string;
    slug: string;
    description: string;
    resourceType: ResourceType;
    plan: ResourcePlan;
    verified: boolean;
    score: number;
    category: {
        id: string;
        name: string;
        slug: string;
    };
    address?: {
        addressLine1?: string;
        city?: string;
        region?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    distance?: number;
    contact?: {
        phone?: string;
        email?: string;
        website?: string;
    };
    tags: string[];
    rating?: number;
    createdAt: string;
    highlights?: string[];
}
export declare class SearchFacetDto {
    name: string;
    values: Record<string, number>;
    total: number;
}
export declare class SearchResultsDto {
    hits: SearchHitDto[];
    total: number;
    took: number;
    facets: SearchFacetDto[];
    suggestions?: string[];
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    metadata: {
        query?: string;
        appliedFilters: string[];
        searchId: string;
    };
}
export declare class SuggestionDto {
    text: string;
    score: number;
    type: string;
    count?: number;
    category?: {
        id: string;
        name: string;
        slug: string;
    };
    highlighted?: string;
}
export declare class GeoLocationDto {
    latitude: number;
    longitude: number;
}
export declare class GeoSearchParamsDto extends SearchParamsDto {
    location: GeoLocationDto;
    radius: number;
}
export declare class MultiTypeSearchResultsDto {
    resultsByType: Record<string, {
        hits: SearchHitDto[];
        total: number;
        facets: SearchFacetDto[];
    }>;
    totalAcrossTypes: number;
    took: number;
    mixedResults?: SearchHitDto[];
    paginationByType: Record<string, {
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
}
export declare class CategoryInfoDto {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    resourceCount: number;
}
export declare class BreadcrumbDto {
    id: string;
    name: string;
    slug: string;
    url: string;
}
export declare class CategorySearchResultsDto extends SearchResultsDto {
    categoryInfo: CategoryInfoDto;
    breadcrumbs: BreadcrumbDto[];
    subcategories: CategoryInfoDto[];
    parentCategory?: CategoryInfoDto;
    seo: {
        title: string;
        description: string;
        canonicalUrl: string;
        shareUrl: string;
        breadcrumbsSchema?: any;
    };
}
export declare class SearchErrorDto {
    success: boolean;
    error: {
        code: string;
        message: string;
        timestamp: string;
        path: string;
        method: string;
        details?: any;
    };
}
export declare class SearchAnalyticsDto {
    popularTerms: Array<{
        term: string;
        count: number;
        percentage: number;
    }>;
    noResultsQueries: Array<{
        query: string;
        count: number;
        lastSeen: string;
    }>;
    metrics: {
        averageResponseTime: number;
        totalSearches: number;
        successRate: number;
        cacheHitRate: number;
    };
}
