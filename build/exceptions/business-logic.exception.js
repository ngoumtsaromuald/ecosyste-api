"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessLogicException = void 0;
const common_1 = require("@nestjs/common");
class BusinessLogicException extends common_1.BadRequestException {
    constructor(message, code) {
        super({
            message,
            code: code || 'BUSINESS_LOGIC_ERROR',
        });
    }
    static insufficientPermissions(action) {
        return new BusinessLogicException(`Insufficient permissions to perform action: ${action}`, 'INSUFFICIENT_PERMISSIONS');
    }
    static resourceNotPublished(resourceId) {
        return new BusinessLogicException(`Resource ${resourceId} is not published and cannot be accessed`, 'RESOURCE_NOT_PUBLISHED');
    }
    static invalidResourceStatus(currentStatus, targetStatus) {
        return new BusinessLogicException(`Cannot change resource status from ${currentStatus} to ${targetStatus}`, 'INVALID_STATUS_TRANSITION');
    }
    static quotaExceeded(quotaType, limit) {
        return new BusinessLogicException(`${quotaType} quota exceeded. Limit: ${limit}`, 'QUOTA_EXCEEDED');
    }
}
exports.BusinessLogicException = BusinessLogicException;
//# sourceMappingURL=business-logic.exception.js.map