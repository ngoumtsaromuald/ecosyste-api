import { Counter, Gauge, Histogram } from 'prom-client';
import { SearchParams, SearchResults } from '../interfaces/search.interfaces';
export interface SearchMetrics {
    searchLatency: Histogram<string>;
    searchRequestsTotal: Counter<string>;
    searchResultsCount: Histogram<string>;
    searchErrorsTotal: Counter<string>;
    searchCacheHitRate: Gauge<string>;
    searchActiveQueries: Gauge<string>;
    searchIndexHealth: Gauge<string>;
    searchSuggestionLatency: Histogram<string>;
    searchGeographicQueries: Counter<string>;
    searchPersonalizedQueries: Counter<string>;
}
export declare class SearchMetricsService {
    private readonly logger;
    private readonly searchLatency;
    private readonly searchRequestsTotal;
    private readonly searchResultsCount;
    private readonly searchErrorsTotal;
    private readonly searchCacheHitRate;
    private readonly searchActiveQueries;
    private readonly searchIndexHealth;
    private readonly searchSuggestionLatency;
    private readonly searchGeographicQueries;
    private readonly searchPersonalizedQueries;
    private readonly searchQueryLength;
    private readonly searchFilterUsage;
    constructor();
    recordSearchLatency(duration: number, searchType: string, status: 'success' | 'error', cacheHit?: boolean): void;
    recordSearchRequest(searchType: string, status: 'success' | 'error', userType?: 'authenticated' | 'anonymous'): void;
    recordSearchResults(resultsCount: number, searchType: string, hasFilters?: boolean): void;
    recordSearchError(errorType: string, searchType: string, component?: string): void;
    updateCacheHitRate(cacheType: string, hitRate: number): void;
    updateActiveQueries(count: number): void;
    updateIndexHealth(indexName: string, healthStatus: 'green' | 'yellow' | 'red'): void;
    recordSuggestionLatency(duration: number, suggestionType: string): void;
    recordGeographicQuery(locationType: string, radiusKm: number): void;
    recordPersonalizedQuery(personalizationType: string, userSegment: string): void;
    recordQueryCharacteristics(params: SearchParams): void;
    recordSearchMetrics(params: SearchParams, results: SearchResults, duration: number, searchType: string, cacheHit?: boolean, userType?: 'authenticated' | 'anonymous'): void;
    getMetrics(): Promise<string>;
    getSearchMetricsSummary(): SearchMetrics;
    clearMetrics(): void;
    private getRadiusRange;
}
