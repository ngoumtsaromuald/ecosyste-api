import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SearchResults,
  SearchHit,
  SearchFacets,
  SearchParams,
  SortField,
  SortOrder
} from '../interfaces/search.interfaces';
import { SearchCacheService } from './search-cache.service';
import { ApiResourceRepository } from '../../../repositories/api-resource.repository';
import { ResourceType, ResourcePlan, ResourceStatus } from '@prisma/client';

/**
 * Service pour gérer les erreurs de recherche et fournir des stratégies de fallback
 */
@Injectable()
export class SearchErrorHandler {
  private readonly logger = new Logger(SearchErrorHandler.name);

  constructor(
    private readonly cacheService: SearchCacheService,
    private readonly apiResourceRepository: ApiResourceRepository,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Gérer les erreurs Elasticsearch et fournir des résultats de fallback
   */
  async handleSearchError(error: any, query?: string, params?: SearchParams): Promise<SearchResults> {
    this.logger.error(`Search error: ${error.message}`, error.stack);

    // Analyser le type d'erreur
    const errorType = this.getErrorType(error);

    switch (errorType) {
      case 'index_not_found':
        this.logger.warn('Index not found, attempting PostgreSQL fallback');
        return await this.fallbackToPostgreSQL(query, params);

      case 'timeout':
        this.logger.warn('Search timeout, trying cache fallback first');
        return await this.fallbackWithTimeout(query, params);

      case 'connection_error':
        this.logger.error('Elasticsearch connection error, using full fallback strategy');
        return await this.fallbackToPostgreSQL(query, params);

      case 'query_parsing_error':
        this.logger.warn(`Query parsing error for: "${query}", trying simplified query`);
        return await this.fallbackWithSimplifiedQuery(query, params);

      case 'cluster_block_exception':
        this.logger.error('Elasticsearch cluster blocked, using cache and PostgreSQL fallback');
        return await this.fallbackToPostgreSQL(query, params);

      case 'search_phase_execution_exception':
        this.logger.warn('Search phase execution error, trying simplified search');
        return await this.fallbackWithSimplifiedQuery(query, params);

      default:
        this.logger.error(`Unknown search error: ${error.message}, using full fallback`);
        return await this.fallbackToPostgreSQL(query, params);
    }
  }

  /**
   * Gérer les erreurs de suggestion avec fallback
   */
  async handleSuggestionError(error: any, query?: string): Promise<any[]> {
    this.logger.error(`Suggestion error for query "${query}": ${error.message}`, error.stack);

    // Essayer de récupérer des suggestions depuis le cache
    if (query && query.length >= 2) {
      try {
        const cachedSuggestions = await this.cacheService.getCachedSuggestions(query);
        if (cachedSuggestions && cachedSuggestions.length > 0) {
          this.logger.debug(`Returning cached suggestions for failed query: "${query}"`);
          return cachedSuggestions;
        }

        // Fallback vers PostgreSQL pour suggestions basiques
        return await this.fallbackSuggestionsFromPostgreSQL(query);
      } catch (fallbackError) {
        this.logger.error(`Suggestion fallback failed: ${fallbackError.message}`);
      }
    }

    return []; // Retourner un tableau vide en dernier recours
  }

  /**
   * Déterminer le type d'erreur Elasticsearch
   */
  private getErrorType(error: any): string {
    if (!error) return 'unknown';

    const message = error.message?.toLowerCase() || '';
    const type = error.type?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';

    // Erreurs d'index
    if (type.includes('index_not_found') || message.includes('index_not_found') ||
      message.includes('no such index')) {
      return 'index_not_found';
    }

    // Erreurs de timeout
    if (type.includes('timeout') || message.includes('timeout') ||
      name.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }

    // Erreurs de connexion
    if (message.includes('connection') || message.includes('connect') ||
      message.includes('econnrefused') || message.includes('network') ||
      name.includes('connectionerror')) {
      return 'connection_error';
    }

    // Erreurs de parsing de requête
    if (type.includes('parsing_exception') || message.includes('parsing') ||
      type.includes('query_shard_exception') || message.includes('failed to parse')) {
      return 'query_parsing_error';
    }

    // Erreurs de cluster bloqué
    if (type.includes('cluster_block_exception') || message.includes('cluster_block') ||
      message.includes('blocked by')) {
      return 'cluster_block_exception';
    }

    // Erreurs d'exécution de recherche
    if (type.includes('search_phase_execution_exception') ||
      message.includes('search_phase_execution') ||
      message.includes('failed to execute phase')) {
      return 'search_phase_execution_exception';
    }

    // Erreurs de ressources
    if (message.includes('circuit_breaking_exception') ||
      message.includes('too_many_requests') ||
      message.includes('service_unavailable')) {
      return 'resource_exhaustion';
    }

    return 'unknown';
  }

  /**
   * Retourner des résultats vides
   */
  private getEmptyResults(): SearchResults {
    return {
      hits: [],
      total: 0,
      facets: this.getEmptyFacets(),
      took: 0,
      hasMore: false
    };
  }

  /**
   * Retourner des facettes vides
   */
  private getEmptyFacets(): SearchFacets {
    return {
      categories: [],
      resourceTypes: [],
      plans: [],
      cities: [],
      regions: [],
      verified: [],
      tags: []
    };
  }

  /**
   * Vérifier si une erreur est récupérable
   */
  isRecoverableError(error: any): boolean {
    const errorType = this.getErrorType(error);

    // Les erreurs de timeout et de parsing sont récupérables
    return ['timeout', 'query_parsing_error'].includes(errorType);
  }

  /**
   * Simplifier une requête en cas d'erreur de parsing
   */
  simplifyQuery(originalQuery: string): string {
    if (!originalQuery) return '*';

    // Supprimer les caractères spéciaux qui peuvent causer des erreurs
    let simplified = originalQuery
      .replace(/[^\w\s\-]/g, ' ') // Garder seulement les mots, espaces et tirets
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .trim();

    // Si la requête est trop courte après simplification, utiliser une recherche générale
    if (simplified.length < 2) {
      return '*';
    }

    return simplified;
  }

  /**
   * Créer une requête de fallback simple
   */
  createFallbackQuery(originalQuery?: string): any {
    if (!originalQuery) {
      return {
        query: { match_all: {} },
        size: 10,
        sort: [{ _score: { order: 'desc' } }]
      };
    }

    const simplifiedQuery = this.simplifyQuery(originalQuery);

    return {
      query: {
        simple_query_string: {
          query: simplifiedQuery,
          fields: ['name^2', 'description', 'tags'],
          default_operator: 'and'
        }
      },
      size: 10,
      sort: [{ _score: { order: 'desc' } }]
    };
  }

  /**
   * Fallback vers PostgreSQL en cas d'indisponibilité d'Elasticsearch
   */
  private async fallbackToPostgreSQL(query?: string, params?: SearchParams): Promise<SearchResults> {
    this.logger.log('Executing PostgreSQL fallback search');

    try {
      // Essayer d'abord le cache pour des résultats récents
      const cachedResults = await this.tryGetCachedResults(query, params);
      if (cachedResults) {
        this.logger.debug('Returning cached results for PostgreSQL fallback');
        return cachedResults;
      }

      // Construire les filtres PostgreSQL
      const searchFilters = this.buildPostgreSQLFilters(query, params?.filters);
      const pagination = {
        limit: params?.pagination?.limit || 20,
        offset: params?.pagination?.offset || 0,
      };

      // Exécuter la recherche PostgreSQL
      const { resources, total } = await this.apiResourceRepository.search(searchFilters, pagination);

      // Transformer les résultats
      const searchResults = this.transformPostgreSQLResults(resources, total, params);

      // Mettre en cache les résultats pour les prochaines requêtes
      if (query) {
        const cacheKey = this.generateCacheKey(query, params);
        await this.cacheService.cacheSearchResults(cacheKey, searchResults);
      }

      this.logger.log(`PostgreSQL fallback returned ${total} results`);
      return searchResults;

    } catch (error) {
      this.logger.error(`PostgreSQL fallback failed: ${error.message}`);

      // En dernier recours, retourner des résultats populaires
      return await this.fallbackToPopularResults();
    }
  }

  /**
   * Fallback avec timeout - essayer cache puis PostgreSQL
   */
  private async fallbackWithTimeout(query?: string, params?: SearchParams): Promise<SearchResults> {
    this.logger.log('Executing timeout fallback strategy');

    // Essayer le cache en premier
    const cachedResults = await this.tryGetCachedResults(query, params);
    if (cachedResults) {
      this.logger.debug('Returning cached results for timeout fallback');
      return cachedResults;
    }

    // Si pas de cache, utiliser PostgreSQL
    return await this.fallbackToPostgreSQL(query, params);
  }

  /**
   * Fallback avec requête simplifiée
   */
  private async fallbackWithSimplifiedQuery(query?: string, params?: SearchParams): Promise<SearchResults> {
    this.logger.log('Executing simplified query fallback');

    if (!query) {
      return await this.fallbackToPopularResults();
    }

    // Simplifier la requête et essayer PostgreSQL
    const simplifiedParams = {
      ...params,
      query: this.simplifyQuery(query),
    };

    return await this.fallbackToPostgreSQL(simplifiedParams.query, simplifiedParams);
  }

  /**
   * Fallback vers des résultats populaires
   */
  private async fallbackToPopularResults(): Promise<SearchResults> {
    this.logger.log('Executing popular results fallback');

    try {
      // Essayer d'abord les résultats populaires en cache
      const cachedPopular = await this.cacheService.getCachedPopularSearches();
      if (cachedPopular && cachedPopular.length > 0) {
        return this.transformCachedPopularResults(cachedPopular);
      }

      // Récupérer les ressources populaires depuis PostgreSQL
      const { resources, total } = await this.apiResourceRepository.search(
        { verified: true }, // Ressources vérifiées seulement
        { limit: 20, offset: 0 }
      );

      const results = this.transformPostgreSQLResults(resources, total);

      // Mettre en cache les résultats populaires
      await this.cacheService.cachePopularSearches(resources);

      this.logger.log(`Popular results fallback returned ${total} results`);
      return results;

    } catch (error) {
      this.logger.error(`Popular results fallback failed: ${error.message}`);
      return this.getEmptyResults();
    }
  }

  /**
   * Fallback pour suggestions depuis PostgreSQL
   */
  private async fallbackSuggestionsFromPostgreSQL(query: string): Promise<any[]> {
    this.logger.log(`Executing PostgreSQL suggestions fallback for: "${query}"`);

    try {
      const { resources } = await this.apiResourceRepository.search(
        { name: query },
        { limit: 10, offset: 0 }
      );

      return resources.map(resource => ({
        text: resource.name,
        type: 'resource',
        score: resource.verified ? 2 : 1,
        metadata: {
          id: resource.id,
          description: resource.description,
          resourceType: resource.resourceType,
        }
      }));

    } catch (error) {
      this.logger.error(`PostgreSQL suggestions fallback failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Essayer de récupérer des résultats depuis le cache
   */
  private async tryGetCachedResults(query?: string, params?: SearchParams): Promise<SearchResults | null> {
    if (!query) return null;

    try {
      const cacheKey = this.generateCacheKey(query, params);
      return await this.cacheService.getCachedSearchResults(cacheKey);
    } catch (error) {
      this.logger.debug(`Cache retrieval failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Construire les filtres pour PostgreSQL
   */
  private buildPostgreSQLFilters(query?: string, filters?: any): any {
    const searchFilters: any = {};

    if (query) {
      searchFilters.name = query;
    }

    if (filters?.categories && filters.categories.length > 0) {
      searchFilters.categoryId = filters.categories[0]; // PostgreSQL ne supporte qu'une catégorie
    }

    if (filters?.resourceTypes && filters.resourceTypes.length > 0) {
      searchFilters.resourceType = filters.resourceTypes[0];
    }

    if (filters?.plans && filters.plans.length > 0) {
      searchFilters.plan = filters.plans[0];
    }

    if (filters?.verified !== undefined) {
      searchFilters.verified = filters.verified;
    }

    if (filters?.city) {
      searchFilters.city = filters.city;
    }

    if (filters?.region) {
      searchFilters.region = filters.region;
    }

    if (filters?.country) {
      searchFilters.country = filters.country;
    }

    // Toujours filtrer les ressources actives pour les recherches publiques
    searchFilters.status = ResourceStatus.ACTIVE;

    return searchFilters;
  }

  /**
   * Transformer les résultats PostgreSQL en format SearchResults
   */
  private transformPostgreSQLResults(resources: any[], total: number, params?: SearchParams): SearchResults {
    const hits: SearchHit[] = resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      description: resource.description,
      resourceType: resource.resourceType as ResourceType,
      category: resource.category ? {
        id: resource.category.id,
        name: resource.category.name,
        slug: resource.category.slug,
      } : {
        id: resource.categoryId,
        name: 'Unknown',
        slug: 'unknown',
      },
      plan: resource.plan as ResourcePlan,
      verified: resource.verified,
      location: resource.latitude && resource.longitude ? {
        latitude: typeof resource.latitude === 'object' ? resource.latitude.toNumber() : resource.latitude,
        longitude: typeof resource.longitude === 'object' ? resource.longitude.toNumber() : resource.longitude,
        city: resource.city,
        region: resource.region,
        country: resource.country,
      } : undefined,
      contact: {
        phone: resource.phone,
        email: resource.email,
        website: resource.website,
      },
      tags: [], // PostgreSQL ne stocke pas les tags dans ce format
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      score: resource.verified ? 2 : 1, // Score basique basé sur la vérification
    }));

    return {
      hits,
      total,
      facets: this.getEmptyFacets(),
      took: 0, // PostgreSQL ne fournit pas de métrique de temps
      page: params?.pagination?.page,
      limit: params?.pagination?.limit,
      hasMore: hits.length === (params?.pagination?.limit || 20),
    };
  }

  /**
   * Transformer les résultats populaires en cache
   */
  private transformCachedPopularResults(cachedResults: any[]): SearchResults {
    const hits: SearchHit[] = cachedResults.slice(0, 20).map(resource => ({
      id: resource.id,
      name: resource.name,
      description: resource.description,
      resourceType: resource.resourceType as ResourceType,
      category: {
        id: resource.categoryId,
        name: 'Popular',
        slug: 'popular',
      },
      plan: resource.plan as ResourcePlan,
      verified: resource.verified,
      location: resource.latitude && resource.longitude ? {
        latitude: typeof resource.latitude === 'object' ? resource.latitude.toNumber() : resource.latitude,
        longitude: typeof resource.longitude === 'object' ? resource.longitude.toNumber() : resource.longitude,
        city: resource.city,
        region: resource.region,
        country: resource.country,
      } : undefined,
      contact: {
        phone: resource.phone,
        email: resource.email,
        website: resource.website,
      },
      tags: [],
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      score: 3, // Score élevé pour les résultats populaires
    }));

    return {
      hits,
      total: hits.length,
      facets: this.getEmptyFacets(),
      took: 0,
      hasMore: false,
    };
  }

  /**
   * Générer une clé de cache
   */
  private generateCacheKey(query?: string, params?: SearchParams): string {
    const keyParts = [
      query || '',
      JSON.stringify(params?.filters || {}),
      JSON.stringify(params?.sort || {}),
      JSON.stringify(params?.pagination || {}),
    ];

    return keyParts.join('|');
  }

  /**
   * Vérifier si Elasticsearch est disponible
   */
  async isElasticsearchAvailable(): Promise<boolean> {
    // Cette méthode sera utilisée par d'autres services pour vérifier la disponibilité
    // avant de faire des requêtes Elasticsearch
    return true; // Implémentation basique - peut être améliorée
  }

  /**
   * Obtenir des métriques d'erreur pour monitoring
   */
  getErrorMetrics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    fallbacksUsed: Record<string, number>;
  } {
    // Implémentation basique - peut être étendue avec des compteurs réels
    return {
      totalErrors: 0,
      errorsByType: {},
      fallbacksUsed: {},
    };
  }
}