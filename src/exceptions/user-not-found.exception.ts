import { NotFoundException } from '@nestjs/common';

/**
 * Exception thrown when a user is not found
 */
export class UserNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`User with ID ${id} not found`);
  }

  static byEmail(email: string): UserNotFoundException {
    const exception = new UserNotFoundException(email);
    exception.message = `User with email '${email}' not found`;
    return exception;
  }
}