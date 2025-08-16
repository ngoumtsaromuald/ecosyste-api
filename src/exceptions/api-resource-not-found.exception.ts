import { NotFoundException } from '@nestjs/common';

/**
 * Exception thrown when an API resource is not found
 */
export class ApiResourceNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`API Resource with ID ${id} not found`);
  }

  static bySlug(slug: string): ApiResourceNotFoundException {
    const exception = new ApiResourceNotFoundException(slug);
    exception.message = `API Resource with slug '${slug}' not found`;
    return exception;
  }
}