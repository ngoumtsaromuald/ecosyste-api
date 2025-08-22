/**
 * Utilitaires pour le SDK de recherche ROMAPI
 */

import {
  SearchParams,
  SearchFilters,
  ResourceType,
  ResourcePlan,
  SortField,
  SortOrder,
  GeoLocation,
  SearchHit
} from './types';

/**
 * Builder pour construire facilement des paramètres de recherche
 */
export class SearchParamsBuilder {
  private params: SearchParams = {};

  /**
   * Définir la requête textuelle
   */
  query(q: string): SearchParamsBuilder {
    this.params.query = q;
    return this;
  }

  /**
   * Ajouter des filtres par catégorie
   */
  categories(...categoryIds: string[]): SearchParamsBuilder {
    if (!this.params.filters) this.params.filters = {};
    this.params.filters.categories = [...(this.params.filters.categories || []), ...categoryIds];
    return this;
  }

  /**
   * Filtrer par types de ressources
   */
  resourceTypes(...types: ResourceType[]): SearchParamsBuilder {
    if (!this.params.filters) this.params.filters = {};
    this.params.filters.resourceTypes = [...(this.params.filters.resourceTypes || []), ...types];
    return this;
  }

  /**
   * Filtrer par plans tarifaires
   */
  plans(...plans: ResourcePlan[]): SearchParamsBuilder {
    if (!this.params.filters) this.params.filters = {};
    this.params.filters.plans = [...(this.params.filters.plans || []), ...plans];
    return this;
  }

  /**
   * Définir une fourchette de prix
   */
  priceRange(min?: number, max?: number): SearchParamsBuilder {
    if (!this.params.filters) this.params.filters = {};
    this.params.filters.priceRange = { min, max };
    return this;
  }

  /**
   * Filtrer par ressources vérifiées
   */
  verified(isVerified: boolean = true): SearchParamsBuilder {
    if (!this.params.filters) this.params.filters = {};
    this.params.filters.verified = isVerified;
    return this;
  }

  /**
   * Filtrer par ville
   */
  city(cityName: string): SearchParamsBuilder {
    if (!this.params.filters) this.params.filters = {};
    this.params.filters.city = cityName;
    return this;
  }

  /**
   * Filtrer par région
   */
  region(regionName: string): SearchParamsBuilder {
    if (!this.params.filters) this.params.filters = {};
    this.params.filters.region = regionName;
    return this;
  }

  /**
   * Ajouter des tags
   */
  tags(...tags: string[]): SearchParamsBuilder {
    if (!this.params.filters) this.params.filters = {};
    this.params.filters.tags = [...(this.params.filters.tags || []), ...tags];
    return this;
  }

  /**
   * Définir le tri
   */
  sortBy(field: SortField, order: SortOrder = SortOrder.DESC): SearchParamsBuilder {
    this.params.sort = { field, order };
    return this;
  }

  /**
   * Définir la pagination
   */
  paginate(page: number, limit: number = 20): SearchParamsBuilder {
    this.params.pagination = { page, limit };
    return this;
  }

  /**
   * Définir les facettes à inclure
   */
  facets(...facetNames: string[]): SearchParamsBuilder {
    this.params.facets = facetNames;
    return this;
  }

  /**
   * Définir l'ID utilisateur pour personnalisation
   */
  userId(id: string): SearchParamsBuilder {
    this.params.userId = id;
    return this;
  }

  /**
   * Définir l'ID de session
   */
  sessionId(id: string): SearchParamsBuilder {
    this.params.sessionId = id;
    return this;
  }

  /**
   * Construire les paramètres finaux
   */
  build(): SearchParams {
    return { ...this.params };
  }

  /**
   * Réinitialiser le builder
   */
  reset(): SearchParamsBuilder {
    this.params = {};
    return this;
  }
}

/**
 * Utilitaires de géolocalisation
 */
export class GeoUtils {
  /**
   * Calculer la distance entre deux points géographiques (formule de Haversine)
   */
  static calculateDistance(point1: GeoLocation, point2: GeoLocation): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convertir des degrés en radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Vérifier si une position est valide
   */
  static isValidLocation(location: GeoLocation): boolean {
    return location.latitude >= -90 && location.latitude <= 90 &&
           location.longitude >= -180 && location.longitude <= 180;
  }

  /**
   * Obtenir la position actuelle de l'utilisateur (navigateur uniquement)
   */
  static getCurrentPosition(): Promise<GeoLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
}

/**
 * Utilitaires de formatage et validation
 */
