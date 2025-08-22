import { SearchParams, SearchResults } from '../interfaces/search.interfaces';
import { SearchAnalyticsService } from './search-analytics.service';
export interface UserPreferences {
    topCategories: Array<{
        categoryId: string;
        categoryName: string;
        searchCount: number;
        weight: number;
    }>;
    topTerms: Array<{
        term: string;
        count: number;
        weight: number;
    }>;
    recentSearches: Array<{
        query: string;
        filters: any;
        createdAt: Date;
        resultsCount: number;
    }>;
    clickedResources: Array<{
        resourceId: string;
        clickCount: number;
        lastClicked: Date;
        weight: number;
    }>;
}
export interface PersonalizedSearchParams extends SearchParams {
    userId: string;
    usePersonalization?: boolean;
    personalizationWeight?: number;
}
export declare class PersonalizedSearchService {
    private readonly analyticsService;
    private readonly logger;
    constructor(analyticsService: SearchAnalyticsService);
    getUserPreferences(userId: string, lookbackDays?: number): Promise<UserPreferences>;
    personalizeSearchParams(params: PersonalizedSearchParams): Promise<SearchParams>;
    personalizeSearchResults(results: SearchResults, userId: string, personalizationWeight?: number): Promise<SearchResults>;
    private calculateCategoryWeight;
    private calculateTermWeight;
    private getClickedResources;
    private applyPersonalizationToFilters;
    private applyPersonalizationToQuery;
    private calculatePersonalizedScore;
    private calculateCategoryBoost;
    private calculateClickBoost;
    private getPersonalizationReasons;
    private calculateAverageBoost;
    private getDefaultPreferences;
}
