import { ConfigService } from '@nestjs/config';
import { GeoLocation } from '../interfaces/search.interfaces';
export interface GeocodingResult {
    location: GeoLocation;
    address: {
        street?: string;
        city: string;
        region: string;
        country: string;
        postalCode?: string;
    };
    confidence: number;
    source: 'nominatim' | 'cache' | 'fallback';
}
export interface ReverseGeocodingResult {
    address: {
        street?: string;
        city: string;
        region: string;
        country: string;
        postalCode?: string;
    };
    confidence: number;
}
export declare class GeocodingService {
    private readonly configService;
    private readonly logger;
    private readonly cache;
    private readonly cacheExpiry;
    private readonly CACHE_TTL;
    constructor(configService: ConfigService);
    geocodeAddress(address: string): Promise<GeocodingResult | null>;
    reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null>;
    getUserLocationInstructions(): {
        browserAPI: string;
        fallbackOptions: string[];
        errorHandling: string[];
    };
    private isValidCoordinates;
    private normalizeAddress;
    private geocodeWithNominatim;
    private reverseGeocodeWithNominatim;
    private tryFallbackGeocoding;
    private calculateConfidence;
    private getDefaultCityLocations;
    private getCachedResult;
    private setCachedResult;
}
