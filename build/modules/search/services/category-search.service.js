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
var CategorySearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategorySearchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const search_cache_service_1 = require("./search-cache.service");
const category_repository_1 = require("../../../repositories/category.repository");
const elasticsearch_service_1 = require("./elasticsearch.service");
let CategorySearchService = CategorySearchService_1 = class CategorySearchService {
    constructor(categoryRepository, cacheService, elasticsearchService, configService) {
        this.categoryRepository = categoryRepository;
        this.cacheService = cacheService;
        this.elasticsearchService = elasticsearchService;
        this.configService = configService;
        this.logger = new common_1.Logger(CategorySearchService_1.name);
    }
    async searchByCategory(categoryId, params) {
        const startTime = Date.now();
        try {
            this.logger.debug(`Category search: categoryId=${categoryId}, includeSubcategories=${params.includeSubcategories}`);
            const cacheKey = this.generateCategoryCacheKey(categoryId, params);
            const cachedResults = await this.cacheService.getCachedSearchResults(cacheKey);
            if (cachedResults) {
                return cachedResults;
            }
            const categoryInfo = await this.getCategoryInfo(categoryId, params.showCounts !== false);
            if (!categoryInfo) {
                throw new common_1.NotFoundException(`Category with ID ${categoryId} not found`);
            }
            const searchParams = await this.buildCategorySearchParams(categoryId, params);
            const searchResults = await this.performElasticsearchSearch(searchParams);
            const hierarchy = await this.getCategoryHierarchy({
                categoryId,
                includeResourceCounts: params.showCounts !== false,
                maxDepth: params.maxDepth || 3
            });
            const subcategories = await this.getSubcategoriesWithCounts(categoryId, params.includeSubcategories !== false, params.maxDepth || 2);
            const breadcrumbs = await this.buildCategoryBreadcrumbs(categoryId);
            const results = {
                ...searchResults,
                category: categoryInfo,
                subcategories,
                breadcrumbs,
                hierarchy,
                took: Date.now() - startTime
            };
            await this.cacheService.cacheSearchResults(cacheKey, results);
            this.logger.debug(`Category search completed in ${results.took}ms`);
            return results;
        }
        catch (error) {
            this.logger.error(`Category search failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getCategoryHierarchy(params) {
        try {
            const cacheKey = `category_hierarchy_${params.categoryId || 'root'}_${JSON.stringify(params)}`;
            const cached = await this.cacheService.redisClient.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            let current = null;
            let ancestors = [];
            let siblings = [];
            let children = [];
            if (params.categoryId) {
                current = await this.getCategoryInfo(params.categoryId, params.includeResourceCounts !== false);
                if (!current) {
                    throw new common_1.NotFoundException(`Category ${params.categoryId} not found`);
                }
                ancestors = await this.getCategoryAncestors(params.categoryId);
                siblings = await this.getCategorySiblings(params.categoryId);
                children = await this.getCategoryChildren(params.categoryId, params.includeResourceCounts !== false);
            }
            const root = await this.getRootCategories(params.includeResourceCounts !== false);
            const hierarchy = {
                root,
                current: current,
                siblings,
                children,
                ancestors
            };
            await this.cacheService.redisClient.setex(cacheKey, 3600, JSON.stringify(hierarchy));
            return hierarchy;
        }
        catch (error) {
            this.logger.error(`Failed to get category hierarchy: ${error.message}`);
            throw error;
        }
    }
    async getCategoryBySlug(slug) {
        try {
            const category = await this.categoryRepository.findBySlug(slug, {
                parent: true,
                children: true,
                _count: {
                    select: {
                        children: true,
                        apiResources: true
                    }
                }
            });
            if (!category) {
                return null;
            }
            const level = await this.calculateCategoryLevel(category.id);
            const path = await this.buildCategoryPath(category.id);
            const categoryInfo = {
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description || undefined,
                icon: category.icon || undefined,
                parentId: category.parentId || undefined,
                level,
                resourceCount: category._count?.apiResources || 0,
                subcategoryCount: category._count?.children || 0,
                path
            };
            return categoryInfo;
        }
        catch (error) {
            this.logger.error(`Failed to get category by slug: ${error.message}`);
            return null;
        }
    }
    async getCategoryInfo(categoryId, includeCounts = true) {
        try {
            const category = await this.categoryRepository.findById(categoryId, {
                parent: true,
                children: true,
                _count: includeCounts ? {
                    select: {
                        children: true,
                        apiResources: true
                    }
                } : undefined
            });
            if (!category) {
                return null;
            }
            const level = await this.calculateCategoryLevel(categoryId);
            const path = await this.buildCategoryPath(categoryId);
            const categoryInfo = {
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description || undefined,
                icon: category.icon || undefined,
                parentId: category.parentId || undefined,
                level,
                resourceCount: includeCounts ? category._count?.apiResources || 0 : 0,
                subcategoryCount: includeCounts ? category._count?.children || 0 : 0,
                path
            };
            return categoryInfo;
        }
        catch (error) {
            this.logger.error(`Failed to get category info: ${error.message}`);
            return null;
        }
    }
    async getSubcategoriesWithCounts(categoryId, includeSubcategories = true, maxDepth = 2) {
        if (!includeSubcategories) {
            return [];
        }
        try {
            const subcategories = await this.categoryRepository.findMany({
                where: { parentId: categoryId },
                include: {
                    children: maxDepth > 1,
                    _count: {
                        select: {
                            children: true,
                            apiResources: true
                        }
                    }
                },
                orderBy: [
                    { name: 'asc' }
                ]
            });
            const results = [];
            for (const subcategory of subcategories) {
                const level = await this.calculateCategoryLevel(subcategory.id);
                const path = await this.buildCategoryPath(subcategory.id);
                const categoryInfo = {
                    id: subcategory.id,
                    name: subcategory.name,
                    slug: subcategory.slug,
                    description: subcategory.description || undefined,
                    icon: subcategory.icon || undefined,
                    parentId: subcategory.parentId || undefined,
                    level,
                    resourceCount: subcategory._count?.apiResources || 0,
                    subcategoryCount: subcategory._count?.children || 0,
                    path
                };
                if (maxDepth > 1 && subcategory._count?.children > 0) {
                    categoryInfo.children = await this.getSubcategoriesWithCounts(subcategory.id, true, maxDepth - 1);
                }
                results.push(categoryInfo);
            }
            return results;
        }
        catch (error) {
            this.logger.error(`Failed to get subcategories: ${error.message}`);
            return [];
        }
    }
    async buildCategoryBreadcrumbs(categoryId) {
        try {
            const ancestors = await this.getCategoryAncestors(categoryId);
            const current = await this.getCategoryInfo(categoryId, false);
            if (!current) {
                return [];
            }
            const breadcrumbs = [];
            breadcrumbs.push({
                id: 'root',
                name: 'Toutes les catégories',
                slug: '',
                url: '/categories',
                level: 0
            });
            ancestors.forEach((ancestor, index) => {
                breadcrumbs.push({
                    id: ancestor.id,
                    name: ancestor.name,
                    slug: ancestor.slug,
                    url: `/categories/${ancestor.slug}`,
                    level: index + 1
                });
            });
            breadcrumbs.push({
                id: current.id,
                name: current.name,
                slug: current.slug,
                url: `/categories/${current.slug}`,
                level: current.level
            });
            return breadcrumbs;
        }
        catch (error) {
            this.logger.error(`Failed to build breadcrumbs: ${error.message}`);
            return [];
        }
    }
    async getCategoryStats(categoryId) {
        try {
            const indexName = this.configService.get('elasticsearch.indices.resources');
            const query = {
                query: {
                    term: { 'category.id': categoryId }
                },
                size: 0,
                aggs: {
                    total_resources: {
                        value_count: { field: 'id' }
                    },
                    verified_resources: {
                        filter: { term: { verified: true } },
                        aggs: {
                            count: { value_count: { field: 'id' } }
                        }
                    },
                    resource_types: {
                        terms: { field: 'resourceType', size: 20 }
                    },
                    resource_plans: {
                        terms: { field: 'plan', size: 10 }
                    },
                    avg_rating: {
                        avg: { field: 'rating' }
                    }
                }
            };
            const response = await this.elasticsearchService.search(indexName, query);
            const stats = {
                categoryId,
                totalResources: response.aggregations?.total_resources?.value || 0,
                verifiedResources: response.aggregations?.verified_resources?.count?.value || 0,
                resourcesByType: {},
                resourcesByPlan: {},
                averageRating: response.aggregations?.avg_rating?.value || undefined,
                lastUpdated: new Date()
            };
            if (response.aggregations?.resource_types?.buckets) {
                response.aggregations.resource_types.buckets.forEach((bucket) => {
                    stats.resourcesByType[bucket.key] = bucket.doc_count;
                });
            }
            if (response.aggregations?.resource_plans?.buckets) {
                response.aggregations.resource_plans.buckets.forEach((bucket) => {
                    stats.resourcesByPlan[bucket.key] = bucket.doc_count;
                });
            }
            return stats;
        }
        catch (error) {
            this.logger.error(`Failed to get category stats: ${error.message}`);
            throw error;
        }
    }
    async buildCategorySearchParams(categoryId, params) {
        const categories = [categoryId];
        if (params.includeSubcategories !== false) {
            const subcategories = await this.getAllSubcategoryIds(categoryId, params.maxDepth || 3);
            categories.push(...subcategories);
        }
        const searchParams = {
            ...params,
            filters: {
                ...params.filters,
                categories
            }
        };
        return searchParams;
    }
    async getAllSubcategoryIds(categoryId, maxDepth) {
        if (maxDepth <= 0) {
            return [];
        }
        try {
            const children = await this.categoryRepository.findMany({
                where: { parentId: categoryId }
            });
            const childIds = children.map(child => child.id);
            const allIds = [...childIds];
            for (const childId of childIds) {
                const grandChildren = await this.getAllSubcategoryIds(childId, maxDepth - 1);
                allIds.push(...grandChildren);
            }
            return allIds;
        }
        catch (error) {
            this.logger.error(`Failed to get subcategory IDs: ${error.message}`);
            return [];
        }
    }
    async calculateCategoryLevel(categoryId) {
        let level = 0;
        let currentId = categoryId;
        while (currentId) {
            const category = await this.categoryRepository.findById(currentId, {
                parent: { select: { id: true } }
            });
            if (!category || !category.parentId) {
                break;
            }
            level++;
            currentId = category.parentId;
            if (level > 10) {
                this.logger.warn(`Category hierarchy too deep for ${categoryId}`);
                break;
            }
        }
        return level;
    }
    async buildCategoryPath(categoryId) {
        const ancestors = await this.getCategoryAncestors(categoryId);
        const current = await this.getCategoryInfo(categoryId, false);
        if (!current) {
            return '';
        }
        const pathParts = ancestors.map(ancestor => ancestor.slug);
        pathParts.push(current.slug);
        return pathParts.join('/');
    }
    async getCategoryAncestors(categoryId) {
        const ancestors = [];
        let currentId = categoryId;
        while (currentId) {
            const category = await this.categoryRepository.findById(currentId, {
                parent: true
            });
            if (!category || !category.parentId) {
                break;
            }
            const parentInfo = await this.getCategoryInfo(category.parentId, false);
            if (parentInfo) {
                ancestors.unshift(parentInfo);
            }
            currentId = category.parentId;
            if (ancestors.length > 10) {
                this.logger.warn(`Category hierarchy too deep for ${categoryId}`);
                break;
            }
        }
        return ancestors;
    }
    async getCategorySiblings(categoryId) {
        try {
            const category = await this.categoryRepository.findById(categoryId);
            if (!category) {
                return [];
            }
            const siblings = await this.categoryRepository.findMany({
                where: {
                    parentId: category.parentId,
                    id: { not: categoryId }
                },
                include: {
                    _count: {
                        select: {
                            children: true,
                            apiResources: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            });
            const results = [];
            for (const sibling of siblings) {
                const info = await this.getCategoryInfo(sibling.id, true);
                if (info) {
                    results.push(info);
                }
            }
            return results;
        }
        catch (error) {
            this.logger.error(`Failed to get category siblings: ${error.message}`);
            return [];
        }
    }
    async getCategoryChildren(categoryId, includeCounts = true) {
        return this.getSubcategoriesWithCounts(categoryId, true, 1);
    }
    async getRootCategories(includeCounts = true) {
        try {
            const rootCategories = await this.categoryRepository.findMany({
                where: { parentId: null },
                include: {
                    _count: includeCounts ? {
                        select: {
                            children: true,
                            apiResources: true
                        }
                    } : undefined
                },
                orderBy: { name: 'asc' }
            });
            const results = [];
            for (const category of rootCategories) {
                const info = await this.getCategoryInfo(category.id, includeCounts);
                if (info) {
                    results.push(info);
                }
            }
            return results;
        }
        catch (error) {
            this.logger.error(`Failed to get root categories: ${error.message}`);
            return [];
        }
    }
    async performElasticsearchSearch(params) {
        try {
            const indexName = this.configService.get('elasticsearch.indices.resources');
            const query = this.buildElasticsearchQuery(params);
            const response = await this.elasticsearchService.search(indexName, query);
            return this.transformElasticsearchResponse(response, params);
        }
        catch (error) {
            this.logger.error(`Elasticsearch search failed: ${error.message}`);
            throw error;
        }
    }
    buildElasticsearchQuery(params) {
        const query = {
            size: params.pagination?.limit || 20,
            from: ((params.pagination?.page || 1) - 1) * (params.pagination?.limit || 20),
            query: {
                bool: {
                    must: [],
                    filter: [],
                    should: []
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
        else {
            query.query.bool.must.push({ match_all: {} });
        }
        if (params.filters?.categories && params.filters.categories.length > 0) {
            query.query.bool.filter.push({
                terms: { 'category.id': params.filters.categories }
            });
        }
        if (params.filters?.resourceTypes && params.filters.resourceTypes.length > 0) {
            query.query.bool.filter.push({
                terms: { 'resourceType': params.filters.resourceTypes }
            });
        }
        if (params.filters?.plans && params.filters.plans.length > 0) {
            query.query.bool.filter.push({
                terms: { 'plan': params.filters.plans }
            });
        }
        if (params.filters?.verified !== undefined) {
            query.query.bool.filter.push({
                term: { 'verified': params.filters.verified }
            });
        }
        if (params.sort) {
            const sortField = params.sort.field === 'relevance' ? '_score' : params.sort.field;
            query.sort = [{ [sortField]: { order: params.sort.order?.toLowerCase() || 'desc' } }];
        }
        if (params.facets && params.facets.length > 0) {
            query.aggs = {};
            params.facets.forEach(facet => {
                query.aggs[facet] = {
                    terms: { field: facet, size: 20 }
                };
            });
        }
        return query;
    }
    transformElasticsearchResponse(response, params) {
        const hits = response.hits.hits.map((hit) => ({
            id: hit._source.id,
            score: hit._score,
            source: hit._source
        }));
        const facets = {};
        if (response.aggregations) {
            Object.keys(response.aggregations).forEach(key => {
                facets[key] = response.aggregations[key].buckets.map((bucket) => ({
                    key: bucket.key,
                    count: bucket.doc_count
                }));
            });
        }
        return {
            hits,
            total: response.hits.total.value || response.hits.total,
            facets,
            took: response.took,
            metadata: {
                query: params.query,
                filters: params.filters,
                pagination: params.pagination
            }
        };
    }
    generateCategoryCacheKey(categoryId, params) {
        const keyParts = [
            'category_search',
            categoryId,
            params.query || '',
            JSON.stringify(params.filters || {}),
            JSON.stringify(params.sort || {}),
            JSON.stringify(params.pagination || {}),
            params.includeSubcategories?.toString() || 'true',
            params.maxDepth?.toString() || '3',
            params.showCounts?.toString() || 'true'
        ];
        return keyParts.join('|');
    }
};
exports.CategorySearchService = CategorySearchService;
exports.CategorySearchService = CategorySearchService = CategorySearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [category_repository_1.CategoryRepository,
        search_cache_service_1.SearchCacheService,
        elasticsearch_service_1.ElasticsearchService,
        config_1.ConfigService])
], CategorySearchService);
//# sourceMappingURL=category-search.service.js.map