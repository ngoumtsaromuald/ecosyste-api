import { Injectable, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateApiResourceDto } from '../dto/create-api-resource.dto';
import { AddressDto } from '../dto/address.dto';
import { ApiResourceRepository } from '../repositories/api-resource.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { UserRepository } from '../repositories/user.repository';

export class ApiResourceValidationException extends BadRequestException {
  constructor(errors: ValidationError[]) {
    const messages = errors.map(error => 
      Object.values(error.constraints || {}).join(', ')
    ).join('; ');
    super(`Validation failed: ${messages}`);
  }
}

export class BusinessRuleValidationException extends BadRequestException {
  constructor(message: string) {
    super(`Business rule validation failed: ${message}`);
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
@Injectable()
export class ValidationService {
  constructor(
    private readonly apiResourceRepository: ApiResourceRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Validate CreateApiResourceDto with class-validator and business rules
   */
  async validateCreateApiResourceDto(
    dto: CreateApiResourceDto,
    userId?: string,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // 1. Class-validator validation
      const dtoInstance = plainToClass(CreateApiResourceDto, dto);
      const validationErrors = await validate(dtoInstance);

      if (validationErrors.length > 0) {
        const validationMessages = validationErrors.map(error =>
          Object.values(error.constraints || {}).join(', ')
        );
        errors.push(...validationMessages);
      }

      // 2. Business rule validations
      const businessRuleErrors = await this.validateBusinessRules(dto, userId);
      errors.push(...businessRuleErrors);

      // 3. Address validation if provided
      if (dto.address) {
        const addressErrors = await this.validateAddress(dto.address);
        errors.push(...addressErrors);
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return {
        isValid: false,
        errors,
      };
    }
  }

  /**
   * Validate business rules for API resource creation
   */
  private async validateBusinessRules(
    dto: CreateApiResourceDto,
    userId?: string,
  ): Promise<string[]> {
    const errors: string[] = [];

    try {
      // 1. Validate category exists
      if (dto.categoryId) {
        const categoryExists = await this.categoryRepository.findById(dto.categoryId);
        if (!categoryExists) {
          errors.push(`Category with ID ${dto.categoryId} does not exist`);
        }
      }

      // 2. Validate user exists (if userId provided)
      if (userId) {
        const userExists = await this.userRepository.findById(userId);
        if (!userExists) {
          errors.push(`User with ID ${userId} does not exist`);
        }
      }

      // 3. Validate slug uniqueness (generate slug from name for validation)
      if (dto.name) {
        const slug = this.generateSlug(dto.name);
        const isSlugUnique = await this.apiResourceRepository.isSlugUnique(slug);
        if (!isSlugUnique) {
          errors.push(`A resource with similar name already exists (slug: ${slug})`);
        }
      }

      // 4. Validate resource name uniqueness (case-insensitive)
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

      // 5. Validate email format if provided in contact
      if (dto.contact?.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dto.contact.email)) {
          errors.push('Contact email format is invalid');
        }
      }

      // 6. Validate website URL format if provided
      if (dto.contact?.website) {
        try {
          new URL(dto.contact.website);
        } catch {
          errors.push('Contact website URL format is invalid');
        }
      }

      // 7. Validate phone number format if provided
      if (dto.contact?.phone) {
        const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,20}$/;
        if (!phoneRegex.test(dto.contact.phone)) {
          errors.push('Contact phone number format is invalid');
        }
      }

      // 8. Validate business hours if provided
      if (dto.businessHours && dto.businessHours.length > 0) {
        const businessHourErrors = this.validateBusinessHours(dto.businessHours);
        errors.push(...businessHourErrors);
      }

      // 9. Validate images if provided
      if (dto.images && dto.images.length > 0) {
        const imageErrors = this.validateImages(dto.images);
        errors.push(...imageErrors);
      }

      return errors;
    } catch (error) {
      errors.push(`Business rule validation error: ${error.message}`);
      return errors;
    }
  }

  /**
   * Validate address data with custom business rules
   */
  private async validateAddress(address: AddressDto): Promise<string[]> {
    const errors: string[] = [];

    try {
      // 1. Validate address completeness for business resources
      if (!address.addressLine1 && !address.city) {
        errors.push('Address must include at least address line 1 or city');
      }

      // 2. Validate coordinates consistency
      if ((address.latitude && !address.longitude) || (!address.latitude && address.longitude)) {
        errors.push('Both latitude and longitude must be provided together');
      }

      // 3. Validate coordinate ranges
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

      // 4. Validate country code format
      if (address.country) {
        const countryRegex = /^[A-Z]{2}$/;
        if (!countryRegex.test(address.country)) {
          errors.push('Country must be a 2-letter ISO code in uppercase');
        }
      }

      // 5. Validate postal code format for Cameroon
      if (address.postalCode && address.country === 'CM') {
        const cameroonPostalRegex = /^\d{5}$/;
        if (!cameroonPostalRegex.test(address.postalCode)) {
          errors.push('Postal code for Cameroon must be 5 digits');
        }
      }

      // 6. Validate city and region names
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
    } catch (error) {
      errors.push(`Address validation error: ${error.message}`);
      return errors;
    }
  }

