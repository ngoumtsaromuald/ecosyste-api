"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessHourMapper = void 0;
const dto_1 = require("../dto");
class BusinessHourMapper {
    static toDto(data) {
        const dto = new dto_1.BusinessHourDto();
        dto.dayOfWeek = data.dayOfWeek;
        dto.openTime = data.openTime;
        dto.closeTime = data.closeTime;
        dto.isClosed = data.isClosed;
        return dto;
    }
    static fromDto(dto, resourceId) {
        return {
            resourceId,
            dayOfWeek: dto.dayOfWeek,
            openTime: dto.openTime || null,
            closeTime: dto.closeTime || null,
            isClosed: dto.isClosed,
        };
    }
    static toDtoArray(businessHours) {
        return businessHours.map(hour => this.toDto(hour));
    }
    static fromDtoArray(dtos, resourceId) {
        return dtos.map(dto => this.fromDto(dto, resourceId));
    }
}
exports.BusinessHourMapper = BusinessHourMapper;
//# sourceMappingURL=business-hour.mapper.js.map