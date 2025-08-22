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
var SearchFilterPersistenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchFilterPersistenceService = void 0;
const common_1 = require("@nestjs/common");
const search_cache_service_1 = require("./search-cache.service");
let SearchFilterPersistenceService = SearchFilterPersistenceService_1 = class SearchFilterPersistenceService {
    constructor(cacheService) {
        this.cacheService = cacheService;
        this.logger = new common_1.Logger(SearchFilterPersistenceService_1.name);
        this.FILTER_CACHE_PREFIX = 'search_filters';
        this.FILTER_TTL = 3600;
    }
    async saveFilters(sessionId, filters, activeTab, searchQuery) {
        try {
            const filterState = {
                filters,
                activeTab,
                searchQuery,
                timestamp: new Date(),
                lastUpdated: Date.now()
            };
            const cacheKey = this.generateFilterCacheKey(sessionId);
            await this.cacheService.redisClient.setex(cacheKey, this.FILTER_TTL, JSON.stringify(filterState));
            this.logger.debug(`Filters saved for session: ${sessionId}`);
        }
        catch (error) {
            this.logger.error(`Failed to save filters for session ${sessionId}: ${error.message}`);
        }
    }
    async getFilters(sessionId) {
        try {
            const cacheKey = this.generateFilterCacheKey(sessionId);
            const cached = await this.cacheService.redisClient.get(cacheKey);
            if (!cached) {
                return null;
            }
            const filterState = JSON.parse(cached);
            const age = Date.now() - filterState.lastUpdated;
            if (age > this.FILTER_TTL * 1000) {
                await this.clearFilters(sessionId);
                return null;
            }
            this.logger.debug(`Filters retrieved for session: ${sessionId}`);
            return {
                filters: filterState.filters,
                activeTab: filterState.activeTab,
                searchQuery: filterState.searchQuery,
                timestamp: new Date(filterState.timestamp)
            };
        }
        catch (error) {
            this.logger.error(`Failed to get filters for session ${sessionId}: ${error.message}`);
            return null;
        }
    }
    async updateActiveTab(sessionId, activeTab) {
        try {
            const existing = await this.getFilters(sessionId);
            if (existing) {
                await this.saveFilters(sessionId, existing.filters, activeTab, existing.searchQuery);
                this.logger.debug(`Active tab updated to ${activeTab} for session: ${sessionId}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to update active tab for session ${sessionId}: ${error.message}`);
        }
    }
    async updateFilters(sessionId, filters, searchQuery) {
        try {
            const existing = await this.getFilters(sessionId);
            await this.saveFilters(sessionId, filters, existing?.activeTab, searchQuery || existing?.searchQuery);
            this.logger.debug(`Filters updated for session: ${sessionId}`);
        }
        catch (error) {
            this.logger.error(`Failed to update filters for session ${sessionId}: ${error.message}`);
        }
    }
    async clearFilters(sessionId) {
        try {
            const cacheKey = this.generateFilterCacheKey(sessionId);
            await this.cacheService.redisClient.del(cacheKey);
            this.logger.debug(`Filters cleared for session: ${sessionId}`);
        }
        catch (error) {
            this.logger.error(`Failed to clear filters for session ${sessionId}: ${error.message}`);
        }
    }
    async applyPersistedFilters(sessionId, params) {
        try {
            const persisted = await this.getFilters(sessionId);
            if (!persisted) {
                return params;
            }
            const mergedFilters = this.mergeFilters(persisted.filters, params.filters);
            const enhancedParams = {
                ...params,
                filters: mergedFilters,
                query: params.query || persisted.searchQuery
            };
            if (persisted.activeTab && (!params.includeTypes || params.includeTypes.length === 0)) {
                enhancedParams.includeTypes = [persisted.activeTab];
            }
            this.logger.debug(`Applied persisted filters for session: ${sessionId}`);
            return enhancedParams;
        }
        catch (error) {
            this.logger.error(`Failed to apply persisted filters for session ${sessionId}: ${error.message}`);
            return params;
        }
    }
    async getFilterHistory(sessionId, limit = 10) {
        try {
            const historyKey = `${this.generateFilterCacheKey(sessionId)}_history`;
            const cached = await this.cacheService.redisClient.lrange(historyKey, 0, limit - 1);
            const history = cached.map(item => {
                const parsed = JSON.parse(item);
                return {
                    filters: parsed.filters,
                    searchQuery: parsed.searchQuery,
                    timestamp: new Date(parsed.timestamp)
                };
            });
            this.logger.debug(`Retrieved filter history for session: ${sessionId}, ${history.length} items`);
            return history;
        }
        catch (error) {
            this.logger.error(`Failed to get filter history for session ${sessionId}: ${error.message}`);
            return [];
        }
    }
    async addToFilterHistory(sessionId, filters, searchQuery) {
        try {
            const historyKey = `${this.generateFilterCacheKey(sessionId)}_history`;
            const historyItem = {
                filters,
                searchQuery,
                timestamp: new Date()
            };
            await this.cacheService.redisClient.lpush(historyKey, JSON.stringify(historyItem));
            await this.cacheService.redisClient.ltrim(historyKey, 0, 19);
            await this.cacheService.redisClient.expire(historyKey, this.FILTER_TTL * 24);
            this.logger.debug(`Added to filter history for session: ${sessionId}`);
        }
        catch (error) {
            this.logger.error(`Failed to add to filter history for session ${sessionId}: ${error.message}`);
        }
    }
    async getPopularFilters(limit = 10) {
        try {
            const popularKey = `${this.FILTER_CACHE_PREFIX}_popular`;
            const cached = await this.cacheService.redisClient.zrevrange(popularKey, 0, limit - 1, 'WITHSCORES');
            const popular = [];
            for (let i = 0; i < cached.length; i += 2) {
                const filtersJson = cached[i];
                const score = parseInt(cached[i + 1]);
                try {
                    const filters = JSON.parse(filtersJson);
                    popular.push({ filters, usage: score });
                }
                catch (parseError) {
                    this.logger.warn(`Failed to parse popular filter: ${filtersJson}`);
                }
            }
            this.logger.debug(`Retrieved ${popular.length} popular filters`);
            return popular;
        }
        catch (error) {
            this.logger.error(`Failed to get popular filters: ${error.message}`);
            return [];
        }
    }
    async recordFilterUsage(filters) {
        try {
            const popularKey = `${this.FILTER_CACHE_PREFIX}_popular`;
            const filtersKey = JSON.stringify(this.normalizeFiltersForStats(filters));
            await this.cacheService.redisClient.zincrby(popularKey, 1, filtersKey);
            await this.cacheService.redisClient.expire(popularKey, this.FILTER_TTL * 24 * 7);
        }
        catch (error) {
            this.logger.error(`Failed to record filter usage: ${error.message}`);
        }
    }
    generateFilterCacheKey(sessionId) {
        return `${this.FILTER_CACHE_PREFIX}:${sessionId}`;
    }
    mergeFilters(persistedFilters, currentFilters) {
        if (!currentFilters) {
            return persistedFilters;
        }
        return {
            ...persistedFilters,
            ...currentFilters,
            categories: currentFilters.categories || persistedFilters.categories,
            resourceTypes: currentFilters.resourceTypes || persistedFilters.resourceTypes,
            plans: currentFilters.plans || persistedFilters.plans,
            tags: currentFilters.tags || persistedFilters.tags,
            priceRange: currentFilters.priceRange || persistedFilters.priceRange,
            location: currentFilters.location || persistedFilters.location,
            dateRange: currentFilters.dateRange || persistedFilters.dateRange
        };
    }
    normalizeFiltersForStats(filters) {
        return {
            categories: filters.categories,
            resourceTypes: filters.resourceTypes,
            plans: filters.plans,
            verified: filters.verified,
            city: filters.city,
            region: filters.region,
            country: filters.country
        };
    }
};
exports.SearchFilterPersistenceService = SearchFilterPersistenceService;
exports.SearchFilterPersistenceService = SearchFilterPersistenceService = SearchFilterPersistenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_cache_service_1.SearchCacheService])
], SearchFilterPersistenceService);
//# sourceMappingURL=search-filter-persistence.service.js.map