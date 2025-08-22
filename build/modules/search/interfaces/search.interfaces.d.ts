import { ResourceType, ResourcePlan } from '@prisma/client';
export declare enum TimePeriod {
    HOUR = "hour",
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year"
}
export declare enum SortField {
    RELEVANCE = "relevance",
    NAME = "name",
    CREATED_AT = "createdAt",
    UPDATED_AT = "updatedAt",
    POPULARITY = "popularity",
    RATING = "rating",
    DISTANCE = "distance"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export interface SearchParams {
    query?: string;
    filters?: SearchFilters;
    sort?: SortOptions;
    pagination?: PaginationParams;
    facets?: string[];
    userId?: string;
    sessionId?: string;
    language?: string;
}
export interface MultiTypeSearchParams extends SearchParams {
    includeTypes?: ResourceType[];
    groupByType?: boolean;
    globalRelevanceSort?: boolean;
    limitsPerType?: {
        [key in ResourceType]?: number;
    };
}
export interface SearchFilters {
    categories?: string[];
    resourceTypes?: ResourceType[];
    plans?: ResourcePlan[];
    location?: GeoFilter;
    priceRange?: PriceRange;
    verified?: boolean;
    city?: string;
    region?: string;
    country?: string;
    tags?: string[];
    dateRange?: DateRange;
}
export interface GeoFilter {
    latitude: number;
    longitude: number;
    radius: number;
    unit?: 'km' | 'mi';
}
export interface PriceRange {
    min?: number;
    max?: number;
    currency?: string;
}
export interface DateRange {
    from?: Date;
    to?: Date;
}
export interface SortOptions {
    field: SortField;
    order: SortOrder;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
    searchAfter?: string;
}
export interface SearchResults {
    hits: SearchHit[];
    total: number;
    facets: SearchFacets;
    suggestions?: string[];
    took: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
    metadata?: {
        query?: string;
        filters?: SearchFilters;
        pagination?: PaginationParams;
        categoryId?: string;
        subcategoriesIncluded?: number;
        totalCategoriesSearched?: number;
        [key: string]: any;
    };
}
export interface MultiTypeSearchResults {
    resultsByType: {
        [key in ResourceType]: {
            hits: SearchHit[];
            total: number;
            facets: SearchFacets;
        };
    };
    combinedResults: SearchHit[];
    totalAcrossTypes: number;
    globalFacets: SearchFacets;
    took: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
    metadata?: {
        query?: string;
        filters?: SearchFilters;
        pagination?: PaginationParams;
        typeDistribution: {
            [key in ResourceType]: number;
        };
        [key: string]: any;
    };
}
export interface SearchHit {
    id: string;
    name: string;
    description?: string;
    resourceType: ResourceType;
    category: {
        id: string;
        name: string;
        slug: string;
    };
    plan: ResourcePlan;
    verified: boolean;
    location?: {
        latitude: number;
        longitude: number;
        city?: string;
        region?: string;
        country: string;
        distance?: number;
    };
    contact?: {
        phone?: string;
        email?: string;
        website?: string;
    };
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    score: number;
    highlight?: Record<string, string[]>;
    language?: string;
    languageConfidence?: number;
    languageAdaptation?: {
        userLanguage: string;
        contentLanguage: string;
        relevanceBoost: number;
        translationAvailable?: boolean;
    };
}
export interface SearchFacets {
    categories: FacetBucket[];
    resourceTypes: FacetBucket[];
    plans: FacetBucket[];
    cities: FacetBucket[];
    regions: FacetBucket[];
    verified: FacetBucket[];
    tags: FacetBucket[];
    priceRanges?: FacetBucket[];
    popularity?: FacetBucket[];
    rating?: FacetBucket[];
    globalStats?: {
        totalResources: number;
        averageRating: number;
        verifiedCount: number;
    };
}
export interface FacetBucket {
    key: string;
    count: number;
    selected?: boolean;
    label?: string;
}
export interface GeoLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
}
export interface SearchMetrics {
    totalSearches: number;
    averageResponseTime: number;
    popularTerms: PopularTerm[];
    noResultsQueries: NoResultsQuery[];
    clickThroughRate: number;
    period: DateRangeWithGranularity;
}
export interface PopularTerm {
    term: string;
    count: number;
    percentage: number;
}
export interface NoResultsQuery {
    query: string;
    count: number;
    lastSearched: Date;
}
export interface DateRangeWithGranularity {
    from: Date;
    to: Date;
    granularity: 'hour' | 'day' | 'week' | 'month';
}
export interface SearchLogParams {
    query: string;
    filters: SearchFilters;
    userId?: string;
    sessionId: string;
    userAgent?: string;
    ipAddress?: string;
    resultsCount: number;
    took: number;
    language?: string;
    detectedLanguage?: string;
}
export interface IndexHealth {
    status: 'green' | 'yellow' | 'red';
    totalDocs: number;
    indexSize: string;
    lastUpdate: Date;
    errors?: string[];
    shards?: {
        total: number;
        successful: number;
        failed: number;
    };
}
export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Date;
    checks: {
        elasticsearch: 'fulfilled' | 'rejected';
        redis: 'fulfilled' | 'rejected';
        index: 'fulfilled' | 'rejected';
    };
    details?: Record<string, any>;
}
