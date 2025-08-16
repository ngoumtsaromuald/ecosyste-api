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
exports.CreateResourceImageDto = exports.ResourceImageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ResourceImageDto {
    constructor() {
        this.isPrimary = false;
        this.orderIndex = 0;
    }
}
exports.ResourceImageDto = ResourceImageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Image ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResourceImageDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Image URL',
        example: 'https://example.com/images/restaurant.jpg'
    }),
    (0, class_validator_1.IsUrl)({}, { message: 'URL must be a valid URL' }),
    __metadata("design:type", String)
], ResourceImageDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Alternative text for accessibility',
        example: 'Restaurant interior with modern decor',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], ResourceImageDto.prototype, "altText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether this is the primary image',
        example: true,
        default: false
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResourceImageDto.prototype, "isPrimary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Display order index',
        example: 0,
        default: 0
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ResourceImageDto.prototype, "orderIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Creation timestamp',
        example: '2024-01-15T10:30:00Z'
    }),
    __metadata("design:type", Date)
], ResourceImageDto.prototype, "createdAt", void 0);
class CreateResourceImageDto {
    constructor() {
        this.isPrimary = false;
        this.orderIndex = 0;
    }
}
exports.CreateResourceImageDto = CreateResourceImageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Image URL',
        example: 'https://example.com/images/restaurant.jpg'
    }),
    (0, class_validator_1.IsUrl)({}, { message: 'URL must be a valid URL' }),
    __metadata("design:type", String)
], CreateResourceImageDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Alternative text for accessibility',
        example: 'Restaurant interior with modern decor',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateResourceImageDto.prototype, "altText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether this is the primary image',
        example: true,
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateResourceImageDto.prototype, "isPrimary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Display order index',
        example: 0,
        default: 0
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateResourceImageDto.prototype, "orderIndex", void 0);
//# sourceMappingURL=resource-image.dto.js.map