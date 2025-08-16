"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isApiResponse = isApiResponse;
exports.isApiErrorResponse = isApiErrorResponse;
exports.isPaginatedResponse = isPaginatedResponse;
function isApiResponse(obj) {
    return typeof obj === 'object' && obj !== null && 'success' in obj && 'data' in obj && 'timestamp' in obj;
}
function isApiErrorResponse(obj) {
    return typeof obj === 'object' && obj !== null && obj.success === false && 'error' in obj;
}
function isPaginatedResponse(obj) {
    return isApiResponse(obj) && 'meta' in obj && typeof obj.meta === 'object';
}
//# sourceMappingURL=api-utils.js.map