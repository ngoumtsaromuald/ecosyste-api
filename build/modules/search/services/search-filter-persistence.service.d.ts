import { SearchCacheService } from './search-cache.service';
import { SearchFilters, MultiTypeSearchParams } from '../interfaces/search.interfaces';
import { ResourceType } from '@prisma/client';
export declare class SearchFilterPersistenceService {
    private readonly cacheService;
    private readonly logger;
    private readonly FILTER_CACHE_PREFIX;
    private readonly FILTER_TTL;
    constructor(cacheService: SearchCacheService);
    saveFilters(sessionId: string, filters: SearchFilters, activeTab?: ResourceType, searchQuery?: string): Promise<void>;
    getFilters(sessionId: string): Promise<{
        filters: SearchFilters;
        activeTab?: ResourceType;
        searchQuery?: string;
        timestamp: Date;
    } | null>;
    updateActiveTab(sessionId: string, activeTab: ResourceType): Promise<void>;
    updateFilters(sessionId: string, filters: SearchFilters, searchQuery?: string): Promise<void>;
    clearFilters(sessionId: string): Promise<void>;
    applyPersistedFilters(sessionId: string, params: MultiTypeSearchParams): Promise<MultiTypeSearchParams>;
    getFilterHistory(sessionId: string, limit?: number): Promise<{
        filters: SearchFilters;
        searchQuery?: string;
        timestamp: Date;
    }[]>;
    addToFilterHistory(sessionId: string, filters: SearchFilters, searchQuery?: string): Promise<void>;
    getPopularFilters(limit?: number): Promise<{
        filters: Partial<SearchFilters>;
        usage: number;
    }[]>;
    recordFilterUsage(filters: SearchFilters): Promise<void>;
    private generateFilterCacheKey;
    private mergeFilters;
    private normalizeFiltersForStats;
}
