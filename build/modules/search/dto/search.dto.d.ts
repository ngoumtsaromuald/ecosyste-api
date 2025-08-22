import { ResourceType, ResourcePlan } from '@prisma/client';
import { SortField, SortOrder } from '../interfaces/search.interfaces';
export declare class SearchParamsDto {
    query?: string;
    filters?: SearchFiltersDto;
    sort?: SortOptionsDto;
    pagination?: PaginationParamsDto;
    facets?: string[];
    userId?: string;
    sessionId?: string;
}
export declare class SearchFiltersDto {
    categories?: string[];
    resourceTypes?: ResourceType[];
    plans?: ResourcePlan[];
    location?: GeoFilterDto;
    priceRange?: PriceRangeDto;
    verified?: boolean;
    city?: string;
    region?: string;
    country?: string;
    tags?: string[];
    dateRange?: DateRangeDto;
}
export declare class GeoFilterDto {
    latitude: number;
    longitude: number;
    radius: number;
    unit?: 'km' | 'mi';
}
export declare class PriceRangeDto {
    min?: number;
    max?: number;
    currency?: string;
}
export declare class DateRangeDto {
    from?: string;
    to?: string;
}
export declare class SortOptionsDto {
    field: SortField;
    order: SortOrder;
}
export declare class PaginationParamsDto {
    page?: number;
    limit?: number;
    offset?: number;
    searchAfter?: string;
}
export declare class SearchByCategoryDto extends SearchParamsDto {
    categoryId: string;
}
export declare class SearchNearbyDto extends SearchParamsDto {
    location: GeoFilterDto;
}
export declare class PersonalizedSearchDto extends SearchParamsDto {
    userId: string;
}
export declare class SearchByAddressDto extends SearchParamsDto {
    address: string;
    radius?: number;
}
export declare class SearchNearUserDto extends SearchParamsDto {
    userLocation: GeoFilterDto;
    radius?: number;
}
export declare class SearchByCityDto extends SearchParamsDto {
    city: string;
}
export declare class SearchByRegionDto extends SearchParamsDto {
    region: string;
}
export declare class SearchLogDto {
    query: string;
    filters?: SearchFiltersDto;
    userId?: string;
    sessionId: string;
    userAgent: string;
    ipAddress: string;
    resultsCount: number;
    took: number;
}
export declare class SearchClickDto {
    searchLogId: string;
    resourceId: string;
    userId?: string;
    position: number;
}
export declare class SavedSearchDto {
    name: string;
    query: string;
    filters?: SearchFiltersDto;
    isPublic?: boolean;
}
