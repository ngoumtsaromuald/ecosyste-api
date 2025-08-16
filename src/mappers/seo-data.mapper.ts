import { SeoData } from '../domain/value-objects';
import { SeoDataDto } from '../dto';

export class SeoDataMapper {
  static toDto(seoData: SeoData): SeoDataDto {
    const dto = new SeoDataDto();
    dto.metaTitle = seoData.metaTitle;
    dto.metaDescription = seoData.metaDescription;
    return dto;
  }

  static toDomain(dto: SeoDataDto): SeoData {
    return SeoData.create({
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
    });
  }

  static fromPrisma(data: {
    metaTitle: string | null;
    metaDescription: string | null;
  }): SeoData {
    return SeoData.create({
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
    });
  }

  static toPrisma(seoData: SeoData): {
    metaTitle: string | null;
    metaDescription: string | null;
  } {
    return {
      metaTitle: seoData.metaTitle,
      metaDescription: seoData.metaDescription,
    };
  }
}