  /**
   * Validate business hours data
   */
  private validateBusinessHours(businessHours: any[]): string[] {
    const errors: string[] = [];

    try {
      // 1. Validate day of week range
      for (const hour of businessHours) {
        if (hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
          errors.push(`Invalid day of week: ${hour.dayOfWeek}. Must be 0-6 (Sunday-Saturday)`);
        }

        // 2. Validate time format
        if (hour.openTime && !this.isValidTimeFormat(hour.openTime)) {
          errors.push(`Invalid open time format: ${hour.openTime}. Use HH:MM format`);
        }

        if (hour.closeTime && !this.isValidTimeFormat(hour.closeTime)) {
          errors.push(`Invalid close time format: ${hour.closeTime}. Use HH:MM format`);
        }

        // 3. Validate time logic
        if (hour.openTime && hour.closeTime && !hour.isClosed) {
          if (hour.openTime >= hour.closeTime) {
            errors.push(`Open time (${hour.openTime}) must be before close time (${hour.closeTime})`);
          }
        }

        // 4. Validate closed day logic
        if (hour.isClosed && (hour.openTime || hour.closeTime)) {
          errors.push('Closed days should not have open or close times');
        }
      }

      // 5. Check for duplicate days
      const days = businessHours.map(h => h.dayOfWeek);
      const uniqueDays = new Set(days);
      if (days.length !== uniqueDays.size) {
        errors.push('Duplicate business hours for the same day of week');
      }

      return errors;
    } catch (error) {
      errors.push(`Business hours validation error: ${error.message}`);
      return errors;
    }
  }

  /**
   * Validate images data
   */
  private validateImages(images: any[]): string[] {
    const errors: string[] = [];

    try {
      // 1. Validate image count
      if (images.length > 10) {
        errors.push('Maximum 10 images allowed per resource');
      }

      // 2. Check for primary image logic
      const primaryImages = images.filter(img => img.isPrimary);
      if (primaryImages.length > 1) {
        errors.push('Only one image can be marked as primary');
      }

      // 3. Validate image URLs
      for (const image of images) {
        if (image.url) {
          try {
            new URL(image.url);
          } catch {
            errors.push(`Invalid image URL: ${image.url}`);
          }
        }

        // 4. Validate alt text length
        if (image.altText && image.altText.length > 255) {
          errors.push('Image alt text must be 255 characters or less');
        }

        // 5. Validate order index
        if (image.orderIndex !== undefined && (image.orderIndex < 0 || image.orderIndex > 99)) {
          errors.push('Image order index must be between 0 and 99');
        }
      }

      return errors;
    } catch (error) {
      errors.push(`Images validation error: ${error.message}`);
      return errors;
    }
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD') // Normalize accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Validate time format (HH:MM)
   */
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Validate slug format
   */
  validateSlugFormat(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
  }

  /**
   * Validate update data (for existing resources)
   */
  async validateUpdateApiResourceDto(
    dto: Partial<CreateApiResourceDto>,
    resourceId: string,
    userId?: string,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // 1. Validate resource exists and user has permission
      const existingResource = await this.apiResourceRepository.findById(resourceId);
      if (!existingResource) {
        errors.push(`Resource with ID ${resourceId} not found`);
        return { isValid: false, errors };
      }

      if (userId && existingResource.userId !== userId) {
        errors.push('You do not have permission to update this resource');
        return { isValid: false, errors };
      }

      // 2. Validate only provided fields
      if (dto.name) {
        // Check name uniqueness (excluding current resource)
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

        // Check slug uniqueness (excluding current resource)
        const slug = this.generateSlug(dto.name);
        const isSlugUnique = await this.apiResourceRepository.isSlugUnique(slug, resourceId);
        if (!isSlugUnique) {
          errors.push(`A resource with similar name already exists (slug: ${slug})`);
        }
      }

      // 3. Validate category if provided
      if (dto.categoryId) {
        const categoryExists = await this.categoryRepository.findById(dto.categoryId);
        if (!categoryExists) {
          errors.push(`Category with ID ${dto.categoryId} does not exist`);
        }
      }

      // 4. Validate address if provided
      if (dto.address) {
        const addressErrors = await this.validateAddress(dto.address);
        errors.push(...addressErrors);
      }

      // 5. Validate contact if provided
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
          } catch {
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
    } catch (error) {
      errors.push(`Update validation error: ${error.message}`);
      return {
        isValid: false,
        errors,
      };
    }
  }

  /**
   * Throw validation exception if validation fails
   */
  async validateCreateApiResourceDtoOrThrow(
    dto: CreateApiResourceDto,
    userId?: string,
  ): Promise<void> {
    const result = await this.validateCreateApiResourceDto(dto, userId);
    if (!result.isValid) {
      throw new BusinessRuleValidationException(result.errors.join('; '));
    }
  }

  /**
   * Throw validation exception if update validation fails
   */
  async validateUpdateApiResourceDtoOrThrow(
    dto: Partial<CreateApiResourceDto>,
    resourceId: string,
    userId?: string,
  ): Promise<void> {
    const result = await this.validateUpdateApiResourceDto(dto, resourceId, userId);
    if (!result.isValid) {
      throw new BusinessRuleValidationException(result.errors.join('; '));
    }
  }
}