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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const search_interfaces_1 = require("../interfaces/search.interfaces");
const suggestion_types_1 = require("../types/suggestion.types");
const elasticsearch_service_1 = require("./elasticsearch.service");
const search_cache_service_1 = require("./search-cache.service");
const search_error_handler_service_1 = require("./search-error-handler.service");
const geocoding_service_1 = require("./geocoding.service");
const category_repository_1 = require("../../../repositories/category.repository");
const search_analytics_service_1 = require("./search-analytics.service");
const personalized_search_service_1 = require("./personalized-search.service");
const language_detection_service_1 = require("./language-detection.service");
let SearchService = SearchService_1 = class SearchService {
    constructor(elasticsearchService, cacheService, configService, errorHandler, geocodingService, categoryRepository, analyticsService, personalizedSearchService, languageDetectionService) {
        this.elasticsearchService = elasticsearchService;
        this.cacheService = cacheService;
        this.configService = configService;
        this.errorHandler = errorHandler;
        this.geocodingService = geocodingService;
        this.categoryRepository = categoryRepository;
        this.analyticsService = analyticsService;
        this.personalizedSearchService = personalizedSearchService;
        this.languageDetectionService = languageDetectionService;
        this.logger = new common_1.Logger(SearchService_1.name);
    }
    async search(params) {
        const startTime = Date.now();
        try {
            const { detectedLanguage, ...processedParams } = this.preprocessSearchParams(params);
            this.logger.debug(`Starting search with processed params: ${JSON.stringify(processedParams)}`);
            const cacheKey = this.generateCacheKey(processedParams);
            const cachedResults = await this.cacheService.getCachedSearchResults(cacheKey);
            if (cachedResults) {
                this.logger.debug(`Returning cached results for key: ${cacheKey}`);
                return cachedResults;
            }
            const esQuery = this.buildElasticsearchQuery(processedParams);
            esQuery.track_total_hits = true;
            esQuery.timeout = '30s';
            esQuery.min_score = 0.1;
            if (processedParams.query) {
                esQuery.highlight = this.buildHighlightConfig();
            }
            const indexName = this.configService.get('elasticsearch.indices.resources');
            const response = await this.elasticsearchService.search(indexName, esQuery);
            const results = this.transformSearchResults(response, processedParams);
            await this.cacheService.cacheSearchResults(cacheKey, results);
            const took = Date.now() - startTime;
            results.took = took;
            this.logger.debug(`Search completed in ${took}ms, found ${results.total} results`);
            this.logSearchAnalytics(processedParams, results, took, detectedLanguage).catch(error => {
                this.logger.warn('Failed to log search analytics', error);
            });
            return results;
        }
        catch (error) {
            this.logger.error(`Search failed: ${error.message}`, error.stack);
            return await this.errorHandler.handleSearchError(error, params.query);
        }
    }
    async suggest(query, limit = 10, userId, language) {
        const startTime = Date.now();
        try {
            this.logger.debug(`Getting suggestions for query: "${query}"`);
            if (query.length < 2) {
                return [];
            }
            const detectedLanguage = this.languageDetectionService.detectLanguage(query);
            const effectiveLanguage = language || detectedLanguage.language;
            let normalizedQuery;
            if (effectiveLanguage === language_detection_service_1.SupportedLanguage.FRENCH) {
                normalizedQuery = this.normalizeFrenchQuery(query.trim());
            }
            else if (effectiveLanguage === language_detection_service_1.SupportedLanguage.ENGLISH) {
                normalizedQuery = this.normalizeEnglishQuery(query.trim());
            }
            else {
                normalizedQuery = this.normalizeMultilingualQuery(query.trim());
            }
            const cacheKey = this.generateSuggestionCacheKey(normalizedQuery, limit, userId);
            const cachedSuggestions = await this.cacheService.getCachedSuggestions(cacheKey);
            if (cachedSuggestions) {
                this.logger.debug(`Returning cached suggestions for query: "${normalizedQuery}"`);
                return cachedSuggestions;
            }
            const suggestionQuery = this.buildAdvancedSuggestionQuery(normalizedQuery, limit, userId, effectiveLanguage);
            const indexName = this.configService.get('elasticsearch.indices.resources');
            const response = await this.elasticsearchService.search(indexName, suggestionQuery);
            const suggestions = this.transformAdvancedSuggestionResults(response, normalizedQuery, userId);
            await this.cacheService.cacheSuggestions(cacheKey, suggestions);
            const took = Date.now() - startTime;
            this.logger.debug(`Suggestions completed in ${took}ms, found ${suggestions.length} suggestions`);
            return suggestions;
        }
        catch (error) {
            return await this.errorHandler.handleSuggestionError(error, query);
        }
    }
    async searchByCategory(categoryId, params) {
        const startTime = Date.now();
        try {
            this.logger.debug(`Searching by category: ${categoryId} with hierarchical support`);
            const category = await this.categoryRepository.findById(categoryId);
            if (!category) {
                throw new Error(`Category with ID ${categoryId} not found`);
            }
            const subcategoryIds = await this.getAllSubcategoryIds(categoryId);
            const allCategoryIds = [categoryId, ...subcategoryIds];
            this.logger.debug(`Including ${allCategoryIds.length} categories in search: ${allCategoryIds.join(', ')}`);
            const categoryParams = {
                ...params,
                filters: {
                    ...params.filters,
                    categories: allCategoryIds
                }
            };
            const results = await this.search(categoryParams);
            const enrichedResults = {
                ...results,
                took: Date.now() - startTime,
                metadata: {
                    ...results.metadata,
                    categoryId,
                    subcategoriesIncluded: subcategoryIds.length,
                    totalCategoriesSearched: allCategoryIds.length
                }
            };
            this.logger.debug(`Category search completed in ${enrichedResults.took}ms with ${results.total} results`);
            return enrichedResults;
        }
        catch (error) {
            this.logger.error(`Category search failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async searchByCategoryWithHierarchy(categoryId, params) {
        this.logger.debug(`Searching by category with hierarchy: ${categoryId}`);
        return this.searchByCategory(categoryId, params);
    }
    async getAllSubcategoryIds(categoryId, maxDepth = 5) {
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
            this.logger.error(`Failed to get subcategory IDs for ${categoryId}: ${error.message}`);
            return [];
        }
    }
    async searchNearby(location, radius, params) {
        this.logger.debug(`Searching nearby location: ${location.latitude}, ${location.longitude} within ${radius}km`);
        if (!this.isValidGeoLocation(location)) {
            throw new Error('Invalid geographic location provided');
        }
        if (radius <= 0 || radius > 1000) {
            throw new Error('Radius must be between 0 and 1000 km');
        }
        const geoParams = {
            ...params,
            filters: {
                ...params.filters,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    radius,
                    unit: 'km'
                }
            },
            sort: {
                field: search_interfaces_1.SortField.DISTANCE,
                order: search_interfaces_1.SortOrder.ASC
            }
        };
        const results = await this.search(geoParams);
        results.hits = results.hits.map(hit => ({
            ...hit,
            location: {
                ...hit.location,
                distance: hit.location ? this.calculateDistance(location.latitude, location.longitude, hit.location.latitude, hit.location.longitude) : undefined
            }
        }));
        return results;
    }
    async searchByCity(city, params) {
        this.logger.debug(`Searching by city: ${city}`);
        if (!city || city.trim().length === 0) {
            throw new Error('City name is required');
        }
        const cityParams = {
            ...params,
            filters: {
                ...params.filters,
                city: city.trim()
            }
        };
        return this.search(cityParams);
    }
    async searchByRegion(region, params) {
        this.logger.debug(`Searching by region: ${region}`);
        if (!region || region.trim().length === 0) {
            throw new Error('Region name is required');
        }
        const regionParams = {
            ...params,
            filters: {
                ...params.filters,
                region: region.trim()
            }
        };
        return this.search(regionParams);
    }
    async searchByAddress(address, radius = 10, params) {
        this.logger.debug(`Searching by address: ${address} within ${radius}km`);
        if (!address || address.trim().length === 0) {
            throw new Error('Address is required');
        }
        try {
            const geocodingResult = await this.geocodingService.geocodeAddress(address);
            if (!geocodingResult) {
                this.logger.warn(`Geocoding failed for address: ${address}, falling back to text search`);
                return this.searchWithAddressFallback(address, params);
            }
            return this.searchNearby(geocodingResult.location, radius, {
                ...params,
                filters: {
                    ...params.filters,
                    city: geocodingResult.address.city,
                    region: geocodingResult.address.region,
                    country: geocodingResult.address.country
                }
            });
        }
        catch (error) {
            this.logger.error(`Address search failed: ${error.message}`);
            return this.searchWithAddressFallback(address, params);
        }
    }
    async searchNearUser(userLocation, radius = 25, params) {
        this.logger.debug(`Searching near user location: ${userLocation.latitude}, ${userLocation.longitude}`);
        if (!this.isValidGeoLocation(userLocation)) {
            throw new Error('Invalid user location provided');
        }
        try {
            const reverseResult = await this.geocodingService.reverseGeocode(userLocation.latitude, userLocation.longitude);
            const enrichedParams = {
                ...params,
                filters: {
                    ...params.filters,
                    ...(reverseResult && {
                        city: reverseResult.address.city,
                        region: reverseResult.address.region,
                        country: reverseResult.address.country
                    })
                }
            };
            return this.searchNearby(userLocation, radius, enrichedParams);
        }
        catch (error) {
            this.logger.error(`User location search failed: ${error.message}`);
            return this.searchNearby(userLocation, radius, params);
        }
    }
    async searchWithAddressFallback(address, params) {
        const addressParts = this.parseAddressComponents(address);
        const fallbackParams = {
            ...params,
            query: params.query ? `${params.query} ${address}` : address,
            filters: {
                ...params.filters,
                ...addressParts
            }
        };
        return this.search(fallbackParams);
    }
    parseAddressComponents(address) {
        const components = {};
        const normalizedAddress = address.toLowerCase().trim();
        const cameroonCities = ['yaoundé', 'douala', 'bamenda', 'bafoussam', 'garoua', 'maroua', 'ngaoundéré'];
        const frenchCities = ['paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 'strasbourg'];
        for (const city of [...cameroonCities, ...frenchCities]) {
            if (normalizedAddress.includes(city)) {
                components.city = city.charAt(0).toUpperCase() + city.slice(1);
                break;
            }
        }
        if (normalizedAddress.includes('cameroun') || normalizedAddress.includes('cameroon')) {
            components.country = 'CM';
        }
        else if (normalizedAddress.includes('france')) {
            components.country = 'FR';
        }
        return components;
    }
    async suggestWithRateLimit(query, limit = 10, userId, sessionId, language) {
        const rateLimitKey = `suggest_rate_${userId || sessionId || 'anonymous'}`;
        const isAllowed = await this.checkSuggestionRateLimit(rateLimitKey);
        if (!isAllowed) {
            this.logger.warn(`Suggestion rate limit exceeded for ${rateLimitKey}`);
            return [];
        }
        return this.suggest(query, limit, userId, language);
    }
    async checkSuggestionRateLimit(key) {
        try {
            const maxRequests = 30;
            const windowMs = 60 * 1000;
            const current = await this.cacheService.redisClient.incr(`rate_limit:${key}`);
            if (current === 1) {
                await this.cacheService.redisClient.expire(`rate_limit:${key}`, Math.ceil(windowMs / 1000));
            }
            return current <= maxRequests;
        }
        catch (error) {
            this.logger.error(`Rate limit check failed: ${error.message}`);
            return true;
        }
    }
    async getPopularSuggestions(limit = 20) {
        try {
            const cacheKey = 'popular_suggestions';
            const cached = await this.cacheService.getCachedSuggestions(cacheKey);
            if (cached) {
                return cached;
            }
            const indexName = this.configService.get('elasticsearch.indices.resources');
            const query = {
                size: 0,
                aggs: {
                    popular_names: {
                        terms: {
                            field: 'name.keyword',
                            size: limit,
                            order: { avg_popularity: 'desc' }
                        },
                        aggs: {
                            avg_popularity: {
                                avg: { field: 'popularity' }
                            }
                        }
                    },
                    popular_categories: {
                        terms: {
                            field: 'category.name.keyword',
                            size: Math.ceil(limit / 2),
                            order: { doc_count: 'desc' }
                        }
                    }
                }
            };
            const response = await this.elasticsearchService.search(indexName, query);
            const suggestions = this.transformPopularSuggestions(response);
            await this.cacheService.cacheSuggestions(cacheKey, suggestions);
            return suggestions;
        }
        catch (error) {
            this.logger.error(`Failed to get popular suggestions: ${error.message}`);
            return [];
        }
    }
    transformPopularSuggestions(response) {
        const suggestions = [];
        if (response.aggregations?.popular_names?.buckets) {
            response.aggregations.popular_names.buckets.forEach((bucket) => {
                suggestions.push({
                    text: bucket.key,
                    type: suggestion_types_1.SuggestionType.RESOURCE,
                    score: bucket.avg_popularity?.value || bucket.doc_count,
                    metadata: {
                        popularity: bucket.avg_popularity?.value || 0,
                        description: `${bucket.doc_count} ressources`
                    }
                });
            });
        }
        if (response.aggregations?.popular_categories?.buckets) {
            response.aggregations.popular_categories.buckets.forEach((bucket) => {
                suggestions.push({
                    text: bucket.key,
                    type: suggestion_types_1.SuggestionType.CATEGORY,
                    score: bucket.doc_count,
                    category: bucket.key,
                    metadata: {
                        description: `${bucket.doc_count} ressources dans cette catégorie`
                    }
                });
            });
        }
        return suggestions.sort((a, b) => b.score - a.score);
    }
    async personalizedSearch(userId, params, usePersonalization = true, personalizationWeight = 0.3) {
        this.logger.debug(`Personalized search for user: ${userId}, personalization: ${usePersonalization}`);
        try {
            const personalizedParams = {
                ...params,
                userId,
                usePersonalization,
                personalizationWeight
            };
            const enhancedParams = await this.personalizedSearchService.personalizeSearchParams(personalizedParams);
            const results = await this.search(enhancedParams);
            if (usePersonalization) {
                const personalizedResults = await this.personalizedSearchService.personalizeSearchResults(results, userId, personalizationWeight);
                this.logger.debug(`Personalized search completed with ${personalizedResults.hits.length} results`);
                return personalizedResults;
            }
            return results;
        }
        catch (error) {
            this.logger.error(`Personalized search failed: ${error.message}`);
            return this.search({ ...params, userId });
        }
    }
    async suggestWithPopularityRanking(query, limit = 10, userId, includePopular = true, language) {
        try {
            this.logger.debug(`Getting popularity-ranked suggestions for: "${query}"`);
            const suggestions = await this.suggest(query, Math.ceil(limit * 0.8), userId, language);
            if (includePopular && suggestions.length < limit) {
                const popularSuggestions = await this.getPopularSuggestions(limit - suggestions.length);
                const existingTexts = new Set(suggestions.map(s => s.text.toLowerCase()));
                const uniquePopular = popularSuggestions.filter(s => !existingTexts.has(s.text.toLowerCase()));
                suggestions.push(...uniquePopular);
            }
            return suggestions
                .map(suggestion => ({
                ...suggestion,
                score: this.calculateCombinedPopularityScore(suggestion, query)
            }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        }
        catch (error) {
            this.logger.error(`Popularity ranking failed: ${error.message}`);
            return await this.suggest(query, limit, userId, language);
        }
    }
    calculateCombinedPopularityScore(suggestion, query) {
        let score = suggestion.score;
        if (suggestion.text.toLowerCase() === query.toLowerCase()) {
            score *= 2.0;
        }
        else if (suggestion.text.toLowerCase().startsWith(query.toLowerCase())) {
            score *= 1.5;
        }
        const popularity = suggestion.metadata?.popularity || 0;
        if (popularity > 0.8) {
            score *= 1.4;
        }
        else if (popularity > 0.6) {
            score *= 1.2;
        }
        else if (popularity > 0.4) {
            score *= 1.1;
        }
        switch (suggestion.type) {
            case suggestion_types_1.SuggestionType.RESOURCE:
                score *= 1.0;
                break;
            case suggestion_types_1.SuggestionType.CATEGORY:
                score *= 0.9;
                break;
            case suggestion_types_1.SuggestionType.TAG:
                score *= 0.7;
                break;
            case suggestion_types_1.SuggestionType.LOCATION:
                score *= 0.8;
                break;
        }
        return Math.round(score * 100) / 100;
    }
    async getContextualSuggestions(query, userId, limit = 10, language) {
        try {
            const suggestions = await this.suggest(query, limit, userId, language);
            return suggestions.map(suggestion => ({
                ...suggestion,
                metadata: {
                    ...suggestion.metadata,
                    lastUsed: new Date(),
                    isRecent: false
                }
            }));
        }
        catch (error) {
            this.logger.error(`Contextual suggestions failed: ${error.message}`);
            return [];
        }
    }
    async preloadPopularSuggestions() {
        try {
            this.logger.debug('Preloading popular suggestions');
            const popularSuggestions = await this.getPopularSuggestions(50);
            await this.cacheService.cacheSuggestions('preloaded_popular', popularSuggestions);
            this.logger.debug(`Preloaded ${popularSuggestions.length} popular suggestions`);
        }
        catch (error) {
            this.logger.error(`Failed to preload popular suggestions: ${error.message}`);
        }
    }
    async getSmartAutocompleteSuggestions(query, limit = 10, userId, language) {
        try {
            const strategies = [
                this.getExactPrefixSuggestions(query, Math.ceil(limit * 0.4)),
                this.getFuzzySuggestions(query, Math.ceil(limit * 0.3)),
                this.getPopularSuggestions(Math.ceil(limit * 0.3))
            ];
            const results = await Promise.allSettled(strategies);
            const allSuggestions = [];
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    allSuggestions.push(...result.value);
                }
                else {
                    this.logger.warn(`Suggestion strategy ${index} failed: ${result.reason}`);
                }
            });
            const uniqueSuggestions = this.deduplicateSuggestions(allSuggestions);
            return uniqueSuggestions
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        }
        catch (error) {
            this.logger.error(`Smart autocomplete failed: ${error.message}`);
            return await this.suggest(query, limit, userId, language);
        }
    }
    async getExactPrefixSuggestions(query, limit) {
        const indexName = this.configService.get('elasticsearch.indices.resources');
        const prefixQuery = {
            query: {
                bool: {
                    should: [
                        {
                            prefix: {
                                'name.keyword': {
                                    value: query,
                                    boost: 3.0
                                }
                            }
                        },
                        {
                            prefix: {
                                'category.name.keyword': {
                                    value: query,
                                    boost: 2.0
                                }
                            }
                        }
                    ]
                }
            },
            size: limit,
            _source: ['name', 'category', 'resourceType', 'verified', 'popularity'],
            sort: [
                { _score: { order: 'desc' } },
                { popularity: { order: 'desc' } }
            ]
        };
        try {
            const response = await this.elasticsearchService.search(indexName, prefixQuery);
            return this.transformAdvancedSuggestionResults(response, query);
        }
        catch (error) {
            this.logger.warn(`Exact prefix suggestions failed: ${error.message}`);
            return [];
        }
    }
    async getFuzzySuggestions(query, limit) {
        const indexName = this.configService.get('elasticsearch.indices.resources');
        const fuzzyQuery = {
            query: {
                bool: {
                    should: [
                        {
                            fuzzy: {
                                name: {
                                    value: query,
                                    fuzziness: 'AUTO',
                                    prefix_length: 1,
                                    max_expansions: 50,
                                    boost: 2.0
                                }
                            }
                        },
                        {
                            fuzzy: {
                                'category.name': {
                                    value: query,
                                    fuzziness: 'AUTO',
                                    prefix_length: 1,
                                    max_expansions: 50,
                                    boost: 1.5
                                }
                            }
                        }
                    ]
                }
            },
            size: limit,
            _source: ['name', 'category', 'resourceType', 'verified', 'popularity'],
            sort: [
                { _score: { order: 'desc' } },
                { popularity: { order: 'desc' } }
            ]
        };
        try {
            const response = await this.elasticsearchService.search(indexName, fuzzyQuery);
            return this.transformAdvancedSuggestionResults(response, query);
        }
        catch (error) {
            this.logger.warn(`Fuzzy suggestions failed: ${error.message}`);
            return [];
        }
    }
    deduplicateSuggestions(suggestions) {
        const seen = new Map();
        suggestions.forEach(suggestion => {
            const key = suggestion.text.toLowerCase();
            const existing = seen.get(key);
            if (!existing || suggestion.score > existing.score) {
                seen.set(key, suggestion);
            }
        });
        return Array.from(seen.values());
    }
    async checkHealth() {
        try {
            const checks = await Promise.allSettled([
                this.elasticsearchService.checkConnection(),
                this.cacheService.testConnection(),
                this.checkIndexHealth()
            ]);
            const status = checks.every(check => check.status === 'fulfilled' && check.value)
                ? 'healthy'
                : 'unhealthy';
            return {
                status,
                timestamp: new Date(),
                checks: {
                    elasticsearch: checks[0].status,
                    redis: checks[1].status,
                    index: checks[2].status
                }
            };
        }
        catch (error) {
            this.logger.error(`Health check failed: ${error.message}`);
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                checks: {
                    elasticsearch: 'rejected',
                    redis: 'rejected',
                    index: 'rejected'
                },
                details: { error: error.message }
            };
        }
    }
    async getMetrics(period) {
        const dateRange = this.convertTimePeriodToDateRange(period);
        return {
            totalSearches: 0,
            averageResponseTime: 0,
            popularTerms: [],
            noResultsQueries: [],
            clickThroughRate: 0,
            period: dateRange
        };
    }
    convertTimePeriodToDateRange(period) {
        const now = new Date();
        let from;
        let granularity;
        switch (period) {
            case search_interfaces_1.TimePeriod.HOUR:
                from = new Date(now.getTime() - 60 * 60 * 1000);
                granularity = 'hour';
                break;
            case search_interfaces_1.TimePeriod.DAY:
                from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                granularity = 'day';
                break;
            case search_interfaces_1.TimePeriod.WEEK:
                from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                granularity = 'week';
                break;
            case search_interfaces_1.TimePeriod.MONTH:
                from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                granularity = 'month';
                break;
            default:
                from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                granularity = 'day';
        }
        return {
            from,
            to: now,
            granularity
        };
    }
    generateCacheKey(params) {
        const keyParts = [
            params.query || '',
            JSON.stringify(params.filters || {}),
            JSON.stringify(params.sort || {}),
            JSON.stringify(params.pagination || {}),
            JSON.stringify(params.facets || []),
            params.userId || 'anonymous'
        ];
        return keyParts.join('|');
    }
    preprocessSearchParams(params) {
        const processedParams = { ...params };
        let detectedLanguage;
        if (params.query) {
            let processedQuery = params.query.trim();
            detectedLanguage = this.languageDetectionService.detectLanguage(processedQuery);
            const userLanguage = params.language;
            let effectiveLanguage = detectedLanguage.language;
            if (userLanguage && this.languageDetectionService.isSupportedLanguage(userLanguage)) {
                effectiveLanguage = userLanguage;
                this.logger.debug(`Using user preferred language: ${effectiveLanguage}`);
            }
            else {
                this.logger.debug(`Using detected language: ${effectiveLanguage} (confidence: ${detectedLanguage.confidence.toFixed(2)})`);
            }
            if (effectiveLanguage === language_detection_service_1.SupportedLanguage.FRENCH) {
                processedQuery = this.normalizeFrenchQuery(processedQuery);
                processedQuery = this.correctCommonTypos(processedQuery);
                processedQuery = this.expandContextualSynonyms(processedQuery);
            }
            else if (effectiveLanguage === language_detection_service_1.SupportedLanguage.ENGLISH) {
                processedQuery = this.normalizeEnglishQuery(processedQuery);
                processedQuery = this.correctEnglishTypos(processedQuery);
                processedQuery = this.expandEnglishSynonyms(processedQuery);
            }
            else {
                processedQuery = this.normalizeMultilingualQuery(processedQuery);
            }
            processedParams.query = processedQuery;
            processedParams.language = effectiveLanguage;
            this.logger.debug(`Query preprocessed: "${params.query}" -> "${processedQuery}" (${effectiveLanguage})`);
        }
        return { ...processedParams, detectedLanguage };
    }
    normalizeFrenchQuery(query) {
        return query
            .replace(/\s+/g, ' ')
            .trim();
    }
    normalizeEnglishQuery(query) {
        return query
            .replace(/\s+/g, ' ')
            .trim();
    }
    normalizeMultilingualQuery(query) {
        return query
            .replace(/\s+/g, ' ')
            .trim();
    }
    correctCommonTypos(query) {
        const commonTypos = {
            'resturant': 'restaurant',
            'restaurent': 'restaurant',
            'hotell': 'hotel',
            'hotele': 'hotel',
            'entreprize': 'entreprise',
            'entreprice': 'entreprise',
            'servise': 'service',
            'servic': 'service',
            'tecnologie': 'technologie',
            'technologi': 'technologie',
            'financ': 'finance',
            'educaton': 'education',
            'educatoin': 'education',
            'transpor': 'transport',
            'trasport': 'transport'
        };
        let correctedQuery = query.toLowerCase();
        Object.entries(commonTypos).forEach(([typo, correction]) => {
            const regex = new RegExp(`\\b${typo}\\b`, 'gi');
            correctedQuery = correctedQuery.replace(regex, correction);
        });
        return correctedQuery;
    }
    expandContextualSynonyms(query) {
        const contextualSynonyms = {
            'api': ['interface', 'service', 'webservice'],
            'resto': ['restaurant'],
            'hotel': ['hébergement', 'logement'],
            'shop': ['boutique', 'magasin'],
            'tech': ['technologie', 'informatique'],
            'finance': ['banque', 'assurance'],
            'medical': ['santé', 'clinique'],
            'education': ['formation', 'école']
        };
        return query;
    }
    correctEnglishTypos(query) {
        const commonTypos = {
            'resturant': 'restaurant',
            'restaurent': 'restaurant',
            'hotell': 'hotel',
            'hotele': 'hotel',
            'compeny': 'company',
            'companie': 'company',
            'servise': 'service',
            'servic': 'service',
            'tecnology': 'technology',
            'technologi': 'technology',
            'financ': 'finance',
            'educaton': 'education',
            'educatoin': 'education',
            'transpor': 'transport',
            'trasport': 'transport',
            'bussiness': 'business',
            'busines': 'business'
        };
        let correctedQuery = query.toLowerCase();
        Object.entries(commonTypos).forEach(([typo, correction]) => {
            const regex = new RegExp(`\\b${typo}\\b`, 'gi');
            correctedQuery = correctedQuery.replace(regex, correction);
        });
        return correctedQuery;
    }
    expandEnglishSynonyms(query) {
        const contextualSynonyms = {
            'api': ['interface', 'service', 'webservice'],
            'company': ['business', 'enterprise', 'corporation'],
            'shop': ['store', 'boutique', 'retail'],
            'tech': ['technology', 'it', 'digital'],
            'finance': ['banking', 'insurance', 'credit'],
            'medical': ['health', 'clinic', 'hospital'],
            'education': ['training', 'school', 'university'],
            'transport': ['transportation', 'travel', 'mobility']
        };
        return query;
    }
    buildTextualQuery(queryText, language) {
        const cleanQuery = queryText.trim();
        const detectedLanguage = language || language_detection_service_1.SupportedLanguage.AUTO;
        const searchFields = this.languageDetectionService.getSearchFieldsForLanguage(detectedLanguage);
        const analyzer = this.languageDetectionService.getAnalyzerForLanguage(detectedLanguage);
        const searchAnalyzer = this.languageDetectionService.getSearchAnalyzerForLanguage(detectedLanguage);
        const textualQuery = {
            bool: {
                should: [
                    {
                        multi_match: {
                            query: cleanQuery,
                            fields: [
                                'name.exact^5',
                                'category.name.keyword^3'
                            ],
                            type: 'phrase',
                            boost: 4.0
                        }
                    },
                    {
                        multi_match: {
                            query: cleanQuery,
                            fields: searchFields.slice(0, 4),
                            type: 'phrase',
                            analyzer: searchAnalyzer,
                            boost: 3.0
                        }
                    },
                    {
                        multi_match: {
                            query: cleanQuery,
                            fields: searchFields.slice(0, 3),
                            type: 'phrase_prefix',
                            analyzer: searchAnalyzer,
                            boost: 2.5
                        }
                    },
                    {
                        multi_match: {
                            query: cleanQuery,
                            fields: searchFields,
                            type: 'best_fields',
                            analyzer: searchAnalyzer,
                            fuzziness: 'AUTO',
                            prefix_length: 2,
                            max_expansions: 50,
                            boost: 2.0
                        }
                    },
                    {
                        multi_match: {
                            query: cleanQuery,
                            fields: searchFields,
                            type: 'cross_fields',
                            analyzer: searchAnalyzer,
                            minimum_should_match: '75%',
                            boost: 1.5
                        }
                    },
                    {
                        multi_match: {
                            query: cleanQuery,
                            fields: [
                                'address.city^2.0',
                                'address.region^1.8',
                                'address.street^1.5'
                            ],
                            type: 'best_fields',
                            analyzer: analyzer,
                            fuzziness: 'AUTO',
                            boost: 1.2
                        }
                    }
                ],
                minimum_should_match: 1
            }
        };
        if (cleanQuery.length <= 3) {
            textualQuery.bool.should[0].multi_match.boost = 6.0;
            textualQuery.bool.should[1].multi_match.boost = 4.0;
        }
        else if (cleanQuery.split(' ').length === 1) {
            textualQuery.bool.should[2].multi_match.boost = 3.5;
        }
        return textualQuery;
    }
    buildElasticsearchQuery(params) {
        const query = {
            query: {
                bool: {
                    must: [],
                    filter: [],
                    should: []
                }
            },
            aggs: {},
            from: 0,
            size: 20
        };
        if (params.query) {
            const textQuery = this.buildTextualQuery(params.query, params.language);
            query.query.bool.must.push(textQuery);
        }
        else {
            query.query.bool.must.push({
                match_all: {}
            });
        }
        if (params.filters) {
            this.applyAdvancedFilters(query, params.filters);
        }
        if (params.sort) {
            query.sort = this.buildSortClause(params.sort, params.filters);
        }
        if (params.pagination) {
            query.from = params.pagination.offset || ((params.pagination.page || 1) - 1) * (params.pagination.limit || 20);
            query.size = params.pagination.limit || 20;
        }
        if (params.facets && params.facets.length > 0) {
            this.addFacetAggregations(query, params.facets);
        }
        else {
            this.addFacetAggregations(query, ['categories', 'resourceTypes', 'plans', 'verified']);
        }
        query.query.bool.should.push({
            term: { verified: { value: true, boost: 1.5 } }
        }, {
            range: { popularity: { gte: 0.7, boost: 1.2 } }
        }, {
            range: { rating: { gte: 4.0, boost: 1.1 } }
        });
        return query;
    }
    applyAdvancedFilters(query, filters) {
        const validatedFilters = this.validateAndCleanFilters(filters);
        this.applyFilters(query, validatedFilters);
        this.logger.debug(`Applied filters: ${JSON.stringify(validatedFilters)}`);
    }
    validateAndCleanFilters(filters) {
        const cleanFilters = {};
        if (filters.categories && Array.isArray(filters.categories) && filters.categories.length > 0) {
            cleanFilters.categories = filters.categories.filter(cat => typeof cat === 'string' && cat.trim().length > 0);
        }
        if (filters.resourceTypes && Array.isArray(filters.resourceTypes) && filters.resourceTypes.length > 0) {
            cleanFilters.resourceTypes = filters.resourceTypes;
        }
        if (filters.plans && Array.isArray(filters.plans) && filters.plans.length > 0) {
            cleanFilters.plans = filters.plans;
        }
        if (filters.priceRange) {
            const priceRange = {};
            if (typeof filters.priceRange.min === 'number' && filters.priceRange.min >= 0) {
                priceRange.min = filters.priceRange.min;
            }
            if (typeof filters.priceRange.max === 'number' && filters.priceRange.max >= 0) {
                priceRange.max = filters.priceRange.max;
            }
            if (priceRange.min !== undefined && priceRange.max !== undefined && priceRange.min > priceRange.max) {
                [priceRange.min, priceRange.max] = [priceRange.max, priceRange.min];
            }
            if (Object.keys(priceRange).length > 0) {
                cleanFilters.priceRange = priceRange;
            }
        }
        if (typeof filters.verified === 'boolean') {
            cleanFilters.verified = filters.verified;
        }
        if (filters.location) {
            const { latitude, longitude, radius } = filters.location;
            if (typeof latitude === 'number' && typeof longitude === 'number' &&
                typeof radius === 'number' && radius > 0) {
                cleanFilters.location = filters.location;
            }
        }
        if (filters.city && typeof filters.city === 'string' && filters.city.trim().length > 0) {
            cleanFilters.city = filters.city.trim();
        }
        if (filters.region && typeof filters.region === 'string' && filters.region.trim().length > 0) {
            cleanFilters.region = filters.region.trim();
        }
        if (filters.country && typeof filters.country === 'string' && filters.country.trim().length > 0) {
            cleanFilters.country = filters.country.trim();
        }
        if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
            cleanFilters.tags = filters.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0).map(tag => tag.trim());
        }
        if (filters.dateRange) {
            const dateRange = {};
            if (filters.dateRange.from instanceof Date) {
                dateRange.from = filters.dateRange.from;
            }
            if (filters.dateRange.to instanceof Date) {
                dateRange.to = filters.dateRange.to;
            }
            if (Object.keys(dateRange).length > 0) {
                cleanFilters.dateRange = dateRange;
            }
        }
        return cleanFilters;
    }
    isValidGeoLocation(location) {
        if (!location)
            return false;
        const { latitude, longitude } = location;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return false;
        }
        if (latitude < -90 || latitude > 90) {
            return false;
        }
        if (longitude < -180 || longitude > 180) {
            return false;
        }
        return true;
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return Math.round(distance * 100) / 100;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    buildHighlightConfig() {
        return {
            pre_tags: ['<mark>'],
            post_tags: ['</mark>'],
            fields: {
                'name': {
                    fragment_size: 150,
                    number_of_fragments: 1,
                    analyzer: 'french_search_analyzer'
                },
                'description': {
                    fragment_size: 200,
                    number_of_fragments: 2,
                    analyzer: 'french_search_analyzer'
                },
                'category.name': {
                    fragment_size: 100,
                    number_of_fragments: 1,
                    analyzer: 'french_search_analyzer'
                },
                'tags': {
                    fragment_size: 100,
                    number_of_fragments: 3,
                    analyzer: 'french_search_analyzer'
                }
            },
            require_field_match: false,
            fragment_size: 150,
            max_analyzed_offset: 1000000
        };
    }
    applyFilters(query, filters) {
        if (filters.categories && filters.categories.length > 0) {
            query.query.bool.filter.push({
                terms: { 'category.id': filters.categories }
            });
        }
        if (filters.resourceTypes && filters.resourceTypes.length > 0) {
            query.query.bool.filter.push({
                terms: { resourceType: filters.resourceTypes }
            });
        }
        if (filters.plans && filters.plans.length > 0) {
            query.query.bool.filter.push({
                terms: { plan: filters.plans }
            });
        }
        if (filters.priceRange) {
            const priceFilter = {};
            if (filters.priceRange.min !== undefined && filters.priceRange.min >= 0) {
                priceFilter.gte = filters.priceRange.min;
            }
            if (filters.priceRange.max !== undefined && filters.priceRange.max >= 0) {
                priceFilter.lte = filters.priceRange.max;
            }
            if (Object.keys(priceFilter).length > 0) {
                query.query.bool.filter.push({
                    range: { 'pricing.basePrice': priceFilter }
                });
            }
        }
        if (filters.verified !== undefined) {
            query.query.bool.filter.push({
                term: { verified: filters.verified }
            });
        }
        if (filters.location) {
            query.query.bool.filter.push({
                geo_distance: {
                    distance: `${filters.location.radius}${filters.location.unit || 'km'}`,
                    location: {
                        lat: filters.location.latitude,
                        lon: filters.location.longitude
                    }
                }
            });
        }
        if (filters.city) {
            query.query.bool.filter.push({
                bool: {
                    should: [
                        { term: { 'address.city.keyword': filters.city } },
                        {
                            match: {
                                'address.city': {
                                    query: filters.city,
                                    analyzer: 'french_analyzer',
                                    fuzziness: 'AUTO'
                                }
                            }
                        }
                    ],
                    minimum_should_match: 1
                }
            });
        }
        if (filters.region) {
            query.query.bool.filter.push({
                bool: {
                    should: [
                        { term: { 'address.region.keyword': filters.region } },
                        {
                            match: {
                                'address.region': {
                                    query: filters.region,
                                    analyzer: 'french_analyzer',
                                    fuzziness: 'AUTO'
                                }
                            }
                        }
                    ],
                    minimum_should_match: 1
                }
            });
        }
        if (filters.country) {
            query.query.bool.filter.push({
                bool: {
                    should: [
                        { term: { 'address.country.keyword': filters.country } },
                        {
                            match: {
                                'address.countryName': {
                                    query: filters.country,
                                    analyzer: 'french_analyzer'
                                }
                            }
                        }
                    ],
                    minimum_should_match: 1
                }
            });
        }
        if (filters.tags && filters.tags.length > 0) {
            filters.tags.forEach(tag => {
                query.query.bool.filter.push({
                    term: { 'tags.keyword': tag }
                });
            });
        }
        if (filters.dateRange) {
            const dateFilter = {};
            if (filters.dateRange.from) {
                dateFilter.gte = filters.dateRange.from;
            }
            if (filters.dateRange.to) {
                dateFilter.lte = filters.dateRange.to;
            }
            if (Object.keys(dateFilter).length > 0) {
                query.query.bool.filter.push({
                    range: { createdAt: dateFilter }
                });
            }
        }
    }
    buildSortClause(sort, filters) {
        const sortClause = [];
        switch (sort.field) {
            case search_interfaces_1.SortField.RELEVANCE:
                sortClause.push({ _score: { order: sort.order } });
                break;
            case search_interfaces_1.SortField.NAME:
                sortClause.push({ 'name.keyword': { order: sort.order } });
                break;
            case search_interfaces_1.SortField.CREATED_AT:
                sortClause.push({ createdAt: { order: sort.order } });
                break;
            case search_interfaces_1.SortField.UPDATED_AT:
                sortClause.push({ updatedAt: { order: sort.order } });
                break;
            case search_interfaces_1.SortField.DISTANCE:
                if (filters?.location) {
                    sortClause.push({
                        _geo_distance: {
                            location: {
                                lat: filters.location.latitude,
                                lon: filters.location.longitude
                            },
                            order: sort.order,
                            unit: filters.location.unit || 'km',
                            mode: 'min',
                            distance_type: 'arc'
                        }
                    });
                }
                else {
                    sortClause.push({ _score: { order: 'desc' } });
                }
                break;
            case search_interfaces_1.SortField.POPULARITY:
                sortClause.push({ popularity: { order: sort.order } });
                break;
            case search_interfaces_1.SortField.RATING:
                sortClause.push({ rating: { order: sort.order } });
                break;
            default:
                sortClause.push({ _score: { order: 'desc' } });
        }
        return sortClause;
    }
    addFacetAggregations(query, facets) {
        facets.forEach(facet => {
            switch (facet) {
                case 'categories':
                    query.aggs.categories = {
                        terms: {
                            field: 'category.id',
                            size: 50,
                            order: { _count: 'desc' }
                        },
                        aggs: {
                            category_names: {
                                terms: { field: 'category.name.keyword', size: 1 }
                            }
                        }
                    };
                    break;
                case 'resourceTypes':
                    query.aggs.resourceTypes = {
                        terms: {
                            field: 'resourceType',
                            size: 10,
                            order: { _count: 'desc' }
                        }
                    };
                    break;
                case 'plans':
                    query.aggs.plans = {
                        terms: {
                            field: 'plan',
                            size: 5,
                            order: [
                                { _key: 'asc' },
                                { _count: 'desc' }
                            ]
                        }
                    };
                    break;
                case 'priceRanges':
                    query.aggs.priceRanges = {
                        range: {
                            field: 'pricing.basePrice',
                            ranges: [
                                { key: 'free', to: 0.01 },
                                { key: 'low', from: 0.01, to: 50 },
                                { key: 'medium', from: 50, to: 200 },
                                { key: 'high', from: 200, to: 1000 },
                                { key: 'premium', from: 1000 }
                            ]
                        }
                    };
                    break;
                case 'cities':
                    query.aggs.cities = {
                        terms: {
                            field: 'address.city.keyword',
                            size: 20,
                            order: { _count: 'desc' }
                        }
                    };
                    break;
                case 'regions':
                    query.aggs.regions = {
                        terms: {
                            field: 'address.region.keyword',
                            size: 20,
                            order: { _count: 'desc' }
                        }
                    };
                    break;
                case 'verified':
                    query.aggs.verified = {
                        terms: {
                            field: 'verified',
                            size: 2,
                            order: { _key: 'desc' }
                        }
                    };
                    break;
                case 'tags':
                    query.aggs.tags = {
                        terms: {
                            field: 'tags.keyword',
                            size: 30,
                            order: { _count: 'desc' },
                            min_doc_count: 2
                        }
                    };
                    break;
                case 'popularity':
                    query.aggs.popularity = {
                        range: {
                            field: 'popularity',
                            ranges: [
                                { key: 'low', to: 0.3 },
                                { key: 'medium', from: 0.3, to: 0.7 },
                                { key: 'high', from: 0.7 }
                            ]
                        }
                    };
                    break;
                case 'rating':
                    query.aggs.rating = {
                        range: {
                            field: 'rating',
                            ranges: [
                                { key: '1-2', from: 1, to: 3 },
                                { key: '3-4', from: 3, to: 4 },
                                { key: '4-5', from: 4, to: 5 }
                            ]
                        }
                    };
                    break;
            }
        });
        if (facets.length > 0) {
            query.aggs.global_stats = {
                global: {},
                aggs: {
                    total_resources: {
                        value_count: { field: '_id' }
                    },
                    avg_rating: {
                        avg: { field: 'rating' }
                    },
                    verified_count: {
                        filter: { term: { verified: true } }
                    }
                }
            };
        }
    }
    transformSearchResults(response, params) {
        const userLanguage = params.language || language_detection_service_1.SupportedLanguage.FRENCH;
        const hits = response.hits.hits.map((hit) => {
            const contentText = `${hit._source.name} ${hit._source.description || ''}`.trim();
            const languageDetection = this.languageDetectionService.detectLanguage(contentText);
            const contentLanguage = hit._source.language || languageDetection.language;
            const relevanceBoost = this.calculateLanguageRelevanceBoost(userLanguage, contentLanguage, languageDetection.confidence);
            return {
                id: hit._id,
                name: hit._source.name,
                description: hit._source.description,
                resourceType: hit._source.resourceType,
                category: hit._source.category,
                plan: hit._source.plan,
                verified: hit._source.verified,
                location: hit._source.location ? {
                    latitude: hit._source.location.lat,
                    longitude: hit._source.location.lon,
                    city: hit._source.address?.city,
                    region: hit._source.address?.region,
                    country: hit._source.address?.country,
                    distance: hit.sort && hit.sort.length > 1 ? hit.sort[1] : undefined
                } : undefined,
                contact: hit._source.contact,
                tags: hit._source.tags,
                createdAt: new Date(hit._source.createdAt),
                updatedAt: new Date(hit._source.updatedAt),
                score: hit._score * relevanceBoost,
                highlight: hit.highlight,
                language: contentLanguage,
                languageConfidence: languageDetection.confidence,
                languageAdaptation: {
                    userLanguage,
                    contentLanguage,
                    relevanceBoost,
                    translationAvailable: this.isTranslationAvailable(contentLanguage, userLanguage)
                }
            };
        });
        hits.sort((a, b) => b.score - a.score);
        const facets = this.transformFacets(response.aggregations || {});
        return {
            hits,
            total: response.hits.total.value,
            facets,
            took: response.took,
            page: params.pagination?.page,
            limit: params.pagination?.limit,
            hasMore: hits.length === (params.pagination?.limit || 20),
            metadata: {
                query: params.query,
                filters: params.filters,
                pagination: params.pagination,
                languageAdaptation: {
                    userLanguage,
                    adaptationApplied: true,
                    boostApplied: true
                }
            }
        };
    }
    calculateLanguageRelevanceBoost(userLanguage, contentLanguage, confidence) {
        if (userLanguage === contentLanguage) {
            return 1.0 + (confidence * 0.3);
        }
        if (this.areLanguagesCompatible(userLanguage, contentLanguage)) {
            return 1.0 + (confidence * 0.1);
        }
        if (confidence > 0.8) {
            return 0.95;
        }
        return 0.85;
    }
    areLanguagesCompatible(lang1, lang2) {
        const compatiblePairs = [
            ['fr', 'en'],
            ['en', 'fr']
        ];
        return compatiblePairs.some(pair => (pair[0] === lang1 && pair[1] === lang2) ||
            (pair[0] === lang2 && pair[1] === lang1));
    }
    isTranslationAvailable(contentLanguage, userLanguage) {
        return this.areLanguagesCompatible(contentLanguage, userLanguage);
    }
    async changeSearchLanguage(originalParams, newLanguage, cacheKey) {
        this.logger.debug(`Changing search language from ${originalParams.language} to ${newLanguage}`);
        if (!this.languageDetectionService.isSupportedLanguage(newLanguage)) {
            throw new Error(`Unsupported language: ${newLanguage}`);
        }
        const updatedParams = {
            ...originalParams,
            language: newLanguage
        };
        if (cacheKey) {
            await this.cacheService.invalidateSearchCache(cacheKey);
        }
        const results = await this.search(updatedParams);
        this.logger.debug(`Language change completed: ${results.total} results adapted for ${newLanguage}`);
        return results;
    }
    async getAvailableLanguagesForResults(resultIds) {
        try {
            const indexName = this.configService.get('elasticsearch.indices.resources');
            const query = {
                query: {
                    terms: {
                        id: resultIds
                    }
                },
                aggs: {
                    languages_per_result: {
                        terms: {
                            field: 'id',
                            size: resultIds.length
                        },
                        aggs: {
                            detected_language: {
                                terms: {
                                    field: 'language',
                                    size: 10
                                }
                            }
                        }
                    }
                },
                size: 0
            };
            const response = await this.elasticsearchService.search(indexName, query);
            const languageMap = {};
            if (response.aggregations?.languages_per_result?.buckets) {
                response.aggregations.languages_per_result.buckets.forEach((bucket) => {
                    const resultId = bucket.key;
                    const languages = bucket.detected_language.buckets.map((langBucket) => langBucket.key);
                    languageMap[resultId] = languages;
                });
            }
            return languageMap;
        }
        catch (error) {
            this.logger.error(`Failed to get available languages: ${error.message}`);
            return {};
        }
    }
    transformFacets(aggregations) {
        const facets = {
            categories: [],
            resourceTypes: [],
            plans: [],
            cities: [],
            regions: [],
            verified: [],
            tags: []
        };
        Object.keys(aggregations).forEach(key => {
            if (facets.hasOwnProperty(key) && aggregations[key].buckets) {
                facets[key] = aggregations[key].buckets.map((bucket) => {
                    const facetBucket = {
                        key: bucket.key,
                        count: bucket.doc_count
                    };
                    if (key === 'categories' && bucket.category_names?.buckets?.length > 0) {
                        facetBucket.label = bucket.category_names.buckets[0].key;
                    }
                    return facetBucket;
                });
            }
        });
        if (aggregations.priceRanges?.buckets) {
            facets.priceRanges = aggregations.priceRanges.buckets.map((bucket) => ({
                key: bucket.key,
                count: bucket.doc_count,
                label: this.getPriceRangeLabel(bucket.key)
            }));
        }
        if (aggregations.popularity?.buckets) {
            facets.popularity = aggregations.popularity.buckets.map((bucket) => ({
                key: bucket.key,
                count: bucket.doc_count,
                label: this.getPopularityLabel(bucket.key)
            }));
        }
        if (aggregations.rating?.buckets) {
            facets.rating = aggregations.rating.buckets.map((bucket) => ({
                key: bucket.key,
                count: bucket.doc_count,
                label: this.getRatingLabel(bucket.key)
            }));
        }
        if (aggregations.global_stats) {
            facets.globalStats = {
                totalResources: aggregations.global_stats.total_resources?.value || 0,
                averageRating: aggregations.global_stats.avg_rating?.value || 0,
                verifiedCount: aggregations.global_stats.verified_count?.doc_count || 0
            };
        }
        return facets;
    }
    getPriceRangeLabel(key) {
        const labels = {
            'free': 'Gratuit',
            'low': '0€ - 50€',
            'medium': '50€ - 200€',
            'high': '200€ - 1000€',
            'premium': '1000€+'
        };
        return labels[key] || key;
    }
    getPopularityLabel(key) {
        const labels = {
            'low': 'Peu populaire',
            'medium': 'Populaire',
            'high': 'Très populaire'
        };
        return labels[key] || key;
    }
    getRatingLabel(key) {
        const labels = {
            '1-2': '⭐⭐ et moins',
            '3-4': '⭐⭐⭐ à ⭐⭐⭐⭐',
            '4-5': '⭐⭐⭐⭐⭐'
        };
        return labels[key] || key;
    }
    generateSuggestionCacheKey(query, limit, userId) {
        return `suggest_${query}_${limit}_${userId || 'anonymous'}`;
    }
    buildAdvancedSuggestionQuery(query, limit, userId, language) {
        const effectiveLanguage = language || language_detection_service_1.SupportedLanguage.FRENCH;
        const analyzer = this.languageDetectionService.getSearchAnalyzerForLanguage(effectiveLanguage);
        let nameField = 'name';
        let categoryField = 'category.name';
        let tagsField = 'tags';
        if (effectiveLanguage === language_detection_service_1.SupportedLanguage.FRENCH) {
            nameField = 'name.french';
            categoryField = 'category.name.french';
            tagsField = 'tags.french';
        }
        else if (effectiveLanguage === language_detection_service_1.SupportedLanguage.ENGLISH) {
            nameField = 'name.english';
            categoryField = 'category.name.english';
            tagsField = 'tags.english';
        }
        return {
            suggest: {
                name_suggest: {
                    prefix: query,
                    completion: {
                        field: 'name.suggest',
                        size: Math.ceil(limit * 0.6),
                        skip_duplicates: true,
                        contexts: {
                            resource_type: ['api', 'enterprise', 'service'],
                            language: [effectiveLanguage]
                        }
                    }
                },
                category_suggest: {
                    prefix: query,
                    completion: {
                        field: 'category.name.suggest',
                        size: Math.ceil(limit * 0.3),
                        skip_duplicates: true,
                        contexts: {
                            language: [effectiveLanguage]
                        }
                    }
                },
                tag_suggest: {
                    prefix: query,
                    completion: {
                        field: 'tags.suggest',
                        size: Math.ceil(limit * 0.1),
                        skip_duplicates: true
                    }
                }
            },
            query: {
                bool: {
                    should: [
                        {
                            match_phrase_prefix: {
                                'name.exact': {
                                    query: query,
                                    boost: 5.0
                                }
                            }
                        },
                        {
                            match_phrase_prefix: {
                                [nameField]: {
                                    query: query,
                                    analyzer: analyzer,
                                    boost: 4.0
                                }
                            }
                        },
                        {
                            match_phrase_prefix: {
                                [categoryField]: {
                                    query: query,
                                    analyzer: analyzer,
                                    boost: 3.0
                                }
                            }
                        },
                        {
                            match_phrase_prefix: {
                                [tagsField]: {
                                    query: query,
                                    analyzer: analyzer,
                                    boost: 2.0
                                }
                            }
                        },
                        {
                            match: {
                                [nameField]: {
                                    query: query,
                                    analyzer: analyzer,
                                    fuzziness: 'AUTO',
                                    prefix_length: 2,
                                    boost: 1.5
                                }
                            }
                        },
                        { term: { verified: { value: true, boost: 1.5 } } },
                        { range: { popularity: { gte: 0.7, boost: 1.3 } } },
                        { range: { rating: { gte: 4.0, boost: 1.2 } } }
                    ],
                    minimum_should_match: 1
                }
            },
            size: limit,
            _source: [
                'name', 'category', 'resourceType', 'tags', 'verified',
                'popularity', 'rating', 'description', 'location'
            ],
            sort: [
                { _score: { order: 'desc' } },
                { popularity: { order: 'desc' } },
                { verified: { order: 'desc' } },
                { rating: { order: 'desc' } }
            ]
        };
    }
    buildSuggestionQuery(query, limit) {
        const normalizedQuery = this.normalizeFrenchQuery(query);
        return {
            suggest: {
                name_suggest: {
                    prefix: normalizedQuery,
                    completion: {
                        field: 'name.suggest',
                        size: limit,
                        skip_duplicates: true,
                        contexts: {
                            resource_type: ['api', 'enterprise', 'service']
                        }
                    }
                },
                category_suggest: {
                    prefix: normalizedQuery,
                    completion: {
                        field: 'category.name.suggest',
                        size: Math.floor(limit / 2),
                        skip_duplicates: true
                    }
                }
            },
            query: {
                bool: {
                    should: [
                        {
                            match_phrase_prefix: {
                                'name.exact': {
                                    query: normalizedQuery,
                                    boost: 4.0
                                }
                            }
                        },
                        {
                            match_phrase_prefix: {
                                name: {
                                    query: normalizedQuery,
                                    analyzer: 'french_search_analyzer',
                                    boost: 3.0
                                }
                            }
                        },
                        {
                            match_phrase_prefix: {
                                'category.name': {
                                    query: normalizedQuery,
                                    analyzer: 'french_search_analyzer',
                                    boost: 2.5
                                }
                            }
                        },
                        {
                            match_phrase_prefix: {
                                tags: {
                                    query: normalizedQuery,
                                    analyzer: 'french_search_analyzer',
                                    boost: 1.5
                                }
                            }
                        },
                        {
                            match: {
                                name: {
                                    query: normalizedQuery,
                                    analyzer: 'french_search_analyzer',
                                    fuzziness: 'AUTO',
                                    prefix_length: 2,
                                    boost: 1.0
                                }
                            }
                        }
                    ],
                    minimum_should_match: 1
                }
            },
            size: limit,
            _source: ['name', 'category', 'resourceType', 'tags', 'verified', 'popularity'],
            sort: [
                { _score: { order: 'desc' } },
                { popularity: { order: 'desc' } },
                { verified: { order: 'desc' } }
            ]
        };
    }
    transformAdvancedSuggestionResults(response, query, userId) {
        const suggestions = [];
        const seenTexts = new Set();
        if (response.suggest?.name_suggest) {
            response.suggest.name_suggest.forEach((suggest) => {
                suggest.options.forEach((option) => {
                    if (!seenTexts.has(option.text.toLowerCase())) {
                        seenTexts.add(option.text.toLowerCase());
                        suggestions.push({
                            text: option.text,
                            type: suggestion_types_1.SuggestionType.RESOURCE,
                            score: this.calculateSuggestionScore(option, query, 'name'),
                            category: option._source?.category?.name,
                            resourceType: option._source?.resourceType,
                            metadata: {
                                id: option._id,
                                description: option._source?.description,
                                popularity: option._source?.popularity || 0,
                                icon: this.getResourceTypeIcon(option._source?.resourceType)
                            }
                        });
                    }
                });
            });
        }
        if (response.suggest?.category_suggest) {
            response.suggest.category_suggest.forEach((suggest) => {
                suggest.options.forEach((option) => {
                    if (!seenTexts.has(option.text.toLowerCase())) {
                        seenTexts.add(option.text.toLowerCase());
                        suggestions.push({
                            text: option.text,
                            type: suggestion_types_1.SuggestionType.CATEGORY,
                            score: this.calculateSuggestionScore(option, query, 'category'),
                            category: option.text,
                            metadata: {
                                id: option._id,
                                description: `Catégorie: ${option.text}`,
                                icon: 'category'
                            }
                        });
                    }
                });
            });
        }
        if (response.suggest?.tag_suggest) {
            response.suggest.tag_suggest.forEach((suggest) => {
                suggest.options.forEach((option) => {
                    if (!seenTexts.has(option.text.toLowerCase())) {
                        seenTexts.add(option.text.toLowerCase());
                        suggestions.push({
                            text: option.text,
                            type: suggestion_types_1.SuggestionType.TAG,
                            score: this.calculateSuggestionScore(option, query, 'tag'),
                            metadata: {
                                description: `Tag: ${option.text}`,
                                icon: 'tag'
                            }
                        });
                    }
                });
            });
        }
        if (response.hits?.hits) {
            response.hits.hits.forEach((hit) => {
                const resourceName = hit._source.name;
                if (!seenTexts.has(resourceName.toLowerCase())) {
                    seenTexts.add(resourceName.toLowerCase());
                    suggestions.push({
                        text: resourceName,
                        type: suggestion_types_1.SuggestionType.RESOURCE,
                        score: this.calculateSuggestionScore(hit, query, 'search'),
                        category: hit._source.category?.name,
                        resourceType: hit._source.resourceType,
                        metadata: {
                            id: hit._id,
                            description: hit._source.description,
                            popularity: hit._source.popularity || 0,
                            icon: this.getResourceTypeIcon(hit._source.resourceType)
                        }
                    });
                }
            });
        }
        const sortedSuggestions = suggestions
            .sort((a, b) => {
            if (Math.abs(a.score - b.score) > 0.1) {
                return b.score - a.score;
            }
            const typeOrder = {
                [suggestion_types_1.SuggestionType.RESOURCE]: 3,
                [suggestion_types_1.SuggestionType.CATEGORY]: 2,
                [suggestion_types_1.SuggestionType.TAG]: 1
            };
            const typeDiff = typeOrder[b.type] - typeOrder[a.type];
            if (typeDiff !== 0) {
                return typeDiff;
            }
            const aPopularity = a.metadata?.popularity || 0;
            const bPopularity = b.metadata?.popularity || 0;
            return bPopularity - aPopularity;
        })
            .slice(0, 10);
        this.logger.debug(`Transformed ${sortedSuggestions.length} suggestions for query: "${query}"`);
        return sortedSuggestions;
    }
    calculateSuggestionScore(item, query, type) {
        let baseScore = item._score || 1;
        const text = item.text || item._source?.name || '';
        if (text.toLowerCase().startsWith(query.toLowerCase())) {
            baseScore *= 1.5;
        }
        if (item._source?.verified) {
            baseScore *= 1.3;
        }
        const popularity = item._source?.popularity || 0;
        if (popularity > 0.7) {
            baseScore *= 1.2;
        }
        else if (popularity > 0.5) {
            baseScore *= 1.1;
        }
        const rating = item._source?.rating || 0;
        if (rating >= 4.0) {
            baseScore *= 1.1;
        }
        switch (type) {
            case 'name':
                baseScore *= 1.0;
                break;
            case 'category':
                baseScore *= 0.8;
                break;
            case 'tag':
                baseScore *= 0.6;
                break;
            case 'search':
                baseScore *= 0.9;
                break;
        }
        return Math.round(baseScore * 100) / 100;
    }
    getResourceTypeIcon(resourceType) {
        const iconMap = {
            'API': 'api',
            'ENTERPRISE': 'building',
            'SERVICE': 'service',
            'TOOL': 'tool',
            'LIBRARY': 'library'
        };
        return iconMap[resourceType] || 'resource';
    }
    transformSuggestionResults(response, query) {
        const suggestions = [];
        if (response.suggest?.name_suggest) {
            response.suggest.name_suggest.forEach((suggest) => {
                suggest.options.forEach((option) => {
                    suggestions.push({
                        text: option.text,
                        type: suggestion_types_1.SuggestionType.RESOURCE,
                        score: option._score || 1,
                        metadata: {
                            id: option._id,
                            description: option._source?.description
                        }
                    });
                });
            });
        }
        if (response.hits?.hits) {
            response.hits.hits.forEach((hit) => {
                if (!suggestions.find(s => s.text === hit._source.name)) {
                    suggestions.push({
                        text: hit._source.name,
                        type: suggestion_types_1.SuggestionType.RESOURCE,
                        score: hit._score,
                        category: hit._source.category?.name,
                        resourceType: hit._source.resourceType,
                        metadata: {
                            id: hit._id,
                            description: hit._source.description
                        }
                    });
                }
            });
        }
        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    async checkIndexHealth() {
        try {
            const indexName = this.configService.get('elasticsearch.indices.resources');
            const health = await this.elasticsearchService.getIndexHealth(indexName);
            return health.status === 'green' || health.status === 'yellow';
        }
        catch (error) {
            this.logger.error(`Index health check failed: ${error.message}`);
            return false;
        }
    }
    async logSearchAnalytics(params, results, took, detectedLanguage) {
        try {
            const sessionId = params.sessionId || 'anonymous';
            const userId = params.userId;
            const logParams = {
                query: params.query || '',
                filters: params.filters || {},
                userId,
                sessionId,
                userAgent: undefined,
                ipAddress: undefined,
                resultsCount: results.total,
                took,
                language: params.language,
                detectedLanguage: detectedLanguage?.language
            };
            await this.analyticsService.logSearch(logParams);
            this.logger.debug(`Search analytics logged for query: "${params.query}" - Results: ${results.total} - Language: ${params.language || detectedLanguage?.language}`);
        }
        catch (error) {
            this.logger.warn('Failed to log search analytics', error);
        }
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [elasticsearch_service_1.ElasticsearchService,
        search_cache_service_1.SearchCacheService,
        config_1.ConfigService,
        search_error_handler_service_1.SearchErrorHandler,
        geocoding_service_1.GeocodingService,
        category_repository_1.CategoryRepository,
        search_analytics_service_1.SearchAnalyticsService,
        personalized_search_service_1.PersonalizedSearchService,
        language_detection_service_1.LanguageDetectionService])
], SearchService);
//# sourceMappingURL=search.service.js.map