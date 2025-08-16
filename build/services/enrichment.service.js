"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EnrichmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrichmentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const enums_1 = require("../domain/enums");
let EnrichmentService = EnrichmentService_1 = class EnrichmentService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EnrichmentService_1.name);
    }
    async enrich(data) {
        this.logger.debug(`Enriching data for resource: ${data.name}`);
        const enriched = {
            ...data,
            slug: this.generateSlug(data.name),
        };
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
            }
            catch (error) {
                this.logger.warn(`Failed to geocode address for ${data.name}:`, error);
                enriched.address = data.address;
            }
        }
        else {
            enriched.address = data.address;
        }
        enriched.seo = this.enrichSeoData(data);
        this.logger.debug(`Successfully enriched data for resource: ${data.name}`);
        return enriched;
    }
    generateSlug(name) {
        if (!name || name.trim().length === 0) {
            throw new Error('Name is required to generate slug');
        }
        const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        if (slug.length === 0) {
            return `resource-${Date.now()}`;
        }
        return slug.length > 100 ? slug.substring(0, 100).replace(/-$/, '') : slug;
    }
    shouldGeocode(address) {
        if (address.latitude && address.longitude) {
            return false;
        }
        return !!(address.addressLine1 && address.city && address.country);
    }
    async geocodeAddress(address) {
        const fullAddress = this.buildFullAddress(address);
        return this.mockGeocode(fullAddress, address.country);
    }
    buildFullAddress(address) {
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
    async mockGeocode(address, country) {
        this.logger.debug(`Mock geocoding address: ${address}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        const mockCoordinates = this.getMockCoordinatesForCountry(country);
        if (mockCoordinates) {
            const latVariation = (Math.random() - 0.5) * 0.1;
            const lngVariation = (Math.random() - 0.5) * 0.1;
            return {
                latitude: mockCoordinates.latitude + latVariation,
                longitude: mockCoordinates.longitude + lngVariation,
                formattedAddress: address,
            };
        }
        return null;
    }
    getMockCoordinatesForCountry(country) {
        const countryCoordinates = {
            'CM': { latitude: 3.848, longitude: 11.502 },
            'FR': { latitude: 48.8566, longitude: 2.3522 },
            'US': { latitude: 39.8283, longitude: -98.5795 },
            'GB': { latitude: 55.3781, longitude: -3.4360 },
            'DE': { latitude: 51.1657, longitude: 10.4515 },
            'CA': { latitude: 56.1304, longitude: -106.3468 },
        };
        return countryCoordinates[country.toUpperCase()] || null;
    }
    enrichSeoData(data) {
        const existingSeo = data.seo || {};
        let metaTitle = existingSeo.metaTitle;
        if (!metaTitle) {
            metaTitle = data.name;
            if (data.resourceType === enums_1.ResourceType.BUSINESS && data.address?.city) {
                metaTitle += ` - ${data.address.city}`;
            }
            if (metaTitle.length > 60) {
                metaTitle = metaTitle.substring(0, 57) + '...';
            }
        }
        let metaDescription = existingSeo.metaDescription;
        if (!metaDescription) {
            if (data.description) {
                metaDescription = data.description.length > 160
                    ? data.description.substring(0, 157) + '...'
                    : data.description;
            }
            else {
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
    getResourceTypeText(resourceType) {
        const typeTexts = {
            [enums_1.ResourceType.BUSINESS]: 'Business',
            [enums_1.ResourceType.SERVICE]: 'Service',
            [enums_1.ResourceType.DATA]: 'Data Resource',
            [enums_1.ResourceType.API]: 'API Service',
        };
        return typeTexts[resourceType] || 'Resource';
    }
    validateEnrichedData(data) {
        const errors = [];
        if (!data.slug || data.slug.trim().length === 0) {
            errors.push('Slug is required');
        }
        else if (!this.isValidSlug(data.slug)) {
            errors.push('Generated slug is invalid');
        }
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
        if (data.seo?.metaTitle && data.seo.metaTitle.length > 60) {
            errors.push('Meta title should be 60 characters or less');
        }
        if (data.seo?.metaDescription && data.seo.metaDescription.length > 160) {
            errors.push('Meta description should be 160 characters or less');
        }
        return errors;
    }
    isValidSlug(slug) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        return slugRegex.test(slug);
    }
};
exports.EnrichmentService = EnrichmentService;
exports.EnrichmentService = EnrichmentService = EnrichmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EnrichmentService);
//# sourceMappingURL=enrichment.service.js.map