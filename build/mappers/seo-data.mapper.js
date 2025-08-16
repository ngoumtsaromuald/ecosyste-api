"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoDataMapper = void 0;
const value_objects_1 = require("../domain/value-objects");
const dto_1 = require("../dto");
class SeoDataMapper {
    static toDto(seoData) {
        const dto = new dto_1.SeoDataDto();
        dto.metaTitle = seoData.metaTitle;
        dto.metaDescription = seoData.metaDescription;
        return dto;
    }
    static toDomain(dto) {
        return value_objects_1.SeoData.create({
            metaTitle: dto.metaTitle,
            metaDescription: dto.metaDescription,
        });
    }
    static fromPrisma(data) {
        return value_objects_1.SeoData.create({
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
        });
    }
    static toPrisma(seoData) {
        return {
            metaTitle: seoData.metaTitle,
            metaDescription: seoData.metaDescription,
        };
    }
}
exports.SeoDataMapper = SeoDataMapper;
//# sourceMappingURL=seo-data.mapper.js.map