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
var SearchErrorHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchErrorHandler = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const search_cache_service_1 = require("./search-cache.service");
const api_resource_repository_1 = require("../../../repositories/api-resource.repository");
const client_1 = require("@prisma/client");
let SearchErrorHandler = SearchErrorHandler_1 = class SearchErrorHandler {
    constructor(cacheService, apiResourceRepository, configService) {
        this.cacheService = cacheService;
        this.apiResourceRepository = apiResourceRepository;
        this.configService = configService;
        this.logger = new common_1.Logger(SearchErrorHandler_1.name);
    }
    async handleSearchError(error, query, params) {
        this.logger.error(`Search error: ${error.message}`, error.stack);
        const errorType = this.getErrorType(error);
        switch (errorType) {
            case 'index_not_found':
                this.logger.warn('Index not found, attempting PostgreSQL fallback');
                return await this.fallbackToPostgreSQL(query, params);
            case 'timeout':
                this.logger.warn('Search timeout, trying cache fallback first');
                return await this.fallbackWithTimeout(query, params);
            case 'connection_error':
                this.logger.error('Elasticsearch connection error, using full fallback strategy');
                return await this.fallbackToPostgreSQL(query, params);
            case 'query_parsing_error':
                this.logger.warn(`Query parsing error for: "${query}", trying simplified query`);
                return await this.fallbackWithSimplifiedQuery(query, params);
            case 'cluster_block_exception':
                this.logger.error('Elasticsearch cluster blocked, using cache and PostgreSQL fallback');
                return await this.fallbackToPostgreSQL(query, params);
            case 'search_phase_execution_exception':
                this.logger.warn('Search phase execution error, trying simplified search');
                return await this.fallbackWithSimplifiedQuery(query, params);
            default:
                this.logger.error(`Unknown search error: ${error.message}, using full fallback`);
                return await this.fallbackToPostgreSQL(query, params);
        }
    }
    async handleSuggestionError(error, query) {
        this.logger.error(`Suggestion error for query "${query}": ${error.message}`, error.stack);
        if (query && query.length >= 2) {
            try {
                const cachedSuggestions = await this.cacheService.getCachedSuggestions(query);
                if (cachedSuggestions && cachedSuggestions.length > 0) {
                    this.logger.debug(`Returning cached suggestions for failed query: "${query}"`);
                    return cachedSuggestions;
                }
                return await this.fallbackSuggestionsFromPostgreSQL(query);
            }
            catch (fallbackError) {
                this.logger.error(`Suggestion fallback failed: ${fallbackError.message}`);
            }
        }
        return [];
    }
    getErrorType(error) {
        if (!error)
            return 'unknown';
        const message = error.message?.toLowerCase() || '';
        const type = error.type?.toLowerCase() || '';
        const name = error.name?.toLowerCase() || '';
        if (type.includes('index_not_found') || message.includes('index_not_found') ||
            message.includes('no such index')) {
            return 'index_not_found';
        }
        if (type.includes('timeout') || message.includes('timeout') ||
            name.includes('timeout') || message.includes('timed out')) {
            return 'timeout';
        }
        if (message.includes('connection') || message.includes('connect') ||
            message.includes('econnrefused') || message.includes('network') ||
            name.includes('connectionerror')) {
            return 'connection_error';
        }
        if (type.includes('parsing_exception') || message.includes('parsing') ||
            type.includes('query_shard_exception') || message.includes('failed to parse')) {
            return 'query_parsing_error';
        }
        if (type.includes('cluster_block_exception') || message.includes('cluster_block') ||
            message.includes('blocked by')) {
            return 'cluster_block_exception';
        }
        if (type.includes('search_phase_execution_exception') ||
            message.includes('search_phase_execution') ||
            message.includes('failed to execute phase')) {
            return 'search_phase_execution_exception';
        }
        if (message.includes('circuit_breaking_exception') ||
            message.includes('too_many_requests') ||
            message.includes('service_unavailable')) {
            return 'resource_exhaustion';
        }
        return 'unknown';
    }
    getEmptyResults() {
        return {
            hits: [],
            total: 0,
            facets: this.getEmptyFacets(),
            took: 0,
            hasMore: false
        };
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
    isRecoverableError(error) {
        const errorType = this.getErrorType(error);
        return ['timeout', 'query_parsing_error'].includes(errorType);
    }
    simplifyQuery(originalQuery) {
        if (!originalQuery)
            return '*';
        let simplified = originalQuery
            .replace(/[^\w\s\-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (simplified.length < 2) {
            return '*';
        }
        return simplified;
    }
    createFallbackQuery(originalQuery) {
        if (!originalQuery) {
            return {
                query: { match_all: {} },
                size: 10,
                sort: [{ _score: { order: 'desc' } }]
            };
        }
        const simplifiedQuery = this.simplifyQuery(originalQuery);
        return {
            query: {
                simple_query_string: {
                    query: simplifiedQuery,
                    fields: ['name^2', 'description', 'tags'],
                    default_operator: 'and'
                }
            },
            size: 10,
            sort: [{ _score: { order: 'desc' } }]
        };
    }
    async fallbackToPostgreSQL(query, params) {
        this.logger.log('Executing PostgreSQL fallback search');
        try {
            const cachedResults = await this.tryGetCachedResults(query, params);
            if (cachedResults) {
                this.logger.debug('Returning cached results for PostgreSQL fallback');
                return cachedResults;
            }
            const searchFilters = this.buildPostgreSQLFilters(query, params?.filters);
            const pagination = {
                limit: params?.pagination?.limit || 20,
                offset: params?.pagination?.offset || 0,
            };
            const { resources, total } = await this.apiResourceRepository.search(searchFilters, pagination);
            const searchResults = this.transformPostgreSQLResults(resources, total, params);
            if (query) {
                const cacheKey = this.generateCacheKey(query, params);
                await this.cacheService.cacheSearchResults(cacheKey, searchResults);
            }
            this.logger.log(`PostgreSQL fallback returned ${total} results`);
            return searchResults;
        }
        catch (error) {
            this.logger.error(`PostgreSQL fallback failed: ${error.message}`);
            return await this.fallbackToPopularResults();
        }
    }
    async fallbackWithTimeout(query, params) {
        this.logger.log('Executing timeout fallback strategy');
        const cachedResults = await this.tryGetCachedResults(query, params);
        if (cachedResults) {
            this.logger.debug('Returning cached results for timeout fallback');
            return cachedResults;
        }
        return await this.fallbackToPostgreSQL(query, params);
    }
    async fallbackWithSimplifiedQuery(query, params) {
        this.logger.log('Executing simplified query fallback');
        if (!query) {
            return await this.fallbackToPopularResults();
        }
        const simplifiedParams = {
            ...params,
            query: this.simplifyQuery(query),
        };
        return await this.fallbackToPostgreSQL(simplifiedParams.query, simplifiedParams);
    }
    async fallbackToPopularResults() {
        this.logger.log('Executing popular results fallback');
        try {
            const cachedPopular = await this.cacheService.getCachedPopularSearches();
            if (cachedPopular && cachedPopular.length > 0) {
                return this.transformCachedPopularResults(cachedPopular);
            }
            const { resources, total } = await this.apiResourceRepository.search({ verified: true }, { limit: 20, offset: 0 });
            const results = this.transformPostgreSQLResults(resources, total);
            await this.cacheService.cachePopularSearches(resources);
            this.logger.log(`Popular results fallback returned ${total} results`);
            return results;
        }
        catch (error) {
            this.logger.error(`Popular results fallback failed: ${error.message}`);
            return this.getEmptyResults();
        }
    }
    async fallbackSuggestionsFromPostgreSQL(query) {
        this.logger.log(`Executing PostgreSQL suggestions fallback for: "${query}"`);
        try {
            const { resources } = await this.apiResourceRepository.search({ name: query }, { limit: 10, offset: 0 });
            return resources.map(resource => ({
                text: resource.name,
                type: 'resource',
                score: resource.verified ? 2 : 1,
                metadata: {
                    id: resource.id,
                    description: resource.description,
                    resourceType: resource.resourceType,
                }
            }));
        }
        catch (error) {
            this.logger.error(`PostgreSQL suggestions fallback failed: ${error.message}`);
            return [];
        }
    }
    async tryGetCachedResults(query, params) {
        if (!query)
            return null;
        try {
            const cacheKey = this.generateCacheKey(query, params);
            return await this.cacheService.getCachedSearchResults(cacheKey);
        }
        catch (error) {
            this.logger.debug(`Cache retrieval failed: ${error.message}`);
            return null;
        }
    }
    buildPostgreSQLFilters(query, filters) {
        const searchFilters = {};
        if (query) {
            searchFilters.name = query;
        }
        if (filters?.categories && filters.categories.length > 0) {
            searchFilters.categoryId = filters.categories[0];
        }
        if (filters?.resourceTypes && filters.resourceTypes.length > 0) {
            searchFilters.resourceType = filters.resourceTypes[0];
        }
        if (filters?.plans && filters.plans.length > 0) {
            searchFilters.plan = filters.plans[0];
        }
        if (filters?.verified !== undefined) {
            searchFilters.verified = filters.verified;
        }
        if (filters?.city) {
            searchFilters.city = filters.city;
        }
        if (filters?.region) {
            searchFilters.region = filters.region;
        }
        if (filters?.country) {
            searchFilters.country = filters.country;
        }
        searchFilters.status = client_1.ResourceStatus.ACTIVE;
        return searchFilters;
    }
    transformPostgreSQLResults(resources, total, params) {
        const hits = resources.map(resource => ({
            id: resource.id,
            name: resource.name,
            description: resource.description,
            resourceType: resource.resourceType,
            category: resource.category ? {
                id: resource.category.id,
                name: resource.category.name,
                slug: resource.category.slug,
            } : {
                id: resource.categoryId,
                name: 'Unknown',
                slug: 'unknown',
            },
            plan: resource.plan,
            verified: resource.verified,
            location: resource.latitude && resource.longitude ? {
                latitude: typeof resource.latitude === 'object' ? resource.latitude.toNumber() : resource.latitude,
                longitude: typeof resource.longitude === 'object' ? resource.longitude.toNumber() : resource.longitude,
                city: resource.city,
                region: resource.region,
                country: resource.country,
            } : undefined,
            contact: {
                phone: resource.phone,
                email: resource.email,
                website: resource.website,
            },
            tags: [],
            createdAt: resource.createdAt,
            updatedAt: resource.updatedAt,
            score: resource.verified ? 2 : 1,
        }));
        return {
            hits,
            total,
            facets: this.getEmptyFacets(),
            took: 0,
            page: params?.pagination?.page,
            limit: params?.pagination?.limit,
            hasMore: hits.length === (params?.pagination?.limit || 20),
        };
    }
    transformCachedPopularResults(cachedResults) {
        const hits = cachedResults.slice(0, 20).map(resource => ({
            id: resource.id,
            name: resource.name,
            description: resource.description,
            resourceType: resource.resourceType,
            category: {
                id: resource.categoryId,
                name: 'Popular',
                slug: 'popular',
            },
            plan: resource.plan,
            verified: resource.verified,
            location: resource.latitude && resource.longitude ? {
                latitude: typeof resource.latitude === 'object' ? resource.latitude.toNumber() : resource.latitude,
                longitude: typeof resource.longitude === 'object' ? resource.longitude.toNumber() : resource.longitude,
                city: resource.city,
                region: resource.region,
                country: resource.country,
            } : undefined,
            contact: {
                phone: resource.phone,
                email: resource.email,
                website: resource.website,
            },
            tags: [],
            createdAt: resource.createdAt,
            updatedAt: resource.updatedAt,
            score: 3,
        }));
        return {
            hits,
            total: hits.length,
            facets: this.getEmptyFacets(),
            took: 0,
            hasMore: false,
        };
    }
    generateCacheKey(query, params) {
        const keyParts = [
            query || '',
            JSON.stringify(params?.filters || {}),
            JSON.stringify(params?.sort || {}),
            JSON.stringify(params?.pagination || {}),
        ];
        return keyParts.join('|');
    }
    async isElasticsearchAvailable() {
        return true;
    }
    getErrorMetrics() {
        return {
            totalErrors: 0,
            errorsByType: {},
            fallbacksUsed: {},
        };
    }
};
exports.SearchErrorHandler = SearchErrorHandler;
exports.SearchErrorHandler = SearchErrorHandler = SearchErrorHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_cache_service_1.SearchCacheService,
        api_resource_repository_1.ApiResourceRepository,
        config_1.ConfigService])
], SearchErrorHandler);
//# sourceMappingURL=search-error-handler.service.js.map