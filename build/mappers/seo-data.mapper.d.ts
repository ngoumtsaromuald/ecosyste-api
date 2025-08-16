import { SeoData } from '../domain/value-objects';
import { SeoDataDto } from '../dto';
export declare class SeoDataMapper {
    static toDto(seoData: SeoData): SeoDataDto;
    static toDomain(dto: SeoDataDto): SeoData;
    static fromPrisma(data: {
        metaTitle: string | null;
        metaDescription: string | null;
    }): SeoData;
    static toPrisma(seoData: SeoData): {
        metaTitle: string | null;
        metaDescription: string | null;
    };
}
