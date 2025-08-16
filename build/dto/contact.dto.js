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
exports.ContactDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ContactDto {
}
exports.ContactDto = ContactDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Phone number',
        example: '+237123456789',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[\+]?[1-9][\d\s\-\(\)]{0,20}$/, {
        message: 'Phone number must be a valid format'
    }),
    __metadata("design:type", String)
], ContactDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email address',
        example: 'contact@example.com',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Email must be a valid email address' }),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], ContactDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Website URL',
        example: 'https://www.example.com',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'Website must be a valid URL' }),
    (0, class_validator_1.Length)(1, 500),
    __metadata("design:type", String)
], ContactDto.prototype, "website", void 0);
//# sourceMappingURL=contact.dto.js.map