"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResourceValidationException = void 0;
const common_1 = require("@nestjs/common");
class ApiResourceValidationException extends common_1.BadRequestException {
    constructor(errors) {
        const messages = errors.map(error => Object.values(error.constraints || {}).join(', ')).join('; ');
        super({
            message: `Validation failed: ${messages}`,
            code: 'VALIDATION_ERROR',
            errors: errors.map(error => ({
                property: error.property,
                value: error.value,
                constraints: error.constraints,
            })),
        });
    }
    static fromMessage(message) {
        const exception = new ApiResourceValidationException([]);
        exception.message = `Validation failed: ${message}`;
        return exception;
    }
}
exports.ApiResourceValidationException = ApiResourceValidationException;
//# sourceMappingURL=api-resource-validation.exception.js.map