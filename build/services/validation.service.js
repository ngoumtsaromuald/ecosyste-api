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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = exports.BusinessRuleValidationException = exports.ApiResourceValidationException = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const create_api_resource_dto_1 = require("../dto/create-api-resource.dto");
const api_resource_repository_1 = require("../repositories/api-resource.repository");
const category_repository_1 = require("../repositories/category.repository");
const user_repository_1 = require("../repositories/user.repository");
class ApiResourceValidationException extends common_1.BadRequestException {
    constructor(errors) {
        const messages = errors.map(error => Object.values(error.constraints || {}).join(', ')).join('; ');
        super(`Validation failed: ${messages}`);
    }
}
exports.ApiResourceValidationException = ApiResourceValidationException;
class BusinessRuleValidationException extends common_1.BadRequestException {
    constructor(message) {
        super(`Business rule validation failed: ${message}`);
    }
}
exports.BusinessRuleValidationException = BusinessRuleValidationException;
let ValidationService = class ValidationService {
    constructor(apiResourceRepository, categoryRepository, userRepository) {
        this.apiResourceRepository = apiResourceRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }
    async validateCreateApiResourceDto(dto, userId) {
        const errors = [];
        try {
            const dtoInstance = (0, class_transformer_1.plainToClass)(create_api_resource_dto_1.CreateApiResourceDto, dto);
            const validationErrors = await (0, class_validator_1.validate)(dtoInstance);
            if (validationErrors.length > 0) {
                const validationMessages = validationErrors.map(error => Object.values(error.constraints || {}).join(', '));
                errors.push(...validationMessages);
            }
            const businessRuleErrors = await this.validateBusinessRules(dto, userId);
            errors.push(...businessRuleErrors);
            if (dto.address) {
                const addressErrors = await this.validateAddress(dto.address);
                errors.push(...addressErrors);
            }
            return {
                isValid: errors.length === 0,
                errors,
            };
        }
        catch (error) {
            errors.push(`Validation error: ${error.message}`);
            return {
                isValid: false,
                errors,
            };
        }
    }
    async validateBusinessRules(dto, userId) {
        const errors = [];
        try {
            if (dto.categoryId) {
                const categoryExists = await this.categoryRepository.findById(dto.categoryId);
                if (!categoryExists) {
                    errors.push(`Category with ID ${dto.categoryId} does not exist`);
                }
            }
            if (userId) {
                const userExists = await this.userRepository.findById(userId);
                if (!userExists) {
                    errors.push(`User with ID ${userId} does not exist`);
                }
            }
            if (dto.name) {
                const slug = this.generateSlug(dto.name);
                const isSlugUnique = await this.apiResourceRepository.isSlugUnique(slug);
                if (!isSlugUnique) {
                    errors.push(`A resource with similar name already exists (slug: ${slug})`);
                }
            }
            if (dto.name) {
                const existingResource = await this.apiResourceRepository.findMany({
                    where: {
                        name: {
                            equals: dto.name,
                            mode: 'insensitive',
                        },
                    },
                    take: 1,
                });
                if (existingResource.length > 0) {
                    errors.push(`A resource with the name "${dto.name}" already exists`);
                }
            }
            if (dto.contact?.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(dto.contact.email)) {
                    errors.push('Contact email format is invalid');
                }
            }
            if (dto.contact?.website) {
                try {
                    new URL(dto.contact.website);
                }
                catch {
                    errors.push('Contact website URL format is invalid');
                }
            }
            if (dto.contact?.phone) {
                const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,20}$/;
                if (!phoneRegex.test(dto.contact.phone)) {
                    errors.push('Contact phone number format is invalid');
                }
            }
            if (dto.businessHours && dto.businessHours.length > 0) {
                const businessHourErrors = this.validateBusinessHours(dto.businessHours);
                errors.push(...businessHourErrors);
            }
            if (dto.images && dto.images.length > 0) {
                const imageErrors = this.validateImages(dto.images);
                errors.push(...imageErrors);
            }
            return errors;
        }
        catch (error) {
            errors.push(`Business rule validation error: ${error.message}`);
            return errors;
        }
    }
    async validateAddress(address) {
        const errors = [];
        try {
            if (!address.addressLine1 && !address.city) {
                errors.push('Address must include at least address line 1 or city');
            }
            if ((address.latitude && !address.longitude) || (!address.latitude && address.longitude)) {
                errors.push('Both latitude and longitude must be provided together');
            }
            if (address.latitude !== undefined) {
                if (address.latitude < -90 || address.latitude > 90) {
                    errors.push('Latitude must be between -90 and 90 degrees');
                }
            }
            if (address.longitude !== undefined) {
                if (address.longitude < -180 || address.longitude > 180) {
                    errors.push('Longitude must be between -180 and 180 degrees');
                }
            }
            if (address.country) {
                const countryRegex = /^[A-Z]{2}$/;
                if (!countryRegex.test(address.country)) {
                    errors.push('Country must be a 2-letter ISO code in uppercase');
                }
            }
            if (address.postalCode && address.country === 'CM') {
                const cameroonPostalRegex = /^\d{5}$/;
                if (!cameroonPostalRegex.test(address.postalCode)) {
                    errors.push('Postal code for Cameroon must be 5 digits');
                }
            }
            if (address.city) {
                const nameRegex = /^[a-zA-ZÀ-ÿ\s\-'\.]{1,100}$/;
                if (!nameRegex.test(address.city)) {
                    errors.push('City name contains invalid characters');
                }
            }
            if (address.region) {
                const nameRegex = /^[a-zA-ZÀ-ÿ\s\-'\.]{1,100}$/;
                if (!nameRegex.test(address.region)) {
                    errors.push('Region name contains invalid characters');
                }
            }
            return errors;
        }
        catch (error) {
            errors.push(`Address validation error: ${error.message}`);
            return errors;
        }
    }
    validateBusinessHours(businessHours) {
        const errors = [];
        try {
            for (const hour of businessHours) {
                if (hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
                    errors.push(`Invalid day of week: ${hour.dayOfWeek}. Must be 0-6 (Sunday-Saturday)`);
                }
                if (hour.openTime && !this.isValidTimeFormat(hour.openTime)) {
                    errors.push(`Invalid open time format: ${hour.openTime}. Use HH:MM format`);
                }
                if (hour.closeTime && !this.isValidTimeFormat(hour.closeTime)) {
                    errors.push(`Invalid close time format: ${hour.closeTime}. Use HH:MM format`);
                }
                if (hour.openTime && hour.closeTime && !hour.isClosed) {
                    if (hour.openTime >= hour.closeTime) {
                        errors.push(`Open time (${hour.openTime}) must be before close time (${hour.closeTime})`);
                    }
                }
                if (hour.isClosed && (hour.openTime || hour.closeTime)) {
                    errors.push('Closed days should not have open or close times');
                }
            }
            const days = businessHours.map(h => h.dayOfWeek);
            const uniqueDays = new Set(days);
            if (days.length !== uniqueDays.size) {
                errors.push('Duplicate business hours for the same day of week');
            }
            return errors;
        }
        catch (error) {
            errors.push(`Business hours validation error: ${error.message}`);
            return errors;
        }
    }
    validateImages(images) {
        const errors = [];
        try {
            if (images.length > 10) {
                errors.push('Maximum 10 images allowed per resource');
            }
            const primaryImages = images.filter(img => img.isPrimary);
            if (primaryImages.length > 1) {
                errors.push('Only one image can be marked as primary');
            }
            for (const image of images) {
                if (image.url) {
                    try {
                        new URL(image.url);
                    }
                    catch {
                        errors.push(`Invalid image URL: ${image.url}`);
                    }
                }
                if (image.altText && image.altText.length > 255) {
                    errors.push('Image alt text must be 255 characters or less');
                }
                if (image.orderIndex !== undefined && (image.orderIndex < 0 || image.orderIndex > 99)) {
                    errors.push('Image order index must be between 0 and 99');
                }
            }
            return errors;
        }
        catch (error) {
            errors.push(`Images validation error: ${error.message}`);
            return errors;
        }
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    isValidTimeFormat(time) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }
    validateSlugFormat(slug) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
    }
    async validateUpdateApiResourceDto(dto, resourceId, userId) {
        const errors = [];
        try {
            const existingResource = await this.apiResourceRepository.findById(resourceId);
            if (!existingResource) {
                errors.push(`Resource with ID ${resourceId} not found`);
                return { isValid: false, errors };
            }
            if (userId && existingResource.userId !== userId) {
                errors.push('You do not have permission to update this resource');
                return { isValid: false, errors };
            }
            if (dto.name) {
                const existingWithName = await this.apiResourceRepository.findMany({
                    where: {
                        name: { equals: dto.name, mode: 'insensitive' },
                        id: { not: resourceId },
                    },
                    take: 1,
                });
                if (existingWithName.length > 0) {
                    errors.push(`A resource with the name "${dto.name}" already exists`);
                }
                const slug = this.generateSlug(dto.name);
                const isSlugUnique = await this.apiResourceRepository.isSlugUnique(slug, resourceId);
                if (!isSlugUnique) {
                    errors.push(`A resource with similar name already exists (slug: ${slug})`);
                }
            }
            if (dto.categoryId) {
                const categoryExists = await this.categoryRepository.findById(dto.categoryId);
                if (!categoryExists) {
                    errors.push(`Category with ID ${dto.categoryId} does not exist`);
                }
            }
            if (dto.address) {
                const addressErrors = await this.validateAddress(dto.address);
                errors.push(...addressErrors);
            }
            if (dto.contact) {
                if (dto.contact.email) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(dto.contact.email)) {
                        errors.push('Contact email format is invalid');
                    }
                }
                if (dto.contact.website) {
                    try {
                        new URL(dto.contact.website);
                    }
                    catch {
                        errors.push('Contact website URL format is invalid');
                    }
                }
                if (dto.contact.phone) {
                    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,20}$/;
                    if (!phoneRegex.test(dto.contact.phone)) {
                        errors.push('Contact phone number format is invalid');
                    }
                }
            }
            return {
                isValid: errors.length === 0,
                errors,
            };
        }
        catch (error) {
            errors.push(`Update validation error: ${error.message}`);
            return {
                isValid: false,
                errors,
            };
        }
    }
    async validateCreateApiResourceDtoOrThrow(dto, userId) {
        const result = await this.validateCreateApiResourceDto(dto, userId);
        if (!result.isValid) {
            throw new BusinessRuleValidationException(result.errors.join('; '));
        }
    }
    async validateUpdateApiResourceDtoOrThrow(dto, resourceId, userId) {
        const result = await this.validateUpdateApiResourceDto(dto, resourceId, userId);
        if (!result.isValid) {
            throw new BusinessRuleValidationException(result.errors.join('; '));
        }
    }
};
exports.ValidationService = ValidationService;
exports.ValidationService = ValidationService = __decorate([
    (0, common_1.Injectable)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_resource_repository_1.ApiResourceRepository,
        category_repository_1.CategoryRepository,
        user_repository_1.UserRepository])
], ValidationService);
//# sourceMappingURL=validation.service.js.map