export class FormatUtils {
  /**
   * Formater un prix en FCFA
   */
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  /**
   * Formater une distance
   */
  static formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }

  /**
   * Formater une date relative
   */
  static formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const target = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - target.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} ans`;
  }

  /**
   * Nettoyer et valider une requête de recherche
   */
  static sanitizeQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ') // Remplacer les espaces multiples
      .replace(/[<>]/g, '') // Supprimer les caractères dangereux
      .substring(0, 200); // Limiter la longueur
  }

  /**
   * Valider un email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider un numéro de téléphone camerounais
   */
  static isValidCameroonPhone(phone: string): boolean {
    const phoneRegex = /^(\+237|237)?[2368]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }
}

/**
 * Utilitaires de cache et performance
 */
export class CacheUtils {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * Générer une clé de cache à partir de paramètres
   */
  static generateCacheKey(prefix: string, params: any): string {
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    return `${prefix}_${btoa(sortedParams).replace(/[+/=]/g, '')}`;
  }

  /**
   * Mettre en cache avec TTL
   */
  static set(key: string, data: any, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  /**
   * Récupérer du cache
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Nettoyer le cache expiré
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Vider tout le cache
   */
  static clear(): void {
    this.cache.clear();
  }
}

/**
 * Utilitaires de debouncing et throttling
 */
export class AsyncUtils {
  private static debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Debounce une fonction
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key?: string
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    const timerKey = key || func.toString();

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        // Annuler le timer précédent
        const existingTimer = this.debounceTimers.get(timerKey);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Créer un nouveau timer
        const timer = setTimeout(async () => {
          try {
            const result = await func(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.debounceTimers.delete(timerKey);
          }
        }, delay);

        this.debounceTimers.set(timerKey, timer);
      });
    };
  }

  /**
   * Retry avec backoff exponentiel
   */
  static async retry<T>(
    func: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await func();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Sleep/pause
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Utilitaires de filtrage et tri des résultats
 */
export class ResultsUtils {
  /**
   * Filtrer les résultats par score minimum
   */
  static filterByMinScore(hits: SearchHit[], minScore: number): SearchHit[] {
    return hits.filter(hit => hit.score >= minScore);
  }

  /**
   * Grouper les résultats par catégorie
   */
  static groupByCategory(hits: SearchHit[]): Record<string, SearchHit[]> {
    return hits.reduce((groups, hit) => {
      const categoryName = hit.category.name;
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(hit);
      return groups;
    }, {} as Record<string, SearchHit[]>);
  }

  /**
   * Trier les résultats par distance (si disponible)
   */
  static sortByDistance(hits: SearchHit[]): SearchHit[] {
    return hits
      .filter(hit => hit.distance !== undefined)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  /**
   * Extraire les highlights uniques
   */
  static extractHighlights(hits: SearchHit[]): string[] {
    const highlights = new Set<string>();
    hits.forEach(hit => {
      if (hit.highlights) {
        hit.highlights.forEach(highlight => highlights.add(highlight));
      }
    });
    return Array.from(highlights);
  }

  /**
   * Calculer des statistiques sur les résultats
   */
  static calculateStats(hits: SearchHit[]): {
    averageScore: number;
    averageRating: number;
    verifiedCount: number;
    typeDistribution: Record<string, number>;
  } {
    const totalScore = hits.reduce((sum, hit) => sum + hit.score, 0);
    const ratingsSum = hits.reduce((sum, hit) => sum + (hit.rating || 0), 0);
    const ratingsCount = hits.filter(hit => hit.rating).length;
    const verifiedCount = hits.filter(hit => hit.verified).length;
    
    const typeDistribution = hits.reduce((dist, hit) => {
      dist[hit.resourceType] = (dist[hit.resourceType] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return {
      averageScore: hits.length > 0 ? totalScore / hits.length : 0,
      averageRating: ratingsCount > 0 ? ratingsSum / ratingsCount : 0,
      verifiedCount,
      typeDistribution
    };
  }
}

/**
 * Factory functions pour créer des builders et utilitaires
 */
export function createSearchBuilder(): SearchParamsBuilder {
  return new SearchParamsBuilder();
}

export function createGeoSearch(location: GeoLocation, radius: number): SearchParamsBuilder {
  return new SearchParamsBuilder(); // Note: GeoSearch sera géré par le client
}

/**
 * Constantes utiles
 */
export const CAMEROON_CITIES = [
  'Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Maroua', 'Bafoussam',
  'Ngaoundéré', 'Bertoua', 'Loum', 'Kumba', 'Nkongsamba', 'Buea',
  'Limbe', 'Dschang', 'Foumban', 'Ebolowa', 'Kribi', 'Tiko'
];

export const CAMEROON_REGIONS = [
  'Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral',
  'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'
];

export const COMMON_SEARCH_TERMS = [
  'restaurant', 'hotel', 'api', 'service', 'business',
  'payment', 'mobile money', 'delivery', 'transport'
];