import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { CreateApiResourceDto } from '../dto/create-api-resource.dto';
import { ApiResourceRepository } from '../repositories/api-resource.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { UserRepository } from '../repositories/user.repository';
export declare class ApiResourceValidationException extends BadRequestException {
    constructor(errors: ValidationError[]);
}
export declare class BusinessRuleValidationException extends BadRequestException {
    constructor(message: string);
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare class ValidationService {
    private readonly apiResourceRepository;
    private readonly categoryRepository;
    private readonly userRepository;
    constructor(apiResourceRepository: ApiResourceRepository, categoryRepository: CategoryRepository, userRepository: UserRepository);
    validateCreateApiResourceDto(dto: CreateApiResourceDto, userId?: string): Promise<ValidationResult>;
    private validateBusinessRules;
    private validateAddress;
    private validateBusinessHours;
    private validateImages;
    private generateSlug;
    private isValidTimeFormat;
    validateSlugFormat(slug: string): boolean;
    validateUpdateApiResourceDto(dto: Partial<CreateApiResourceDto>, resourceId: string, userId?: string): Promise<ValidationResult>;
    validateCreateApiResourceDtoOrThrow(dto: CreateApiResourceDto, userId?: string): Promise<void>;
    validateUpdateApiResourceDtoOrThrow(dto: Partial<CreateApiResourceDto>, resourceId: string, userId?: string): Promise<void>;
}
