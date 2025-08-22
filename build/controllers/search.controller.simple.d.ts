import { SearchServiceSimple } from '../modules/search/services/search.service.simple';
export declare class SearchControllerSimple {
    private readonly searchService;
    private readonly logger;
    constructor(searchService: SearchServiceSimple);
    search(query?: string, limit?: number, offset?: number): Promise<{
        success: boolean;
        data: import("../modules/search/interfaces/search.interfaces.simple").SearchResults;
        timestamp: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        timestamp: string;
        data?: undefined;
    }>;
    health(): Promise<{
        success: boolean;
        data: any;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message: string;
        data?: undefined;
    }>;
}
