import { ConfigService } from '@nestjs/config';
import { ResourceType } from '@prisma/client';
import { MultiTypeSearchParams, MultiTypeSearchResults, SearchResults, SearchParams } from '../interfaces/search.interfaces';
import { IMultiTypeSearchService } from '../interfaces/multi-type-search.interface';
import { SearchService } from './search.service';
import { ElasticsearchService } from './elasticsearch.service';
import { SearchCacheService } from './search-cache.service';
export declare class MultiTypeSearchService implements IMultiTypeSearchService {
    private readonly searchService;
    private readonly elasticsearchService;
    private readonly cacheService;
    private readonly configService;
    private readonly logger;
    constructor(searchService: SearchService, elasticsearchService: ElasticsearchService, cacheService: SearchCacheService, configService: ConfigService);
    searchAllTypes(params: MultiTypeSearchParams): Promise<MultiTypeSearchResults>;
    searchWithTypeGrouping(params: MultiTypeSearchParams): Promise<MultiTypeSearchResults>;
    searchSingleTypeWithContext(resourceType: ResourceType, params: SearchParams): Promise<SearchResults>;
    getTypeDistribution(params: MultiTypeSearchParams): Promise<{
        [key in ResourceType]: number;
    }>;
    exportResultsByType(params: MultiTypeSearchParams, exportTypes: ResourceType[], format: 'json' | 'csv' | 'xlsx'): Promise<{
        [key in ResourceType]?: any;
    }>;
    private buildTypeDistributionQuery;
    private sortByGlobalRelevance;
    private buildGlobalFacets;
    private mergeFacetBuckets;
    private applyPagination;
    private calculateHasMore;
    private formatExportData;
    private generateMultiTypeCacheKey;
    private isValidMultiTypeCache;
    private getEmptyFacets;
}
