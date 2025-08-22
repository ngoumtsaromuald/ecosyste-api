import { SearchParams, SearchResults } from '../interfaces/search.interfaces.simple';
export declare class SearchServiceSimple {
    private readonly logger;
    search(params: SearchParams): Promise<SearchResults>;
    health(): Promise<any>;
}
