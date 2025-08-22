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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SearchController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const search_service_1 = require("../modules/search/services/search.service");
const category_search_service_1 = require("../modules/search/services/category-search.service");
const multi_type_search_service_1 = require("../modules/search/services/multi-type-search.service");
const search_filter_persistence_service_1 = require("../modules/search/services/search-filter-persistence.service");
const search_analytics_service_1 = require("../modules/search/services/search-analytics.service");
const saved_search_service_1 = require("../modules/search/services/saved-search.service");
const search_interfaces_1 = require("../modules/search/interfaces/search.interfaces");
const client_1 = require("@prisma/client");
let SearchController = SearchController_1 = class SearchController {
    constructor(searchService, categorySearchService, multiTypeSearchService, filterPersistenceService, analyticsService, savedSearchService) {
        this.searchService = searchService;
        this.categorySearchService = categorySearchService;
        this.multiTypeSearchService = multiTypeSearchService;
        this.filterPersistenceService = filterPersistenceService;
        this.analyticsService = analyticsService;
        this.savedSearchService = savedSearchService;
        this.logger = new common_1.Logger(SearchController_1.name);
    }
    async search(request, ipAddress, query, categories, resourceTypes, plans, minPrice, maxPrice, verified, city, region, tags, sort, order, page, limit, facets, language) {
        try {
            this.logger.debug(`Search request: q="${query}", filters=${JSON.stringify({
                categories, resourceTypes, plans, minPrice, maxPrice, verified, city, region, tags
            })}`);
            const filters = {};
            if (categories && categories.length > 0 && categories[0] !== '') {
                filters.categories = categories;
            }
            if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
                filters.resourceTypes = resourceTypes;
            }
            if (plans && plans.length > 0 && plans[0]) {
                filters.plans = plans;
            }
            if (minPrice !== undefined || maxPrice !== undefined) {
                filters.priceRange = {};
                if (minPrice !== undefined)
                    filters.priceRange.min = minPrice;
                if (maxPrice !== undefined)
                    filters.priceRange.max = maxPrice;
            }
            if (verified !== undefined) {
                filters.verified = verified;
            }
            if (city) {
                filters.city = city;
            }
            if (region) {
                filters.region = region;
            }
            if (tags && tags.length > 0 && tags[0] !== '') {
                filters.tags = tags;
            }
            const sessionId = this.generateSessionId(request);
            const userId = this.extractUserId(request);
            const searchParams = {
                query: query || undefined,
                filters: Object.keys(filters).length > 0 ? filters : undefined,
                sort: {
                    field: sort || search_interfaces_1.SortField.RELEVANCE,
                    order: order || search_interfaces_1.SortOrder.DESC
                },
                pagination: {
                    page: page || 1,
                    limit: Math.min(limit || 20, 100)
                },
                facets: facets && facets.length > 0 ? facets : ['categories', 'resourceTypes', 'plans', 'verified'],
                userId,
                sessionId,
                language: language || undefined
            };
            const results = await this.searchService.search(searchParams);
            this.logSearchAnalytics(searchParams, results, request, ipAddress).catch(error => {
                this.logger.warn('Failed to log search analytics', error);
            });
            this.logger.debug(`Search completed: ${results.total} results found in ${results.took}ms`);
            return results;
        }
        catch (error) {
            this.logger.error(`Search failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la recherche',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async suggest(query, limit, userId, includePopular, sessionId, language) {
        try {
            if (!query || query.trim().length < 2) {
                return [];
            }
            this.logger.debug(`Advanced suggestion request: q="${query}", limit=${limit}, userId=${userId}, includePopular=${includePopular}`);
            let suggestions;
            if (sessionId || userId) {
                suggestions = await this.searchService.suggestWithRateLimit(query.trim(), Math.min(limit || 10, 20), userId, sessionId, language);
            }
            else {
                suggestions = await this.searchService.suggestWithPopularityRanking(query.trim(), Math.min(limit || 10, 20), userId, includePopular, language);
            }
            this.logger.debug(`Advanced suggestions completed: ${suggestions.length} suggestions found`);
            return suggestions;
        }
        catch (error) {
            this.logger.error(`Advanced suggestions failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération des suggestions',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPopularSuggestions(limit) {
        try {
            this.logger.debug(`Popular suggestions request: limit=${limit}`);
            const suggestions = await this.searchService.getPopularSuggestions(Math.min(limit || 20, 50));
            this.logger.debug(`Popular suggestions completed: ${suggestions.length} suggestions found`);
            return suggestions;
        }
        catch (error) {
            this.logger.error(`Popular suggestions failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération des suggestions populaires',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSmartSuggestions(query, limit, userId) {
        try {
            if (!query || query.trim().length < 2) {
                return [];
            }
            this.logger.debug(`Smart suggestions request: q="${query}", limit=${limit}, userId=${userId}`);
            const suggestions = await this.searchService.getSmartAutocompleteSuggestions(query.trim(), Math.min(limit || 10, 20), userId);
            this.logger.debug(`Smart suggestions completed: ${suggestions.length} suggestions found`);
            return suggestions;
        }
        catch (error) {
            this.logger.error(`Smart suggestions failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération des suggestions intelligentes',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchByCategory(categoryId, query, resourceTypes, plans, verified, sort, order, page, limit) {
        try {
            if (!categoryId) {
                throw new common_1.HttpException('Category ID is required', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Category search request: categoryId="${categoryId}", q="${query}"`);
            const filters = {
                categories: [categoryId]
            };
            if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
                filters.resourceTypes = resourceTypes;
            }
            if (plans && plans.length > 0 && plans[0]) {
                filters.plans = plans;
            }
            if (verified !== undefined) {
                filters.verified = verified;
            }
            const searchParams = {
                query: query || undefined,
                filters,
                sort: {
                    field: sort || search_interfaces_1.SortField.RELEVANCE,
                    order: order || search_interfaces_1.SortOrder.DESC
                },
                pagination: {
                    page: page || 1,
                    limit: Math.min(limit || 20, 100)
                },
                facets: ['resourceTypes', 'plans', 'verified', 'tags']
            };
            const results = await this.searchService.searchByCategory(categoryId, searchParams);
            this.logger.debug(`Category search completed: ${results.total} results found`);
            return results;
        }
        catch (error) {
            this.logger.error(`Category search failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la recherche par catégorie',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchByCategoryWithHierarchy(categoryId, query, includeSubcategories, maxDepth, showCounts, resourceTypes, plans, verified, sort, order, page, limit) {
        try {
            if (!categoryId) {
                throw new common_1.HttpException('Category ID is required', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Hierarchical category search: categoryId="${categoryId}", includeSubcategories=${includeSubcategories}, maxDepth=${maxDepth}`);
            const filters = {};
            if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
                filters.resourceTypes = resourceTypes;
            }
            if (plans && plans.length > 0 && plans[0]) {
                filters.plans = plans;
            }
            if (verified !== undefined) {
                filters.verified = verified;
            }
            const categorySearchParams = {
                query: query || undefined,
                filters,
                sort: {
                    field: sort || search_interfaces_1.SortField.RELEVANCE,
                    order: order || search_interfaces_1.SortOrder.DESC
                },
                pagination: {
                    page: page || 1,
                    limit: Math.min(limit || 20, 100)
                },
                facets: ['resourceTypes', 'plans', 'verified', 'tags', 'categories'],
                includeSubcategories: includeSubcategories !== false,
                maxDepth: maxDepth || 3,
                showCounts: showCounts !== false
            };
            const results = await this.categorySearchService.searchByCategory(categoryId, categorySearchParams);
            this.logger.debug(`Hierarchical category search completed: ${results.total} results found`);
            return results;
        }
        catch (error) {
            this.logger.error(`Hierarchical category search failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la recherche hiérarchique par catégorie',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCategoryHierarchy(categoryId, includeResourceCounts, maxDepth) {
        try {
            this.logger.debug(`Category hierarchy request: categoryId=${categoryId}, includeResourceCounts=${includeResourceCounts}, maxDepth=${maxDepth}`);
            const hierarchy = await this.categorySearchService.getCategoryHierarchy({
                categoryId: categoryId || undefined,
                includeResourceCounts: includeResourceCounts !== false,
                maxDepth: maxDepth || 5
            });
            this.logger.debug(`Category hierarchy completed`);
            return hierarchy;
        }
        catch (error) {
            this.logger.error(`Category hierarchy failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération de la hiérarchie des catégories',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchByCategorySlug(slug, query, includeSubcategories, maxDepth, showCounts, resourceTypes, plans, verified, sort, order, page, limit) {
        try {
            if (!slug) {
                throw new common_1.HttpException('Category slug is required', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`SEO-friendly category search: slug="${slug}", includeSubcategories=${includeSubcategories}`);
            const categoryInfo = await this.categorySearchService.getCategoryBySlug(slug);
            if (!categoryInfo) {
                throw new common_1.HttpException(`Category with slug "${slug}" not found`, common_1.HttpStatus.NOT_FOUND);
            }
            const filters = {};
            if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
                filters.resourceTypes = resourceTypes;
            }
            if (plans && plans.length > 0 && plans[0]) {
                filters.plans = plans;
            }
            if (verified !== undefined) {
                filters.verified = verified;
            }
            const categorySearchParams = {
                query: query || undefined,
                filters,
                sort: {
                    field: sort || search_interfaces_1.SortField.RELEVANCE,
                    order: order || search_interfaces_1.SortOrder.DESC
                },
                pagination: {
                    page: page || 1,
                    limit: Math.min(limit || 20, 100)
                },
                facets: ['resourceTypes', 'plans', 'verified', 'tags', 'categories'],
                includeSubcategories: includeSubcategories !== false,
                maxDepth: maxDepth || 3,
                showCounts: showCounts !== false
            };
            const results = await this.categorySearchService.searchByCategory(categoryInfo.id, categorySearchParams);
            const enrichedResults = {
                ...results,
                seo: {
                    canonicalUrl: `/api/v1/search/categories/${slug}`,
                    shareUrl: `${process.env.BASE_URL || 'https://api.romapi.com'}/search/categories/${slug}`,
                    title: `${categoryInfo.name} - Recherche API`,
                    description: categoryInfo.description || `Découvrez les API et services dans la catégorie ${categoryInfo.name}`,
                    breadcrumbsSchema: this.generateBreadcrumbsSchema(results.breadcrumbs)
                }
            };
            this.logger.debug(`SEO-friendly category search completed: ${results.total} results found`);
            return enrichedResults;
        }
        catch (error) {
            this.logger.error(`SEO-friendly category search failed: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                message: 'Erreur lors de la recherche par catégorie',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchMultiType(query, includeTypes, groupByType, globalRelevanceSort, categories, plans, verified, city, region, sort, order, page, limit) {
        try {
            this.logger.debug(`Multi-type search request: q="${query}", includeTypes=${includeTypes?.join(',')}, groupByType=${groupByType}`);
            const filters = {};
            if (categories && categories.length > 0 && categories[0] !== '') {
                filters.categories = categories;
            }
            if (plans && plans.length > 0 && plans[0]) {
                filters.plans = plans;
            }
            if (verified !== undefined) {
                filters.verified = verified;
            }
            if (city) {
                filters.city = city;
            }
            if (region) {
                filters.region = region;
            }
            const multiTypeParams = {
                query: query || undefined,
                filters: Object.keys(filters).length > 0 ? filters : undefined,
                sort: {
                    field: sort || search_interfaces_1.SortField.RELEVANCE,
                    order: order || search_interfaces_1.SortOrder.DESC
                },
                pagination: {
                    page: page || 1,
                    limit: Math.min(limit || 20, 100)
                },
                facets: ['categories', 'resourceTypes', 'plans', 'verified'],
                includeTypes: includeTypes && includeTypes.length > 0 && includeTypes[0] ? includeTypes : undefined,
                groupByType: groupByType !== false,
                globalRelevanceSort: globalRelevanceSort !== false
            };
            const results = await this.multiTypeSearchService.searchAllTypes(multiTypeParams);
            this.logger.debug(`Multi-type search completed: ${results.totalAcrossTypes} total results found in ${results.took}ms`);
            return results;
        }
        catch (error) {
            this.logger.error(`Multi-type search failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la recherche multi-types',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTypeDistribution(query, categories, verified, city, region) {
        try {
            this.logger.debug(`Type distribution request: q="${query}"`);
            const filters = {};
            if (categories && categories.length > 0 && categories[0] !== '') {
                filters.categories = categories;
            }
            if (verified !== undefined) {
                filters.verified = verified;
            }
            if (city) {
                filters.city = city;
            }
            if (region) {
                filters.region = region;
            }
            const params = {
                query: query || undefined,
                filters: Object.keys(filters).length > 0 ? filters : undefined
            };
            const distribution = await this.multiTypeSearchService.getTypeDistribution(params);
            this.logger.debug(`Type distribution completed: ${JSON.stringify(distribution)}`);
            return distribution;
        }
        catch (error) {
            this.logger.error(`Type distribution failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération de la distribution des types',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async exportResultsByType(exportTypes, query, format, categories, verified, city, region, maxResults) {
        try {
            if (!exportTypes || exportTypes.length === 0) {
                throw new common_1.HttpException('Export types are required', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Export request: types=${exportTypes.join(',')}, format=${format}, q="${query}"`);
            const filters = {};
            if (categories && categories.length > 0 && categories[0] !== '') {
                filters.categories = categories;
            }
            if (verified !== undefined) {
                filters.verified = verified;
            }
            if (city) {
                filters.city = city;
            }
            if (region) {
                filters.region = region;
            }
            const limitsPerType = {};
            exportTypes.forEach(type => {
                limitsPerType[type] = Math.min(maxResults || 1000, 5000);
            });
            const params = {
                query: query || undefined,
                filters: Object.keys(filters).length > 0 ? filters : undefined,
                limitsPerType
            };
            const exportResults = await this.multiTypeSearchService.exportResultsByType(params, exportTypes, format || 'json');
            this.logger.debug(`Export completed for ${exportTypes.length} types`);
            return exportResults;
        }
        catch (error) {
            this.logger.error(`Export failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de l\'export des résultats',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchSingleTypeWithContext(resourceType, query, categories, plans, verified, city, region, sort, order, page, limit) {
        try {
            if (!Object.values(client_1.ResourceType).includes(resourceType)) {
                throw new common_1.HttpException(`Invalid resource type: ${resourceType}`, common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Single type search with context: type=${resourceType}, q="${query}"`);
            const filters = {};
            if (categories && categories.length > 0 && categories[0] !== '') {
                filters.categories = categories;
            }
            if (plans && plans.length > 0 && plans[0]) {
                filters.plans = plans;
            }
            if (verified !== undefined) {
                filters.verified = verified;
            }
            if (city) {
                filters.city = city;
            }
            if (region) {
                filters.region = region;
            }
            const searchParams = {
                query: query || undefined,
                filters: Object.keys(filters).length > 0 ? filters : undefined,
                sort: {
                    field: sort || search_interfaces_1.SortField.RELEVANCE,
                    order: order || search_interfaces_1.SortOrder.DESC
                },
                pagination: {
                    page: page || 1,
                    limit: Math.min(limit || 20, 100)
                },
                facets: ['categories', 'plans', 'verified', 'tags']
            };
            const results = await this.multiTypeSearchService.searchSingleTypeWithContext(resourceType, searchParams);
            this.logger.debug(`Single type search completed: ${results.total} results found for type ${resourceType}`);
            return results;
        }
        catch (error) {
            this.logger.error(`Single type search failed: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                message: 'Erreur lors de la recherche par type',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCategoryShareInfo(slug) {
        try {
            if (!slug) {
                throw new common_1.HttpException('Category slug is required', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Getting share info for category: ${slug}`);
            const categoryInfo = await this.categorySearchService.getCategoryBySlug(slug);
            if (!categoryInfo) {
                throw new common_1.HttpException(`Category with slug "${slug}" not found`, common_1.HttpStatus.NOT_FOUND);
            }
            const stats = await this.categorySearchService.getCategoryStats(categoryInfo.id);
            const shareInfo = {
                title: `${categoryInfo.name} - API ROMAPI`,
                description: categoryInfo.description || `Découvrez ${stats.totalResources} API et services dans la catégorie ${categoryInfo.name}`,
                url: `${process.env.BASE_URL || 'https://api.romapi.com'}/search/categories/${slug}`,
                image: categoryInfo.icon ? `${process.env.BASE_URL || 'https://api.romapi.com'}/images/categories/${categoryInfo.icon}` : `${process.env.BASE_URL || 'https://api.romapi.com'}/images/default-category.png`,
                type: 'website',
                siteName: 'ROMAPI',
                category: categoryInfo.name,
                resourceCount: stats.totalResources,
                verifiedCount: stats.verifiedResources,
                breadcrumbs: await this.categorySearchService.buildCategoryBreadcrumbs(categoryInfo.id),
                openGraph: {
                    title: `${categoryInfo.name} - API ROMAPI`,
                    description: categoryInfo.description || `Découvrez ${stats.totalResources} API et services dans la catégorie ${categoryInfo.name}`,
                    url: `${process.env.BASE_URL || 'https://api.romapi.com'}/search/categories/${slug}`,
                    image: categoryInfo.icon ? `${process.env.BASE_URL || 'https://api.romapi.com'}/images/categories/${categoryInfo.icon}` : `${process.env.BASE_URL || 'https://api.romapi.com'}/images/default-category.png`,
                    type: 'website',
                    siteName: 'ROMAPI'
                },
                twitter: {
                    card: 'summary_large_image',
                    title: `${categoryInfo.name} - API ROMAPI`,
                    description: categoryInfo.description || `Découvrez ${stats.totalResources} API et services dans la catégorie ${categoryInfo.name}`,
                    image: categoryInfo.icon ? `${process.env.BASE_URL || 'https://api.romapi.com'}/images/categories/${categoryInfo.icon}` : `${process.env.BASE_URL || 'https://api.romapi.com'}/images/default-category.png`
                }
            };
            this.logger.debug(`Share info retrieved for category: ${slug}`);
            return shareInfo;
        }
        catch (error) {
            this.logger.error(`Failed to get category share info: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération des informations de partage',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchNearby(latitude, longitude, radius, query, categories, resourceTypes, page, limit) {
        try {
            if (latitude === undefined || longitude === undefined) {
                throw new common_1.HttpException('Latitude and longitude are required', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Nearby search request: lat=${latitude}, lon=${longitude}, radius=${radius}km`);
            const location = { latitude, longitude };
            const filters = {};
            if (categories && categories.length > 0 && categories[0] !== '') {
                filters.categories = categories;
            }
            if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
                filters.resourceTypes = resourceTypes;
            }
            const searchParams = {
                query: query || undefined,
                filters: Object.keys(filters).length > 0 ? filters : undefined,
                pagination: {
                    page: page || 1,
                    limit: Math.min(limit || 20, 100)
                },
                facets: ['categories', 'resourceTypes', 'cities', 'regions']
            };
            const results = await this.searchService.searchNearby(location, radius || 10, searchParams);
            this.logger.debug(`Nearby search completed: ${results.total} results found`);
            return results;
        }
        catch (error) {
            this.logger.error(`Nearby search failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la recherche géographique',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async saveFilters(sessionId, body) {
        try {
            if (!sessionId) {
                throw new common_1.HttpException('Session ID is required in x-session-id header', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Saving filters for session: ${sessionId}`);
            await this.filterPersistenceService.saveFilters(sessionId, body.filters, body.activeTab, body.searchQuery);
            await this.filterPersistenceService.recordFilterUsage(body.filters);
            await this.filterPersistenceService.addToFilterHistory(sessionId, body.filters, body.searchQuery);
            return {
                success: true,
                message: 'Filtres sauvegardés avec succès'
            };
        }
        catch (error) {
            this.logger.error(`Failed to save filters: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la sauvegarde des filtres',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async loadFilters(sessionId) {
        try {
            if (!sessionId) {
                throw new common_1.HttpException('Session ID is required in x-session-id header', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Loading filters for session: ${sessionId}`);
            const savedFilters = await this.filterPersistenceService.getFilters(sessionId);
            return savedFilters;
        }
        catch (error) {
            this.logger.error(`Failed to load filters: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors du chargement des filtres',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateActiveTab(sessionId, body) {
        try {
            if (!sessionId) {
                throw new common_1.HttpException('Session ID is required in x-session-id header', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!Object.values(client_1.ResourceType).includes(body.activeTab)) {
                throw new common_1.HttpException(`Invalid resource type: ${body.activeTab}`, common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Updating active tab to ${body.activeTab} for session: ${sessionId}`);
            await this.filterPersistenceService.updateActiveTab(sessionId, body.activeTab);
            return {
                success: true,
                message: 'Onglet actif mis à jour avec succès'
            };
        }
        catch (error) {
            this.logger.error(`Failed to update active tab: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la mise à jour de l\'onglet actif',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async clearFilters(sessionId) {
        try {
            if (!sessionId) {
                throw new common_1.HttpException('Session ID is required in x-session-id header', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Clearing filters for session: ${sessionId}`);
            await this.filterPersistenceService.clearFilters(sessionId);
            return {
                success: true,
                message: 'Filtres effacés avec succès'
            };
        }
        catch (error) {
            this.logger.error(`Failed to clear filters: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de l\'effacement des filtres',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getFilterHistory(sessionId, limit) {
        try {
            if (!sessionId) {
                throw new common_1.HttpException('Session ID is required in x-session-id header', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Getting filter history for session: ${sessionId}`);
            const history = await this.filterPersistenceService.getFilterHistory(sessionId, Math.min(limit || 10, 50));
            return history;
        }
        catch (error) {
            this.logger.error(`Failed to get filter history: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération de l\'historique des filtres',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPopularFilters(limit) {
        try {
            this.logger.debug(`Getting popular filters, limit: ${limit}`);
            const popularFilters = await this.filterPersistenceService.getPopularFilters(Math.min(limit || 10, 20));
            return popularFilters;
        }
        catch (error) {
            this.logger.error(`Failed to get popular filters: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération des filtres populaires',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchMultiTypeWithPersistence(sessionId, query, includeTypes, overrideFilters, groupByType, globalRelevanceSort, page, limit) {
        try {
            this.logger.debug(`Multi-type search with persistence for session: ${sessionId}`);
            let searchParams = {
                query: query || undefined,
                includeTypes: includeTypes && includeTypes.length > 0 && includeTypes[0] ? includeTypes : undefined,
                groupByType: groupByType !== false,
                globalRelevanceSort: globalRelevanceSort !== false,
                pagination: {
                    page: page || 1,
                    limit: Math.min(limit || 20, 100)
                },
                facets: ['categories', 'resourceTypes', 'plans', 'verified']
            };
            if (sessionId && !overrideFilters) {
                searchParams = await this.filterPersistenceService.applyPersistedFilters(sessionId, searchParams);
            }
            const results = await this.multiTypeSearchService.searchAllTypes(searchParams);
            this.logger.debug(`Multi-type search with persistence completed: ${results.totalAcrossTypes} total results found`);
            return results;
        }
        catch (error) {
            this.logger.error(`Multi-type search with persistence failed: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la recherche multi-types avec persistance',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    generateBreadcrumbsSchema(breadcrumbs) {
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": breadcrumb.name,
                "item": `${process.env.BASE_URL || 'https://api.romapi.com'}${breadcrumb.url}`
            }))
        };
    }
    generateSessionId(request) {
        const existingSessionId = request.headers['x-session-id'];
        if (existingSessionId) {
            return existingSessionId;
        }
        const userAgent = request.headers['user-agent'] || '';
        const ip = request.ip || request.connection.remoteAddress || '';
        const timestamp = Date.now();
        const sessionData = `${ip}_${userAgent}_${timestamp}`;
        return Buffer.from(sessionData).toString('base64').substring(0, 32);
    }
    extractUserId(request) {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return undefined;
        }
        return undefined;
    }
    async logSearchAnalytics(params, results, request, ipAddress) {
        try {
            const logParams = {
                query: params.query || '',
                filters: params.filters || {},
                userId: params.userId,
                sessionId: params.sessionId || 'anonymous',
                userAgent: request.headers['user-agent'],
                ipAddress,
                resultsCount: results.total,
                took: results.took || 0,
            };
            await this.analyticsService.logSearch(logParams);
            this.logger.debug(`Search analytics logged for query: "${params.query}" - Results: ${results.total}`);
        }
        catch (error) {
            this.logger.warn('Failed to log search analytics in controller', error);
        }
    }
    async logClick(body, request, ipAddress) {
        try {
            const { searchLogId, resourceId, position, query, sessionId } = body;
            if (!resourceId || position === undefined) {
                throw new common_1.HttpException('resourceId and position are required', common_1.HttpStatus.BAD_REQUEST);
            }
            let finalSearchLogId = searchLogId;
            if (!finalSearchLogId && query && sessionId) {
                const logParams = {
                    query,
                    filters: {},
                    sessionId,
                    userAgent: request.headers['user-agent'],
                    ipAddress,
                    resultsCount: 0,
                    took: 0,
                };
                finalSearchLogId = await this.analyticsService.logSearch(logParams);
            }
            if (finalSearchLogId) {
                const userId = this.extractUserId(request);
                await this.analyticsService.logClick(finalSearchLogId, resourceId, position, userId);
            }
            this.logger.debug(`Click logged: Resource ${resourceId} at position ${position}`);
            return {
                success: true,
                message: 'Clic enregistré avec succès'
            };
        }
        catch (error) {
            this.logger.error(`Failed to log click: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de l\'enregistrement du clic',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPopularTerms(from, to, limit) {
        try {
            const period = {
                from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                to: to ? new Date(to) : new Date(),
                granularity: 'day'
            };
            this.logger.debug(`Getting popular terms for period: ${period.from.toISOString()} to ${period.to.toISOString()}`);
            const popularTerms = await this.analyticsService.getPopularTerms(period, Math.min(limit || 50, 100));
            return popularTerms;
        }
        catch (error) {
            this.logger.error(`Failed to get popular terms: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération des termes populaires',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getNoResultsQueries(from, to, limit) {
        try {
            const period = {
                from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                to: to ? new Date(to) : new Date(),
                granularity: 'day'
            };
            this.logger.debug(`Getting no-results queries for period: ${period.from.toISOString()} to ${period.to.toISOString()}`);
            const noResultsQueries = await this.analyticsService.getNoResultsQueries(period, Math.min(limit || 50, 100));
            return noResultsQueries;
        }
        catch (error) {
            this.logger.error(`Failed to get no-results queries: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération des requêtes sans résultats',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSearchMetrics(from, to) {
        try {
            const period = {
                from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                to: to ? new Date(to) : new Date(),
                granularity: 'day'
            };
            this.logger.debug(`Getting search metrics for period: ${period.from.toISOString()} to ${period.to.toISOString()}`);
            const metrics = await this.analyticsService.getSearchMetrics(period);
            return metrics;
        }
        catch (error) {
            this.logger.error(`Failed to get search metrics: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération des métriques de recherche',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getResourceClickStats(resourceId, from, to) {
        try {
            if (!resourceId) {
                throw new common_1.HttpException('Resource ID is required', common_1.HttpStatus.BAD_REQUEST);
            }
            const period = {
                from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                to: to ? new Date(to) : new Date(),
                granularity: 'day'
            };
            this.logger.debug(`Getting click stats for resource ${resourceId} for period: ${period.from.toISOString()} to ${period.to.toISOString()}`);
            const clickStats = await this.analyticsService.getClickStats(resourceId, period);
            return {
                resourceId,
                period,
                ...clickStats
            };
        }
        catch (error) {
            this.logger.error(`Failed to get resource click stats: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération des statistiques de clics',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAnalyticsDashboard(from, to) {
        try {
            const period = {
                from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                to: to ? new Date(to) : new Date(),
                granularity: 'day'
            };
            this.logger.debug(`Getting analytics dashboard for period: ${period.from.toISOString()} to ${period.to.toISOString()}`);
            const [metrics, popularTerms, noResultsQueries] = await Promise.all([
                this.analyticsService.getSearchMetrics(period),
                this.analyticsService.getPopularTerms(period, 10),
                this.analyticsService.getNoResultsQueries(period, 10)
            ]);
            const dashboard = {
                period,
                overview: {
                    totalSearches: metrics.totalSearches,
                    averageResponseTime: metrics.averageResponseTime,
                    clickThroughRate: metrics.clickThroughRate,
                    noResultsRate: noResultsQueries.reduce((sum, q) => sum + q.count, 0) / metrics.totalSearches * 100
                },
                popularTerms: metrics.popularTerms,
                noResultsQueries: metrics.noResultsQueries,
                trends: {
                    searchVolumeGrowth: 0,
                    performanceImprovement: 0,
                    userSatisfactionScore: metrics.clickThroughRate
                },
                recommendations: this.generateRecommendations(metrics, popularTerms, noResultsQueries)
            };
            return dashboard;
        }
        catch (error) {
            this.logger.error(`Failed to get analytics dashboard: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                message: 'Erreur lors de la récupération du dashboard d\'analytics',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    generateRecommendations(metrics, popularTerms, noResultsQueries) {
        const recommendations = [];
        if (metrics.averageResponseTime > 500) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                title: 'Temps de réponse élevé',
                description: `Le temps de réponse moyen (${metrics.averageResponseTime}ms) dépasse les 500ms recommandés`,
                action: 'Optimiser les requêtes Elasticsearch et vérifier les performances du cache'
            });
        }
        if (metrics.clickThroughRate < 30) {
            recommendations.push({
                type: 'relevance',
                priority: 'medium',
                title: 'Taux de clic faible',
                description: `Le taux de clic (${metrics.clickThroughRate.toFixed(1)}%) est inférieur à 30%`,
                action: 'Améliorer la pertinence des résultats et l\'affichage des extraits'
            });
        }
        if (noResultsQueries.length > 0) {
            const totalNoResults = noResultsQueries.reduce((sum, q) => sum + q.count, 0);
            if (totalNoResults > metrics.totalSearches * 0.1) {
                recommendations.push({
                    type: 'content',
                    priority: 'high',
                    title: 'Trop de requêtes sans résultats',
                    description: `${totalNoResults} requêtes (${(totalNoResults / metrics.totalSearches * 100).toFixed(1)}%) n'ont donné aucun résultat`,
                    action: 'Analyser les termes sans résultats et enrichir le contenu ou améliorer les synonymes'
                });
            }
        }
        if (popularTerms.length > 0) {
            const topTerm = popularTerms[0];
            if (topTerm.percentage > 20) {
                recommendations.push({
                    type: 'optimization',
                    priority: 'low',
                    title: 'Terme très dominant',
                    description: `Le terme "${topTerm.term}" représente ${topTerm.percentage.toFixed(1)}% des recherches`,
                    action: 'Optimiser spécifiquement les résultats pour ce terme et créer des suggestions associées'
                });
            }
        }
        return recommendations;
    }
    getDashboardUI() {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="refresh" content="0; url=/analytics-dashboard.html">
        <title>Redirection vers le Dashboard</title>
      </head>
      <body>
        <p>Redirection vers le <a href="/analytics-dashboard.html">Dashboard Analytics</a>...</p>
      </body>
      </html>
    `;
    }
    async createSavedSearch(data, userId) {
        try {
            if (!userId) {
                throw new common_1.HttpException('User authentication required', common_1.HttpStatus.UNAUTHORIZED);
            }
            this.logger.debug(`Creating saved search for user ${userId}: ${data.name}`);
            const savedSearch = await this.savedSearchService.createSavedSearch(userId, data);
            return {
                success: true,
                data: savedSearch,
                message: 'Saved search created successfully'
            };
        }
        catch (error) {
            this.logger.error(`Failed to create saved search: ${error.message}`);
            if (error.message.includes('already exists')) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.CONFLICT);
            }
            throw new common_1.HttpException(error.message || 'Failed to create saved search', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async personalizedSearch(userId, query, categories, resourceTypes, plans, verified, city, region, page = 1, limit = 20, sortBy, sortOrder, personalizationWeight = 0.3, request) {
        try {
            if (!userId) {
                throw new common_1.HttpException('User authentication required', common_1.HttpStatus.UNAUTHORIZED);
            }
            this.logger.debug(`Personalized search request for user ${userId}: q="${query}"`);
            const filters = {};
            if (categories && categories.length > 0 && categories[0] !== '') {
                filters.categories = categories;
            }
            if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
                filters.resourceTypes = resourceTypes;
            }
            if (plans && plans.length > 0 && plans[0]) {
                filters.plans = plans;
            }
            if (verified !== undefined) {
                filters.verified = verified;
            }
            if (city) {
                filters.city = city;
            }
            if (region) {
                filters.region = region;
            }
            const searchParams = {
                query: query?.trim(),
                filters,
                sort: sortBy && sortOrder ? { field: sortBy, order: sortOrder } : undefined,
                pagination: { page, limit },
                userId,
                sessionId: request?.sessionID || 'anonymous'
            };
            const results = await this.searchService.personalizedSearch(userId, searchParams, true, personalizationWeight);
            return {
                success: true,
                data: results,
                message: 'Personalized search completed successfully'
            };
        }
        catch (error) {
            this.logger.error(`Personalized search failed: ${error.message}`);
            throw new common_1.HttpException('Personalized search failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserSavedSearches(userId, page = 1, limit = 20) {
        try {
            if (!userId) {
                throw new common_1.HttpException('User authentication required', common_1.HttpStatus.UNAUTHORIZED);
            }
            this.logger.debug(`Getting saved searches for user ${userId}, page ${page}`);
            const result = await this.savedSearchService.getUserSavedSearches(userId, page, limit);
            return {
                success: true,
                data: result,
                message: 'Saved searches retrieved successfully'
            };
        }
        catch (error) {
            this.logger.error(`Failed to get saved searches: ${error.message}`);
            throw new common_1.HttpException('Failed to retrieve saved searches', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSavedSearchById(searchId, userId) {
        try {
            if (!userId) {
                throw new common_1.HttpException('User authentication required', common_1.HttpStatus.UNAUTHORIZED);
            }
            this.logger.debug(`Getting saved search ${searchId} for user ${userId}`);
            const savedSearch = await this.savedSearchService.getSavedSearchById(userId, searchId);
            return {
                success: true,
                data: savedSearch,
                message: 'Saved search retrieved successfully'
            };
        }
        catch (error) {
            this.logger.error(`Failed to get saved search: ${error.message}`);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException('Failed to retrieve saved search', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateSavedSearch(searchId, data, userId) {
        try {
            if (!userId) {
                throw new common_1.HttpException('User authentication required', common_1.HttpStatus.UNAUTHORIZED);
            }
            this.logger.debug(`Updating saved search ${searchId} for user ${userId}`);
            const updatedSearch = await this.savedSearchService.updateSavedSearch(userId, searchId, data);
            return {
                success: true,
                data: updatedSearch,
                message: 'Saved search updated successfully'
            };
        }
        catch (error) {
            this.logger.error(`Failed to update saved search: ${error.message}`);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.NOT_FOUND);
            }
            if (error.message.includes('already exists')) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.CONFLICT);
            }
            throw new common_1.HttpException(error.message || 'Failed to update saved search', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async deleteSavedSearch(searchId, userId) {
        try {
            if (!userId) {
                throw new common_1.HttpException('User authentication required', common_1.HttpStatus.UNAUTHORIZED);
            }
            this.logger.debug(`Deleting saved search ${searchId} for user ${userId}`);
            await this.savedSearchService.deleteSavedSearch(userId, searchId);
            return {
                success: true,
                message: 'Saved search deleted successfully'
            };
        }
        catch (error) {
            this.logger.error(`Failed to delete saved search: ${error.message}`);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException('Failed to delete saved search', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async executeSavedSearch(searchId, userId, personalized = true, personalizationWeight = 0.3) {
        try {
            if (!userId) {
                throw new common_1.HttpException('User authentication required', common_1.HttpStatus.UNAUTHORIZED);
            }
            this.logger.debug(`Executing saved search ${searchId} for user ${userId}, personalized: ${personalized}`);
            const searchParams = await this.savedSearchService.convertToSearchParams(userId, searchId);
            let results;
            if (personalized) {
                results = await this.searchService.personalizedSearch(userId, searchParams, true, personalizationWeight);
            }
            else {
                results = await this.searchService.search(searchParams);
            }
            return {
                success: true,
                data: results,
                message: 'Saved search executed successfully'
            };
        }
        catch (error) {
            this.logger.error(`Failed to execute saved search: ${error.message}`);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException('Failed to execute saved search', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async setSearchLanguage(body, req, ip) {
        try {
            const { language } = body;
            if (!language || !['fr', 'en', 'auto'].includes(language)) {
                throw new common_1.HttpException('Langue non supportée. Langues disponibles: fr, en, auto', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.log(`Language preference set to ${language} for IP ${ip}`);
            return {
                success: true,
                data: {
                    language,
                    message: `Langue de recherche définie sur ${language}`,
                    supportedLanguages: ['fr', 'en', 'auto']
                }
            };
        }
        catch (error) {
            this.logger.error(`Failed to set search language: ${error.message}`);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Erreur lors de la définition de la langue', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async detectQueryLanguage(query) {
        try {
            if (!query || query.trim().length === 0) {
                throw new common_1.HttpException('Paramètre de requête "q" requis', common_1.HttpStatus.BAD_REQUEST);
            }
            const languageDetectionService = this.searchService['languageDetectionService'];
            const detection = languageDetectionService.detectLanguage(query);
            return {
                success: true,
                data: {
                    query,
                    detectedLanguage: detection.language,
                    confidence: detection.confidence,
                    allLanguages: detection.detectedLanguages,
                    recommendedAnalyzer: languageDetectionService.getAnalyzerForLanguage(detection.language),
                    recommendedSearchAnalyzer: languageDetectionService.getSearchAnalyzerForLanguage(detection.language),
                    recommendedFields: languageDetectionService.getSearchFieldsForLanguage(detection.language)
                }
            };
        }
        catch (error) {
            this.logger.error(`Failed to detect query language: ${error.message}`);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Erreur lors de la détection de langue', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSupportedLanguages() {
        try {
            return {
                success: true,
                data: {
                    supportedLanguages: [
                        {
                            code: 'fr',
                            name: 'Français',
                            description: 'Langue française avec analyseur optimisé',
                            default: true
                        },
                        {
                            code: 'en',
                            name: 'English',
                            description: 'English language with optimized analyzer',
                            default: false
                        },
                        {
                            code: 'auto',
                            name: 'Détection automatique',
                            description: 'Détection automatique de la langue selon le contenu',
                            default: false
                        }
                    ],
                    defaultLanguage: 'fr',
                    autoDetectionAvailable: true
                }
            };
        }
        catch (error) {
            this.logger.error(`Failed to get supported languages: ${error.message}`);
            throw new common_1.HttpException('Erreur lors de la récupération des langues supportées', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async changeSearchLanguage(body) {
        try {
            const { searchParams, newLanguage, cacheKey } = body;
            if (!searchParams) {
                throw new common_1.HttpException('Les paramètres de recherche sont requis', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!newLanguage) {
                throw new common_1.HttpException('La nouvelle langue est requise', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Language change request: ${searchParams.language} -> ${newLanguage}`);
            const results = await this.searchService.changeSearchLanguage(searchParams, newLanguage, cacheKey);
            this.logger.debug(`Language change completed: ${results.total} results adapted`);
            return results;
        }
        catch (error) {
            this.logger.error(`Language change failed: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                message: 'Erreur lors du changement de langue',
                error: error.message,
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getResultLanguages(resultId) {
        try {
            if (!resultId) {
                throw new common_1.HttpException('Result ID is required', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`Getting languages for result: ${resultId}`);
            const languageMap = await this.searchService.getAvailableLanguagesForResults([resultId]);
            const languages = languageMap[resultId] || [];
            return {
                languages,
                translationsAvailable: languages.length > 1
            };
        }
        catch (error) {
            this.logger.error(`Failed to get result languages: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Erreur lors de la récupération des langues du résultat', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Recherche avancée avec filtres',
        description: `
    Effectue une recherche textuelle avancée avec support complet des filtres, facettes et tri.
    
    **Fonctionnalités principales :**
    - Recherche textuelle en langage naturel avec correction orthographique
    - Filtrage par catégorie, type de ressource, plan tarifaire
    - Filtrage géographique par ville/région
    - Filtrage par prix avec fourchettes personnalisées
    - Tri par pertinence, date, nom, popularité, note
    - Facettes avec compteurs pour affinage des résultats
    - Pagination optimisée avec métadonnées complètes
    - Support des highlights pour mise en évidence des termes
    
    **Exemples d'utilisation :**
    - Recherche simple : \`?q=restaurant\`
    - Recherche avec filtres : \`?q=restaurant&city=Douala&verified=true&sort=rating&order=desc\`
    - Recherche par catégorie : \`?categories=123e4567-e89b-12d3-a456-426614174000&resourceTypes=BUSINESS\`
    - Recherche avec prix : \`?q=hotel&minPrice=10000&maxPrice=50000&plans=PREMIUM\`
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultats de recherche avec facettes, pagination et métadonnées complètes'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Erreur de validation des paramètres'
    }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Limite de taux dépassée'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Erreur interne du serveur'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'q',
        required: false,
        description: 'Requête de recherche textuelle en langage naturel (max 200 caractères)',
        example: 'restaurant douala cuisine africaine',
        schema: { type: 'string', maxLength: 200 }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'categories',
        required: false,
        description: 'IDs des catégories à filtrer (séparés par virgule). Utilise une logique AND.',
        example: '123e4567-e89b-12d3-a456-426614174000,456e7890-e89b-12d3-a456-426614174001',
        schema: { type: 'array', items: { type: 'string', format: 'uuid' } }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'resourceTypes',
        required: false,
        description: 'Types de ressources à inclure dans les résultats',
        example: 'BUSINESS,API',
        enum: client_1.ResourceType,
        isArray: true
    }),
    (0, swagger_1.ApiQuery)({
        name: 'plans',
        required: false,
        description: 'Plans tarifaires à filtrer',
        example: 'FREE,PREMIUM',
        enum: client_1.ResourcePlan,
        isArray: true
    }),
    (0, swagger_1.ApiQuery)({
        name: 'minPrice',
        required: false,
        description: 'Prix minimum en FCFA (inclus)',
        example: 1000,
        schema: { type: 'integer', minimum: 0 }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'maxPrice',
        required: false,
        description: 'Prix maximum en FCFA (inclus)',
        example: 50000,
        schema: { type: 'integer', minimum: 0 }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'verified',
        required: false,
        description: 'Filtrer uniquement les ressources vérifiées par l\'équipe ROMAPI',
        example: true,
        schema: { type: 'boolean' }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'city',
        required: false,
        description: 'Ville pour filtrage géographique (insensible à la casse)',
        example: 'Douala',
        schema: { type: 'string' }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'region',
        required: false,
        description: 'Région pour filtrage géographique (insensible à la casse)',
        example: 'Littoral',
        schema: { type: 'string' }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'tags',
        required: false,
        description: 'Tags à rechercher (séparés par virgule, logique OR)',
        example: 'cuisine,livraison,africaine',
        schema: { type: 'array', items: { type: 'string' } }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sort',
        required: false,
        description: 'Champ de tri des résultats',
        example: 'relevance',
        enum: ['relevance', 'createdAt', 'updatedAt', 'name', 'popularity', 'rating', 'distance']
    }),
    (0, swagger_1.ApiQuery)({
        name: 'order',
        required: false,
        description: 'Ordre de tri (croissant ou décroissant)',
        example: 'desc',
        enum: ['asc', 'desc']
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        description: 'Numéro de page (commence à 1)',
        example: 1,
        schema: { type: 'integer', minimum: 1 }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: 'Nombre de résultats par page (maximum 100)',
        example: 20,
        schema: { type: 'integer', minimum: 1, maximum: 100 }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'facets',
        required: false,
        description: 'Facettes à inclure dans la réponse pour filtrage dynamique',
        example: 'categories,resourceTypes,plans,verified',
        schema: {
            type: 'array',
            items: {
                type: 'string',
                enum: ['categories', 'resourceTypes', 'plans', 'verified', 'tags', 'cities', 'regions']
            }
        }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'language',
        required: false,
        description: 'Langue préférée pour la recherche et les résultats',
        example: 'fr',
        enum: ['fr', 'en', 'auto'],
        schema: { type: 'string' }
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('categories', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(4, (0, common_1.Query)('resourceTypes', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(5, (0, common_1.Query)('plans', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(6, (0, common_1.Query)('minPrice', new common_1.DefaultValuePipe(undefined), new common_1.ParseIntPipe({ optional: true }))),
    __param(7, (0, common_1.Query)('maxPrice', new common_1.DefaultValuePipe(undefined), new common_1.ParseIntPipe({ optional: true }))),
    __param(8, (0, common_1.Query)('verified', new common_1.DefaultValuePipe(undefined), new common_1.ParseBoolPipe({ optional: true }))),
    __param(9, (0, common_1.Query)('city')),
    __param(10, (0, common_1.Query)('region')),
    __param(11, (0, common_1.Query)('tags', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(12, (0, common_1.Query)('sort', new common_1.DefaultValuePipe(search_interfaces_1.SortField.RELEVANCE))),
    __param(13, (0, common_1.Query)('order', new common_1.DefaultValuePipe(search_interfaces_1.SortOrder.DESC))),
    __param(14, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(15, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(16, (0, common_1.Query)('facets', new common_1.DefaultValuePipe('categories,resourceTypes,plans,verified'), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(17, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Array, Array, Array, Number, Number, Boolean, String, String, Array, String, String, Number, Number, Array, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('suggest'),
    (0, swagger_1.ApiOperation)({
        summary: 'Suggestions auto-complete avancées',
        description: `
    Fournit des suggestions de recherche intelligentes avec auto-complétion en temps réel.
    
    **Fonctionnalités :**
    - Suggestions basées sur la popularité et la pertinence
    - Support de la personnalisation utilisateur
    - Correction orthographique automatique
    - Suggestions de catégories et ressources
    - Rate limiting par session/utilisateur
    - Debouncing côté client recommandé (300ms)
    
    **Types de suggestions :**
    - \`query\` : Requêtes de recherche populaires
    - \`category\` : Noms de catégories correspondants
    - \`resource\` : Noms de ressources spécifiques
    - \`popular\` : Suggestions tendances
    
    **Optimisations :**
    - Cache Redis pour réponses rapides
    - Pré-calcul des suggestions populaires
    - Limitation automatique des requêtes abusives
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des suggestions classées par pertinence avec métadonnées'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Requête trop courte ou paramètres invalides'
    }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Limite de suggestions dépassée'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'q',
        required: true,
        description: 'Début de la requête pour suggestions (minimum 2 caractères, maximum 100)',
        example: 'rest',
        schema: { type: 'string', minLength: 2, maxLength: 100 }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: 'Nombre maximum de suggestions à retourner (maximum 20)',
        example: 10,
        schema: { type: 'integer', minimum: 1, maximum: 20 }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'userId',
        required: false,
        description: 'ID utilisateur pour personnalisation des suggestions basée sur l\'historique',
        example: 'user_123456',
        schema: { type: 'string' }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'includePopular',
        required: false,
        description: 'Inclure les suggestions populaires même si elles ne matchent pas exactement',
        example: true,
        schema: { type: 'boolean' }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sessionId',
        required: false,
        description: 'ID de session pour rate limiting et analytics',
        example: 'session_789012',
        schema: { type: 'string' }
    }),
    (0, swagger_1.ApiQuery)({
        name: 'language',
        required: false,
        description: 'Langue préférée pour les suggestions',
        example: 'fr',
        enum: ['fr', 'en', 'auto'],
        schema: { type: 'string' }
    }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('includePopular', new common_1.DefaultValuePipe(true), new common_1.ParseBoolPipe({ optional: true }))),
    __param(4, (0, common_1.Query)('sessionId')),
    __param(5, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, Boolean, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "suggest", null);
__decorate([
    (0, common_1.Get)('suggest/popular'),
    (0, swagger_1.ApiOperation)({
        summary: 'Suggestions populaires',
        description: 'Obtient les suggestions les plus populaires pour pré-cache ou affichage initial'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des suggestions populaires',
        type: [Object]
    }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre maximum de suggestions populaires' }),
    __param(0, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getPopularSuggestions", null);
__decorate([
    (0, common_1.Get)('suggest/smart'),
    (0, swagger_1.ApiOperation)({
        summary: 'Suggestions intelligentes avec auto-complétion',
        description: 'Obtient des suggestions avec stratégies multiples (exact, fuzzy, populaire)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des suggestions intelligentes',
        type: [Object]
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Requête pour suggestions intelligentes' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre maximum de suggestions' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'ID utilisateur pour personnalisation' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSmartSuggestions", null);
__decorate([
    (0, common_1.Get)('category/:categoryId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Recherche par catégorie',
        description: 'Recherche toutes les ressources d\'une catégorie spécifique'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultats de la catégorie avec facettes',
        type: Object
    }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('resourceTypes', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(3, (0, common_1.Query)('plans', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(4, (0, common_1.Query)('verified', new common_1.DefaultValuePipe(undefined), new common_1.ParseBoolPipe({ optional: true }))),
    __param(5, (0, common_1.Query)('sort', new common_1.DefaultValuePipe(search_interfaces_1.SortField.RELEVANCE))),
    __param(6, (0, common_1.Query)('order', new common_1.DefaultValuePipe(search_interfaces_1.SortOrder.DESC))),
    __param(7, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(8, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array, Array, Boolean, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchByCategory", null);
__decorate([
    (0, common_1.Get)('categories/:categoryId/hierarchy'),
    (0, swagger_1.ApiOperation)({
        summary: 'Recherche par catégorie avec navigation hiérarchique',
        description: 'Recherche avec informations complètes de hiérarchie, sous-catégories et breadcrumbs'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultats avec navigation hiérarchique complète',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'includeSubcategories', required: false, description: 'Inclure les sous-catégories dans la recherche' }),
    (0, swagger_1.ApiQuery)({ name: 'maxDepth', required: false, description: 'Profondeur maximale de la hiérarchie' }),
    (0, swagger_1.ApiQuery)({ name: 'showCounts', required: false, description: 'Afficher les compteurs de ressources' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('includeSubcategories', new common_1.DefaultValuePipe(true), new common_1.ParseBoolPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('maxDepth', new common_1.DefaultValuePipe(3), common_1.ParseIntPipe)),
    __param(4, (0, common_1.Query)('showCounts', new common_1.DefaultValuePipe(true), new common_1.ParseBoolPipe({ optional: true }))),
    __param(5, (0, common_1.Query)('resourceTypes', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(6, (0, common_1.Query)('plans', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(7, (0, common_1.Query)('verified', new common_1.DefaultValuePipe(undefined), new common_1.ParseBoolPipe({ optional: true }))),
    __param(8, (0, common_1.Query)('sort', new common_1.DefaultValuePipe(search_interfaces_1.SortField.RELEVANCE))),
    __param(9, (0, common_1.Query)('order', new common_1.DefaultValuePipe(search_interfaces_1.SortOrder.DESC))),
    __param(10, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(11, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean, Number, Boolean, Array, Array, Boolean, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchByCategoryWithHierarchy", null);
__decorate([
    (0, common_1.Get)('categories/hierarchy'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir la hiérarchie complète des catégories',
        description: 'Retourne la structure hiérarchique des catégories avec compteurs'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Hiérarchie complète des catégories',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, description: 'ID de la catégorie courante pour contexte' }),
    (0, swagger_1.ApiQuery)({ name: 'includeResourceCounts', required: false, description: 'Inclure les compteurs de ressources' }),
    (0, swagger_1.ApiQuery)({ name: 'maxDepth', required: false, description: 'Profondeur maximale' }),
    __param(0, (0, common_1.Query)('categoryId')),
    __param(1, (0, common_1.Query)('includeResourceCounts', new common_1.DefaultValuePipe(true), new common_1.ParseBoolPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('maxDepth', new common_1.DefaultValuePipe(5), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getCategoryHierarchy", null);
__decorate([
    (0, common_1.Get)('categories/:slug'),
    (0, swagger_1.ApiOperation)({
        summary: 'Recherche par catégorie avec slug SEO-friendly',
        description: 'Effectue une recherche dans une catégorie spécifique en utilisant son slug pour des URLs SEO-friendly'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultats de recherche par catégorie avec navigation',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Requête de recherche textuelle' }),
    (0, swagger_1.ApiQuery)({ name: 'includeSubcategories', required: false, description: 'Inclure les sous-catégories' }),
    (0, swagger_1.ApiQuery)({ name: 'maxDepth', required: false, description: 'Profondeur maximale de la hiérarchie' }),
    (0, swagger_1.ApiQuery)({ name: 'showCounts', required: false, description: 'Afficher les compteurs de ressources' }),
    (0, swagger_1.ApiQuery)({ name: 'resourceTypes', required: false, description: 'Types de ressources (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'plans', required: false, description: 'Plans tarifaires (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, description: 'Champ de tri' }),
    (0, swagger_1.ApiQuery)({ name: 'order', required: false, description: 'Ordre de tri (asc/desc)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Numéro de page' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre de résultats par page' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('includeSubcategories', new common_1.DefaultValuePipe(true), new common_1.ParseBoolPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('maxDepth', new common_1.DefaultValuePipe(3), common_1.ParseIntPipe)),
    __param(4, (0, common_1.Query)('showCounts', new common_1.DefaultValuePipe(true), new common_1.ParseBoolPipe({ optional: true }))),
    __param(5, (0, common_1.Query)('resourceTypes', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(6, (0, common_1.Query)('plans', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(7, (0, common_1.Query)('verified', new common_1.DefaultValuePipe(undefined), new common_1.ParseBoolPipe({ optional: true }))),
    __param(8, (0, common_1.Query)('sort', new common_1.DefaultValuePipe(search_interfaces_1.SortField.RELEVANCE))),
    __param(9, (0, common_1.Query)('order', new common_1.DefaultValuePipe(search_interfaces_1.SortOrder.DESC))),
    __param(10, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(11, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean, Number, Boolean, Array, Array, Boolean, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchByCategorySlug", null);
__decorate([
    (0, common_1.Get)('multi-type'),
    (0, swagger_1.ApiOperation)({
        summary: 'Recherche multi-types avec groupement',
        description: 'Effectue une recherche simultanée dans tous les types de ressources (API, entreprises, services) avec groupement par type'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultats groupés par type de ressource avec onglets',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Requête de recherche textuelle' }),
    (0, swagger_1.ApiQuery)({ name: 'includeTypes', required: false, description: 'Types de ressources à inclure (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'groupByType', required: false, description: 'Grouper les résultats par type' }),
    (0, swagger_1.ApiQuery)({ name: 'globalRelevanceSort', required: false, description: 'Tri par pertinence globale' }),
    (0, swagger_1.ApiQuery)({ name: 'categories', required: false, description: 'IDs des catégories (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'plans', required: false, description: 'Plans tarifaires (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false, description: 'Ville' }),
    (0, swagger_1.ApiQuery)({ name: 'region', required: false, description: 'Région' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, description: 'Champ de tri', enum: search_interfaces_1.SortField }),
    (0, swagger_1.ApiQuery)({ name: 'order', required: false, description: 'Ordre de tri', enum: search_interfaces_1.SortOrder }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Numéro de page' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre de résultats par page' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('includeTypes', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(2, (0, common_1.Query)('groupByType', new common_1.DefaultValuePipe(true), new common_1.ParseBoolPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('globalRelevanceSort', new common_1.DefaultValuePipe(true), new common_1.ParseBoolPipe({ optional: true }))),
    __param(4, (0, common_1.Query)('categories', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(5, (0, common_1.Query)('plans', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(6, (0, common_1.Query)('verified', new common_1.DefaultValuePipe(undefined), new common_1.ParseBoolPipe({ optional: true }))),
    __param(7, (0, common_1.Query)('city')),
    __param(8, (0, common_1.Query)('region')),
    __param(9, (0, common_1.Query)('sort', new common_1.DefaultValuePipe(search_interfaces_1.SortField.RELEVANCE))),
    __param(10, (0, common_1.Query)('order', new common_1.DefaultValuePipe(search_interfaces_1.SortOrder.DESC))),
    __param(11, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(12, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Boolean, Boolean, Array, Array, Boolean, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchMultiType", null);
__decorate([
    (0, common_1.Get)('multi-type/distribution'),
    (0, swagger_1.ApiOperation)({
        summary: 'Distribution des types pour une requête',
        description: 'Obtient le nombre de résultats par type de ressource pour une requête donnée'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Distribution des résultats par type de ressource',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Requête de recherche textuelle' }),
    (0, swagger_1.ApiQuery)({ name: 'categories', required: false, description: 'IDs des catégories (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false, description: 'Ville' }),
    (0, swagger_1.ApiQuery)({ name: 'region', required: false, description: 'Région' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('categories', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(2, (0, common_1.Query)('verified', new common_1.DefaultValuePipe(undefined), new common_1.ParseBoolPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('city')),
    __param(4, (0, common_1.Query)('region')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Boolean, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getTypeDistribution", null);
__decorate([
    (0, common_1.Get)('multi-type/export'),
    (0, swagger_1.ApiOperation)({
        summary: 'Exporter les résultats par type',
        description: 'Exporte les résultats de recherche groupés par type de ressource dans différents formats'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Données exportées par type de ressource',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Requête de recherche textuelle' }),
    (0, swagger_1.ApiQuery)({ name: 'exportTypes', required: true, description: 'Types de ressources à exporter (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'format', required: false, description: 'Format d\'export (json, csv, xlsx)' }),
    (0, swagger_1.ApiQuery)({ name: 'categories', required: false, description: 'IDs des catégories (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false, description: 'Ville' }),
    (0, swagger_1.ApiQuery)({ name: 'region', required: false, description: 'Région' }),
    (0, swagger_1.ApiQuery)({ name: 'maxResults', required: false, description: 'Nombre maximum de résultats par type' }),
    __param(0, (0, common_1.Query)('exportTypes', new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('format', new common_1.DefaultValuePipe('json'))),
    __param(3, (0, common_1.Query)('categories', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(4, (0, common_1.Query)('verified', new common_1.DefaultValuePipe(undefined), new common_1.ParseBoolPipe({ optional: true }))),
    __param(5, (0, common_1.Query)('city')),
    __param(6, (0, common_1.Query)('region')),
    __param(7, (0, common_1.Query)('maxResults', new common_1.DefaultValuePipe(1000), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, String, Array, Boolean, String, String, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "exportResultsByType", null);
__decorate([
    (0, common_1.Get)('type/:resourceType'),
    (0, swagger_1.ApiOperation)({
        summary: 'Recherche dans un type spécifique avec contexte multi-type',
        description: 'Effectue une recherche dans un type de ressource spécifique avec des métadonnées de contexte multi-type'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultats de recherche pour le type spécifique avec contexte',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Requête de recherche textuelle' }),
    (0, swagger_1.ApiQuery)({ name: 'categories', required: false, description: 'IDs des catégories (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'plans', required: false, description: 'Plans tarifaires (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false, description: 'Ville' }),
    (0, swagger_1.ApiQuery)({ name: 'region', required: false, description: 'Région' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, description: 'Champ de tri', enum: search_interfaces_1.SortField }),
    (0, swagger_1.ApiQuery)({ name: 'order', required: false, description: 'Ordre de tri', enum: search_interfaces_1.SortOrder }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Numéro de page' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre de résultats par page' }),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('categories', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(3, (0, common_1.Query)('plans', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(4, (0, common_1.Query)('verified', new common_1.DefaultValuePipe(undefined), new common_1.ParseBoolPipe({ optional: true }))),
    __param(5, (0, common_1.Query)('city')),
    __param(6, (0, common_1.Query)('region')),
    __param(7, (0, common_1.Query)('sort', new common_1.DefaultValuePipe(search_interfaces_1.SortField.RELEVANCE))),
    __param(8, (0, common_1.Query)('order', new common_1.DefaultValuePipe(search_interfaces_1.SortOrder.DESC))),
    __param(9, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(10, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array, Array, Boolean, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchSingleTypeWithContext", null);
__decorate([
    (0, common_1.Get)('categories/:slug/share'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les informations de partage pour une catégorie',
        description: 'Retourne les métadonnées nécessaires pour le partage social d\'une catégorie'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Métadonnées de partage pour la catégorie',
        type: Object
    }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getCategoryShareInfo", null);
__decorate([
    (0, common_1.Get)('nearby'),
    (0, swagger_1.ApiOperation)({
        summary: 'Recherche géographique',
        description: 'Recherche des ressources près d\'une localisation'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultats triés par distance',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'lat', required: true, description: 'Latitude' }),
    (0, swagger_1.ApiQuery)({ name: 'lon', required: true, description: 'Longitude' }),
    (0, swagger_1.ApiQuery)({ name: 'radius', required: false, description: 'Rayon de recherche en km' }),
    __param(0, (0, common_1.Query)('lat', common_1.ParseFloatPipe)),
    __param(1, (0, common_1.Query)('lon', common_1.ParseFloatPipe)),
    __param(2, (0, common_1.Query)('radius', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('q')),
    __param(4, (0, common_1.Query)('categories', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(5, (0, common_1.Query)('resourceTypes', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(6, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(7, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String, Array, Array, Number, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchNearby", null);
__decorate([
    (0, common_1.Post)('filters/save'),
    (0, swagger_1.ApiOperation)({
        summary: 'Sauvegarder les filtres de recherche',
        description: 'Sauvegarde les filtres de recherche pour une session utilisateur pour persistance entre onglets'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Filtres sauvegardés avec succès',
        type: Object
    }),
    __param(0, (0, common_1.Headers)('x-session-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "saveFilters", null);
__decorate([
    (0, common_1.Get)('filters/load'),
    (0, swagger_1.ApiOperation)({
        summary: 'Charger les filtres sauvegardés',
        description: 'Récupère les filtres de recherche sauvegardés pour une session utilisateur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Filtres récupérés avec succès',
        type: Object
    }),
    __param(0, (0, common_1.Headers)('x-session-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "loadFilters", null);
__decorate([
    (0, common_1.Put)('filters/tab'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour l\'onglet actif',
        description: 'Met à jour l\'onglet actif sans changer les filtres sauvegardés'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Onglet actif mis à jour avec succès',
        type: Object
    }),
    __param(0, (0, common_1.Headers)('x-session-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "updateActiveTab", null);
__decorate([
    (0, common_1.Delete)('filters/clear'),
    (0, swagger_1.ApiOperation)({
        summary: 'Effacer les filtres sauvegardés',
        description: 'Supprime tous les filtres sauvegardés pour une session utilisateur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Filtres effacés avec succès',
        type: Object
    }),
    __param(0, (0, common_1.Headers)('x-session-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "clearFilters", null);
__decorate([
    (0, common_1.Get)('filters/history'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir l\'historique des filtres',
        description: 'Récupère l\'historique des filtres utilisés par une session utilisateur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Historique des filtres récupéré avec succès',
        type: [Object]
    }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre maximum d\'entrées dans l\'historique' }),
    __param(0, (0, common_1.Headers)('x-session-id')),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getFilterHistory", null);
__decorate([
    (0, common_1.Get)('filters/popular'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les filtres populaires',
        description: 'Récupère les filtres les plus utilisés pour suggestions'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Filtres populaires récupérés avec succès',
        type: [Object]
    }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre maximum de filtres populaires' }),
    __param(0, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getPopularFilters", null);
__decorate([
    (0, common_1.Get)('multi-type/with-persistence'),
    (0, swagger_1.ApiOperation)({
        summary: 'Recherche multi-types avec filtres persistés',
        description: 'Effectue une recherche multi-types en appliquant automatiquement les filtres persistés de la session'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultats de recherche avec filtres persistés appliqués',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Requête de recherche textuelle' }),
    (0, swagger_1.ApiQuery)({ name: 'includeTypes', required: false, description: 'Types de ressources à inclure (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'overrideFilters', required: false, description: 'Ignorer les filtres persistés' }),
    __param(0, (0, common_1.Headers)('x-session-id')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('includeTypes', new common_1.DefaultValuePipe(''), new common_1.ParseArrayPipe({ items: String, separator: ',', optional: true }))),
    __param(3, (0, common_1.Query)('overrideFilters', new common_1.DefaultValuePipe(false), new common_1.ParseBoolPipe({ optional: true }))),
    __param(4, (0, common_1.Query)('groupByType', new common_1.DefaultValuePipe(true), new common_1.ParseBoolPipe({ optional: true }))),
    __param(5, (0, common_1.Query)('globalRelevanceSort', new common_1.DefaultValuePipe(true), new common_1.ParseBoolPipe({ optional: true }))),
    __param(6, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(7, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array, Boolean, Boolean, Boolean, Number, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchMultiTypeWithPersistence", null);
__decorate([
    (0, common_1.Post)('click'),
    (0, swagger_1.ApiOperation)({
        summary: 'Logger un clic sur un résultat de recherche',
        description: 'Enregistre qu\'un utilisateur a cliqué sur un résultat de recherche pour les analytics'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Clic enregistré avec succès',
        type: Object
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "logClick", null);
__decorate([
    (0, common_1.Get)('analytics/popular-terms'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les termes de recherche populaires',
        description: 'Retourne les termes de recherche les plus utilisés avec leurs statistiques'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Termes populaires récupérés avec succès',
        type: [Object]
    }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Date de début (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'Date de fin (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre maximum de termes' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getPopularTerms", null);
__decorate([
    (0, common_1.Get)('analytics/no-results'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les requêtes sans résultats',
        description: 'Retourne les requêtes qui n\'ont donné aucun résultat pour améliorer le système'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Requêtes sans résultats récupérées avec succès',
        type: [Object]
    }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Date de début (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'Date de fin (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre maximum de requêtes' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getNoResultsQueries", null);
__decorate([
    (0, common_1.Get)('analytics/metrics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les métriques de recherche',
        description: 'Retourne les métriques de performance et d\'utilisation du système de recherche'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Métriques récupérées avec succès',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Date de début (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'Date de fin (ISO string)' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSearchMetrics", null);
__decorate([
    (0, common_1.Get)('analytics/resource/:resourceId/clicks'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les statistiques de clics d\'une ressource',
        description: 'Retourne les statistiques détaillées des clics pour une ressource spécifique'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statistiques de clics récupérées avec succès',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Date de début (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'Date de fin (ISO string)' }),
    __param(0, (0, common_1.Param)('resourceId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getResourceClickStats", null);
__decorate([
    (0, common_1.Get)('analytics/dashboard'),
    (0, swagger_1.ApiOperation)({
        summary: 'Dashboard d\'analytics pour administrateurs',
        description: 'Retourne un tableau de bord complet avec toutes les métriques importantes'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboard récupéré avec succès',
        type: Object
    }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Date de début (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'Date de fin (ISO string)' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getAnalyticsDashboard", null);
__decorate([
    (0, common_1.Get)('analytics/dashboard-ui'),
    (0, swagger_1.ApiOperation)({
        summary: 'Interface du dashboard d\'analytics',
        description: 'Retourne l\'interface HTML du dashboard d\'analytics pour les administrateurs'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Interface HTML du dashboard',
        content: {
            'text/html': {
                schema: {
                    type: 'string'
                }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], SearchController.prototype, "getDashboardUI", null);
__decorate([
    (0, common_1.Post)('saved'),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer une recherche sauvegardée',
        description: 'Sauvegarde une recherche avec ses paramètres pour réutilisation future'
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Recherche sauvegardée créée avec succès' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Données invalides' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Authentification requise' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "createSavedSearch", null);
__decorate([
    (0, common_1.Get)('personalized'),
    (0, swagger_1.ApiOperation)({
        summary: 'Recherche personnalisée',
        description: 'Effectue une recherche personnalisée basée sur l\'historique utilisateur'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Résultats de recherche personnalisés' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Authentification requise' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Requête de recherche textuelle' }),
    (0, swagger_1.ApiQuery)({ name: 'categories', required: false, description: 'IDs des catégories (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'resourceTypes', required: false, description: 'Types de ressources (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'plans', required: false, description: 'Plans tarifaires (séparés par virgule)' }),
    (0, swagger_1.ApiQuery)({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false, description: 'Ville' }),
    (0, swagger_1.ApiQuery)({ name: 'region', required: false, description: 'Région' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Numéro de page (défaut: 1)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre de résultats par page (défaut: 20)' }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false, description: 'Champ de tri' }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, description: 'Ordre de tri (asc/desc)' }),
    (0, swagger_1.ApiQuery)({ name: 'personalizationWeight', required: false, description: 'Poids de personnalisation (0.0-1.0, défaut: 0.3)' }),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('categories', new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __param(3, (0, common_1.Query)('resourceTypes', new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __param(4, (0, common_1.Query)('plans', new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __param(5, (0, common_1.Query)('verified', common_1.ParseBoolPipe)),
    __param(6, (0, common_1.Query)('city')),
    __param(7, (0, common_1.Query)('region')),
    __param(8, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(9, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(10, (0, common_1.Query)('sortBy')),
    __param(11, (0, common_1.Query)('sortOrder')),
    __param(12, (0, common_1.Query)('personalizationWeight', new common_1.DefaultValuePipe(0.3), common_1.ParseFloatPipe)),
    __param(13, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array, Array, Array, Boolean, String, String, Number, Number, String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "personalizedSearch", null);
__decorate([
    (0, common_1.Get)('saved'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les recherches sauvegardées',
        description: 'Récupère toutes les recherches sauvegardées de l\'utilisateur'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des recherches sauvegardées' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Authentification requise' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Numéro de page (défaut: 1)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre d\'éléments par page (défaut: 20)' }),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getUserSavedSearches", null);
__decorate([
    (0, common_1.Get)('saved/:searchId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir une recherche sauvegardée',
        description: 'Récupère une recherche sauvegardée spécifique par son ID'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recherche sauvegardée trouvée' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Recherche sauvegardée non trouvée' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Authentification requise' }),
    __param(0, (0, common_1.Param)('searchId')),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSavedSearchById", null);
__decorate([
    (0, common_1.Put)('saved/:searchId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour une recherche sauvegardée',
        description: 'Met à jour les paramètres d\'une recherche sauvegardée existante'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recherche sauvegardée mise à jour' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Recherche sauvegardée non trouvée' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Authentification requise' }),
    __param(0, (0, common_1.Param)('searchId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "updateSavedSearch", null);
__decorate([
    (0, common_1.Delete)('saved/:searchId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Supprimer une recherche sauvegardée',
        description: 'Supprime définitivement une recherche sauvegardée'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recherche sauvegardée supprimée' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Recherche sauvegardée non trouvée' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Authentification requise' }),
    __param(0, (0, common_1.Param)('searchId')),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "deleteSavedSearch", null);
__decorate([
    (0, common_1.Post)('saved/:searchId/execute'),
    (0, swagger_1.ApiOperation)({
        summary: 'Exécuter une recherche sauvegardée',
        description: 'Exécute une recherche sauvegardée et retourne les résultats actuels'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Résultats de la recherche sauvegardée' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Recherche sauvegardée non trouvée' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Authentification requise' }),
    (0, swagger_1.ApiQuery)({ name: 'personalized', required: false, description: 'Appliquer la personnalisation (défaut: true)' }),
    (0, swagger_1.ApiQuery)({ name: 'personalizationWeight', required: false, description: 'Poids de personnalisation (0.0-1.0, défaut: 0.3)' }),
    __param(0, (0, common_1.Param)('searchId')),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __param(2, (0, common_1.Query)('personalized', new common_1.DefaultValuePipe(true), common_1.ParseBoolPipe)),
    __param(3, (0, common_1.Query)('personalizationWeight', new common_1.DefaultValuePipe(0.3), common_1.ParseFloatPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "executeSavedSearch", null);
__decorate([
    (0, common_1.Post)('language/set'),
    (0, swagger_1.ApiOperation)({
        summary: 'Définir la langue de recherche préférée',
        description: `
    Permet de définir la langue préférée pour les recherches de l'utilisateur.
    Cette préférence sera utilisée pour prioriser les résultats dans la langue choisie
    et adapter les analyseurs de recherche.
    
    **Langues supportées :**
    - \`fr\` : Français (par défaut)
    - \`en\` : Anglais
    - \`auto\` : Détection automatique
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Langue définie avec succès'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Langue non supportée'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "setSearchLanguage", null);
__decorate([
    (0, common_1.Get)('language/detect'),
    (0, swagger_1.ApiOperation)({
        summary: 'Détecter la langue d\'une requête de recherche',
        description: `
    Analyse une requête de recherche pour détecter automatiquement sa langue.
    Utile pour adapter les résultats et les analyseurs selon le contenu de la requête.
    
    **Fonctionnalités :**
    - Détection basée sur les mots-clés et patterns linguistiques
    - Score de confiance pour chaque langue détectée
    - Recommandations d'analyseurs appropriés
    `
    }),
    (0, swagger_1.ApiQuery)({
        name: 'q',
        description: 'Requête de recherche à analyser',
        required: true,
        example: 'restaurant français à Douala'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Langue détectée avec score de confiance'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Requête manquante ou invalide'
    }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "detectQueryLanguage", null);
__decorate([
    (0, common_1.Get)('language/supported'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les langues supportées',
        description: `
    Retourne la liste des langues supportées par le système de recherche
    avec leurs codes ISO et descriptions.
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des langues supportées'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSupportedLanguages", null);
__decorate([
    (0, common_1.Post)('language/change'),
    (0, swagger_1.ApiOperation)({
        summary: 'Changer la langue de recherche',
        description: `
    Change la langue de recherche et adapte les résultats existants selon la nouvelle langue.
    
    **Fonctionnalités :**
    - Adaptation des résultats selon la nouvelle langue utilisateur
    - Recalcul des scores de pertinence avec boost de langue
    - Invalidation du cache pour forcer la mise à jour
    - Indication de langue pour chaque résultat
    - Support des traductions disponibles
    
    **Cas d'usage :**
    - Utilisateur change de langue dans l'interface
    - Adaptation dynamique des résultats sans nouvelle recherche
    - Personnalisation selon les préférences linguistiques
    
    Requirements: 12.6, 12.7
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultats adaptés à la nouvelle langue avec métadonnées d\'adaptation'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Langue non supportée ou paramètres invalides'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Erreur lors du changement de langue'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "changeSearchLanguage", null);
__decorate([
    (0, common_1.Get)('results/:resultId/languages'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les langues disponibles pour un résultat',
        description: `
    Retourne les langues dans lesquelles un résultat spécifique est disponible,
    avec indication des traductions possibles.
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Langues disponibles pour le résultat'
    }),
    (0, swagger_1.ApiParam)({
        name: 'resultId',
        description: 'ID du résultat de recherche',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    __param(0, (0, common_1.Param)('resultId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getResultLanguages", null);
exports.SearchController = SearchController = SearchController_1 = __decorate([
    (0, swagger_1.ApiTags)('Search'),
    (0, common_1.Controller)('api/v1/search'),
    __metadata("design:paramtypes", [search_service_1.SearchService,
        category_search_service_1.CategorySearchService,
        multi_type_search_service_1.MultiTypeSearchService,
        search_filter_persistence_service_1.SearchFilterPersistenceService,
        search_analytics_service_1.SearchAnalyticsService,
        saved_search_service_1.SavedSearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map