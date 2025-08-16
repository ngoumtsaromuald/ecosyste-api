import { CategoryResponseDto } from './category-response.dto';
export declare class CategoryTreeResponseDto extends CategoryResponseDto {
    children?: CategoryTreeResponseDto[];
    parent?: CategoryResponseDto;
    _count?: {
        children: number;
        apiResources: number;
    };
}
