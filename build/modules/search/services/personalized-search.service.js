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
var PersonalizedSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalizedSearchService = void 0;
const common_1 = require("@nestjs/common");
const search_analytics_service_1 = require("./search-analytics.service");
let PersonalizedSearchService = PersonalizedSearchService_1 = class PersonalizedSearchService {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
        this.logger = new common_1.Logger(PersonalizedSearchService_1.name);
    }
    async getUserPreferences(userId, lookbackDays = 90) {
        try {
            this.logger.debug(`Getting user preferences for user: ${userId}`);
            const history = await this.analyticsService.getUserSearchHistory(userId, 200);
            const now = new Date();
            const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000;
            const recentSearches = history.searches.filter(search => (now.getTime() - search.createdAt.getTime()) <= lookbackMs);
            const topCategories = history.topCategories.map(cat => ({
                ...cat,
                weight: this.calculateCategoryWeight(cat.searchCount, history.topCategories.length)
            }));
            const topTerms = history.topTerms.map(term => ({
                ...term,
                weight: this.calculateTermWeight(term.count, history.topTerms.length)
            }));
            const clickedResources = await this.getClickedResources(userId, lookbackDays);
            return {
                topCategories,
                topTerms,
                recentSearches,
                clickedResources
            };
        }
        catch (error) {
            this.logger.error(`Failed to get user preferences for ${userId}: ${error.message}`);
            return this.getDefaultPreferences();
        }
    }
    async personalizeSearchParams(params) {
        try {
            if (!params.usePersonalization || !params.userId) {
                return params;
            }
            const preferences = await this.getUserPreferences(params.userId);
            const personalizationWeight = params.personalizationWeight || 0.3;
            this.logger.debug(`Personalizing search for user ${params.userId} with weight ${personalizationWeight}`);
            const personalizedFilters = this.applyPersonalizationToFilters(params.filters || {}, preferences, personalizationWeight);
            const personalizedQuery = this.applyPersonalizationToQuery(params.query || '', preferences, personalizationWeight);
            return {
                ...params,
                query: personalizedQuery,
                filters: personalizedFilters
            };
        }
        catch (error) {
            this.logger.error(`Failed to personalize search params: ${error.message}`);
            return params;
        }
    }
    async personalizeSearchResults(results, userId, personalizationWeight = 0.3) {
        try {
            if (!userId || results.hits.length === 0) {
                return results;
            }
            const preferences = await this.getUserPreferences(userId);
            this.logger.debug(`Personalizing ${results.hits.length} search results for user ${userId}`);
            const personalizedHits = results.hits.map(hit => {
                const personalizedScore = this.calculatePersonalizedScore(hit, preferences, personalizationWeight);
                return {
                    ...hit,
                    score: personalizedScore
                };
            });
            personalizedHits.sort((a, b) => b.score - a.score);
            return {
                ...results,
                hits: personalizedHits
            };
        }
        catch (error) {
            this.logger.error(`Failed to personalize search results: ${error.message}`);
            return results;
        }
    }
    calculateCategoryWeight(searchCount, totalCategories) {
        const maxWeight = 1.0;
        const minWeight = 0.1;
        const normalizedCount = Math.min(searchCount / 10, 1.0);
        return minWeight + (normalizedCount * (maxWeight - minWeight));
    }
    calculateTermWeight(count, totalTerms) {
        const maxWeight = 1.0;
        const minWeight = 0.1;
        const normalizedCount = Math.min(count / 5, 1.0);
        return minWeight + (normalizedCount * (maxWeight - minWeight));
    }
    async getClickedResources(userId, lookbackDays) {
        try {
            return [];
        }
        catch (error) {
            this.logger.error(`Failed to get clicked resources for ${userId}: ${error.message}`);
            return [];
        }
    }
    applyPersonalizationToFilters(filters, preferences, weight) {
        const personalizedFilters = { ...filters };
        if (!filters.categories || filters.categories.length === 0) {
            if (preferences.topCategories.length > 0 && weight > 0.5) {
                personalizedFilters.categories = preferences.topCategories
                    .slice(0, 3)
                    .map(cat => cat.categoryId);
            }
        }
        return personalizedFilters;
    }
    applyPersonalizationToQuery(query, preferences, weight) {
        if (!query && weight > 0.7 && preferences.topTerms.length > 0) {
            return preferences.topTerms[0].term;
        }
        return query;
    }
    calculatePersonalizedScore(hit, preferences, weight) {
        let boost = 0;
        const categoryBoost = this.calculateCategoryBoost(hit, preferences.topCategories);
        boost += categoryBoost * weight * 0.4;
        const clickBoost = this.calculateClickBoost(hit, preferences.clickedResources);
        boost += clickBoost * weight * 0.6;
        return hit.score * (1 + boost);
    }
    calculateCategoryBoost(hit, topCategories) {
        const categoryMatch = topCategories.find(cat => cat.categoryId === hit.category.id);
        if (categoryMatch) {
            return categoryMatch.weight * 0.5;
        }
        return 0;
    }
    calculateClickBoost(hit, clickedResources) {
        const clickMatch = clickedResources.find(res => res.resourceId === hit.id);
        if (clickMatch) {
            return clickMatch.weight * 0.3;
        }
        return 0;
    }
    getPersonalizationReasons(hit, preferences) {
        const reasons = [];
        const categoryMatch = preferences.topCategories.find(cat => cat.categoryId === hit.category.id);
        if (categoryMatch) {
            reasons.push(`Catégorie préférée: ${categoryMatch.categoryName}`);
        }
        const clickMatch = preferences.clickedResources.find(res => res.resourceId === hit.id);
        if (clickMatch) {
            reasons.push(`Ressource consultée ${clickMatch.clickCount} fois`);
        }
        return reasons;
    }
    calculateAverageBoost(hits) {
        if (hits.length === 0)
            return 0;
        const totalBoost = hits.reduce((sum, hit) => {
            const personalization = hit.metadata?.personalization;
            return sum + (personalization?.boost || 0);
        }, 0);
        return totalBoost / hits.length;
    }
    getDefaultPreferences() {
        return {
            topCategories: [],
            topTerms: [],
            recentSearches: [],
            clickedResources: []
        };
    }
};
exports.PersonalizedSearchService = PersonalizedSearchService;
exports.PersonalizedSearchService = PersonalizedSearchService = PersonalizedSearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_analytics_service_1.SearchAnalyticsService])
], PersonalizedSearchService);
//# sourceMappingURL=personalized-search.service.js.map