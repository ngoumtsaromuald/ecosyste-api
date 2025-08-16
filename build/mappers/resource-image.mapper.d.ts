import { ResourceImageDto, CreateResourceImageDto } from '../dto';
export declare class ResourceImageMapper {
    static toDto(data: {
        id: string;
        url: string;
        altText: string | null;
        isPrimary: boolean;
        orderIndex: number;
        createdAt: Date;
    }): ResourceImageDto;
    static fromCreateDto(dto: CreateResourceImageDto, resourceId: string): {
        resourceId: string;
        url: string;
        altText: string | null;
        isPrimary: boolean;
        orderIndex: number;
    };
    static toDtoArray(images: Array<{
        id: string;
        url: string;
        altText: string | null;
        isPrimary: boolean;
        orderIndex: number;
        createdAt: Date;
    }>): ResourceImageDto[];
    static fromCreateDtoArray(dtos: CreateResourceImageDto[], resourceId: string): Array<{
        resourceId: string;
        url: string;
        altText: string | null;
        isPrimary: boolean;
        orderIndex: number;
    }>;
}
