"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiError = exports.validateCreateCategoryRequest = exports.validateCreateApiResourceRequest = exports.validateCategory = exports.validateApiResource = exports.TypeValidators = void 0;
class TypeValidators {
    static isResourceType(value) {
        return ['BUSINESS', 'SERVICE', 'DATA', 'API'].includes(value);
    }
    static isResourceStatus(value) {
        return ['ACTIVE', 'PENDING', 'SUSPENDED'].includes(value);
    }
    static isResourcePlan(value) {
        return ['FREE', 'PREMIUM', 'FEATURED'].includes(value);
    }
    static isUserType(value) {
        return ['INDIVIDUAL', 'BUSINESS', 'ADMIN'].includes(value);
    }
    static isPlan(value) {
        return ['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE'].includes(value);
    }
    static isPricingTier(value) {
        return ['STANDARD', 'BUSINESS', 'ENTERPRISE'].includes(value);
    }
    static isUUID(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof value === 'string' && uuidRegex.test(value);
    }
    static isEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof value === 'string' && emailRegex.test(value);
    }
    static isUrl(value) {
        try {
            new URL(value);
            return true;
        }
        catch {
            return false;
        }
    }
    static isPhoneNumber(value) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return typeof value === 'string' && phoneRegex.test(value.replace(/[\s-()]/g, ''));
    }
    static isSlug(value) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        return typeof value === 'string' && slugRegex.test(value);
    }
    static isLatitude(value) {
        return typeof value === 'number' && value >= -90 && value <= 90;
    }
    static isLongitude(value) {
        return typeof value === 'number' && value >= -180 && value <= 180;
    }
    static isPostalCode(value) {
        const postalCodeRegex = /^[A-Z0-9\s-]{3,10}$/i;
        return typeof value === 'string' && postalCodeRegex.test(value);
    }
    static isCountryCode(value) {
        const countryCodeRegex = /^[A-Z]{2}$/;
        return typeof value === 'string' && countryCodeRegex.test(value);
    }
}
exports.TypeValidators = TypeValidators;
const validateApiResource = (data) => {
    return (typeof data === 'object' &&
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
        data.updatedAt instanceof Date);
};
exports.validateApiResource = validateApiResource;
const validateCategory = (data) => {
    return (typeof data === 'object' &&
        data !== null &&
        TypeValidators.isUUID(data.id) &&
        typeof data.name === 'string' &&
        TypeValidators.isSlug(data.slug) &&
        data.createdAt instanceof Date);
};
exports.validateCategory = validateCategory;
const validateCreateApiResourceRequest = (data) => {
    return (typeof data === 'object' &&
        data !== null &&
        typeof data.name === 'string' &&
        data.name.length > 0 &&
        TypeValidators.isResourceType(data.resourceType) &&
        TypeValidators.isUUID(data.categoryId));
};
exports.validateCreateApiResourceRequest = validateCreateApiResourceRequest;
const validateCreateCategoryRequest = (data) => {
    return (typeof data === 'object' &&
        data !== null &&
        typeof data.name === 'string' &&
        data.name.length > 0 &&
        (!data.parentId || TypeValidators.isUUID(data.parentId)));
};
exports.validateCreateCategoryRequest = validateCreateCategoryRequest;
const validateApiError = (data) => {
    return (typeof data === 'object' &&
        data !== null &&
        data.success === false &&
        typeof data.error === 'object' &&
        typeof data.error.code === 'string' &&
        typeof data.error.message === 'string' &&
        typeof data.error.timestamp === 'string' &&
        typeof data.error.path === 'string' &&
        typeof data.error.method === 'string');
};
exports.validateApiError = validateApiError;
//# sourceMappingURL=validators.js.map