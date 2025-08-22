import { PrismaService } from '../../../config/prisma.service';
import { SearchParams, SearchFilters } from '../interfaces/search.interfaces';
export interface SavedSearchDto {
    name: string;
    query: string;
    filters: SearchFilters;
    isPublic?: boolean;
}
export interface SavedSearchResponse {
    id: string;
    name: string;
    query: string;
    filters: SearchFilters;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}
export interface SavedSearchListResponse {
    searches: SavedSearchResponse[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class SavedSearchService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSavedSearch(userId: string, data: SavedSearchDto): Promise<SavedSearchResponse>;
    getUserSavedSearches(userId: string, page?: number, limit?: number): Promise<SavedSearchListResponse>;
    getSavedSearchById(userId: string, searchId: string): Promise<SavedSearchResponse>;
    updateSavedSearch(userId: string, searchId: string, data: Partial<SavedSearchDto>): Promise<SavedSearchResponse>;
    deleteSavedSearch(userId: string, searchId: string): Promise<void>;
    getPopularPublicSearches(limit?: number): Promise<SavedSearchResponse[]>;
    convertToSearchParams(userId: string, searchId: string): Promise<SearchParams>;
    duplicateSavedSearch(userId: string, searchId: string, newName?: string): Promise<SavedSearchResponse>;
    getUserSavedSearchStats(userId: string): Promise<{
        totalSearches: number;
        publicSearches: number;
        privateSearches: number;
        mostUsedCategories: Array<{
            category: string;
            count: number;
        }>;
        recentActivity: Date | null;
    }>;
    private validateSavedSearchData;
    private transformSavedSearch;
}
