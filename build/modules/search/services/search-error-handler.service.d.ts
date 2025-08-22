import { ConfigService } from '@nestjs/config';
import { SearchResults, SearchParams } from '../interfaces/search.interfaces';
import { SearchCacheService } from './search-cache.service';
import { ApiResourceRepository } from '../../../repositories/api-resource.repository';
export declare class SearchErrorHandler {
    private readonly cacheService;
    private readonly apiResourceRepository;
    private readonly configService;
    private readonly logger;
    constructor(cacheService: SearchCacheService, apiResourceRepository: ApiResourceRepository, configService: ConfigService);
    handleSearchError(error: any, query?: string, params?: SearchParams): Promise<SearchResults>;
    handleSuggestionError(error: any, query?: string): Promise<any[]>;
    private getErrorType;
    private getEmptyResults;
    private getEmptyFacets;
    isRecoverableError(error: any): boolean;
    simplifyQuery(originalQuery: string): string;
    createFallbackQuery(originalQuery?: string): any;
    private fallbackToPostgreSQL;
    private fallbackWithTimeout;
    private fallbackWithSimplifiedQuery;
    private fallbackToPopularResults;
    private fallbackSuggestionsFromPostgreSQL;
    private tryGetCachedResults;
    private buildPostgreSQLFilters;
    private transformPostgreSQLResults;
    private transformCachedPopularResults;
    private generateCacheKey;
    isElasticsearchAvailable(): Promise<boolean>;
    getErrorMetrics(): {
        totalErrors: number;
        errorsByType: Record<string, number>;
        fallbacksUsed: Record<string, number>;
    };
}
