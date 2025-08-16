import { ResourceImageDto, CreateResourceImageDto } from '../dto';

export class ResourceImageMapper {
  static toDto(data: {
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    orderIndex: number;
    createdAt: Date;
  }): ResourceImageDto {
    const dto = new ResourceImageDto();
    dto.id = data.id;
    dto.url = data.url;
    dto.altText = data.altText;
    dto.isPrimary = data.isPrimary;
    dto.orderIndex = data.orderIndex;
    dto.createdAt = data.createdAt;
    return dto;
  }

  static fromCreateDto(dto: CreateResourceImageDto, resourceId: string): {
    resourceId: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    orderIndex: number;
  } {
    return {
      resourceId,
      url: dto.url,
      altText: dto.altText || null,
      isPrimary: dto.isPrimary || false,
      orderIndex: dto.orderIndex || 0,
    };
  }

  static toDtoArray(images: Array<{
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    orderIndex: number;
    createdAt: Date;
  }>): ResourceImageDto[] {
    return images
      .sort((a, b) => {
        // Primary images first, then by order index
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.orderIndex - b.orderIndex;
      })
      .map(image => this.toDto(image));
  }

  static fromCreateDtoArray(dtos: CreateResourceImageDto[], resourceId: string): Array<{
    resourceId: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    orderIndex: number;
  }> {
    return dtos.map(dto => this.fromCreateDto(dto, resourceId));
  }
}