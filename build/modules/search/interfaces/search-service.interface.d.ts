import { SearchParams, SearchResults, GeoLocation, SearchMetrics, TimePeriod, HealthStatus } from './search.interfaces';
import { Suggestion } from '../types/suggestion.types';
export interface ISearchService {
    search(params: SearchParams): Promise<SearchResults>;
    suggest(query: string, limit?: number, userId?: string): Promise<Suggestion[]>;
    searchByCategory(categoryId: string, params: SearchParams): Promise<SearchResults>;
    searchNearby(location: GeoLocation, radius: number, params: SearchParams): Promise<SearchResults>;
    searchByCity(city: string, params: SearchParams): Promise<SearchResults>;
    searchByRegion(region: string, params: SearchParams): Promise<SearchResults>;
    searchByAddress(address: string, radius: number, params: SearchParams): Promise<SearchResults>;
    searchNearUser(userLocation: GeoLocation, radius: number, params: SearchParams): Promise<SearchResults>;
    personalizedSearch(userId: string, params: SearchParams): Promise<SearchResults>;
    checkHealth(): Promise<HealthStatus>;
    getMetrics(period: TimePeriod): Promise<SearchMetrics>;
}
