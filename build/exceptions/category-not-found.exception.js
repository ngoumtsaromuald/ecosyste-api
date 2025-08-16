"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class CategoryNotFoundException extends common_1.NotFoundException {
    constructor(id) {
        super(`Category with ID ${id} not found`);
    }
    static bySlug(slug) {
        const exception = new CategoryNotFoundException(slug);
        exception.message = `Category with slug '${slug}' not found`;
        return exception;
    }
}
exports.CategoryNotFoundException = CategoryNotFoundException;
//# sourceMappingURL=category-not-found.exception.js.map