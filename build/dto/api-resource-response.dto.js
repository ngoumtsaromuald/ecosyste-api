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
exports.ApiResourceResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../domain/enums");
const address_dto_1 = require("./address.dto");
const contact_dto_1 = require("./contact.dto");
const seo_data_dto_1 = require("./seo-data.dto");
const business_hour_dto_1 = require("./business-hour.dto");
const resource_image_dto_1 = require("./resource-image.dto");
const category_response_dto_1 = require("./category-response.dto");
class ApiResourceResponseDto {
}
exports.ApiResourceResponseDto = ApiResourceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    __metadata("design:type", String)
], ApiResourceResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID who owns this resource',
        example: '456e7890-e89b-12d3-a456-426614174000'
    }),
    __metadata("design:type", String)
], ApiResourceResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource name',
        example: 'Restaurant Le Palais'
    }),
    __metadata("design:type", String)
], ApiResourceResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource slug',
        example: 'restaurant-le-palais'
    }),
    __metadata("design:type", String)
], ApiResourceResponseDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource description',
        example: 'Authentic Cameroonian cuisine in the heart of Yaoundé',
        required: false
    }),
    __metadata("design:type", String)
], ApiResourceResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of resource',
        enum: enums_1.ResourceType,
        example: enums_1.ResourceType.BUSINESS
    }),
    __metadata("design:type", String)
], ApiResourceResponseDto.prototype, "resourceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    __metadata("design:type", String)
], ApiResourceResponseDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category information',
        type: category_response_dto_1.CategoryResponseDto
    }),
    __metadata("design:type", category_response_dto_1.CategoryResponseDto)
], ApiResourceResponseDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Address information',
        type: address_dto_1.AddressDto,
        required: false
    }),
    __metadata("design:type", address_dto_1.AddressDto)
], ApiResourceResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Contact information',
        type: contact_dto_1.ContactDto,
        required: false
    }),
    __metadata("design:type", contact_dto_1.ContactDto)
], ApiResourceResponseDto.prototype, "contact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource status',
        enum: enums_1.ResourceStatus,
        example: enums_1.ResourceStatus.ACTIVE
    }),
    __metadata("design:type", String)
], ApiResourceResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource plan',
        enum: enums_1.ResourcePlan,
        example: enums_1.ResourcePlan.FREE
    }),
    __metadata("design:type", String)
], ApiResourceResponseDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the resource is verified',
        example: false
    }),
    __metadata("design:type", Boolean)
], ApiResourceResponseDto.prototype, "verified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SEO metadata',
        type: seo_data_dto_1.SeoDataDto,
        required: false
    }),
    __metadata("design:type", seo_data_dto_1.SeoDataDto)
], ApiResourceResponseDto.prototype, "seo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Business hours',
        type: [business_hour_dto_1.BusinessHourDto]
    }),
    __metadata("design:type", Array)
], ApiResourceResponseDto.prototype, "businessHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource images',
        type: [resource_image_dto_1.ResourceImageDto]
    }),
    __metadata("design:type", Array)
], ApiResourceResponseDto.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Creation timestamp',
        example: '2024-01-15T10:30:00Z'
    }),
    __metadata("design:type", Date)
], ApiResourceResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last update timestamp',
        example: '2024-01-15T10:30:00Z'
    }),
    __metadata("design:type", Date)
], ApiResourceResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Publication timestamp',
        example: '2024-01-15T10:30:00Z',
        required: false
    }),
    __metadata("design:type", Date)
], ApiResourceResponseDto.prototype, "publishedAt", void 0);
//# sourceMappingURL=api-resource-response.dto.js.map