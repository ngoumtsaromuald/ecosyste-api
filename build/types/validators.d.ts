import type { ApiSchemas } from './api-utils';
export declare class TypeValidators {
    static isResourceType(value: any): value is ApiSchemas['ResourceTypeDto']['value'];
    static isResourceStatus(value: any): value is ApiSchemas['ResourceStatusDto']['value'];
    static isResourcePlan(value: any): value is ApiSchemas['ResourcePlanDto']['value'];
    static isUserType(value: any): value is ApiSchemas['UserTypeDto']['value'];
    static isPlan(value: any): value is ApiSchemas['PlanDto']['value'];
    static isPricingTier(value: any): value is ApiSchemas['PricingTierDto']['value'];
    static isUUID(value: any): value is string;
    static isEmail(value: any): value is string;
    static isUrl(value: any): value is string;
    static isPhoneNumber(value: any): value is string;
    static isSlug(value: any): value is string;
    static isLatitude(value: any): value is number;
    static isLongitude(value: any): value is number;
    static isPostalCode(value: any): value is string;
    static isCountryCode(value: any): value is string;
}
export declare const validateApiResource: (data: any) => data is ApiSchemas["ApiResourceResponseDto"];
export declare const validateCategory: (data: any) => data is ApiSchemas["CategoryResponseDto"];
export declare const validateCreateApiResourceRequest: (data: any) => data is ApiSchemas["CreateApiResourceDto"];
export declare const validateCreateCategoryRequest: (data: any) => data is ApiSchemas["CreateCategoryDto"];
export declare const validateApiError: (data: any) => boolean;
