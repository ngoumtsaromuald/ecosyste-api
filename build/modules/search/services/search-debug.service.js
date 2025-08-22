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
var SearchDebugService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchDebugService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const search_logger_service_1 = require("./search-logger.service");
let SearchDebugService = SearchDebugService_1 = class SearchDebugService {
    constructor(configService, searchLogger) {
        this.configService = configService;
        this.searchLogger = searchLogger;
        this.logger = new common_1.Logger(SearchDebugService_1.name);
        this.debugEnabled = this.configService.get('search.debug', false);
    }
    async debugSearch(request, searchOperation) {
        const startTime = Date.now();
        const searchContext = this.searchLogger.createSearchContext(request.params, request.userId, request.sessionId);
        const debugInfo = {
            query: {
                original: request.params,
                processed: { ...request.params },
                elasticsearch: {},
            },
            performance: {
                totalTime: 0,
                breakdown: {
                    preprocessing: 0,
                    elasticsearch: 0,
                    postprocessing: 0,
                    caching: 0,
                },
                bottlenecks: [],
            },
            cache: {
                key: '',
                hit: false,
            },
            elasticsearch: {
                took: 0,
                timedOut: false,
                shards: {
                    total: 0,
                    successful: 0,
                    skipped: 0,
                    failed: 0,
                },
            },
            language: {
                detected: 'unknown',
                confidence: 0,
                analyzer: 'standard',
            },
            filters: {
                applied: request.params.filters || {},
                processed: {},
                facets: {},
            },
            warnings: [],
            recommendations: [],
        };
        try {
            const preprocessStart = Date.now();
            const processedParams = await this.preprocessSearchParams(request.params, debugInfo);
            debugInfo.performance.breakdown.preprocessing = Date.now() - preprocessStart;
            const searchStart = Date.now();
            const results = await this.executeSearchWithProfiling(processedParams, searchOperation, debugInfo, request);
            debugInfo.performance.breakdown.elasticsearch = Date.now() - searchStart;
            const postprocessStart = Date.now();
            await this.postprocessResults(results, debugInfo, request);
            debugInfo.performance.breakdown.postprocessing = Date.now() - postprocessStart;
            debugInfo.performance.totalTime = Date.now() - startTime;
            debugInfo.performance.bottlenecks = this.identifyBottlenecks(debugInfo.performance.breakdown);
            debugInfo.recommendations = this.generateRecommendations(debugInfo);
            this.searchLogger.logDebugInfo(searchContext, {
                elasticsearchQuery: debugInfo.query.elasticsearch,
                performance: {
                    totalTime: debugInfo.performance.totalTime,
                    elasticsearchTime: debugInfo.performance.breakdown.elasticsearch,
                    cacheTime: debugInfo.performance.breakdown.caching,
                    processingTime: debugInfo.performance.breakdown.preprocessing + debugInfo.performance.breakdown.postprocessing,
                },
                cacheHit: debugInfo.cache.hit,
                languageDetected: debugInfo.language.detected,
            });
            return {
                searchId: request.searchId,
                results,
                debugInfo,
            };
        }
        catch (error) {
            this.logger.error(`Debug search failed for ${request.searchId}`, error);
            throw error;
        }
    }
    async preprocessSearchParams(params, debugInfo) {
        const processed = { ...params };
        if (params.query) {
            const languageInfo = await this.detectLanguage(params.query);
            debugInfo.language = languageInfo;
            processed.language = languageInfo.detected;
        }
        if (params.query) {
            processed.query = this.normalizeQuery(params.query);
            if (processed.query !== params.query) {
                debugInfo.warnings.push(`Query normalized from "${params.query}" to "${processed.query}"`);
            }
        }
        if (params.filters) {
            const { validFilters, warnings } = this.validateAndProcessFilters(params.filters);
            processed.filters = validFilters;
            debugInfo.filters.processed = validFilters;
            debugInfo.warnings.push(...warnings);
        }
        debugInfo.query.processed = processed;
        return processed;
    }
    async executeSearchWithProfiling(params, searchOperation, debugInfo, request) {
        const elasticsearchQuery = this.buildElasticsearchQuery(params);
        debugInfo.query.elasticsearch = elasticsearchQuery;
        const results = await searchOperation(params);
        debugInfo.elasticsearch = {
            took: results.took || 0,
            timedOut: false,
            shards: {
                total: 1,
                successful: 1,
                skipped: 0,
                failed: 0,
            },
        };
        if (request.includeRawResponse) {
            debugInfo.elasticsearch.rawResponse = results;
        }
        if (request.explainQuery) {
            debugInfo.query.explanation = await this.explainQuery(elasticsearchQuery, params);
        }
        return results;
    }
    async postprocessResults(results, debugInfo, request) {
        const qualityAnalysis = this.analyzeResultQuality(results, request.params);
        if (qualityAnalysis.warnings.length > 0) {
            debugInfo.warnings.push(...qualityAnalysis.warnings);
        }
        if (results.facets) {
            debugInfo.filters.facets = results.facets;
        }
        if (results.suggestions && results.suggestions.length > 0) {
            debugInfo.suggestions = {
                count: results.suggestions.length,
                sources: ['elasticsearch'],
                ranking: this.analyzeSuggestionRanking(results.suggestions),
            };
        }
    }
    async detectLanguage(query) {
        const frenchPatterns = /[àâäéèêëïîôöùûüÿç]/i;
        const englishPatterns = /\b(the|and|or|in|on|at|to|for|of|with|by)\b/i;
        let detected = 'unknown';
        let confidence = 0;
        let analyzer = 'standard';
        if (frenchPatterns.test(query)) {
            detected = 'fr';
            confidence = 0.8;
            analyzer = 'french';
        }
        else if (englishPatterns.test(query)) {
            detected = 'en';
            confidence = 0.7;
            analyzer = 'english';
        }
        else {
            detected = 'fr';
            confidence = 0.5;
            analyzer = 'french';
        }
        return { detected, confidence, analyzer };
    }
    normalizeQuery(query) {
        return query
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\-àâäéèêëïîôöùûüÿç]/gi, '');
    }
    validateAndProcessFilters(filters) {
        const validFilters = {};
        const warnings = [];
        if (filters.categories && Array.isArray(filters.categories)) {
            validFilters.categories = filters.categories.filter(cat => typeof cat === 'string' && cat.length > 0);
            if (validFilters.categories.length !== filters.categories.length) {
                warnings.push('Some invalid categories were filtered out');
            }
        }
        if (filters.resourceTypes && Array.isArray(filters.resourceTypes)) {
            const validTypes = ['api', 'enterprise', 'service'];
            validFilters.resourceTypes = filters.resourceTypes.filter(type => validTypes.includes(type));
            if (validFilters.resourceTypes.length !== filters.resourceTypes.length) {
                warnings.push('Some invalid resource types were filtered out');
            }
        }
        if (filters.priceRange) {
            const { min, max } = filters.priceRange;
            if (typeof min === 'number' && typeof max === 'number' && min >= 0 && max >= min) {
                validFilters.priceRange = { min, max };
            }
            else {
                warnings.push('Invalid price range was ignored');
            }
        }
        if (filters.location) {
            if (filters.location.latitude && filters.location.longitude) {
                const lat = parseFloat(filters.location.latitude.toString());
                const lon = parseFloat(filters.location.longitude.toString());
                if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                    validFilters.location = { ...filters.location, latitude: lat, longitude: lon };
                }
                else {
                    warnings.push('Invalid coordinates were ignored');
                }
            }
        }
        return { validFilters, warnings };
    }
    buildElasticsearchQuery(params) {
        const query = {
            bool: {
                must: [],
                filter: [],
                should: [],
            },
        };
        if (params.query) {
            query.bool.must.push({
                multi_match: {
                    query: params.query,
                    fields: ['name^3', 'description^2', 'category.name^2', 'tags'],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                },
            });
        }
        if (params.filters?.categories && params.filters.categories.length > 0) {
            query.bool.filter.push({
                terms: { 'category.id': params.filters.categories },
            });
        }
        if (params.filters?.resourceTypes && params.filters.resourceTypes.length > 0) {
            query.bool.filter.push({
                terms: { resourceType: params.filters.resourceTypes },
            });
        }
        if (params.filters?.location) {
            query.bool.filter.push({
                geo_distance: {
                    distance: `${params.filters.location.radius || 10}km`,
                    location: {
                        lat: params.filters.location.latitude,
                        lon: params.filters.location.longitude,
                    },
                },
            });
        }
        if (params.filters?.priceRange) {
            query.bool.filter.push({
                range: {
                    price: {
                        gte: params.filters.priceRange.min,
                        lte: params.filters.priceRange.max,
                    },
                },
            });
        }
        return query;
    }
    async explainQuery(query, params) {
        return {
            query,
            explanation: {
                value: 1.0,
                description: 'Mock explanation for debug purposes',
                details: [],
            },
            matchedDocuments: 0,
            executionTime: 0,
        };
    }
    analyzeResultQuality(results, params) {
        const warnings = [];
        if (results.total === 0) {
            warnings.push('No results found - consider broadening search criteria');
        }
        if (results.total > 0 && results.total < 3) {
            warnings.push('Very few results found - search may be too specific');
        }
        if (params.query && results.hits.length > 0) {
            const queryTerms = params.query.toLowerCase().split(' ');
            const hasRelevantResults = results.hits.some(hit => queryTerms.some(term => hit.name?.toLowerCase().includes(term) ||
                hit.description?.toLowerCase().includes(term)));
            if (!hasRelevantResults) {
                warnings.push('Results may not be relevant to the search query');
            }
        }
        return { warnings };
    }
    analyzeSuggestionRanking(suggestions) {
        return {
            algorithm: 'popularity_based',
            factors: ['frequency', 'recency', 'user_preference'],
            count: suggestions.length,
        };
    }
    identifyBottlenecks(breakdown) {
        const bottlenecks = [];
        const total = Object.values(breakdown).reduce((sum, time) => sum + time, 0);
        Object.entries(breakdown).forEach(([phase, time]) => {
            const percentage = (time / total) * 100;
            if (percentage > 40) {
                bottlenecks.push(`${phase} (${percentage.toFixed(1)}% of total time)`);
            }
        });
        return bottlenecks;
    }
    generateRecommendations(debugInfo) {
        const recommendations = [];
        if (debugInfo.performance.totalTime > 1000) {
            recommendations.push('Consider implementing result caching for better performance');
        }
        if (debugInfo.performance.breakdown.elasticsearch > 500) {
            recommendations.push('Elasticsearch query is slow - consider optimizing index mappings');
        }
        if (debugInfo.query.original.query && debugInfo.query.original.query.length > 100) {
            recommendations.push('Very long query detected - consider breaking into multiple searches');
        }
        const filterCount = Object.keys(debugInfo.filters.applied).length;
        if (filterCount > 5) {
            recommendations.push('Many filters applied - consider using faceted search interface');
        }
        if (!debugInfo.cache.hit && debugInfo.performance.totalTime > 200) {
            recommendations.push('This search could benefit from caching');
        }
        return recommendations;
    }
    getDebugStatistics() {
        return {
            debugEnabled: this.debugEnabled,
            totalDebugRequests: 0,
            averageDebugTime: 0,
            commonBottlenecks: ['elasticsearch', 'preprocessing'],
        };
    }
    setDebugMode(enabled) {
        this.logger.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    clearDebugData() {
        this.logger.log('Debug data cleared');
    }
};
exports.SearchDebugService = SearchDebugService;
exports.SearchDebugService = SearchDebugService = SearchDebugService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        search_logger_service_1.SearchLoggerService])
], SearchDebugService);
//# sourceMappingURL=search-debug.service.js.map