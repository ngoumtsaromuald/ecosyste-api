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
var SearchValidationMiddleware_1, SuggestionValidationMiddleware_1, GeoValidationMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoValidationMiddleware = exports.SuggestionValidationMiddleware = exports.SearchValidationMiddleware = void 0;
const common_1 = require("@nestjs/common");
const search_validation_service_1 = require("../services/search-validation.service");
const search_interfaces_1 = require("../interfaces/search.interfaces");
const client_1 = require("@prisma/client");
let SearchValidationMiddleware = SearchValidationMiddleware_1 = class SearchValidationMiddleware {
    constructor(validationService) {
        this.validationService = validationService;
        this.logger = new common_1.Logger(SearchValidationMiddleware_1.name);
    }
    async use(req, res, next) {
        try {
            const searchParams = this.extractSearchParams(req);
            const validationOptions = this.getValidationOptions(req.path, req.method);
            const validation = await this.validationService.validateSearchParams(searchParams, validationOptions);
            if (!validation.isValid) {
                this.logger.warn(`Search validation failed for ${req.path}: ${validation.errors.join(', ')}`);
                throw new common_1.BadRequestException({
                    message: 'Paramètres de recherche invalides',
                    errors: validation.errors,
                    warnings: validation.warnings,
                    path: req.path,
                    timestamp: new Date().toISOString()
                });
            }
            req.body.validatedSearchParams = validation.sanitizedParams;
            req.body.validationWarnings = validation.warnings;
            if (validation.warnings && validation.warnings.length > 0) {
                this.logger.warn(`Search validation warnings for ${req.path}: ${validation.warnings.join(', ')}`);
            }
            next();
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error(`Search validation middleware error: ${error.message}`, error.stack);
            throw new common_1.BadRequestException({
                message: 'Erreur de validation des paramètres de recherche',
                error: error.message
            });
        }
    }
    extractSearchParams(req) {
        const query = req.query;
        const params = {};
        if (query.q && typeof query.q === 'string') {
            params.query = query.q;
        }
        const filters = {};
        if (query.categories) {
            if (typeof query.categories === 'string') {
                filters.categories = query.categories.split(',').filter(c => c.trim());
            }
            else if (Array.isArray(query.categories)) {
                filters.categories = query.categories.filter(c => typeof c === 'string');
            }
        }
        if (query.resourceTypes) {
            if (typeof query.resourceTypes === 'string') {
                filters.resourceTypes = query.resourceTypes.split(',').filter(t => Object.values(client_1.ResourceType).includes(t));
            }
            else if (Array.isArray(query.resourceTypes)) {
                filters.resourceTypes = query.resourceTypes.filter(t => typeof t === 'string' && Object.values(client_1.ResourceType).includes(t));
            }
        }
        if (query.plans) {
            if (typeof query.plans === 'string') {
                filters.plans = query.plans.split(',').filter(p => Object.values(client_1.ResourcePlan).includes(p));
            }
            else if (Array.isArray(query.plans)) {
                filters.plans = query.plans.filter(p => typeof p === 'string' && Object.values(client_1.ResourcePlan).includes(p));
            }
        }
        if (query.minPrice || query.maxPrice) {
            filters.priceRange = {};
            if (query.minPrice && typeof query.minPrice === 'string') {
                const minPrice = parseInt(query.minPrice, 10);
                if (!isNaN(minPrice)) {
                    filters.priceRange.min = minPrice;
                }
            }
            if (query.maxPrice && typeof query.maxPrice === 'string') {
                const maxPrice = parseInt(query.maxPrice, 10);
                if (!isNaN(maxPrice)) {
                    filters.priceRange.max = maxPrice;
                }
            }
        }
        if (query.verified !== undefined) {
            if (typeof query.verified === 'string') {
                filters.verified = query.verified.toLowerCase() === 'true';
            }
            else if (typeof query.verified === 'boolean') {
                filters.verified = query.verified;
            }
        }
        if (query.city && typeof query.city === 'string') {
            filters.city = query.city;
        }
        if (query.region && typeof query.region === 'string') {
            filters.region = query.region;
        }
        if (query.country && typeof query.country === 'string') {
            filters.country = query.country;
        }
        if (query.tags) {
            if (typeof query.tags === 'string') {
                filters.tags = query.tags.split(',').filter(t => t.trim());
            }
            else if (Array.isArray(query.tags)) {
                filters.tags = query.tags.filter(t => typeof t === 'string');
            }
        }
        if (query.latitude && query.longitude && query.radius) {
            const lat = parseFloat(query.latitude);
            const lng = parseFloat(query.longitude);
            const radius = parseFloat(query.radius);
            if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
                filters.location = {
                    latitude: lat,
                    longitude: lng,
                    radius,
                    unit: query.unit === 'mi' ? 'mi' : 'km'
                };
            }
        }
        if (query.fromDate || query.toDate) {
            filters.dateRange = {};
            if (query.fromDate && typeof query.fromDate === 'string') {
                const fromDate = new Date(query.fromDate);
                if (!isNaN(fromDate.getTime())) {
                    filters.dateRange.from = fromDate;
                }
            }
            if (query.toDate && typeof query.toDate === 'string') {
                const toDate = new Date(query.toDate);
                if (!isNaN(toDate.getTime())) {
                    filters.dateRange.to = toDate;
                }
            }
        }
        if (Object.keys(filters).length > 0) {
            params.filters = filters;
        }
        if (query.sort || query.order) {
            params.sort = {
                field: query.sort || search_interfaces_1.SortField.RELEVANCE,
                order: query.order === 'asc' ? search_interfaces_1.SortOrder.ASC : search_interfaces_1.SortOrder.DESC
            };
        }
        const page = query.page ? parseInt(query.page, 10) : undefined;
        const limit = query.limit ? parseInt(query.limit, 10) : undefined;
        const offset = query.offset ? parseInt(query.offset, 10) : undefined;
        if (page || limit || offset) {
            params.pagination = {};
            if (page && !isNaN(page))
                params.pagination.page = page;
            if (limit && !isNaN(limit))
                params.pagination.limit = limit;
            if (offset && !isNaN(offset))
                params.pagination.offset = offset;
            if (query.searchAfter && typeof query.searchAfter === 'string') {
                params.pagination.searchAfter = query.searchAfter;
            }
        }
        if (query.facets) {
            if (typeof query.facets === 'string') {
                params.facets = query.facets.split(',').filter(f => f.trim());
            }
            else if (Array.isArray(query.facets)) {
                params.facets = query.facets.filter(f => typeof f === 'string');
            }
        }
        if (query.language && typeof query.language === 'string') {
            params.language = query.language;
        }
        if (query.userId && typeof query.userId === 'string') {
            params.userId = query.userId;
        }
        if (query.sessionId && typeof query.sessionId === 'string') {
            params.sessionId = query.sessionId;
        }
        return params;
    }
    getValidationOptions(path, method) {
        const baseOptions = {
            maxQueryLength: 200,
            maxFiltersCount: 50,
            strictMode: false
        };
        if (path.includes('/suggest')) {
            return {
                ...baseOptions,
                maxQueryLength: 100,
                maxFiltersCount: 10,
                strictMode: true
            };
        }
        if (path.includes('/category')) {
            return {
                ...baseOptions,
                maxFiltersCount: 30
            };
        }
        if (path.includes('/multi-type')) {
            return {
                ...baseOptions,
                maxFiltersCount: 100
            };
        }
        if (path.includes('/analytics')) {
            return {
                ...baseOptions,
                strictMode: true,
                maxQueryLength: 500
            };
        }
        return baseOptions;
    }
};
exports.SearchValidationMiddleware = SearchValidationMiddleware;
exports.SearchValidationMiddleware = SearchValidationMiddleware = SearchValidationMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_validation_service_1.SearchValidationService])
], SearchValidationMiddleware);
let SuggestionValidationMiddleware = SuggestionValidationMiddleware_1 = class SuggestionValidationMiddleware {
    constructor(validationService) {
        this.validationService = validationService;
        this.logger = new common_1.Logger(SuggestionValidationMiddleware_1.name);
    }
    async use(req, res, next) {
        try {
            const query = req.query.q;
            if (!query) {
                throw new common_1.BadRequestException({
                    message: 'Paramètre "q" requis pour les suggestions',
                    path: req.path
                });
            }
            if (query.length < 2) {
                res.json([]);
                return;
            }
            if (query.length > 100) {
                throw new common_1.BadRequestException({
                    message: 'Requête trop longue pour les suggestions (max 100 caractères)',
                    path: req.path
                });
            }
            const validation = await this.validationService.validateSearchParams({ query }, {
                maxQueryLength: 100,
                strictMode: true,
                maxFiltersCount: 0
            });
            if (!validation.isValid) {
                throw new common_1.BadRequestException({
                    message: 'Requête de suggestion invalide',
                    errors: validation.errors
                });
            }
            req.body.sanitizedQuery = validation.sanitizedParams?.query;
            next();
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error(`Suggestion validation error: ${error.message}`, error.stack);
            throw new common_1.BadRequestException({
                message: 'Erreur de validation de la suggestion',
                error: error.message
            });
        }
    }
};
exports.SuggestionValidationMiddleware = SuggestionValidationMiddleware;
exports.SuggestionValidationMiddleware = SuggestionValidationMiddleware = SuggestionValidationMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_validation_service_1.SearchValidationService])
], SuggestionValidationMiddleware);
let GeoValidationMiddleware = GeoValidationMiddleware_1 = class GeoValidationMiddleware {
    constructor(validationService) {
        this.validationService = validationService;
        this.logger = new common_1.Logger(GeoValidationMiddleware_1.name);
    }
    async use(req, res, next) {
        try {
            const { latitude, longitude, radius } = req.query;
            if (latitude || longitude || radius) {
                if (!latitude || !longitude || !radius) {
                    throw new common_1.BadRequestException({
                        message: 'Paramètres géographiques incomplets (latitude, longitude, radius requis)',
                        path: req.path
                    });
                }
                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);
                const rad = parseFloat(radius);
                if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
                    throw new common_1.BadRequestException({
                        message: 'Paramètres géographiques invalides (doivent être des nombres)',
                        path: req.path
                    });
                }
                const geoFilter = { latitude: lat, longitude: lng, radius: rad };
                const validation = await this.validationService.validateSearchParams({ filters: { location: geoFilter } }, { strictMode: true, maxGeoRadius: 1000 });
                if (!validation.isValid) {
                    throw new common_1.BadRequestException({
                        message: 'Paramètres géographiques invalides',
                        errors: validation.errors,
                        path: req.path
                    });
                }
                req.body.validatedGeoFilter = geoFilter;
            }
            next();
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error(`Geo validation error: ${error.message}`, error.stack);
            throw new common_1.BadRequestException({
                message: 'Erreur de validation géographique',
                error: error.message
            });
        }
    }
};
exports.GeoValidationMiddleware = GeoValidationMiddleware;
exports.GeoValidationMiddleware = GeoValidationMiddleware = GeoValidationMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_validation_service_1.SearchValidationService])
], GeoValidationMiddleware);
//# sourceMappingURL=search-validation.middleware.js.map