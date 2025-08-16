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
exports.CategoryTreeResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const category_response_dto_1 = require("./category-response.dto");
class CategoryTreeResponseDto extends category_response_dto_1.CategoryResponseDto {
}
exports.CategoryTreeResponseDto = CategoryTreeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Child categories',
        type: [CategoryTreeResponseDto],
        required: false
    }),
    __metadata("design:type", Array)
], CategoryTreeResponseDto.prototype, "children", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Parent category information',
        type: category_response_dto_1.CategoryResponseDto,
        required: false
    }),
    __metadata("design:type", category_response_dto_1.CategoryResponseDto)
], CategoryTreeResponseDto.prototype, "parent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Category counts',
        example: {
            children: 5,
            apiResources: 25
        },
        required: false
    }),
    __metadata("design:type", Object)
], CategoryTreeResponseDto.prototype, "_count", void 0);
//# sourceMappingURL=category-tree-response.dto.js.map