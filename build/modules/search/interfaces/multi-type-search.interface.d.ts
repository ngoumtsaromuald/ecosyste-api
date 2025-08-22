import { ResourceType } from '@prisma/client';
import { MultiTypeSearchParams, MultiTypeSearchResults, SearchResults, SearchParams } from './search.interfaces';
export interface IMultiTypeSearchService {
    searchAllTypes(params: MultiTypeSearchParams): Promise<MultiTypeSearchResults>;
    searchWithTypeGrouping(params: MultiTypeSearchParams): Promise<MultiTypeSearchResults>;
    searchSingleTypeWithContext(resourceType: ResourceType, params: SearchParams): Promise<SearchResults>;
    getTypeDistribution(params: MultiTypeSearchParams): Promise<{
        [key in ResourceType]: number;
    }>;
    exportResultsByType(params: MultiTypeSearchParams, exportTypes: ResourceType[], format: 'json' | 'csv' | 'xlsx'): Promise<{
        [key in ResourceType]?: any;
    }>;
}
export interface ExportConfig {
    format: 'json' | 'csv' | 'xlsx';
    includeTypes: ResourceType[];
    maxResultsPerType?: number;
    includeMetadata?: boolean;
    filename?: string;
}
export interface ExportResults {
    [key: string]: {
        type: ResourceType;
        data: any[];
        count: number;
        exportedAt: Date;
    };
}
