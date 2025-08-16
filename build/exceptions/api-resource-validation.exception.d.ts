import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
export declare class ApiResourceValidationException extends BadRequestException {
    constructor(errors: ValidationError[]);
    static fromMessage(message: string): ApiResourceValidationException;
}
