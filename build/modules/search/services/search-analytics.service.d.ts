import { PrismaService } from '../../../config/prisma.service';
import { ISearchAnalyticsService } from '../interfaces/search-analytics.interface';
import { SearchLogParams, SearchMetrics, PopularTerm, NoResultsQuery, DateRangeWithGranularity } from '../interfaces/search.interfaces';
export declare class SearchAnalyticsService implements ISearchAnalyticsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    logSearch(params: SearchLogParams): Promise<string>;
    logClick(searchLogId: string, resourceId: string, position: number, userId?: string): Promise<void>;
    getPopularTerms(period: DateRangeWithGranularity, limit?: number): Promise<PopularTerm[]>;
    getNoResultsQueries(period: DateRangeWithGranularity, limit?: number): Promise<NoResultsQuery[]>;
    getSearchMetrics(period: DateRangeWithGranularity): Promise<SearchMetrics>;
    getClickStats(resourceId: string, period: DateRangeWithGranularity): Promise<{
        totalClicks: number;
        uniqueUsers: number;
        averagePosition: number;
        clickThroughRate: number;
    }>;
    getUserSearchHistory(userId: string, limit?: number): Promise<{
        searches: Array<{
            query: string;
            filters: any;
            createdAt: Date;
            resultsCount: number;
        }>;
        topCategories: Array<{
            categoryId: string;
            categoryName: string;
            searchCount: number;
        }>;
        topTerms: Array<{
            term: string;
            count: number;
        }>;
    }>;
    cleanupOldLogs(retentionDays: number): Promise<{
        deletedSearchLogs: number;
        deletedSearchClicks: number;
    }>;
    private anonymizeIpAddress;
    private getTotalSearches;
    private getAverageResponseTime;
    private getClickThroughRate;
}
