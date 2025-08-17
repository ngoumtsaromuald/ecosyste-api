"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyValidationResult = exports.ApiKeyListResponseDto = exports.ApiKeyResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ApiKeyResponseDto {
}
exports.ApiKeyResponseDto = ApiKeyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key name',
        example: 'My App API Key'
    }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key prefix (first 8 characters)',
        example: 'rk_abc123'
    }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "keyPrefix", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Full API key value (only shown once during creation)',
        example: 'rk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
        required: false
    }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "keyValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of permissions for this API key',
        example: ['read:resources', 'write:resources'],
        type: [String]
    }),
    __metadata("design:type", Array)
], ApiKeyResponseDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rate limit per hour for this API key',
        example: 1000
    }),
    __metadata("design:type", Number)
], ApiKeyResponseDto.prototype, "rateLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the API key is active',
        example: true
    }),
    __metadata("design:type", Boolean)
], ApiKeyResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last time the API key was used',
        example: '2024-01-15T10:30:00.000Z',
        required: false
    }),
    __metadata("design:type", Date)
], ApiKeyResponseDto.prototype, "lastUsedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key expiration date',
        example: '2024-12-31T23:59:59.000Z',
        required: false
    }),
    __metadata("design:type", Date)
], ApiKeyResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key creation date',
        example: '2024-01-01T00:00:00.000Z'
    }),
    __metadata("design:type", Date)
], ApiKeyResponseDto.prototype, "createdAt", void 0);
class ApiKeyListResponseDto {
}
exports.ApiKeyListResponseDto = ApiKeyListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    __metadata("design:type", String)
], ApiKeyListResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key name',
        example: 'My App API Key'
    }),
    __metadata("design:type", String)
], ApiKeyListResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key prefix (first 8 characters)',
        example: 'rk_abc123'
    }),
    __metadata("design:type", String)
], ApiKeyListResponseDto.prototype, "keyPrefix", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of permissions for this API key',
        example: ['read:resources', 'write:resources'],
        type: [String]
    }),
    __metadata("design:type", Array)
], ApiKeyListResponseDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rate limit per hour for this API key',
        example: 1000
    }),
    __metadata("design:type", Number)
], ApiKeyListResponseDto.prototype, "rateLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the API key is active',
        example: true
    }),
    __metadata("design:type", Boolean)
], ApiKeyListResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last time the API key was used',
        example: '2024-01-15T10:30:00.000Z',
        required: false
    }),
    __metadata("design:type", Date)
], ApiKeyListResponseDto.prototype, "lastUsedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key expiration date',
        example: '2024-12-31T23:59:59.000Z',
        required: false
    }),
    __metadata("design:type", Date)
], ApiKeyListResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key creation date',
        example: '2024-01-01T00:00:00.000Z'
    }),
    __metadata("design:type", Date)
], ApiKeyListResponseDto.prototype, "createdAt", void 0);
class ApiKeyValidationResult {
}
exports.ApiKeyValidationResult = ApiKeyValidationResult;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The validated API key',
    }),
    __metadata("design:type", Object)
], ApiKeyValidationResult.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The user who owns this API key',
    }),
    __metadata("design:type", Object)
], ApiKeyValidationResult.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Remaining rate limit for this period',
        example: 950
    }),
    __metadata("design:type", Number)
], ApiKeyValidationResult.prototype, "rateLimitRemaining", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'When the rate limit resets',
        example: '2024-01-15T11:00:00.000Z'
    }),
    __metadata("design:type", Date)
], ApiKeyValidationResult.prototype, "rateLimitReset", void 0);
//# sourceMappingURL=api-key-response.dto.js.map