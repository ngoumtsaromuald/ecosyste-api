import { CategoryResponseDto } from '../dto';

export class CategoryMapper {
  static toResponseDto(data: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    parentId: string | null;
    createdAt: Date;
  }): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = data.id;
    dto.name = data.name;
    dto.slug = data.slug;
    dto.description = data.description;
    dto.icon = data.icon;
    dto.parentId = data.parentId;
    dto.createdAt = data.createdAt;
    return dto;
  }

  static toResponseDtoArray(categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    parentId: string | null;
    createdAt: Date;
  }>): CategoryResponseDto[] {
    return categories.map(category => this.toResponseDto(category));
  }
}