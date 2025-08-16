import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

/**
 * Exception thrown when API resource validation fails
 */
export class ApiResourceValidationException extends BadRequestException {
  constructor(errors: ValidationError[]) {
    const messages = errors.map(error => 
      Object.values(error.constraints || {}).join(', ')
    ).join('; ');
    
    super({
      message: `Validation failed: ${messages}`,
      code: 'VALIDATION_ERROR',
      errors: errors.map(error => ({
        property: error.property,
        value: error.value,
        constraints: error.constraints,
      })),
    });
  }

  static fromMessage(message: string): ApiResourceValidationException {
    const exception = new ApiResourceValidationException([]);
    exception.message = `Validation failed: ${message}`;
    return exception;
  }
}