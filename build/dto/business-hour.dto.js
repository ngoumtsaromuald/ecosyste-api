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
exports.BusinessHourDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class BusinessHourDto {
    constructor() {
        this.isClosed = false;
    }
}
exports.BusinessHourDto = BusinessHourDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)',
        example: 1,
        minimum: 0,
        maximum: 6
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], BusinessHourDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Opening time in HH:MM format',
        example: '08:00',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Open time must be in HH:MM format'
    }),
    __metadata("design:type", String)
], BusinessHourDto.prototype, "openTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Closing time in HH:MM format',
        example: '18:00',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Close time must be in HH:MM format'
    }),
    __metadata("design:type", String)
], BusinessHourDto.prototype, "closeTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the business is closed on this day',
        example: false,
        default: false
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BusinessHourDto.prototype, "isClosed", void 0);
//# sourceMappingURL=business-hour.dto.js.map