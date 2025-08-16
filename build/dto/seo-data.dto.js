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
exports.SeoDataDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SeoDataDto {
}
exports.SeoDataDto = SeoDataDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Meta title for SEO (recommended: 10-60 characters)',
        example: 'Best Restaurant in Yaoundé - ROMAPI',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 60, {
        message: 'Meta title should be between 10 and 60 characters for optimal SEO'
    }),
    __metadata("design:type", String)
], SeoDataDto.prototype, "metaTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Meta description for SEO (recommended: 50-160 characters)',
        example: 'Discover the best restaurant in Yaoundé with authentic local cuisine and excellent service.',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(50, 160, {
        message: 'Meta description should be between 50 and 160 characters for optimal SEO'
    }),
    __metadata("design:type", String)
], SeoDataDto.prototype, "metaDescription", void 0);
//# sourceMappingURL=seo-data.dto.js.map