"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResourceNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class ApiResourceNotFoundException extends common_1.NotFoundException {
    constructor(id) {
        super(`API Resource with ID ${id} not found`);
    }
    static bySlug(slug) {
        const exception = new ApiResourceNotFoundException(slug);
        exception.message = `API Resource with slug '${slug}' not found`;
        return exception;
    }
}
exports.ApiResourceNotFoundException = ApiResourceNotFoundException;
//# sourceMappingURL=api-resource-not-found.exception.js.map