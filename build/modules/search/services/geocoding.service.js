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
var GeocodingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocodingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let GeocodingService = GeocodingService_1 = class GeocodingService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GeocodingService_1.name);
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.CACHE_TTL = 24 * 60 * 60 * 1000;
    }
    async geocodeAddress(address) {
        if (!address || address.trim().length === 0) {
            throw new Error('Address is required for geocoding');
        }
        const normalizedAddress = this.normalizeAddress(address);
        this.logger.debug(`Geocoding address: ${normalizedAddress}`);
        const cached = this.getCachedResult(normalizedAddress);
        if (cached) {
            this.logger.debug(`Returning cached geocoding result for: ${normalizedAddress}`);
            return cached;
        }
        try {
            const result = await this.geocodeWithNominatim(normalizedAddress);
            if (result) {
                this.setCachedResult(normalizedAddress, result);
                return result;
            }
            const fallbackResult = await this.tryFallbackGeocoding(normalizedAddress);
            if (fallbackResult) {
                this.setCachedResult(normalizedAddress, fallbackResult);
                return fallbackResult;
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Geocoding failed for address: ${normalizedAddress}`, error.stack);
            return null;
        }
    }
    async reverseGeocode(latitude, longitude) {
        if (!this.isValidCoordinates(latitude, longitude)) {
            throw new Error('Invalid coordinates for reverse geocoding');
        }
        this.logger.debug(`Reverse geocoding coordinates: ${latitude}, ${longitude}`);
        try {
            const result = await this.reverseGeocodeWithNominatim(latitude, longitude);
            return result;
        }
        catch (error) {
            this.logger.error(`Reverse geocoding failed for coordinates: ${latitude}, ${longitude}`, error.stack);
            return null;
        }
    }
    getUserLocationInstructions() {
        return {
            browserAPI: 'navigator.geolocation.getCurrentPosition()',
            fallbackOptions: [
                'IP-based location detection',
                'Manual address input',
                'City selection from list',
                'Use default location (major city)'
            ],
            errorHandling: [
                'Permission denied - show manual input',
                'Position unavailable - use IP location',
                'Timeout - use cached location or default',
                'Not supported - show city selector'
            ]
        };
    }
    isValidCoordinates(latitude, longitude) {
        return (typeof latitude === 'number' &&
            typeof longitude === 'number' &&
            latitude >= -90 && latitude <= 90 &&
            longitude >= -180 && longitude <= 180);
    }
    normalizeAddress(address) {
        return address
            .trim()
            .toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[ñ]/g, 'n')
            .replace(/\s+/g, ' ')
            .trim();
    }
    async geocodeWithNominatim(address) {
        const baseUrl = 'https://nominatim.openstreetmap.org/search';
        const params = new URLSearchParams({
            q: address,
            format: 'json',
            limit: '1',
            addressdetails: '1',
            countrycodes: 'cm,fr',
            'accept-language': 'fr,en'
        });
        const url = `${baseUrl}?${params.toString()}`;
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ROMAPI-Search-Service/1.0'
                }
            });
            if (!response.ok) {
                throw new Error(`Nominatim API error: ${response.status}`);
            }
            const data = await response.json();
            if (!data || data.length === 0) {
                return null;
            }
            const result = data[0];
            return {
                location: {
                    latitude: parseFloat(result.lat),
                    longitude: parseFloat(result.lon)
                },
                address: {
                    street: result.address?.road,
                    city: result.address?.city || result.address?.town || result.address?.village,
                    region: result.address?.state || result.address?.region,
                    country: result.address?.country,
                    postalCode: result.address?.postcode
                },
                confidence: this.calculateConfidence(result),
                source: 'nominatim'
            };
        }
        catch (error) {
            this.logger.error(`Nominatim geocoding error: ${error.message}`);
            return null;
        }
    }
    async reverseGeocodeWithNominatim(latitude, longitude) {
        const baseUrl = 'https://nominatim.openstreetmap.org/reverse';
        const params = new URLSearchParams({
            lat: latitude.toString(),
            lon: longitude.toString(),
            format: 'json',
            addressdetails: '1',
            'accept-language': 'fr,en'
        });
        const url = `${baseUrl}?${params.toString()}`;
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ROMAPI-Search-Service/1.0'
                }
            });
            if (!response.ok) {
                throw new Error(`Nominatim reverse API error: ${response.status}`);
            }
            const result = await response.json();
            if (!result || !result.address) {
                return null;
            }
            return {
                address: {
                    street: result.address?.road,
                    city: result.address?.city || result.address?.town || result.address?.village,
                    region: result.address?.state || result.address?.region,
                    country: result.address?.country,
                    postalCode: result.address?.postcode
                },
                confidence: this.calculateConfidence(result)
            };
        }
        catch (error) {
            this.logger.error(`Nominatim reverse geocoding error: ${error.message}`);
            return null;
        }
    }
    async tryFallbackGeocoding(address) {
        const cityMatch = address.match(/([a-zA-ZÀ-ÿ\s-]+)(?:,|$)/);
        if (cityMatch) {
            const cityOnly = cityMatch[1].trim();
            const result = await this.geocodeWithNominatim(cityOnly);
            if (result) {
                result.source = 'fallback';
                result.confidence = Math.max(0.3, result.confidence - 0.2);
                return result;
            }
        }
        const defaultLocations = this.getDefaultCityLocations();
        const normalizedAddress = address.toLowerCase();
        for (const [cityName, location] of Object.entries(defaultLocations)) {
            if (normalizedAddress.includes(cityName.toLowerCase())) {
                return {
                    location,
                    address: {
                        city: cityName,
                        region: location.region,
                        country: location.country
                    },
                    confidence: 0.5,
                    source: 'fallback'
                };
            }
        }
        return null;
    }
    calculateConfidence(result) {
        let confidence = 0.8;
        if (!result.address) {
            confidence -= 0.2;
        }
        if (result.address?.road)
            confidence += 0.1;
        if (result.address?.postcode)
            confidence += 0.1;
        const placeType = result.type || result.class;
        if (placeType === 'city' || placeType === 'town') {
            confidence = Math.max(0.7, confidence);
        }
        else if (placeType === 'village') {
            confidence = Math.max(0.6, confidence);
        }
        return Math.min(1.0, Math.max(0.1, confidence));
    }
    getDefaultCityLocations() {
        return {
            'Yaoundé': {
                latitude: 3.8480,
                longitude: 11.5021,
                region: 'Centre',
                country: 'Cameroun'
            },
            'Douala': {
                latitude: 4.0511,
                longitude: 9.7679,
                region: 'Littoral',
                country: 'Cameroun'
            },
            'Bamenda': {
                latitude: 5.9631,
                longitude: 10.1591,
                region: 'Nord-Ouest',
                country: 'Cameroun'
            },
            'Bafoussam': {
                latitude: 5.4781,
                longitude: 10.4167,
                region: 'Ouest',
                country: 'Cameroun'
            },
            'Garoua': {
                latitude: 9.3265,
                longitude: 13.3958,
                region: 'Nord',
                country: 'Cameroun'
            },
            'Paris': {
                latitude: 48.8566,
                longitude: 2.3522,
                region: 'Île-de-France',
                country: 'France'
            },
            'Lyon': {
                latitude: 45.7640,
                longitude: 4.8357,
                region: 'Auvergne-Rhône-Alpes',
                country: 'France'
            },
            'Marseille': {
                latitude: 43.2965,
                longitude: 5.3698,
                region: 'Provence-Alpes-Côte d\'Azur',
                country: 'France'
            }
        };
    }
    getCachedResult(address) {
        const cached = this.cache.get(address);
        const expiry = this.cacheExpiry.get(address);
        if (cached && expiry && Date.now() < expiry) {
            return { ...cached, source: 'cache' };
        }
        if (cached) {
            this.cache.delete(address);
            this.cacheExpiry.delete(address);
        }
        return null;
    }
    setCachedResult(address, result) {
        this.cache.set(address, result);
        this.cacheExpiry.set(address, Date.now() + this.CACHE_TTL);
        if (this.cache.size > 1000) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
            this.cacheExpiry.delete(oldestKey);
        }
    }
};
exports.GeocodingService = GeocodingService;
exports.GeocodingService = GeocodingService = GeocodingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeocodingService);
//# sourceMappingURL=geocoding.service.js.map