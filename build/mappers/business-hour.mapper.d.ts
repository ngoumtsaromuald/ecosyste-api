import { BusinessHourDto } from '../dto';
export declare class BusinessHourMapper {
    static toDto(data: {
        id: string;
        dayOfWeek: number;
        openTime: string | null;
        closeTime: string | null;
        isClosed: boolean;
    }): BusinessHourDto;
    static fromDto(dto: BusinessHourDto, resourceId: string): {
        resourceId: string;
        dayOfWeek: number;
        openTime: string | null;
        closeTime: string | null;
        isClosed: boolean;
    };
    static toDtoArray(businessHours: Array<{
        id: string;
        dayOfWeek: number;
        openTime: string | null;
        closeTime: string | null;
        isClosed: boolean;
    }>): BusinessHourDto[];
    static fromDtoArray(dtos: BusinessHourDto[], resourceId: string): Array<{
        resourceId: string;
        dayOfWeek: number;
        openTime: string | null;
        closeTime: string | null;
        isClosed: boolean;
    }>;
}
