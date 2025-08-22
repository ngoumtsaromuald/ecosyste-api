import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);
    private readonly cache = new Map<string, GeocodingResult>();
    private readonly cacheExpiry = new Map<string, number>();
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

    constructor(private readonly configService: ConfigService) { }

    /**
     * Géocoder une adresse en coordonnées
     */
    async geocodeAddress(address: string): Promise<GeocodingResult | null> {
        if (!address || address.trim().length === 0) {
            throw new Error('Address is required for geocoding');
        }

        const normalizedAddress = this.normalizeAddress(address);
        this.logger.debug(`Geocoding address: ${normalizedAddress}`);

        // Vérifier le cache
        const cached = this.getCachedResult(normalizedAddress);
        if (cached) {
            this.logger.debug(`Returning cached geocoding result for: ${normalizedAddress}`);
            return cached;
        }

        try {
            // Utiliser Nominatim (OpenStreetMap) comme service de géocodage gratuit
            const result = await this.geocodeWithNominatim(normalizedAddress);

            if (result) {
                // Mettre en cache le résultat
                this.setCachedResult(normalizedAddress, result);
                return result;
            }

            // Fallback: essayer avec des variantes de l'adresse
            const fallbackResult = await this.tryFallbackGeocoding(normalizedAddress);
            if (fallbackResult) {
                this.setCachedResult(normalizedAddress, fallbackResult);
                return fallbackResult;
            }

            return null;
        } catch (error) {
            this.logger.error(`Geocoding failed for address: ${normalizedAddress}`, error.stack);
            return null;
        }
    }  /*
*
   * Géocodage inverse : obtenir l'adresse depuis les coordonnées
   */
    async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
        if (!this.isValidCoordinates(latitude, longitude)) {
            throw new Error('Invalid coordinates for reverse geocoding');
        }

        this.logger.debug(`Reverse geocoding coordinates: ${latitude}, ${longitude}`);

        try {
            const result = await this.reverseGeocodeWithNominatim(latitude, longitude);
            return result;
        } catch (error) {
            this.logger.error(`Reverse geocoding failed for coordinates: ${latitude}, ${longitude}`, error.stack);
            return null;
        }
    }

    /**
     * Détecter la position de l'utilisateur (côté client)
     * Cette méthode retourne des instructions pour le frontend
     */
    getUserLocationInstructions(): {
        browserAPI: string;
        fallbackOptions: string[];
        errorHandling: string[];
    } {
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

    /**
     * Valider des coordonnées géographiques
     */
    private isValidCoordinates(latitude: number, longitude: number): boolean {
        return (
            typeof latitude === 'number' &&
            typeof longitude === 'number' &&
            latitude >= -90 && latitude <= 90 &&
            longitude >= -180 && longitude <= 180
        );
    }

    /**
     * Normaliser une adresse pour le géocodage
     */
    private normalizeAddress(address: string): string {
        return address
            .trim()
            .toLowerCase()
            // Remplacer les caractères spéciaux français
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[ñ]/g, 'n')
            // Nettoyer les espaces multiples
            .replace(/\s+/g, ' ')
            .trim();
    }  /**
  
 * Géocoder avec Nominatim (OpenStreetMap)
   */
    private async geocodeWithNominatim(address: string): Promise<GeocodingResult | null> {
        const baseUrl = 'https://nominatim.openstreetmap.org/search';
        const params = new URLSearchParams({
            q: address,
            format: 'json',
            limit: '1',
            addressdetails: '1',
            countrycodes: 'cm,fr', // Priorité Cameroun et France
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
        } catch (error) {
            this.logger.error(`Nominatim geocoding error: ${error.message}`);
            return null;
        }
    }

    /**
     * Géocodage inverse avec Nominatim
     */
    private async reverseGeocodeWithNominatim(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
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
        } catch (error) {
            this.logger.error(`Nominatim reverse geocoding error: ${error.message}`);
            return null;
        }
    }

    /**
     * Essayer des stratégies de géocodage de fallback
     */
    private async tryFallbackGeocoding(address: string): Promise<GeocodingResult | null> {
        // Stratégie 1: Essayer avec seulement la ville
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

        // Stratégie 2: Utiliser des coordonnées par défaut pour les grandes villes
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

    /**
     * Calculer le niveau de confiance du résultat de géocodage
     */
    private calculateConfidence(result: any): number {
        let confidence = 0.8; // Base confidence

        // Réduire si pas d'adresse détaillée
        if (!result.address) {
            confidence -= 0.2;
        }

        // Augmenter si on a des détails précis
        if (result.address?.road) confidence += 0.1;
        if (result.address?.postcode) confidence += 0.1;

        // Réduire selon le type de lieu
        const placeType = result.type || result.class;
        if (placeType === 'city' || placeType === 'town') {
            confidence = Math.max(0.7, confidence);
        } else if (placeType === 'village') {
            confidence = Math.max(0.6, confidence);
        }

        return Math.min(1.0, Math.max(0.1, confidence));
    }

    /**
     * Obtenir les coordonnées par défaut des grandes villes
     */
    private getDefaultCityLocations(): Record<string, GeoLocation & { region: string; country: string }> {
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

    /**
     * Obtenir un résultat mis en cache
     */
    private getCachedResult(address: string): GeocodingResult | null {
        const cached = this.cache.get(address);
        const expiry = this.cacheExpiry.get(address);

        if (cached && expiry && Date.now() < expiry) {
            return { ...cached, source: 'cache' };
        }

        // Nettoyer le cache expiré
        if (cached) {
            this.cache.delete(address);
            this.cacheExpiry.delete(address);
        }

        return null;
    }

    /**
     * Mettre en cache un résultat de géocodage
     */
    private setCachedResult(address: string, result: GeocodingResult): void {
        this.cache.set(address, result);
        this.cacheExpiry.set(address, Date.now() + this.CACHE_TTL);

        // Limiter la taille du cache
        if (this.cache.size > 1000) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
            this.cacheExpiry.delete(oldestKey);
        }
    }
}