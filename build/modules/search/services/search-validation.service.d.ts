import { SearchParams } from '../interfaces/search.interfaces';
import { ResourceType, ResourcePlan } from '@prisma/client';
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
    sanitizedParams?: SearchParams;
}
export interface ValidationOptions {
    maxQueryLength?: number;
    maxFiltersCount?: number;
    allowedResourceTypes?: ResourceType[];
    allowedPlans?: ResourcePlan[];
    maxPriceRange?: number;
    maxGeoRadius?: number;
    strictMode?: boolean;
}
export declare class SearchValidationService {
    private readonly logger;
    private readonly defaultOptions;
    private readonly suspiciousPatterns;
    private readonly dangerousChars;
    validateSearchParams(params: SearchParams, options?: ValidationOptions): Promise<ValidationResult>;
    private validateQuery;
    private validateFilters;
    private validatePagination;
    private validateFacets;
    private validateLanguage;
    private validateCategories;
    private validateResourceTypes;
    private validatePlans;
    private validatePriceRange;
    private validateGeoFilter;
    private validateTextFilter;
    private validateTags;
    private validateDateRange;
    private sanitizeSearchParams;
    private sanitizeString;
    private containsSuspiciousPatterns;
    private containsDangerousChars;
    private countFilters;
    private isValidUUID;
    validateAndThrow(params: SearchParams, options?: ValidationOptions): Promise<SearchParams>;
}
