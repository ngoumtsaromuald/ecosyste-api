import { BusinessHourDto } from '../dto';

export class BusinessHourMapper {
  static toDto(data: {
    id: string;
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }): BusinessHourDto {
    const dto = new BusinessHourDto();
    dto.dayOfWeek = data.dayOfWeek;
    dto.openTime = data.openTime;
    dto.closeTime = data.closeTime;
    dto.isClosed = data.isClosed;
    return dto;
  }

  static fromDto(dto: BusinessHourDto, resourceId: string): {
    resourceId: string;
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  } {
    return {
      resourceId,
      dayOfWeek: dto.dayOfWeek,
      openTime: dto.openTime || null,
      closeTime: dto.closeTime || null,
      isClosed: dto.isClosed,
    };
  }

  static toDtoArray(businessHours: Array<{
    id: string;
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }>): BusinessHourDto[] {
    return businessHours.map(hour => this.toDto(hour));
  }

  static fromDtoArray(dtos: BusinessHourDto[], resourceId: string): Array<{
    resourceId: string;
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }> {
    return dtos.map(dto => this.fromDto(dto, resourceId));
  }
}