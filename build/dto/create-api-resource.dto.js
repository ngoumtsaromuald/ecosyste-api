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
exports.CreateApiResourceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../domain/enums");
const address_dto_1 = require("./address.dto");
const contact_dto_1 = require("./contact.dto");
const seo_data_dto_1 = require("./seo-data.dto");
const business_hour_dto_1 = require("./business-hour.dto");
const resource_image_dto_1 = require("./resource-image.dto");
class CreateApiResourceDto {
}
exports.CreateApiResourceDto = CreateApiResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource name - must be unique and descriptive',
        example: 'Restaurant Le Palais',
        minLength: 1,
        maxLength: 255
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateApiResourceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Detailed description of the resource - supports markdown formatting',
        example: 'Authentic Cameroonian cuisine in the heart of Yaoundé. We offer traditional dishes prepared with fresh local ingredients, creating an unforgettable dining experience.',
        required: false,
        minLength: 1,
        maxLength: 2000
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 2000),
    __metadata("design:type", String)
], CreateApiResourceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of resource',
        enum: enums_1.ResourceType,
        example: enums_1.ResourceType.BUSINESS
    }),
    (0, class_validator_1.IsEnum)(enums_1.ResourceType),
    __metadata("design:type", String)
], CreateApiResourceDto.prototype, "resourceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'Category ID must be a valid UUID' }),
    __metadata("design:type", String)
], CreateApiResourceDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Address information',
        type: address_dto_1.AddressDto,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => address_dto_1.AddressDto),
    __metadata("design:type", address_dto_1.AddressDto)
], CreateApiResourceDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Contact information',
        type: contact_dto_1.ContactDto,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => contact_dto_1.ContactDto),
    __metadata("design:type", contact_dto_1.ContactDto)
], CreateApiResourceDto.prototype, "contact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SEO metadata',
        type: seo_data_dto_1.SeoDataDto,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => seo_data_dto_1.SeoDataDto),
    __metadata("design:type", seo_data_dto_1.SeoDataDto)
], CreateApiResourceDto.prototype, "seo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Business hours',
        type: [business_hour_dto_1.BusinessHourDto],
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => business_hour_dto_1.BusinessHourDto),
    __metadata("design:type", Array)
], CreateApiResourceDto.prototype, "businessHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource images',
        type: [resource_image_dto_1.CreateResourceImageDto],
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => resource_image_dto_1.CreateResourceImageDto),
    __metadata("design:type", Array)
], CreateApiResourceDto.prototype, "images", void 0);
//# sourceMappingURL=create-api-resource.dto.js.map