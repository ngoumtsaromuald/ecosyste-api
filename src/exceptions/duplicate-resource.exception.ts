import { ConflictException } from '@nestjs/common';

/**
 * Exception thrown when trying to create a resource that already exists
 */
export class DuplicateResourceException extends ConflictException {
  constructor(resourceType: string, field: string, value: string) {
    super({
      message: `${resourceType} with ${field} '${value}' already exists`,
      code: 'DUPLICATE_RESOURCE',
      resourceType,
      field,
      value,
    });
  }

  static apiResourceSlug(slug: string): DuplicateResourceException {
    return new DuplicateResourceException('API Resource', 'slug', slug);
  }

  static categorySlug(slug: string): DuplicateResourceException {
    return new DuplicateResourceException('Category', 'slug', slug);
  }

  static userEmail(email: string): DuplicateResourceException {
    return new DuplicateResourceException('User', 'email', email);
  }
}