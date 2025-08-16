"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceImageMapper = void 0;
const dto_1 = require("../dto");
class ResourceImageMapper {
    static toDto(data) {
        const dto = new dto_1.ResourceImageDto();
        dto.id = data.id;
        dto.url = data.url;
        dto.altText = data.altText;
        dto.isPrimary = data.isPrimary;
        dto.orderIndex = data.orderIndex;
        dto.createdAt = data.createdAt;
        return dto;
    }
    static fromCreateDto(dto, resourceId) {
        return {
            resourceId,
            url: dto.url,
            altText: dto.altText || null,
            isPrimary: dto.isPrimary || false,
            orderIndex: dto.orderIndex || 0,
        };
    }
    static toDtoArray(images) {
        return images
            .sort((a, b) => {
            if (a.isPrimary && !b.isPrimary)
                return -1;
            if (!a.isPrimary && b.isPrimary)
                return 1;
            return a.orderIndex - b.orderIndex;
        })
            .map(image => this.toDto(image));
    }
    static fromCreateDtoArray(dtos, resourceId) {
        return dtos.map(dto => this.fromCreateDto(dto, resourceId));
    }
}
exports.ResourceImageMapper = ResourceImageMapper;
//# sourceMappingURL=resource-image.mapper.js.map