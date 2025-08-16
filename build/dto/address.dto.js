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
exports.AddressDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class AddressDto {
    constructor() {
        this.country = 'CM';
    }
}
exports.AddressDto = AddressDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Primary address line',
        example: '123 Main Street',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], AddressDto.prototype, "addressLine1", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Secondary address line (apartment, suite, etc.)',
        example: 'Apt 4B',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], AddressDto.prototype, "addressLine2", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'City name',
        example: 'Yaoundé',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], AddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Region or state',
        example: 'Centre',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], AddressDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Postal code',
        example: '00237',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 20),
    __metadata("design:type", String)
], AddressDto.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Country code (ISO 3166-1 alpha-2)',
        example: 'CM',
        default: 'CM'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2),
    (0, class_validator_1.Matches)(/^[A-Z]{2}$/, { message: 'Country must be a 2-letter ISO code in uppercase' }),
    __metadata("design:type", String)
], AddressDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Latitude coordinate',
        example: 3.848,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], AddressDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Longitude coordinate',
        example: 11.502,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], AddressDto.prototype, "longitude", void 0);
//# sourceMappingURL=address.dto.js.map