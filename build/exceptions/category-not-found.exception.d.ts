import { NotFoundException } from '@nestjs/common';
export declare class CategoryNotFoundException extends NotFoundException {
    constructor(id: string);
    static bySlug(slug: string): CategoryNotFoundException;
}
