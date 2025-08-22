"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MultiTypeSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiTypeSearchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const search_service_1 = require("./search.service");
const elasticsearch_service_1 = require("./elasticsearch.service");
const search_cache_service_1 = require("./search-cache.service");
let MultiTypeSearchService = MultiTypeSearchService_1 = class MultiTypeSearchService {
    constructor(searchService, elasticsearchService, cacheService, configService) {
        this.searchService = searchService;
        this.elasticsearchService = elasticsearchService;
        this.cacheService = cacheService;
        this.configService = configService;
        this.logger = new common_1.Logger(MultiTypeSearchService_1.name);
    }
    async searchAllTypes(params) {
        const startTime = Date.now();
        try {
            this.logger.debug(`Multi-type search started with params: ${JSON.stringify(params)}`);
            const typesToSearch = params.includeTypes && params.includeTypes.length > 0
                ? params.includeTypes
                : Object.values(client_1.ResourceType);
            this.logger.debug(`Searching in types: ${typesToSearch.join(', ')}`);
            const cacheKey = this.generateMultiTypeCacheKey(params);
            const cachedResults = await this.cacheService.getCachedSearchResults(cacheKey);
            if (cachedResults && this.isValidMultiTypeCache(cachedResults)) {
                this.logger.debug(`Returning cached multi-type results for key: ${cacheKey}`);
                return cachedResults;
            }
            const searchPromises = typesToSearch.map(type => this.searchSingleTypeWithContext(type, params));
            const typeResults = await Promise.allSettled(searchPromises);
            const resultsByType = {};
            const allHits = [];
            let totalAcrossTypes = 0;
            const typeDistribution = {};
            typesToSearch.forEach((type, index) => {
                const result = typeResults[index];
                if (result.status === 'fulfilled') {
                    const searchResult = result.value;
                    resultsByType[type] = {
                        hits: searchResult.hits,
                        total: searchResult.total,
                        facets: searchResult.facets
                    };
                    allHits.push(...searchResult.hits);
                    totalAcrossTypes += searchResult.total;
                    typeDistribution[type] = searchResult.total;
                }
                else {
                    this.logger.error(`Search failed for type ${type}: ${result.reason}`);
                    resultsByType[type] = {
                        hits: [],
                        total: 0,
                        facets: this.getEmptyFacets()
                    };
                    typeDistribution[type] = 0;
                }
            });
            const combinedResults = this.sortByGlobalRelevance(allHits, params);
            const globalFacets = this.buildGlobalFacets(resultsByType);
            const multiTypeResults = {
                resultsByType,
                combinedResults: this.applyPagination(combinedResults, params.pagination),
                totalAcrossTypes,
                globalFacets,
                took: Date.now() - startTime,
                page: params.pagination?.page,
                limit: params.pagination?.limit,
                hasMore: this.calculateHasMore(combinedResults.length, params.pagination),
                metadata: {
                    query: params.query,
                    filters: params.filters,
                    pagination: params.pagination,
                    typeDistribution,
                    searchedTypes: typesToSearch,
                    groupByType: params.groupByType,
                    globalRelevanceSort: params.globalRelevanceSort
                }
            };
            await this.cacheService.cacheSearchResults(cacheKey, multiTypeResults);
            this.logger.debug(`Multi-type search completed in ${multiTypeResults.took}ms, found ${totalAcrossTypes} total results`);
            return multiTypeResults;
        }
        catch (error) {
            this.logger.error(`Multi-type search failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async searchWithTypeGrouping(params) {
        const groupedParams = {
            ...params,
            groupByType: true,
            globalRelevanceSort: false
        };
        return this.searchAllTypes(groupedParams);
    }
    async searchSingleTypeWithContext(resourceType, params) {
        try {
            this.logger.debug(`Single type search for: ${resourceType}`);
            const typeFilteredParams = {
                ...params,
                filters: {
                    ...params.filters,
                    resourceTypes: [resourceType]
                }
            };
            const results = await this.searchService.search(typeFilteredParams);
            return {
                ...results,
                metadata: {
                    ...results.metadata,
                    searchedType: resourceType,
                    isMultiTypeContext: true
                }
            };
        }
        catch (error) {
            this.logger.error(`Single type search failed for ${resourceType}: ${error.message}`);
            throw error;
        }
    }
    async getTypeDistribution(params) {
        try {
            this.logger.debug(`Getting type distribution for query: ${params.query}`);
            const indexName = this.configService.get('elasticsearch.indices.resources');
            const query = this.buildTypeDistributionQuery(params);
            const response = await this.elasticsearchService.search(indexName, query);
            const distribution = {};
            if (response.aggregations?.type_distribution?.buckets) {
                response.aggregations.type_distribution.buckets.forEach((bucket) => {
                    const resourceType = bucket.key;
                    distribution[resourceType] = bucket.doc_count;
                });
            }
            Object.values(client_1.ResourceType).forEach(type => {
                if (!(type in distribution)) {
                    distribution[type] = 0;
                }
            });
            this.logger.debug(`Type distribution: ${JSON.stringify(distribution)}`);
            return distribution;
        }
        catch (error) {
            this.logger.error(`Failed to get type distribution: ${error.message}`);
            throw error;
        }
    }
    async exportResultsByType(params, exportTypes, format) {
        try {
            this.logger.debug(`Exporting results by type: ${exportTypes.join(', ')} in format: ${format}`);
            const exportResults = {};
            const exportPromises = exportTypes.map(async (type) => {
                const exportParams = {
                    ...params,
                    filters: {
                        ...params.filters,
                        resourceTypes: [type]
                    },
                    pagination: {
                        page: 1,
                        limit: params.limitsPerType?.[type] || 1000
                    }
                };
                const results = await this.searchService.search(exportParams);
                return {
                    type,
                    data: this.formatExportData(results.hits, format),
                    count: results.total,
                    exportedAt: new Date()
                };
            });
            const exportData = await Promise.all(exportPromises);
            exportData.forEach(({ type, data, count, exportedAt }) => {
                exportResults[type] = {
                    data,
                    count,
                    exportedAt,
                    format
                };
            });
            this.logger.debug(`Export completed for ${exportTypes.length} types`);
            return exportResults;
        }
        catch (error) {
            this.logger.error(`Export failed: ${error.message}`);
            throw error;
        }
    }
    buildTypeDistributionQuery(params) {
        const query = {
            size: 0,
            query: {
                bool: {
                    must: [],
                    filter: []
                }
            },
            aggs: {
                type_distribution: {
                    terms: {
                        field: 'resourceType',
                        size: Object.values(client_1.ResourceType).length
                    }
                }
            }
        };
        if (params.query) {
            query.query.bool.must.push({
                multi_match: {
                    query: params.query,
                    fields: [
                        'name^3',
                        'description^2',
                        'category.name^2',
                        'tags'
                    ],
                    type: 'best_fields',
                    fuzziness: 'AUTO'
                }
            });
        }
        if (params.filters) {
            if (params.filters.categories && params.filters.categories.length > 0) {
                query.query.bool.filter.push({
                    terms: { 'category.id': params.filters.categories }
                });
            }
            if (params.filters.verified !== undefined) {
                query.query.bool.filter.push({
                    term: { verified: params.filters.verified }
                });
            }
            if (params.filters.plans && params.filters.plans.length > 0) {
                query.query.bool.filter.push({
                    terms: { plan: params.filters.plans }
                });
            }
        }
        return query;
    }
    sortByGlobalRelevance(hits, params) {
        if (!params.globalRelevanceSort) {
            return hits;
        }
        return hits.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            const typePriority = {
                [client_1.ResourceType.API]: 4,
                [client_1.ResourceType.SERVICE]: 3,
                [client_1.ResourceType.BUSINESS]: 2,
                [client_1.ResourceType.DATA]: 1
            };
            const aPriority = typePriority[a.resourceType] || 0;
            const bPriority = typePriority[b.resourceType] || 0;
            if (bPriority !== aPriority) {
                return bPriority - aPriority;
            }
            if (a.verified !== b.verified) {
                return a.verified ? -1 : 1;
            }
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    }
    buildGlobalFacets(resultsByType) {
        const globalFacets = {
            categories: [],
            resourceTypes: [],
            plans: [],
            cities: [],
            regions: [],
            verified: [],
            tags: []
        };
        Object.values(resultsByType).forEach(typeResult => {
            if (typeResult.facets) {
                this.mergeFacetBuckets(globalFacets.categories, typeResult.facets.categories);
                this.mergeFacetBuckets(globalFacets.resourceTypes, typeResult.facets.resourceTypes);
                this.mergeFacetBuckets(globalFacets.plans, typeResult.facets.plans);
                this.mergeFacetBuckets(globalFacets.cities, typeResult.facets.cities);
                this.mergeFacetBuckets(globalFacets.regions, typeResult.facets.regions);
                this.mergeFacetBuckets(globalFacets.verified, typeResult.facets.verified);
                this.mergeFacetBuckets(globalFacets.tags, typeResult.facets.tags);
            }
        });
        Object.keys(globalFacets).forEach(key => {
            if (Array.isArray(globalFacets[key])) {
                globalFacets[key].sort((a, b) => b.count - a.count);
            }
        });
        return globalFacets;
    }
    mergeFacetBuckets(target, source) {
        if (!source || !Array.isArray(source))
            return;
        source.forEach(sourceBucket => {
            const existingBucket = target.find(bucket => bucket.key === sourceBucket.key);
            if (existingBucket) {
                existingBucket.count += sourceBucket.count;
            }
            else {
                target.push({ ...sourceBucket });
            }
        });
    }
    applyPagination(hits, pagination) {
        if (!pagination)
            return hits;
        const page = pagination.page || 1;
        const limit = pagination.limit || 20;
        const offset = (page - 1) * limit;
        return hits.slice(offset, offset + limit);
    }
    calculateHasMore(totalHits, pagination) {
        if (!pagination)
            return false;
        const page = pagination.page || 1;
        const limit = pagination.limit || 20;
        const offset = (page - 1) * limit;
        return totalHits > offset + limit;
    }
    formatExportData(hits, format) {
        switch (format) {
            case 'json':
                return hits.map(hit => ({
                    id: hit.id,
                    name: hit.name,
                    description: hit.description,
                    resourceType: hit.resourceType,
                    category: hit.category.name,
                    plan: hit.plan,
                    verified: hit.verified,
                    location: hit.location,
                    contact: hit.contact,
                    tags: hit.tags,
                    createdAt: hit.createdAt,
                    updatedAt: hit.updatedAt,
                    score: hit.score
                }));
            case 'csv':
                return hits.map(hit => ({
                    ID: hit.id,
                    Nom: hit.name,
                    Description: hit.description,
                    Type: hit.resourceType,
                    Catégorie: hit.category.name,
                    Plan: hit.plan,
                    Vérifié: hit.verified ? 'Oui' : 'Non',
                    Ville: hit.location?.city || '',
                    Région: hit.location?.region || '',
                    Email: hit.contact?.email || '',
                    Téléphone: hit.contact?.phone || '',
                    Site_Web: hit.contact?.website || '',
                    Tags: hit.tags?.join(', ') || '',
                    Date_Création: hit.createdAt,
                    Date_Modification: hit.updatedAt,
                    Score_Pertinence: hit.score
                }));
            default:
                return hits;
        }
    }
    generateMultiTypeCacheKey(params) {
        const keyParts = [
            'multitype',
            params.query || 'empty',
            JSON.stringify(params.filters || {}),
            JSON.stringify(params.includeTypes || []),
            params.groupByType ? 'grouped' : 'combined',
            params.globalRelevanceSort ? 'global' : 'type',
            JSON.stringify(params.pagination || {}),
            JSON.stringify(params.sort || {})
        ];
        return keyParts.join(':');
    }
    isValidMultiTypeCache(cached) {
        return cached &&
            cached.resultsByType &&
            cached.combinedResults &&
            typeof cached.totalAcrossTypes === 'number';
    }
    getEmptyFacets() {
        return {
            categories: [],
            resourceTypes: [],
            plans: [],
            cities: [],
            regions: [],
            verified: [],
            tags: []
        };
    }
};
exports.MultiTypeSearchService = MultiTypeSearchService;
exports.MultiTypeSearchService = MultiTypeSearchService = MultiTypeSearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_service_1.SearchService,
        elasticsearch_service_1.ElasticsearchService,
        search_cache_service_1.SearchCacheService,
        config_1.ConfigService])
], MultiTypeSearchService);
//# sourceMappingURL=multi-type-search.service.js.map