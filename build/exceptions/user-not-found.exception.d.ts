import { NotFoundException } from '@nestjs/common';
export declare class UserNotFoundException extends NotFoundException {
    constructor(id: string);
    static byEmail(email: string): UserNotFoundException;
}
