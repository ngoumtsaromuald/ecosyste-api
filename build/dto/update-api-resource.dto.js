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
exports.UpdateApiResourceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const create_api_resource_dto_1 = require("./create-api-resource.dto");
const enums_1 = require("../domain/enums");
class UpdateApiResourceDto extends (0, swagger_1.PartialType)(create_api_resource_dto_1.CreateApiResourceDto) {
}
exports.UpdateApiResourceDto = UpdateApiResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource slug',
        example: 'restaurant-le-palais',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateApiResourceDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource status',
        enum: enums_1.ResourceStatus,
        example: enums_1.ResourceStatus.ACTIVE,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ResourceStatus),
    __metadata("design:type", String)
], UpdateApiResourceDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resource plan',
        enum: enums_1.ResourcePlan,
        example: enums_1.ResourcePlan.PREMIUM,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ResourcePlan),
    __metadata("design:type", String)
], UpdateApiResourceDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the resource is verified',
        example: true,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateApiResourceDto.prototype, "verified", void 0);
//# sourceMappingURL=update-api-resource.dto.js.map