import { CategoryResponseDto } from '../dto';
export declare class CategoryMapper {
    static toResponseDto(data: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        icon: string | null;
        parentId: string | null;
        createdAt: Date;
    }): CategoryResponseDto;
    static toResponseDtoArray(categories: Array<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        icon: string | null;
        parentId: string | null;
        createdAt: Date;
    }>): CategoryResponseDto[];
}
