"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryMapper = void 0;
const dto_1 = require("../dto");
class CategoryMapper {
    static toResponseDto(data) {
        const dto = new dto_1.CategoryResponseDto();
        dto.id = data.id;
        dto.name = data.name;
        dto.slug = data.slug;
        dto.description = data.description;
        dto.icon = data.icon;
        dto.parentId = data.parentId;
        dto.createdAt = data.createdAt;
        return dto;
    }
    static toResponseDtoArray(categories) {
        return categories.map(category => this.toResponseDto(category));
    }
}
exports.CategoryMapper = CategoryMapper;
//# sourceMappingURL=category.mapper.js.map