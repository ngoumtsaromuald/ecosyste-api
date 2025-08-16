"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class UserNotFoundException extends common_1.NotFoundException {
    constructor(id) {
        super(`User with ID ${id} not found`);
    }
    static byEmail(email) {
        const exception = new UserNotFoundException(email);
        exception.message = `User with email '${email}' not found`;
        return exception;
    }
}
exports.UserNotFoundException = UserNotFoundException;
//# sourceMappingURL=user-not-found.exception.js.map