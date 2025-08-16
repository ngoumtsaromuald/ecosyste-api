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
exports.CategoryResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CategoryResponseDto {
}
exports.CategoryResponseDto = CategoryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    __metadata("design:type", String)
], CategoryResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category name',
        example: 'Restaurants'
    }),
    __metadata("design:type", String)
], CategoryResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category slug',
        example: 'restaurants'
    }),
    __metadata("design:type", String)
], CategoryResponseDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category description',
        example: 'Food and dining establishments',
        required: false
    }),
    __metadata("design:type", String)
], CategoryResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category icon',
        example: 'restaurant',
        required: false
    }),
    __metadata("design:type", String)
], CategoryResponseDto.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Parent category ID',
        example: '456e7890-e89b-12d3-a456-426614174000',
        required: false
    }),
    __metadata("design:type", String)
], CategoryResponseDto.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Creation timestamp',
        example: '2024-01-15T10:30:00Z'
    }),
    __metadata("design:type", Date)
], CategoryResponseDto.prototype, "createdAt", void 0);
//# sourceMappingURL=category-response.dto.js.map