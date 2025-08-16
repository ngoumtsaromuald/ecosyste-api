import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateApiResourceDto } from '../dto/create-api-resource.dto';
import { AddressDto } from '../dto/address.dto';
import { SeoDataDto } from '../dto/seo-data.dto';
import { ResourceType } from '../domain/enums';

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

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Enriches API resource data with automatic enhancements
   */
  async enrich(data: CreateApiResourceDto): Promise<EnrichedApiResourceData> {
    this.logger.debug(`Enriching data for resource: ${data.name}`);

    const enriched: EnrichedApiResourceData = {
      ...data,
      slug: this.generateSlug(data.name),
    };

    // Enrich address with geocoding if needed
    if (data.address && this.shouldGeocode(data.address)) {
      try {
        const geocodeResult = await this.geocodeAddress(data.address);
        if (geocodeResult) {
          enriched.address = {
            ...data.address,
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude,
          };
          this.logger.debug(`Geocoded address for ${data.name}: ${geocodeResult.latitude}, ${geocodeResult.longitude}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to geocode address for ${data.name}:`, error);
        // Continue without geocoding - it's not critical
        enriched.address = data.address;
      }
    } else {
      enriched.address = data.address;
    }

    // Enrich SEO data
    enriched.seo = this.enrichSeoData(data);

    this.logger.debug(`Successfully enriched data for resource: ${data.name}`);
    return enriched;
  }

  /**
   * Generates a URL-friendly slug from the resource name
   */
  generateSlug(name: string): string {
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required to generate slug');
    }

    const slug = name
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    if (slug.length === 0) {
      // Fallback if slug becomes empty after cleaning
      return `resource-${Date.now()}`;
    }

    // Ensure slug is not too long
    return slug.length > 100 ? slug.substring(0, 100).replace(/-$/, '') : slug;
  }

  /**
   * Determines if an address should be geocoded
   */
  private shouldGeocode(address: AddressDto): boolean {
    // Don't geocode if coordinates already exist
    if (address.latitude && address.longitude) {
      return false;
    }

    // Only geocode if we have enough address information
    return !!(address.addressLine1 && address.city && address.country);
  }

  /**
   * Geocodes an address to get latitude/longitude coordinates
   */
  private async geocodeAddress(address: AddressDto): Promise<GeocodeResult | null> {
    const fullAddress = this.buildFullAddress(address);
    
    // For now, implement a mock geocoding service
    // In production, this would integrate with Google Maps, OpenStreetMap, or similar
    return this.mockGeocode(fullAddress, address.country);
  }

  /**
   * Builds a full address string for geocoding
   */
  private buildFullAddress(address: AddressDto): string {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.region,
      address.postalCode,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Mock geocoding implementation
   * In production, replace with actual geocoding service
   */
  private async mockGeocode(address: string, country: string): Promise<GeocodeResult | null> {
    this.logger.debug(`Mock geocoding address: ${address}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return mock coordinates based on country
    const mockCoordinates = this.getMockCoordinatesForCountry(country);
    
    if (mockCoordinates) {
      // Add some random variation to make it more realistic
      const latVariation = (Math.random() - 0.5) * 0.1; // ±0.05 degrees
      const lngVariation = (Math.random() - 0.5) * 0.1; // ±0.05 degrees

      return {
        latitude: mockCoordinates.latitude + latVariation,
        longitude: mockCoordinates.longitude + lngVariation,
        formattedAddress: address,
      };
    }

    return null;
  }

  /**
   * Returns mock coordinates for different countries
   */
  private getMockCoordinatesForCountry(country: string): { latitude: number; longitude: number } | null {
    const countryCoordinates: Record<string, { latitude: number; longitude: number }> = {
      'CM': { latitude: 3.848, longitude: 11.502 }, // Cameroon (Yaoundé)
      'FR': { latitude: 48.8566, longitude: 2.3522 }, // France (Paris)
      'US': { latitude: 39.8283, longitude: -98.5795 }, // USA (center)
      'GB': { latitude: 55.3781, longitude: -3.4360 }, // UK (center)
      'DE': { latitude: 51.1657, longitude: 10.4515 }, // Germany (center)
      'CA': { latitude: 56.1304, longitude: -106.3468 }, // Canada (center)
    };

    return countryCoordinates[country.toUpperCase()] || null;
  }

  /**
   * Enriches SEO data based on resource information
   */
  private enrichSeoData(data: CreateApiResourceDto): SeoDataDto {
    const existingSeo = data.seo || {};

    // Generate meta title if not provided
    let metaTitle = existingSeo.metaTitle;
    if (!metaTitle) {
      metaTitle = data.name;
      
      // Add location context for businesses
      if (data.resourceType === ResourceType.BUSINESS && data.address?.city) {
        metaTitle += ` - ${data.address.city}`;
      }
      
      // Ensure title is not too long
      if (metaTitle.length > 60) {
        metaTitle = metaTitle.substring(0, 57) + '...';
      }
    }

    // Generate meta description if not provided
    let metaDescription = existingSeo.metaDescription;
    if (!metaDescription) {
      if (data.description) {
        metaDescription = data.description.length > 160 
          ? data.description.substring(0, 157) + '...'
          : data.description;
      } else {
        // Generate basic description
        const resourceTypeText = this.getResourceTypeText(data.resourceType);
        const locationText = data.address?.city ? ` in ${data.address.city}` : '';
        metaDescription = `${data.name} - ${resourceTypeText}${locationText}. Discover more on ROMAPI.`;
      }
    }

    return {
      ...existingSeo,
      metaTitle,
      metaDescription,
    };
  }

  /**
   * Gets human-readable text for resource type
   */
  private getResourceTypeText(resourceType: ResourceType): string {
    const typeTexts: Record<ResourceType, string> = {
      [ResourceType.BUSINESS]: 'Business',
      [ResourceType.SERVICE]: 'Service',
      [ResourceType.DATA]: 'Data Resource',
      [ResourceType.API]: 'API Service',
    };

    return typeTexts[resourceType] || 'Resource';
  }

  /**
   * Validates that enriched data is complete and valid
   */
  validateEnrichedData(data: EnrichedApiResourceData): string[] {
    const errors: string[] = [];

    // Validate slug
    if (!data.slug || data.slug.trim().length === 0) {
      errors.push('Slug is required');
    } else if (!this.isValidSlug(data.slug)) {
      errors.push('Generated slug is invalid');
    }

    // Validate coordinates if present
    if (data.address?.latitude !== undefined) {
      if (data.address.latitude < -90 || data.address.latitude > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
    }

    if (data.address?.longitude !== undefined) {
      if (data.address.longitude < -180 || data.address.longitude > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }

    // Validate SEO data lengths
    if (data.seo?.metaTitle && data.seo.metaTitle.length > 60) {
      errors.push('Meta title should be 60 characters or less');
    }

    if (data.seo?.metaDescription && data.seo.metaDescription.length > 160) {
      errors.push('Meta description should be 160 characters or less');
    }

    return errors;
  }

  /**
   * Checks if a slug is valid
   */
  private isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  }
}