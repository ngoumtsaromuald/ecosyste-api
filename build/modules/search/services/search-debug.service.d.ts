import { ConfigService } from '@nestjs/config';
import { SearchParams, SearchResults, SearchFilters } from '../interfaces/search.interfaces';
import { SearchLoggerService } from './search-logger.service';
export interface DebugSearchRequest {
    searchId: string;
    params: SearchParams;
    userId?: string;
    sessionId?: string;
    enableProfiling?: boolean;
    explainQuery?: boolean;
    includeRawResponse?: boolean;
    debugLevel: 'basic' | 'detailed' | 'verbose';
}
export interface DebugSearchResponse {
    searchId: string;
    results: SearchResults;
    debugInfo: {
        query: {
            original: SearchParams;
            processed: SearchParams;
            elasticsearch: any;
            explanation?: any;
        };
        performance: {
            totalTime: number;
            breakdown: {
                preprocessing: number;
                elasticsearch: number;
                postprocessing: number;
                caching: number;
            };
            bottlenecks: string[];
        };
        cache: {
            key: string;
            hit: boolean;
            ttl?: number;
            size?: number;
        };
        elasticsearch: {
            took: number;
            timedOut: boolean;
            shards: {
                total: number;
                successful: number;
                skipped: number;
                failed: number;
            };
            rawResponse?: any;
        };
        personalization?: {
            applied: boolean;
            userId?: string;
            preferences?: any;
            adjustments?: any;
        };
        language: {
            detected: string;
            confidence: number;
            analyzer: string;
        };
        filters: {
            applied: SearchFilters;
            processed: any;
            facets: any;
        };
        suggestions?: {
            count: number;
            sources: string[];
            ranking: any;
        };
        warnings: string[];
        recommendations: string[];
    };
}
export interface QueryExplanation {
    query: any;
    explanation: {
        value: number;
        description: string;
        details: any[];
    };
    matchedDocuments: number;
    executionTime: number;
}
export declare class SearchDebugService {
    private readonly configService;
    private readonly searchLogger;
    private readonly logger;
    private readonly debugEnabled;
    constructor(configService: ConfigService, searchLogger: SearchLoggerService);
    debugSearch(request: DebugSearchRequest, searchOperation: (params: SearchParams) => Promise<SearchResults>): Promise<DebugSearchResponse>;
    private preprocessSearchParams;
    private executeSearchWithProfiling;
    private postprocessResults;
    private detectLanguage;
    private normalizeQuery;
    private validateAndProcessFilters;
    private buildElasticsearchQuery;
    private explainQuery;
    private analyzeResultQuality;
    private analyzeSuggestionRanking;
    private identifyBottlenecks;
    private generateRecommendations;
    getDebugStatistics(): {
        debugEnabled: boolean;
        totalDebugRequests: number;
        averageDebugTime: number;
        commonBottlenecks: string[];
    };
    setDebugMode(enabled: boolean): void;
    clearDebugData(): void;
}
