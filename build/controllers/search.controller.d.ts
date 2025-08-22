import { Request } from 'express';
import { SearchService } from '../modules/search/services/search.service';
import { CategorySearchService } from '../modules/search/services/category-search.service';
import { MultiTypeSearchService } from '../modules/search/services/multi-type-search.service';
import { SearchFilterPersistenceService } from '../modules/search/services/search-filter-persistence.service';
import { SearchAnalyticsService } from '../modules/search/services/search-analytics.service';
import { SavedSearchService, SavedSearchDto } from '../modules/search/services/saved-search.service';
import { SearchParams, SearchResults, SearchFilters, SortField, SortOrder, MultiTypeSearchResults } from '../modules/search/interfaces/search.interfaces';
import { CategorySearchResults } from '../modules/search/interfaces/category-search.interfaces';
import { ResourceType, ResourcePlan } from '@prisma/client';
import { Suggestion } from '../modules/search/types/suggestion.types';
export declare class SearchController {
    private readonly searchService;
    private readonly categorySearchService;
    private readonly multiTypeSearchService;
    private readonly filterPersistenceService;
    private readonly analyticsService;
    private readonly savedSearchService;
    private readonly logger;
    constructor(searchService: SearchService, categorySearchService: CategorySearchService, multiTypeSearchService: MultiTypeSearchService, filterPersistenceService: SearchFilterPersistenceService, analyticsService: SearchAnalyticsService, savedSearchService: SavedSearchService);
    search(request: Request, ipAddress: string, query?: string, categories?: string[], resourceTypes?: ResourceType[], plans?: ResourcePlan[], minPrice?: number, maxPrice?: number, verified?: boolean, city?: string, region?: string, tags?: string[], sort?: SortField, order?: SortOrder, page?: number, limit?: number, facets?: string[], language?: string): Promise<SearchResults>;
    suggest(query: string, limit?: number, userId?: string, includePopular?: boolean, sessionId?: string, language?: string): Promise<Suggestion[]>;
    getPopularSuggestions(limit?: number): Promise<Suggestion[]>;
    getSmartSuggestions(query: string, limit?: number, userId?: string): Promise<Suggestion[]>;
    searchByCategory(categoryId: string, query?: string, resourceTypes?: ResourceType[], plans?: ResourcePlan[], verified?: boolean, sort?: SortField, order?: SortOrder, page?: number, limit?: number): Promise<SearchResults>;
    searchByCategoryWithHierarchy(categoryId: string, query?: string, includeSubcategories?: boolean, maxDepth?: number, showCounts?: boolean, resourceTypes?: ResourceType[], plans?: ResourcePlan[], verified?: boolean, sort?: SortField, order?: SortOrder, page?: number, limit?: number): Promise<CategorySearchResults>;
    getCategoryHierarchy(categoryId?: string, includeResourceCounts?: boolean, maxDepth?: number): Promise<any>;
    searchByCategorySlug(slug: string, query?: string, includeSubcategories?: boolean, maxDepth?: number, showCounts?: boolean, resourceTypes?: ResourceType[], plans?: ResourcePlan[], verified?: boolean, sort?: SortField, order?: SortOrder, page?: number, limit?: number): Promise<CategorySearchResults>;
    searchMultiType(query?: string, includeTypes?: ResourceType[], groupByType?: boolean, globalRelevanceSort?: boolean, categories?: string[], plans?: ResourcePlan[], verified?: boolean, city?: string, region?: string, sort?: SortField, order?: SortOrder, page?: number, limit?: number): Promise<MultiTypeSearchResults>;
    getTypeDistribution(query?: string, categories?: string[], verified?: boolean, city?: string, region?: string): Promise<{
        [key in ResourceType]: number;
    }>;
    exportResultsByType(exportTypes: ResourceType[], query?: string, format?: 'json' | 'csv' | 'xlsx', categories?: string[], verified?: boolean, city?: string, region?: string, maxResults?: number): Promise<{
        [key in ResourceType]?: any;
    }>;
    searchSingleTypeWithContext(resourceType: ResourceType, query?: string, categories?: string[], plans?: ResourcePlan[], verified?: boolean, city?: string, region?: string, sort?: SortField, order?: SortOrder, page?: number, limit?: number): Promise<SearchResults>;
    getCategoryShareInfo(slug: string): Promise<any>;
    searchNearby(latitude: number, longitude: number, radius?: number, query?: string, categories?: string[], resourceTypes?: ResourceType[], page?: number, limit?: number): Promise<SearchResults>;
    saveFilters(sessionId: string, body: {
        filters: SearchFilters;
        activeTab?: ResourceType;
        searchQuery?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    loadFilters(sessionId: string): Promise<{
        filters: SearchFilters;
        activeTab?: ResourceType;
        searchQuery?: string;
        timestamp: Date;
    } | null>;
    updateActiveTab(sessionId: string, body: {
        activeTab: ResourceType;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    clearFilters(sessionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getFilterHistory(sessionId: string, limit?: number): Promise<{
        filters: SearchFilters;
        searchQuery?: string;
        timestamp: Date;
    }[]>;
    getPopularFilters(limit?: number): Promise<{
        filters: Partial<SearchFilters>;
        usage: number;
    }[]>;
    searchMultiTypeWithPersistence(sessionId: string, query?: string, includeTypes?: ResourceType[], overrideFilters?: boolean, groupByType?: boolean, globalRelevanceSort?: boolean, page?: number, limit?: number): Promise<MultiTypeSearchResults>;
    private generateBreadcrumbsSchema;
    private generateSessionId;
    private extractUserId;
    private logSearchAnalytics;
    logClick(body: {
        searchLogId?: string;
        resourceId: string;
        position: number;
        query?: string;
        sessionId?: string;
    }, request: Request, ipAddress: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPopularTerms(from?: string, to?: string, limit?: number): Promise<any[]>;
    getNoResultsQueries(from?: string, to?: string, limit?: number): Promise<any[]>;
    getSearchMetrics(from?: string, to?: string): Promise<any>;
    getResourceClickStats(resourceId: string, from?: string, to?: string): Promise<any>;
    getAnalyticsDashboard(from?: string, to?: string): Promise<any>;
    private generateRecommendations;
    getDashboardUI(): string;
    createSavedSearch(data: SavedSearchDto, userId?: string): Promise<{
        success: boolean;
        data: import("../modules/search/services/saved-search.service").SavedSearchResponse;
        message: string;
    }>;
    personalizedSearch(userId?: string, query?: string, categories?: string[], resourceTypes?: ResourceType[], plans?: ResourcePlan[], verified?: boolean, city?: string, region?: string, page?: number, limit?: number, sortBy?: SortField, sortOrder?: SortOrder, personalizationWeight?: number, request?: Request): Promise<{
        success: boolean;
        data: SearchResults;
        message: string;
    }>;
    getUserSavedSearches(userId?: string, page?: number, limit?: number): Promise<{
        success: boolean;
        data: import("../modules/search/services/saved-search.service").SavedSearchListResponse;
        message: string;
    }>;
    getSavedSearchById(searchId: string, userId?: string): Promise<{
        success: boolean;
        data: import("../modules/search/services/saved-search.service").SavedSearchResponse;
        message: string;
    }>;
    updateSavedSearch(searchId: string, data: Partial<SavedSearchDto>, userId?: string): Promise<{
        success: boolean;
        data: import("../modules/search/services/saved-search.service").SavedSearchResponse;
        message: string;
    }>;
    deleteSavedSearch(searchId: string, userId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    executeSavedSearch(searchId: string, userId?: string, personalized?: boolean, personalizationWeight?: number): Promise<{
        success: boolean;
        data: SearchResults;
        message: string;
    }>;
    setSearchLanguage(body: {
        language: string;
    }, req: Request, ip: string): Promise<{
        success: boolean;
        data: {
            language: string;
            message: string;
            supportedLanguages: string[];
        };
    }>;
    detectQueryLanguage(query: string): Promise<{
        success: boolean;
        data: {
            query: string;
            detectedLanguage: import("../modules/search/services/language-detection.service").SupportedLanguage;
            confidence: number;
            allLanguages: {
                language: import("../modules/search/services/language-detection.service").SupportedLanguage;
                confidence: number;
            }[];
            recommendedAnalyzer: string;
            recommendedSearchAnalyzer: string;
            recommendedFields: string[];
        };
    }>;
    getSupportedLanguages(): Promise<{
        success: boolean;
        data: {
            supportedLanguages: {
                code: string;
                name: string;
                description: string;
                default: boolean;
            }[];
            defaultLanguage: string;
            autoDetectionAvailable: boolean;
        };
    }>;
    changeSearchLanguage(body: {
        searchParams: SearchParams;
        newLanguage: string;
        cacheKey?: string;
    }): Promise<SearchResults>;
    getResultLanguages(resultId: string): Promise<{
        languages: string[];
        translationsAvailable: boolean;
    }>;
}
