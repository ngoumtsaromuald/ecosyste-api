import {
  SearchParams,
  SearchResults,
  GeoLocation,
  SearchMetrics,
  TimePeriod,
  HealthStatus
} from './search.interfaces';
import { Suggestion } from '../types/suggestion.types';

/**
 * Interface pour le service principal de recherche
 */
export interface ISearchService {
  /**
   * Recherche principale avec paramètres complets
   */
  search(params: SearchParams): Promise<SearchResults>;

  /**
   * Suggestions auto-complete
   */
  suggest(query: string, limit?: number, userId?: string): Promise<Suggestion[]>;

  /**
   * Recherche par catégorie
   */
  searchByCategory(categoryId: string, params: SearchParams): Promise<SearchResults>;

  /**
   * Recherche géographique
   */
  searchNearby(location: GeoLocation, radius: number, params: SearchParams): Promise<SearchResults>;

  /**
   * Recherche par ville
   */
  searchByCity(city: string, params: SearchParams): Promise<SearchResults>;

  /**
   * Recherche par région
   */
  searchByRegion(region: string, params: SearchParams): Promise<SearchResults>;

  /**
   * Recherche avec géocodage automatique d'une adresse
   */
  searchByAddress(address: string, radius: number, params: SearchParams): Promise<SearchResults>;

  /**
   * Recherche près de la position utilisateur
   */
  searchNearUser(userLocation: GeoLocation, radius: number, params: SearchParams): Promise<SearchResults>;

  /**
   * Recherche personnalisée pour utilisateur connecté
   */
  personalizedSearch(userId: string, params: SearchParams): Promise<SearchResults>;

  /**
   * Vérification de santé du service de recherche
   */
  checkHealth(): Promise<HealthStatus>;

  /**
   * Métriques de performance du service
   */
  getMetrics(period: TimePeriod): Promise<SearchMetrics>;
}