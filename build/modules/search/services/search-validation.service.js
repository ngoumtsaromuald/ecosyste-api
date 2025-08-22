"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SearchValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchValidationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let SearchValidationService = SearchValidationService_1 = class SearchValidationService {
    constructor() {
        this.logger = new common_1.Logger(SearchValidationService_1.name);
        this.defaultOptions = {
            maxQueryLength: 200,
            maxFiltersCount: 50,
            allowedResourceTypes: Object.values(client_1.ResourceType),
            allowedPlans: Object.values(client_1.ResourcePlan),
            maxPriceRange: 10000000,
            maxGeoRadius: 1000,
            strictMode: false
        };
        this.suspiciousPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /<object[^>]*>.*?<\/object>/gi,
            /<embed[^>]*>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /on\w+\s*=/gi,
            /<img[^>]*src\s*=\s*["']?javascript:/gi,
            /\{\{.*\}\}/g,
            /\$\{.*\}/g,
            /#\{.*\}/g,
            /\{.*"script".*\}/gi,
            /\{.*"source".*\}/gi,
            /"_source":/gi,
            /"query":\s*\{.*"script"/gi,
            /union\s+select/gi,
            /drop\s+table/gi,
            /delete\s+from/gi,
            /insert\s+into/gi,
            /update\s+set/gi,
            /;\s*(rm|del|format|shutdown)/gi,
            /\|\s*(curl|wget|nc|netcat)/gi,
            /`.*`/g,
            /\$\(.*\)/g
        ];
        this.dangerousChars = [
            '<', '>', '"', "'", '&', '{', '}', '[', ']',
            '(', ')', ';', '|', '`', '$', '\n', '\r', '\t'
        ];
    }
    async validateSearchParams(params, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const errors = [];
        const warnings = [];
        try {
            if (params.query !== undefined) {
                const queryValidation = this.validateQuery(params.query, opts);
                if (!queryValidation.isValid) {
                    errors.push(...queryValidation.errors);
                }
                if (queryValidation.warnings) {
                    warnings.push(...queryValidation.warnings);
                }
            }
            if (params.filters) {
                const filtersValidation = this.validateFilters(params.filters, opts);
                if (!filtersValidation.isValid) {
                    errors.push(...filtersValidation.errors);
                }
                if (filtersValidation.warnings) {
                    warnings.push(...filtersValidation.warnings);
                }
            }
            if (params.pagination) {
                const paginationValidation = this.validatePagination(params.pagination);
                if (!paginationValidation.isValid) {
                    errors.push(...paginationValidation.errors);
                }
            }
            if (params.facets) {
                const facetsValidation = this.validateFacets(params.facets);
                if (!facetsValidation.isValid) {
                    errors.push(...facetsValidation.errors);
                }
            }
            if (params.language) {
                const languageValidation = this.validateLanguage(params.language);
                if (!languageValidation.isValid) {
                    errors.push(...languageValidation.errors);
                }
            }
            const sanitizedParams = this.sanitizeSearchParams(params);
            const result = {
                isValid: errors.length === 0,
                errors,
                warnings: warnings.length > 0 ? warnings : undefined,
                sanitizedParams
            };
            if (!result.isValid) {
                this.logger.warn(`Search validation failed: ${errors.join(', ')}`);
            }
            return result;
        }
        catch (error) {
            this.logger.error(`Search validation error: ${error.message}`, error.stack);
            return {
                isValid: false,
                errors: ['Erreur interne de validation']
            };
        }
    }
    validateQuery(query, options) {
        const errors = [];
        const warnings = [];
        if (query.length > options.maxQueryLength) {
            errors.push(`La requête est trop longue (max ${options.maxQueryLength} caractères)`);
        }
        if (this.containsSuspiciousPatterns(query)) {
            errors.push('La requête contient des caractères ou patterns non autorisés');
        }
        if (this.containsDangerousChars(query)) {
            if (options.strictMode) {
                errors.push('La requête contient des caractères dangereux');
            }
            else {
                warnings.push('La requête contient des caractères qui seront échappés');
            }
        }
        if (query.trim().length === 0) {
            warnings.push('La requête est vide');
        }
        if (query.trim().length > 0 && query.trim().length < 2) {
            warnings.push('La requête est très courte, les résultats peuvent être limités');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }
    validateFilters(filters, options) {
        const errors = [];
        const warnings = [];
        const filterCount = this.countFilters(filters);
        if (filterCount > options.maxFiltersCount) {
            errors.push(`Trop de filtres appliqués (max ${options.maxFiltersCount})`);
        }
        if (filters.categories) {
            const categoryValidation = this.validateCategories(filters.categories);
            if (!categoryValidation.isValid) {
                errors.push(...categoryValidation.errors);
            }
        }
        if (filters.resourceTypes) {
            const typeValidation = this.validateResourceTypes(filters.resourceTypes, options);
            if (!typeValidation.isValid) {
                errors.push(...typeValidation.errors);
            }
        }
        if (filters.plans) {
            const planValidation = this.validatePlans(filters.plans, options);
            if (!planValidation.isValid) {
                errors.push(...planValidation.errors);
            }
        }
        if (filters.priceRange) {
            const priceValidation = this.validatePriceRange(filters.priceRange, options);
            if (!priceValidation.isValid) {
                errors.push(...priceValidation.errors);
            }
        }
        if (filters.location) {
            const geoValidation = this.validateGeoFilter(filters.location, options);
            if (!geoValidation.isValid) {
                errors.push(...geoValidation.errors);
            }
        }
        if (filters.city) {
            const cityValidation = this.validateTextFilter(filters.city, 'ville');
            if (!cityValidation.isValid) {
                errors.push(...cityValidation.errors);
            }
        }
        if (filters.region) {
            const regionValidation = this.validateTextFilter(filters.region, 'région');
            if (!regionValidation.isValid) {
                errors.push(...regionValidation.errors);
            }
        }
        if (filters.country) {
            const countryValidation = this.validateTextFilter(filters.country, 'pays');
            if (!countryValidation.isValid) {
                errors.push(...countryValidation.errors);
            }
        }
        if (filters.tags) {
            const tagsValidation = this.validateTags(filters.tags);
            if (!tagsValidation.isValid) {
                errors.push(...tagsValidation.errors);
            }
        }
        if (filters.dateRange) {
            const dateValidation = this.validateDateRange(filters.dateRange);
            if (!dateValidation.isValid) {
                errors.push(...dateValidation.errors);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }
    validatePagination(pagination) {
        const errors = [];
        if (pagination.page !== undefined) {
            if (!Number.isInteger(pagination.page) || pagination.page < 1) {
                errors.push('Le numéro de page doit être un entier positif');
            }
            if (pagination.page > 1000) {
                errors.push('Le numéro de page est trop élevé (max 1000)');
            }
        }
        if (pagination.limit !== undefined) {
            if (!Number.isInteger(pagination.limit) || pagination.limit < 1) {
                errors.push('La limite doit être un entier positif');
            }
            if (pagination.limit > 100) {
                errors.push('La limite est trop élevée (max 100)');
            }
        }
        if (pagination.offset !== undefined) {
            if (!Number.isInteger(pagination.offset) || pagination.offset < 0) {
                errors.push('L\'offset doit être un entier positif ou zéro');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validateFacets(facets) {
        const errors = [];
        const allowedFacets = [
            'categories', 'resourceTypes', 'plans', 'verified',
            'tags', 'cities', 'regions', 'countries'
        ];
        if (facets.length > 20) {
            errors.push('Trop de facettes demandées (max 20)');
        }
        for (const facet of facets) {
            if (!allowedFacets.includes(facet)) {
                errors.push(`Facette non autorisée: ${facet}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validateLanguage(language) {
        const errors = [];
        const allowedLanguages = ['fr', 'en', 'auto'];
        if (!allowedLanguages.includes(language)) {
            errors.push(`Langue non supportée: ${language}`);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validateCategories(categories) {
        const errors = [];
        if (categories.length > 20) {
            errors.push('Trop de catégories sélectionnées (max 20)');
        }
        for (const categoryId of categories) {
            if (!this.isValidUUID(categoryId)) {
                errors.push(`ID de catégorie invalide: ${categoryId}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validateResourceTypes(types, options) {
        const errors = [];
        for (const type of types) {
            if (!options.allowedResourceTypes.includes(type)) {
                errors.push(`Type de ressource non autorisé: ${type}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validatePlans(plans, options) {
        const errors = [];
        for (const plan of plans) {
            if (!options.allowedPlans.includes(plan)) {
                errors.push(`Plan non autorisé: ${plan}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validatePriceRange(priceRange, options) {
        const errors = [];
        if (priceRange.min !== undefined) {
            if (priceRange.min < 0) {
                errors.push('Le prix minimum ne peut pas être négatif');
            }
            if (priceRange.min > options.maxPriceRange) {
                errors.push(`Le prix minimum est trop élevé (max ${options.maxPriceRange})`);
            }
        }
        if (priceRange.max !== undefined) {
            if (priceRange.max < 0) {
                errors.push('Le prix maximum ne peut pas être négatif');
            }
            if (priceRange.max > options.maxPriceRange) {
                errors.push(`Le prix maximum est trop élevé (max ${options.maxPriceRange})`);
            }
        }
        if (priceRange.min !== undefined && priceRange.max !== undefined) {
            if (priceRange.min > priceRange.max) {
                errors.push('Le prix minimum ne peut pas être supérieur au prix maximum');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validateGeoFilter(geoFilter, options) {
        const errors = [];
        if (geoFilter.latitude < -90 || geoFilter.latitude > 90) {
            errors.push('La latitude doit être comprise entre -90 et 90');
        }
        if (geoFilter.longitude < -180 || geoFilter.longitude > 180) {
            errors.push('La longitude doit être comprise entre -180 et 180');
        }
        if (geoFilter.radius <= 0) {
            errors.push('Le rayon doit être positif');
        }
        if (geoFilter.radius > options.maxGeoRadius) {
            errors.push(`Le rayon est trop grand (max ${options.maxGeoRadius} km)`);
        }
        if (geoFilter.unit && !['km', 'mi'].includes(geoFilter.unit)) {
            errors.push('L\'unité doit être "km" ou "mi"');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validateTextFilter(text, fieldName) {
        const errors = [];
        if (text.length > 100) {
            errors.push(`Le champ ${fieldName} est trop long (max 100 caractères)`);
        }
        if (this.containsSuspiciousPatterns(text)) {
            errors.push(`Le champ ${fieldName} contient des caractères non autorisés`);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validateTags(tags) {
        const errors = [];
        if (tags.length > 50) {
            errors.push('Trop de tags sélectionnés (max 50)');
        }
        for (const tag of tags) {
            if (tag.length > 50) {
                errors.push(`Tag trop long: ${tag} (max 50 caractères)`);
            }
            if (this.containsSuspiciousPatterns(tag)) {
                errors.push(`Tag contient des caractères non autorisés: ${tag}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    validateDateRange(dateRange) {
        const errors = [];
        if (dateRange.from && dateRange.to) {
            if (dateRange.from > dateRange.to) {
                errors.push('La date de début ne peut pas être postérieure à la date de fin');
            }
        }
        const now = new Date();
        const maxPastDate = new Date(now.getFullYear() - 50, 0, 1);
        const maxFutureDate = new Date(now.getFullYear() + 10, 11, 31);
        if (dateRange.from && dateRange.from < maxPastDate) {
            errors.push('La date de début est trop ancienne');
        }
        if (dateRange.to && dateRange.to > maxFutureDate) {
            errors.push('La date de fin est trop future');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    sanitizeSearchParams(params) {
        const sanitized = { ...params };
        if (sanitized.query) {
            sanitized.query = this.sanitizeString(sanitized.query);
        }
        if (sanitized.filters) {
            if (sanitized.filters.city) {
                sanitized.filters.city = this.sanitizeString(sanitized.filters.city);
            }
            if (sanitized.filters.region) {
                sanitized.filters.region = this.sanitizeString(sanitized.filters.region);
            }
            if (sanitized.filters.country) {
                sanitized.filters.country = this.sanitizeString(sanitized.filters.country);
            }
            if (sanitized.filters.tags) {
                sanitized.filters.tags = sanitized.filters.tags.map(tag => this.sanitizeString(tag));
            }
        }
        return sanitized;
    }
    sanitizeString(input) {
        let sanitized = input.trim();
        for (const char of this.dangerousChars) {
            sanitized = sanitized.replace(new RegExp(`\\${char}`, 'g'), '');
        }
        for (const pattern of this.suspiciousPatterns) {
            sanitized = sanitized.replace(pattern, '');
        }
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
        return sanitized;
    }
    containsSuspiciousPatterns(input) {
        return this.suspiciousPatterns.some(pattern => pattern.test(input));
    }
    containsDangerousChars(input) {
        return this.dangerousChars.some(char => input.includes(char));
    }
    countFilters(filters) {
        let count = 0;
        if (filters.categories)
            count += filters.categories.length;
        if (filters.resourceTypes)
            count += filters.resourceTypes.length;
        if (filters.plans)
            count += filters.plans.length;
        if (filters.tags)
            count += filters.tags.length;
        if (filters.location)
            count += 1;
        if (filters.priceRange)
            count += 1;
        if (filters.verified !== undefined)
            count += 1;
        if (filters.city)
            count += 1;
        if (filters.region)
            count += 1;
        if (filters.country)
            count += 1;
        if (filters.dateRange)
            count += 1;
        return count;
    }
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    async validateAndThrow(params, options = {}) {
        const validation = await this.validateSearchParams(params, options);
        if (!validation.isValid) {
            throw new common_1.BadRequestException({
                message: 'Paramètres de recherche invalides',
                errors: validation.errors,
                warnings: validation.warnings
            });
        }
        return validation.sanitizedParams;
    }
};
exports.SearchValidationService = SearchValidationService;
exports.SearchValidationService = SearchValidationService = SearchValidationService_1 = __decorate([
    (0, common_1.Injectable)()
], SearchValidationService);
//# sourceMappingURL=search-validation.service.js.map