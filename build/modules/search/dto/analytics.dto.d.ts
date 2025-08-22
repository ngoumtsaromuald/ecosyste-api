import { TimePeriod } from '../interfaces/search.interfaces';
export declare class LogSearchDto {
    query: string;
    filters?: Record<string, any>;
    userId?: string;
    sessionId: string;
    userAgent?: string;
    ipAddress?: string;
    resultsCount: number;
    took: number;
}
export declare class LogClickDto {
    searchLogId: string;
    resourceId: string;
    userId?: string;
    position: number;
}
export declare class SearchMetricsParamsDto {
    period: TimePeriod;
    startDate?: string;
    endDate?: string;
    userId?: string;
    limit?: number;
}
export declare class PopularTermsParamsDto {
    period: TimePeriod;
    limit?: number;
    minCount?: number;
}
export declare class NoResultsQueriesParamsDto {
    period: TimePeriod;
    limit?: number;
    minCount?: number;
}
export declare class CreateSavedSearchDto {
    userId: string;
    name: string;
    query: string;
    filters?: Record<string, any>;
    isPublic?: boolean;
}
export declare class UpdateSavedSearchDto {
    name?: string;
    query?: string;
    filters?: Record<string, any>;
    isPublic?: boolean;
}
