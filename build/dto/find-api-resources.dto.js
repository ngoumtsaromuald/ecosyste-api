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
exports.FindApiResourcesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../domain/enums");
class FindApiResourcesDto {
    constructor() {
        this.limit = 20;
        this.offset = 0;
        this.sortOrder = 'desc';
    }
}
exports.FindApiResourcesDto = FindApiResourcesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Search query for name and description',
        example: 'restaurant',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindApiResourcesDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by resource type',
        enum: enums_1.ResourceType,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ResourceType),
    __metadata("design:type", String)
], FindApiResourcesDto.prototype, "resourceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by resource status',
        enum: enums_1.ResourceStatus,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ResourceStatus),
    __metadata("design:type", String)
], FindApiResourcesDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by resource plan',
        enum: enums_1.ResourcePlan,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ResourcePlan),
    __metadata("design:type", String)
], FindApiResourcesDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by category ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4),
    __metadata("design:type", String)
], FindApiResourcesDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by city',
        example: 'Yaoundé',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindApiResourcesDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by region',
        example: 'Centre',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindApiResourcesDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by country',
        example: 'CM',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindApiResourcesDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by verified status',
        example: true,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FindApiResourcesDto.prototype, "verified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Latitude for location-based search',
        example: 3.848,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], FindApiResourcesDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Longitude for location-based search',
        example: 11.502,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], FindApiResourcesDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Radius in kilometers for location-based search',
        example: 10,
        minimum: 1,
        maximum: 100,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], FindApiResourcesDto.prototype, "radius", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page',
        example: 20,
        minimum: 1,
        maximum: 100,
        default: 20
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], FindApiResourcesDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items to skip',
        example: 0,
        minimum: 0,
        default: 0
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], FindApiResourcesDto.prototype, "offset", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort field',
        example: 'createdAt',
        enum: ['name', 'createdAt', 'updatedAt', 'publishedAt'],
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindApiResourcesDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort order',
        example: 'desc',
        enum: ['asc', 'desc'],
        default: 'desc'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindApiResourcesDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=find-api-resources.dto.js.map