import { NotFoundException } from '@nestjs/common';
export declare class ApiResourceNotFoundException extends NotFoundException {
    constructor(id: string);
    static bySlug(slug: string): ApiResourceNotFoundException;
}
