import { ConfigService } from '@nestjs/config';
import { CreateApiResourceDto } from '../dto/create-api-resource.dto';
import { AddressDto } from '../dto/address.dto';
import { SeoDataDto } from '../dto/seo-data.dto';
export interface EnrichedApiResourceData extends CreateApiResourceDto {
    slug: string;
    address?: AddressDto & {
        latitude?: number;
        longitude?: number;
    };
    seo?: SeoDataDto;
}
export interface GeocodeResult {
    latitude: number;
    longitude: number;
    formattedAddress?: string;
}
export declare class EnrichmentService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    enrich(data: CreateApiResourceDto): Promise<EnrichedApiResourceData>;
    generateSlug(name: string): string;
    private shouldGeocode;
    private geocodeAddress;
    private buildFullAddress;
    private mockGeocode;
    private getMockCoordinatesForCountry;
    private enrichSeoData;
    private getResourceTypeText;
    validateEnrichedData(data: EnrichedApiResourceData): string[];
    private isValidSlug;
}
