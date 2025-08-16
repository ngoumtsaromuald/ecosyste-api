"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateResourceException = void 0;
const common_1 = require("@nestjs/common");
class DuplicateResourceException extends common_1.ConflictException {
    constructor(resourceType, field, value) {
        super({
            message: `${resourceType} with ${field} '${value}' already exists`,
            code: 'DUPLICATE_RESOURCE',
            resourceType,
            field,
            value,
        });
    }
    static apiResourceSlug(slug) {
        return new DuplicateResourceException('API Resource', 'slug', slug);
    }
    static categorySlug(slug) {
        return new DuplicateResourceException('Category', 'slug', slug);
    }
    static userEmail(email) {
        return new DuplicateResourceException('User', 'email', email);
    }
}
exports.DuplicateResourceException = DuplicateResourceException;
//# sourceMappingURL=duplicate-resource.exception.js.map