import { NotFoundException } from '@nestjs/common';

/**
 * Exception thrown when a category is not found
 */
export class CategoryNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Category with ID ${id} not found`);
  }

  static bySlug(slug: string): CategoryNotFoundException {
    const exception = new CategoryNotFoundException(slug);
    exception.message = `Category with slug '${slug}' not found`;
    return exception;
  }
}