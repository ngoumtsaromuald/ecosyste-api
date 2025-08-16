import { ConflictException } from '@nestjs/common';
export declare class DuplicateResourceException extends ConflictException {
    constructor(resourceType: string, field: string, value: string);
    static apiResourceSlug(slug: string): DuplicateResourceException;
    static categorySlug(slug: string): DuplicateResourceException;
    static userEmail(email: string): DuplicateResourceException;
}
