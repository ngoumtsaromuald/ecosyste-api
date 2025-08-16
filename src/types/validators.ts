/**
 * Type validators for ROMAPI Backend Core
 * Generated automatically - do not edit manually
 */

import type { ApiSchemas } from './api-utils';

// Runtime type validation helpers
export class TypeValidators {
  static isResourceType(value: any): value is ApiSchemas['ResourceTypeDto']['value'] {
    return ['BUSINESS', 'SERVICE', 'DATA', 'API'].includes(value);
  }

  static isResourceStatus(value: any): value is ApiSchemas['ResourceStatusDto']['value'] {
    return ['ACTIVE', 'PENDING', 'SUSPENDED'].includes(value);
  }

  static isResourcePlan(value: any): value is ApiSchemas['ResourcePlanDto']['value'] {
    return ['FREE', 'PREMIUM', 'FEATURED'].includes(value);
  }

  static isUserType(value: any): value is ApiSchemas['UserTypeDto']['value'] {
    return ['INDIVIDUAL', 'BUSINESS', 'ADMIN'].includes(value);
  }

  static isPlan(value: any): value is ApiSchemas['PlanDto']['value'] {
    return ['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE'].includes(value);
  }

  static isPricingTier(value: any): value is ApiSchemas['PricingTierDto']['value'] {
    return ['STANDARD', 'BUSINESS', 'ENTERPRISE'].includes(value);
  }

  static isUUID(value: any): value is string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof value === 'string' && uuidRegex.test(value);
  }

  static isEmail(value: any): value is string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof value === 'string' && emailRegex.test(value);
  }

  static isUrl(value: any): value is string {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  static isPhoneNumber(value: any): value is string {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return typeof value === 'string' && phoneRegex.test(value.replace(/[\s-()]/g, ''));
  }

  static isSlug(value: any): value is string {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return typeof value === 'string' && slugRegex.test(value);
  }

  static isLatitude(value: any): value is number {
    return typeof value === 'number' && value >= -90 && value <= 90;
  }

  static isLongitude(value: any): value is number {
    return typeof value === 'number' && value >= -180 && value <= 180;
  }

  static isPostalCode(value: any): value is string {
    // Basic postal code validation (can be extended for specific countries)
    const postalCodeRegex = /^[A-Z0-9\s-]{3,10}$/i;
    return typeof value === 'string' && postalCodeRegex.test(value);
  }

  static isCountryCode(value: any): value is string {
    // ISO 3166-1 alpha-2 country codes
    const countryCodeRegex = /^[A-Z]{2}$/;
    return typeof value === 'string' && countryCodeRegex.test(value);
  }
}

// Schema validation functions
export const validateApiResource = (data: any): data is ApiSchemas['ApiResourceResponseDto'] => {
  return (
    typeof data === 'object' &&
    data !== null &&
    TypeValidators.isUUID(data.id) &&
    typeof data.name === 'string' &&
    TypeValidators.isSlug(data.slug) &&
    TypeValidators.isResourceType(data.resourceType) &&
    TypeValidators.isUUID(data.categoryId) &&
    TypeValidators.isResourceStatus(data.status) &&
    TypeValidators.isResourcePlan(data.plan) &&
    typeof data.verified === 'boolean' &&
    data.createdAt instanceof Date &&
    data.updatedAt instanceof Date
  );
};

export const validateCategory = (data: any): data is ApiSchemas['CategoryResponseDto'] => {
  return (
    typeof data === 'object' &&
    data !== null &&
    TypeValidators.isUUID(data.id) &&
    typeof data.name === 'string' &&
    TypeValidators.isSlug(data.slug) &&
    data.createdAt instanceof Date
  );
};

export const validateCreateApiResourceRequest = (data: any): data is ApiSchemas['CreateApiResourceDto'] => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    TypeValidators.isResourceType(data.resourceType) &&
    TypeValidators.isUUID(data.categoryId)
  );
};

export const validateCreateCategoryRequest = (data: any): data is ApiSchemas['CreateCategoryDto'] => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    (!data.parentId || TypeValidators.isUUID(data.parentId))
  );
};

// Error validation - using boolean return since ApiErrorResponse is not in schemas
export const validateApiError = (data: any): boolean => {
  return (
    typeof data === 'object' &&
    data !== null &&
    data.success === false &&
    typeof data.error === 'object' &&
    typeof data.error.code === 'string' &&
    typeof data.error.message === 'string' &&
    typeof data.error.timestamp === 'string' &&
    typeof data.error.path === 'string' &&
    typeof data.error.method === 'string'
  );
};
