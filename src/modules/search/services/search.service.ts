import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SearchParams,
  SearchResults,
  SearchFilters,
  PriceRange,
  DateRange,
  GeoLocation,
  SearchMetrics,
  TimePeriod,
  DateRangeWithGranularity,
  HealthStatus,
  SearchHit,
  SearchFacets,
  SortField,
  SortOrder
} from '../interfaces/search.interfaces';
import { ISearchService } from '../interfaces/search-service.interface';
import { Suggestion, SuggestionType } from '../types/suggestion.types';
import { ElasticsearchService } from './elasticsearch.service';
import { SearchCacheService } from './search-cache.service';
import { SearchErrorHandler } from './search-error-handler.service';
import { GeocodingService, GeocodingResult } from './geocoding.service';
import { CategoryRepository } from '../../../repositories/category.repository';
import { SearchAnalyticsService } from './search-analytics.service';
import { PersonalizedSearchService, PersonalizedSearchParams } from './personalized-search.service';
import { LanguageDetectionService, SupportedLanguage, LanguageDetectionResult } from './language-detection.service';


@Injectable()
export class SearchService implements ISearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly cacheService: SearchCacheService,
    private readonly configService: ConfigService,
    private readonly errorHandler: SearchErrorHandler,
    private readonly geocodingService: GeocodingService,
    private readonly categoryRepository: CategoryRepository,
    private readonly analyticsService: SearchAnalyticsService,
    private readonly personalizedSearchService: PersonalizedSearchService,
    private readonly languageDetectionService: LanguageDetectionService,
  ) { }

  /**
   * Recherche principale avec paramètres complets
   */
  async search(params: SearchParams): Promise<SearchResults> {
    const startTime = Date.now();

    try {
      // Préprocesser la requête pour optimiser la recherche multilingue
      const { detectedLanguage, ...processedParams } = this.preprocessSearchParams(params);

      this.logger.debug(`Starting search with processed params: ${JSON.stringify(processedParams)}`);

      // Générer la clé de cache
      const cacheKey = this.generateCacheKey(processedParams);

      // Vérifier le cache
      const cachedResults = await this.cacheService.getCachedSearchResults(cacheKey);
      if (cachedResults) {
        this.logger.debug(`Returning cached results for key: ${cacheKey}`);
        return cachedResults;
      }

      // Construire la requête Elasticsearch optimisée
      const esQuery = this.buildElasticsearchQuery(processedParams);

      // Ajouter des paramètres de recherche optimisés
      esQuery.track_total_hits = true;
      esQuery.timeout = '30s';
      esQuery.min_score = 0.1; // Filtrer les résultats avec score trop faible

      // Ajouter le highlighting pour mettre en évidence les termes trouvés
      if (processedParams.query) {
        esQuery.highlight = this.buildHighlightConfig();
      }

      // Exécuter la recherche
      const indexName = this.configService.get('elasticsearch.indices.resources');
      const response = await this.elasticsearchService.search(indexName, esQuery);

      // Transformer les résultats
      const results = this.transformSearchResults(response, processedParams);

      // Mettre en cache les résultats
      await this.cacheService.cacheSearchResults(cacheKey, results);

      const took = Date.now() - startTime;
      results.took = took;

      this.logger.debug(`Search completed in ${took}ms, found ${results.total} results`);

      // Log search analytics (async, don't wait for completion)
      this.logSearchAnalytics(processedParams, results, took, detectedLanguage).catch(error => {
        this.logger.warn('Failed to log search analytics', error);
      });

      return results;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);

      // Utiliser le gestionnaire d'erreurs pour fournir des résultats de fallback
      return await this.errorHandler.handleSearchError(error, params.query);
    }
  }

  /**
   * Suggestions auto-complete avec support avancé et multilingue
   */
  async suggest(query: string, limit = 10, userId?: string, language?: string): Promise<Suggestion[]> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Getting suggestions for query: "${query}"`);

      // Vérifier la longueur minimale (requirement 3.1)
      if (query.length < 2) {
        return [];
      }

      // Détecter la langue et normaliser la requête
      const detectedLanguage = this.languageDetectionService.detectLanguage(query);
      const effectiveLanguage = language as SupportedLanguage || detectedLanguage.language;

      let normalizedQuery: string;
      if (effectiveLanguage === SupportedLanguage.FRENCH) {
        normalizedQuery = this.normalizeFrenchQuery(query.trim());
      } else if (effectiveLanguage === SupportedLanguage.ENGLISH) {
        normalizedQuery = this.normalizeEnglishQuery(query.trim());
      } else {
        normalizedQuery = this.normalizeMultilingualQuery(query.trim());
      }

      // Vérifier le cache avec clé améliorée
      const cacheKey = this.generateSuggestionCacheKey(normalizedQuery, limit, userId);
      const cachedSuggestions = await this.cacheService.getCachedSuggestions(cacheKey);
      if (cachedSuggestions) {
        this.logger.debug(`Returning cached suggestions for query: "${normalizedQuery}"`);
        return cachedSuggestions;
      }

      // Construire la requête de suggestion avec popularité et support multilingue
      const suggestionQuery = this.buildAdvancedSuggestionQuery(normalizedQuery, limit, userId, effectiveLanguage);

      // Exécuter la recherche de suggestions
      const indexName = this.configService.get('elasticsearch.indices.resources');
      const response = await this.elasticsearchService.search(indexName, suggestionQuery);

      // Transformer les suggestions avec classement par popularité
      const suggestions = this.transformAdvancedSuggestionResults(response, normalizedQuery, userId);

      // Mettre en cache avec TTL approprié (1 heure pour suggestions)
      await this.cacheService.cacheSuggestions(cacheKey, suggestions);

      const took = Date.now() - startTime;
      this.logger.debug(`Suggestions completed in ${took}ms, found ${suggestions.length} suggestions`);

      return suggestions;
    } catch (error) {
      return await this.errorHandler.handleSuggestionError(error, query);
    }
  }

  /**
   * Recherche par catégorie avec support hiérarchique
   * Requirements: 6.1, 6.2, 6.4
   */
  async searchByCategory(categoryId: string, params: SearchParams): Promise<SearchResults> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Searching by category: ${categoryId} with hierarchical support`);

      // Vérifier que la catégorie existe
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new Error(`Category with ID ${categoryId} not found`);
      }

      // Obtenir toutes les sous-catégories récursivement
      const subcategoryIds = await this.getAllSubcategoryIds(categoryId);
      const allCategoryIds = [categoryId, ...subcategoryIds];

      this.logger.debug(`Including ${allCategoryIds.length} categories in search: ${allCategoryIds.join(', ')}`);

      // Construire les paramètres de recherche avec toutes les catégories
      const categoryParams: SearchParams = {
        ...params,
        filters: {
          ...params.filters,
          categories: allCategoryIds
        }
      };

      // Effectuer la recherche
      const results = await this.search(categoryParams);

      // Enrichir les résultats avec des informations de catégorie
      const enrichedResults = {
        ...results,
        took: Date.now() - startTime,
        // Ajouter des métadonnées sur la recherche par catégorie
        metadata: {
          ...results.metadata,
          categoryId,
          subcategoriesIncluded: subcategoryIds.length,
          totalCategoriesSearched: allCategoryIds.length
        }
      };

      this.logger.debug(`Category search completed in ${enrichedResults.took}ms with ${results.total} results`);
      return enrichedResults;

    } catch (error) {
      this.logger.error(`Category search failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Recherche par catégorie avec navigation hiérarchique complète
   * Utilise le CategorySearchService pour des fonctionnalités avancées
   */
  async searchByCategoryWithHierarchy(categoryId: string, params: SearchParams): Promise<SearchResults> {
    this.logger.debug(`Searching by category with hierarchy: ${categoryId}`);

    // Cette méthode sera implémentée via injection du CategorySearchService
    // Pour l'instant, utiliser la recherche standard
    return this.searchByCategory(categoryId, params);
  }

  /**
   * Obtenir tous les IDs des sous-catégories récursivement
   * Requirements: 6.1, 6.2
   */
  private async getAllSubcategoryIds(categoryId: string, maxDepth: number = 5): Promise<string[]> {
    if (maxDepth <= 0) {
      return [];
    }

    try {
      // Obtenir les enfants directs
      const children = await this.categoryRepository.findMany({
        where: { parentId: categoryId }
      });

      const childIds = children.map(child => child.id);
      const allIds = [...childIds];

      // Récursivement obtenir les sous-catégories
      for (const childId of childIds) {
        const grandChildren = await this.getAllSubcategoryIds(childId, maxDepth - 1);
        allIds.push(...grandChildren);
      }

      return allIds;

    } catch (error) {
      this.logger.error(`Failed to get subcategory IDs for ${categoryId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Recherche géographique avec filtres avancés
   */
  async searchNearby(location: GeoLocation, radius: number, params: SearchParams): Promise<SearchResults> {
    this.logger.debug(`Searching nearby location: ${location.latitude}, ${location.longitude} within ${radius}km`);

    // Valider les paramètres géographiques
    if (!this.isValidGeoLocation(location)) {
      throw new Error('Invalid geographic location provided');
    }

    if (radius <= 0 || radius > 1000) {
      throw new Error('Radius must be between 0 and 1000 km');
    }

    // Ajouter le filtre géographique aux paramètres
    const geoParams: SearchParams = {
      ...params,
      filters: {
        ...params.filters,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius,
          unit: 'km'
        }
      },
      sort: {
        field: SortField.DISTANCE,
        order: SortOrder.ASC
      }
    };

    const results = await this.search(geoParams);

    // Enrichir les résultats avec les distances calculées
    results.hits = results.hits.map(hit => ({
      ...hit,
      location: {
        ...hit.location,
        distance: hit.location ? this.calculateDistance(
          location.latitude,
          location.longitude,
          hit.location.latitude,
          hit.location.longitude
        ) : undefined
      }
    }));

    return results;
  }

  /**
   * Recherche par ville avec support des variantes
   */
  async searchByCity(city: string, params: SearchParams): Promise<SearchResults> {
    this.logger.debug(`Searching by city: ${city}`);

    if (!city || city.trim().length === 0) {
      throw new Error('City name is required');
    }

    const cityParams: SearchParams = {
      ...params,
      filters: {
        ...params.filters,
        city: city.trim()
      }
    };

    return this.search(cityParams);
  }

  /**
   * Recherche par région avec support hiérarchique
   */
  async searchByRegion(region: string, params: SearchParams): Promise<SearchResults> {
    this.logger.debug(`Searching by region: ${region}`);

    if (!region || region.trim().length === 0) {
      throw new Error('Region name is required');
    }

    const regionParams: SearchParams = {
      ...params,
      filters: {
        ...params.filters,
        region: region.trim()
      }
    };

    return this.search(regionParams);
  }

  /**
   * Recherche avec géocodage automatique d'une adresse
   */
  async searchByAddress(address: string, radius: number = 10, params: SearchParams): Promise<SearchResults> {
    this.logger.debug(`Searching by address: ${address} within ${radius}km`);

    if (!address || address.trim().length === 0) {
      throw new Error('Address is required');
    }

    try {
      // Géocoder l'adresse
      const geocodingResult = await this.geocodingService.geocodeAddress(address);

      if (!geocodingResult) {
        // Si le géocodage échoue, essayer une recherche textuelle
        this.logger.warn(`Geocoding failed for address: ${address}, falling back to text search`);
        return this.searchWithAddressFallback(address, params);
      }

      // Utiliser les coordonnées pour une recherche géographique
      return this.searchNearby(geocodingResult.location, radius, {
        ...params,
        filters: {
          ...params.filters,
          // Ajouter des filtres basés sur l'adresse géocodée si disponible
          city: geocodingResult.address.city,
          region: geocodingResult.address.region,
          country: geocodingResult.address.country
        }
      });
    } catch (error) {
      this.logger.error(`Address search failed: ${error.message}`);
      // Fallback vers recherche textuelle
      return this.searchWithAddressFallback(address, params);
    }
  }

  /**
   * Obtenir la position utilisateur et effectuer une recherche
   */
  async searchNearUser(userLocation: GeoLocation, radius: number = 25, params: SearchParams): Promise<SearchResults> {
    this.logger.debug(`Searching near user location: ${userLocation.latitude}, ${userLocation.longitude}`);

    if (!this.isValidGeoLocation(userLocation)) {
      throw new Error('Invalid user location provided');
    }

    try {
      // Enrichir avec l'adresse de l'utilisateur via géocodage inverse
      const reverseResult = await this.geocodingService.reverseGeocode(
        userLocation.latitude,
        userLocation.longitude
      );

      const enrichedParams: SearchParams = {
        ...params,
        filters: {
          ...params.filters,
          // Ajouter des filtres contextuels basés sur la localisation
          ...(reverseResult && {
            city: reverseResult.address.city,
            region: reverseResult.address.region,
            country: reverseResult.address.country
          })
        }
      };

      return this.searchNearby(userLocation, radius, enrichedParams);
    } catch (error) {
      this.logger.error(`User location search failed: ${error.message}`);
      // Fallback vers recherche géographique simple
      return this.searchNearby(userLocation, radius, params);
    }
  }

  /**
   * Recherche de fallback quand le géocodage échoue
   */
  private async searchWithAddressFallback(address: string, params: SearchParams): Promise<SearchResults> {
    // Extraire les éléments d'adresse pour filtres textuels
    const addressParts = this.parseAddressComponents(address);

    const fallbackParams: SearchParams = {
      ...params,
      query: params.query ? `${params.query} ${address}` : address,
      filters: {
        ...params.filters,
        ...addressParts
      }
    };

    return this.search(fallbackParams);
  }

  /**
   * Parser les composants d'une adresse
   */
  private parseAddressComponents(address: string): Partial<SearchFilters> {
    const components: Partial<SearchFilters> = {};
    const normalizedAddress = address.toLowerCase().trim();

    // Détecter les villes camerounaises communes
    const cameroonCities = ['yaoundé', 'douala', 'bamenda', 'bafoussam', 'garoua', 'maroua', 'ngaoundéré'];
    const frenchCities = ['paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 'strasbourg'];

    for (const city of [...cameroonCities, ...frenchCities]) {
      if (normalizedAddress.includes(city)) {
        components.city = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    // Détecter le pays
    if (normalizedAddress.includes('cameroun') || normalizedAddress.includes('cameroon')) {
      components.country = 'CM';
    } else if (normalizedAddress.includes('france')) {
      components.country = 'FR';
    }

    return components;
  }

  /**
   * Suggestions avec debouncing et limitation de requêtes (requirement 3.6)
   */
  async suggestWithRateLimit(query: string, limit = 10, userId?: string, sessionId?: string, language?: string): Promise<Suggestion[]> {
    // Vérifier la limitation de requêtes
    const rateLimitKey = `suggest_rate_${userId || sessionId || 'anonymous'}`;
    const isAllowed = await this.checkSuggestionRateLimit(rateLimitKey);

    if (!isAllowed) {
      this.logger.warn(`Suggestion rate limit exceeded for ${rateLimitKey}`);
      return [];
    }

    // Appeler la méthode de suggestion normale
    return this.suggest(query, limit, userId, language);
  }

  /**
   * Vérifier la limitation de requêtes pour les suggestions
   */
  private async checkSuggestionRateLimit(key: string): Promise<boolean> {
    try {
      const maxRequests = 30; // 30 requêtes par minute
      const windowMs = 60 * 1000; // 1 minute

      const current = await this.cacheService.redisClient.incr(`rate_limit:${key}`);

      if (current === 1) {
        await this.cacheService.redisClient.expire(`rate_limit:${key}`, Math.ceil(windowMs / 1000));
      }

      return current <= maxRequests;
    } catch (error) {
      this.logger.error(`Rate limit check failed: ${error.message}`);
      return true; // En cas d'erreur, autoriser la requête
    }
  }

  /**
   * Obtenir des suggestions populaires pour pré-cache
   */
  async getPopularSuggestions(limit = 20): Promise<Suggestion[]> {
    try {
      const cacheKey = 'popular_suggestions';
      const cached = await this.cacheService.getCachedSuggestions(cacheKey);

      if (cached) {
        return cached;
      }

      // Requête pour obtenir les termes les plus populaires
      const indexName = this.configService.get('elasticsearch.indices.resources');
      const query = {
        size: 0,
        aggs: {
          popular_names: {
            terms: {
              field: 'name.keyword',
              size: limit,
              order: { avg_popularity: 'desc' }
            },
            aggs: {
              avg_popularity: {
                avg: { field: 'popularity' }
              }
            }
          },
          popular_categories: {
            terms: {
              field: 'category.name.keyword',
              size: Math.ceil(limit / 2),
              order: { doc_count: 'desc' }
            }
          }
        }
      };

      const response = await this.elasticsearchService.search(indexName, query);
      const suggestions = this.transformPopularSuggestions(response);

      // Mettre en cache pour 1 heure
      await this.cacheService.cacheSuggestions(cacheKey, suggestions);

      return suggestions;
    } catch (error) {
      this.logger.error(`Failed to get popular suggestions: ${error.message}`);
      return [];
    }
  }

  /**
   * Transformer les suggestions populaires
   */
  private transformPopularSuggestions(response: any): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Noms populaires
    if (response.aggregations?.popular_names?.buckets) {
      response.aggregations.popular_names.buckets.forEach((bucket: any) => {
        suggestions.push({
          text: bucket.key,
          type: SuggestionType.RESOURCE,
          score: bucket.avg_popularity?.value || bucket.doc_count,
          metadata: {
            popularity: bucket.avg_popularity?.value || 0,
            description: `${bucket.doc_count} ressources`
          }
        });
      });
    }

    // Catégories populaires
    if (response.aggregations?.popular_categories?.buckets) {
      response.aggregations.popular_categories.buckets.forEach((bucket: any) => {
        suggestions.push({
          text: bucket.key,
          type: SuggestionType.CATEGORY,
          score: bucket.doc_count,
          category: bucket.key,
          metadata: {
            description: `${bucket.doc_count} ressources dans cette catégorie`
          }
        });
      });
    }

    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Recherche personnalisée pour utilisateur connecté
   * Requirements: 10.1, 10.2
   */
  async personalizedSearch(
    userId: string,
    params: SearchParams,
    usePersonalization: boolean = true,
    personalizationWeight: number = 0.3
  ): Promise<SearchResults> {
    this.logger.debug(`Personalized search for user: ${userId}, personalization: ${usePersonalization}`);

    try {
      // Créer les paramètres de recherche personnalisée
      const personalizedParams: PersonalizedSearchParams = {
        ...params,
        userId,
        usePersonalization,
        personalizationWeight
      };

      // Appliquer la personnalisation aux paramètres de recherche
      const enhancedParams = await this.personalizedSearchService.personalizeSearchParams(personalizedParams);

      // Effectuer la recherche avec les paramètres personnalisés
      const results = await this.search(enhancedParams);

      // Appliquer la personnalisation au scoring des résultats
      if (usePersonalization) {
        const personalizedResults = await this.personalizedSearchService.personalizeSearchResults(
          results,
          userId,
          personalizationWeight
        );

        this.logger.debug(`Personalized search completed with ${personalizedResults.hits.length} results`);
        return personalizedResults;
      }

      return results;
    } catch (error) {
      this.logger.error(`Personalized search failed: ${error.message}`);
      // Fallback vers recherche standard
      return this.search({ ...params, userId });
    }
  }

  /**
   * Suggestions avec classement par popularité et pertinence (requirement 3.2)
   */
  async suggestWithPopularityRanking(
    query: string,
    limit = 10,
    userId?: string,
    includePopular = true,
    language?: string
  ): Promise<Suggestion[]> {
    try {
      this.logger.debug(`Getting popularity-ranked suggestions for: "${query}"`);

      // Obtenir les suggestions normales
      const suggestions = await this.suggest(query, Math.ceil(limit * 0.8), userId, language);

      // Si on inclut les suggestions populaires et qu'on n'a pas assez de résultats
      if (includePopular && suggestions.length < limit) {
        const popularSuggestions = await this.getPopularSuggestions(limit - suggestions.length);

        // Filtrer les doublons et ajouter les suggestions populaires
        const existingTexts = new Set(suggestions.map(s => s.text.toLowerCase()));
        const uniquePopular = popularSuggestions.filter(
          s => !existingTexts.has(s.text.toLowerCase())
        );

        suggestions.push(...uniquePopular);
      }

      // Re-trier par score de popularité combiné
      return suggestions
        .map(suggestion => ({
          ...suggestion,
          score: this.calculateCombinedPopularityScore(suggestion, query)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      this.logger.error(`Popularity ranking failed: ${error.message}`);
      return await this.suggest(query, limit, userId, language); // Fallback
    }
  }

  /**
   * Calculer un score combiné de popularité et pertinence
   */
  private calculateCombinedPopularityScore(suggestion: Suggestion, query: string): number {
    let score = suggestion.score;

    // Bonus pour correspondance exacte
    if (suggestion.text.toLowerCase() === query.toLowerCase()) {
      score *= 2.0;
    } else if (suggestion.text.toLowerCase().startsWith(query.toLowerCase())) {
      score *= 1.5;
    }

    // Bonus basé sur la popularité
    const popularity = suggestion.metadata?.popularity || 0;
    if (popularity > 0.8) {
      score *= 1.4;
    } else if (popularity > 0.6) {
      score *= 1.2;
    } else if (popularity > 0.4) {
      score *= 1.1;
    }

    // Bonus pour type de suggestion
    switch (suggestion.type) {
      case SuggestionType.RESOURCE:
        score *= 1.0; // Score de base
        break;
      case SuggestionType.CATEGORY:
        score *= 0.9; // Légèrement moins prioritaire
        break;
      case SuggestionType.TAG:
        score *= 0.7; // Moins prioritaire
        break;
      case SuggestionType.LOCATION:
        score *= 0.8;
        break;
    }

    return Math.round(score * 100) / 100;
  }

  /**
   * Obtenir des suggestions contextuelles basées sur l'historique utilisateur
   */
  async getContextualSuggestions(
    query: string,
    userId: string,
    limit = 10,
    language?: string
  ): Promise<Suggestion[]> {
    try {
      // Pour l'instant, utiliser les suggestions normales
      // TODO: Implémenter la logique d'historique utilisateur
      const suggestions = await this.suggest(query, limit, userId, language);

      // Ajouter des métadonnées contextuelles
      return suggestions.map(suggestion => ({
        ...suggestion,
        metadata: {
          ...suggestion.metadata,
          lastUsed: new Date(), // Placeholder - serait récupéré de l'historique
          isRecent: false // Placeholder - serait calculé depuis l'historique
        }
      }));

    } catch (error) {
      this.logger.error(`Contextual suggestions failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Pré-charger les suggestions populaires pour améliorer les performances
   */
  async preloadPopularSuggestions(): Promise<void> {
    try {
      this.logger.debug('Preloading popular suggestions');

      const popularSuggestions = await this.getPopularSuggestions(50);

      // Mettre en cache les suggestions populaires avec une TTL longue
      await this.cacheService.cacheSuggestions('preloaded_popular', popularSuggestions);

      this.logger.debug(`Preloaded ${popularSuggestions.length} popular suggestions`);
    } catch (error) {
      this.logger.error(`Failed to preload popular suggestions: ${error.message}`);
    }
  }

  /**
   * Obtenir des suggestions avec auto-complétion intelligente
   */
  async getSmartAutocompleteSuggestions(
    query: string,
    limit = 10,
    userId?: string,
    language?: string
  ): Promise<Suggestion[]> {
    try {
      // Stratégie multi-niveaux pour l'auto-complétion
      const strategies = [
        // 1. Suggestions exactes (préfixe)
        this.getExactPrefixSuggestions(query, Math.ceil(limit * 0.4)),
        // 2. Suggestions floues (fautes de frappe)
        this.getFuzzySuggestions(query, Math.ceil(limit * 0.3)),
        // 3. Suggestions populaires
        this.getPopularSuggestions(Math.ceil(limit * 0.3))
      ];

      const results = await Promise.allSettled(strategies);
      const allSuggestions: Suggestion[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allSuggestions.push(...result.value);
        } else {
          this.logger.warn(`Suggestion strategy ${index} failed: ${result.reason}`);
        }
      });

      // Déduplication et tri
      const uniqueSuggestions = this.deduplicateSuggestions(allSuggestions);

      return uniqueSuggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      this.logger.error(`Smart autocomplete failed: ${error.message}`);
      return await this.suggest(query, limit, userId, language);
    }
  }

  /**
   * Obtenir des suggestions avec correspondance exacte de préfixe
   */
  private async getExactPrefixSuggestions(query: string, limit: number): Promise<Suggestion[]> {
    const indexName = this.configService.get('elasticsearch.indices.resources');

    const prefixQuery = {
      query: {
        bool: {
          should: [
            {
              prefix: {
                'name.keyword': {
                  value: query,
                  boost: 3.0
                }
              }
            },
            {
              prefix: {
                'category.name.keyword': {
                  value: query,
                  boost: 2.0
                }
              }
            }
          ]
        }
      },
      size: limit,
      _source: ['name', 'category', 'resourceType', 'verified', 'popularity'],
      sort: [
        { _score: { order: 'desc' } },
        { popularity: { order: 'desc' } }
      ]
    };

    try {
      const response = await this.elasticsearchService.search(indexName, prefixQuery);
      return this.transformAdvancedSuggestionResults(response, query);
    } catch (error) {
      this.logger.warn(`Exact prefix suggestions failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtenir des suggestions avec correspondance floue
   */
  private async getFuzzySuggestions(query: string, limit: number): Promise<Suggestion[]> {
    const indexName = this.configService.get('elasticsearch.indices.resources');

    const fuzzyQuery = {
      query: {
        bool: {
          should: [
            {
              fuzzy: {
                name: {
                  value: query,
                  fuzziness: 'AUTO',
                  prefix_length: 1,
                  max_expansions: 50,
                  boost: 2.0
                }
              }
            },
            {
              fuzzy: {
                'category.name': {
                  value: query,
                  fuzziness: 'AUTO',
                  prefix_length: 1,
                  max_expansions: 50,
                  boost: 1.5
                }
              }
            }
          ]
        }
      },
      size: limit,
      _source: ['name', 'category', 'resourceType', 'verified', 'popularity'],
      sort: [
        { _score: { order: 'desc' } },
        { popularity: { order: 'desc' } }
      ]
    };

    try {
      const response = await this.elasticsearchService.search(indexName, fuzzyQuery);
      return this.transformAdvancedSuggestionResults(response, query);
    } catch (error) {
      this.logger.warn(`Fuzzy suggestions failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Déduplication des suggestions
   */
  private deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
    const seen = new Map<string, Suggestion>();

    suggestions.forEach(suggestion => {
      const key = suggestion.text.toLowerCase();
      const existing = seen.get(key);

      if (!existing || suggestion.score > existing.score) {
        seen.set(key, suggestion);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Vérification de santé du service de recherche
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      const checks = await Promise.allSettled([
        this.elasticsearchService.checkConnection(),
        this.cacheService.testConnection(),
        this.checkIndexHealth()
      ]);

      const status = checks.every(check => check.status === 'fulfilled' && check.value)
        ? 'healthy'
        : 'unhealthy';

      return {
        status,
        timestamp: new Date(),
        checks: {
          elasticsearch: checks[0].status,
          redis: checks[1].status,
          index: checks[2].status
        }
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        checks: {
          elasticsearch: 'rejected',
          redis: 'rejected',
          index: 'rejected'
        },
        details: { error: error.message }
      };
    }
  }

  /**
   * Métriques de performance du service
   */
  async getMetrics(period: TimePeriod): Promise<SearchMetrics> {
    // Convertir TimePeriod en DateRangeWithGranularity
    const dateRange = this.convertTimePeriodToDateRange(period);

    // TODO: Implémenter la collecte de métriques depuis la base de données
    // Pour l'instant, retourner des métriques par défaut
    return {
      totalSearches: 0,
      averageResponseTime: 0,
      popularTerms: [],
      noResultsQueries: [],
      clickThroughRate: 0,
      period: dateRange
    };
  }

  /**
   * Convertir TimePeriod en DateRangeWithGranularity
   */
  private convertTimePeriodToDateRange(period: TimePeriod): DateRangeWithGranularity {
    const now = new Date();
    let from: Date;
    let granularity: 'hour' | 'day' | 'week' | 'month';

    switch (period) {
      case TimePeriod.HOUR:
        from = new Date(now.getTime() - 60 * 60 * 1000);
        granularity = 'hour';
        break;
      case TimePeriod.DAY:
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        granularity = 'day';
        break;
      case TimePeriod.WEEK:
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        granularity = 'week';
        break;
      case TimePeriod.MONTH:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        granularity = 'month';
        break;
      default:
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        granularity = 'day';
    }

    return {
      from,
      to: now,
      granularity
    };
  }

  /**
   * Générer une clé de cache pour les paramètres de recherche
   */
  private generateCacheKey(params: SearchParams): string {
    const keyParts = [
      params.query || '',
      JSON.stringify(params.filters || {}),
      JSON.stringify(params.sort || {}),
      JSON.stringify(params.pagination || {}),
      JSON.stringify(params.facets || []),
      params.userId || 'anonymous'
    ];

    return keyParts.join('|');
  }

  /**
   * Préprocesser les paramètres de recherche pour optimiser la recherche multilingue
   */
  private preprocessSearchParams(params: SearchParams): SearchParams & { detectedLanguage?: LanguageDetectionResult } {
    const processedParams = { ...params };
    let detectedLanguage: LanguageDetectionResult | undefined;

    if (params.query) {
      let processedQuery = params.query.trim();

      // Détecter la langue de la requête
      detectedLanguage = this.languageDetectionService.detectLanguage(processedQuery);

      // Déterminer la langue à utiliser (préférence utilisateur ou détection automatique)
      const userLanguage = params.language;
      let effectiveLanguage = detectedLanguage.language;

      if (userLanguage && this.languageDetectionService.isSupportedLanguage(userLanguage)) {
        effectiveLanguage = userLanguage as SupportedLanguage;
        this.logger.debug(`Using user preferred language: ${effectiveLanguage}`);
      } else {
        this.logger.debug(`Using detected language: ${effectiveLanguage} (confidence: ${detectedLanguage.confidence.toFixed(2)})`);
      }

      // Normaliser selon la langue détectée
      if (effectiveLanguage === SupportedLanguage.FRENCH) {
        processedQuery = this.normalizeFrenchQuery(processedQuery);
        processedQuery = this.correctCommonTypos(processedQuery);
        processedQuery = this.expandContextualSynonyms(processedQuery);
      } else if (effectiveLanguage === SupportedLanguage.ENGLISH) {
        processedQuery = this.normalizeEnglishQuery(processedQuery);
        processedQuery = this.correctEnglishTypos(processedQuery);
        processedQuery = this.expandEnglishSynonyms(processedQuery);
      } else {
        // Mode multilingue - normalisation basique
        processedQuery = this.normalizeMultilingualQuery(processedQuery);
      }

      processedParams.query = processedQuery;
      processedParams.language = effectiveLanguage;

      this.logger.debug(`Query preprocessed: "${params.query}" -> "${processedQuery}" (${effectiveLanguage})`);
    }

    return { ...processedParams, detectedLanguage };
  }

  /**
   * Normaliser une requête française (accents, casse, etc.)
   */
  private normalizeFrenchQuery(query: string): string {
    // Conserver la requête originale mais nettoyer les espaces multiples
    return query
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normaliser une requête anglaise
   */
  private normalizeEnglishQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normaliser une requête multilingue
   */
  private normalizeMultilingualQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Corriger les fautes de frappe communes en français
   */
  private correctCommonTypos(query: string): string {
    const commonTypos: Record<string, string> = {
      // Fautes communes sur les mots français
      'resturant': 'restaurant',
      'restaurent': 'restaurant',
      'hotell': 'hotel',
      'hotele': 'hotel',
      'entreprize': 'entreprise',
      'entreprice': 'entreprise',
      'servise': 'service',
      'servic': 'service',
      'tecnologie': 'technologie',
      'technologi': 'technologie',
      'financ': 'finance',
      'educaton': 'education',
      'educatoin': 'education',
      'transpor': 'transport',
      'trasport': 'transport'
    };

    let correctedQuery = query.toLowerCase();

    // Appliquer les corrections mot par mot
    Object.entries(commonTypos).forEach(([typo, correction]) => {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      correctedQuery = correctedQuery.replace(regex, correction);
    });

    return correctedQuery;
  }

  /**
   * Expansion des synonymes contextuels français
   */
  private expandContextualSynonyms(query: string): string {
    const contextualSynonyms: Record<string, string[]> = {
      'api': ['interface', 'service', 'webservice'],
      'resto': ['restaurant'],
      'hotel': ['hébergement', 'logement'],
      'shop': ['boutique', 'magasin'],
      'tech': ['technologie', 'informatique'],
      'finance': ['banque', 'assurance'],
      'medical': ['santé', 'clinique'],
      'education': ['formation', 'école']
    };

    // Pour l'instant, retourner la requête telle quelle
    // L'expansion sera gérée par l'analyseur Elasticsearch avec les synonymes
    return query;
  }

  /**
   * Corriger les fautes de frappe communes en anglais
   */
  private correctEnglishTypos(query: string): string {
    const commonTypos: Record<string, string> = {
      // Fautes communes sur les mots anglais
      'resturant': 'restaurant',
      'restaurent': 'restaurant',
      'hotell': 'hotel',
      'hotele': 'hotel',
      'compeny': 'company',
      'companie': 'company',
      'servise': 'service',
      'servic': 'service',
      'tecnology': 'technology',
      'technologi': 'technology',
      'financ': 'finance',
      'educaton': 'education',
      'educatoin': 'education',
      'transpor': 'transport',
      'trasport': 'transport',
      'bussiness': 'business',
      'busines': 'business'
    };

    let correctedQuery = query.toLowerCase();

    // Appliquer les corrections mot par mot
    Object.entries(commonTypos).forEach(([typo, correction]) => {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      correctedQuery = correctedQuery.replace(regex, correction);
    });

    return correctedQuery;
  }

  /**
   * Expansion des synonymes contextuels anglais
   */
  private expandEnglishSynonyms(query: string): string {
    const contextualSynonyms: Record<string, string[]> = {
      'api': ['interface', 'service', 'webservice'],
      'company': ['business', 'enterprise', 'corporation'],
      'shop': ['store', 'boutique', 'retail'],
      'tech': ['technology', 'it', 'digital'],
      'finance': ['banking', 'insurance', 'credit'],
      'medical': ['health', 'clinic', 'hospital'],
      'education': ['training', 'school', 'university'],
      'transport': ['transportation', 'travel', 'mobility']
    };

    // Pour l'instant, retourner la requête telle quelle
    // L'expansion sera gérée par l'analyseur Elasticsearch avec les synonymes
    return query;
  }

  /**
   * Construire une requête textuelle optimisée avec analyseur multilingue
   */
  private buildTextualQuery(queryText: string, language?: string): any {
    // Nettoyer et préparer la requête
    const cleanQuery = queryText.trim();

    // Déterminer la langue et les champs appropriés
    const detectedLanguage = language as SupportedLanguage || SupportedLanguage.AUTO;
    const searchFields = this.languageDetectionService.getSearchFieldsForLanguage(detectedLanguage);
    const analyzer = this.languageDetectionService.getAnalyzerForLanguage(detectedLanguage);
    const searchAnalyzer = this.languageDetectionService.getSearchAnalyzerForLanguage(detectedLanguage);

    // Stratégie de recherche multi-niveaux pour optimiser la pertinence
    const textualQuery = {
      bool: {
        should: [
          // 1. Correspondance exacte (boost le plus élevé)
          {
            multi_match: {
              query: cleanQuery,
              fields: [
                'name.exact^5',
                'category.name.keyword^3'
              ],
              type: 'phrase',
              boost: 4.0
            }
          },

          // 2. Correspondance de phrase avec analyseur spécifique à la langue
          {
            multi_match: {
              query: cleanQuery,
              fields: searchFields.slice(0, 4), // Prendre les 4 champs les plus importants
              type: 'phrase',
              analyzer: searchAnalyzer,
              boost: 3.0
            }
          },

          // 3. Correspondance de phrase avec préfixe (pour recherches partielles)
          {
            multi_match: {
              query: cleanQuery,
              fields: searchFields.slice(0, 3), // Prendre les 3 champs les plus importants
              type: 'phrase_prefix',
              analyzer: searchAnalyzer,
              boost: 2.5
            }
          },

          // 4. Correspondance best_fields avec fuzziness pour fautes de frappe
          {
            multi_match: {
              query: cleanQuery,
              fields: searchFields,
              type: 'best_fields',
              analyzer: searchAnalyzer,
              fuzziness: 'AUTO',
              prefix_length: 2,
              max_expansions: 50,
              boost: 2.0
            }
          },

          // 5. Correspondance cross_fields pour recherches multi-mots
          {
            multi_match: {
              query: cleanQuery,
              fields: searchFields,
              type: 'cross_fields',
              analyzer: searchAnalyzer,
              minimum_should_match: '75%',
              boost: 1.5
            }
          },

          // 6. Recherche dans l'adresse pour requêtes géographiques
          {
            multi_match: {
              query: cleanQuery,
              fields: [
                'address.city^2.0',
                'address.region^1.8',
                'address.street^1.5'
              ],
              type: 'best_fields',
              analyzer: analyzer,
              fuzziness: 'AUTO',
              boost: 1.2
            }
          }
        ],
        minimum_should_match: 1
      }
    };

    // Ajouter des boosts contextuels selon la longueur de la requête
    if (cleanQuery.length <= 3) {
      // Pour les requêtes courtes, privilégier les correspondances exactes
      textualQuery.bool.should[0].multi_match.boost = 6.0;
      textualQuery.bool.should[1].multi_match.boost = 4.0;
    } else if (cleanQuery.split(' ').length === 1) {
      // Pour les requêtes d'un seul mot, privilégier les préfixes
      textualQuery.bool.should[2].multi_match.boost = 3.5;
    }

    return textualQuery;
  }

  /**
   * Construire la requête Elasticsearch avec filtres avancés
   */
  private buildElasticsearchQuery(params: SearchParams): any {
    const query: any = {
      query: {
        bool: {
          must: [],
          filter: [],
          should: []
        }
      },
      aggs: {},
      from: 0,
      size: 20
    };

    // Requête textuelle avec analyseur multilingue optimisé
    if (params.query) {
      const textQuery = this.buildTextualQuery(params.query, params.language);
      query.query.bool.must.push(textQuery);
    } else {
      // Si pas de requête, utiliser match_all
      query.query.bool.must.push({
        match_all: {}
      });
    }

    // Appliquer les filtres avec logique AND
    if (params.filters) {
      this.applyAdvancedFilters(query, params.filters);
    }

    // Tri avec support géographique
    if (params.sort) {
      query.sort = this.buildSortClause(params.sort, params.filters);
    }

    // Pagination
    if (params.pagination) {
      query.from = params.pagination.offset || ((params.pagination.page || 1) - 1) * (params.pagination.limit || 20);
      query.size = params.pagination.limit || 20;
    }

    // Facettes avec agrégations avancées
    if (params.facets && params.facets.length > 0) {
      this.addFacetAggregations(query, params.facets);
    } else {
      // Ajouter les facettes par défaut si aucune n'est spécifiée
      this.addFacetAggregations(query, ['categories', 'resourceTypes', 'plans', 'verified']);
    }

    // Boost pour ressources vérifiées et populaires
    query.query.bool.should.push(
      {
        term: { verified: { value: true, boost: 1.5 } }
      },
      {
        range: { popularity: { gte: 0.7, boost: 1.2 } }
      },
      {
        range: { rating: { gte: 4.0, boost: 1.1 } }
      }
    );

    return query;
  }

  /**
   * Appliquer les filtres avancés avec validation et logique AND
   */
  private applyAdvancedFilters(query: any, filters: SearchFilters): void {
    // Valider et nettoyer les filtres avant application
    const validatedFilters = this.validateAndCleanFilters(filters);

    // Appliquer les filtres validés
    this.applyFilters(query, validatedFilters);

    // Log des filtres appliqués pour debugging
    this.logger.debug(`Applied filters: ${JSON.stringify(validatedFilters)}`);
  }

  /**
   * Valider et nettoyer les filtres d'entrée
   */
  private validateAndCleanFilters(filters: SearchFilters): SearchFilters {
    const cleanFilters: SearchFilters = {};

    // Valider les catégories
    if (filters.categories && Array.isArray(filters.categories) && filters.categories.length > 0) {
      cleanFilters.categories = filters.categories.filter(cat =>
        typeof cat === 'string' && cat.trim().length > 0
      );
    }

    // Valider les types de ressources
    if (filters.resourceTypes && Array.isArray(filters.resourceTypes) && filters.resourceTypes.length > 0) {
      cleanFilters.resourceTypes = filters.resourceTypes;
    }

    // Valider les plans
    if (filters.plans && Array.isArray(filters.plans) && filters.plans.length > 0) {
      cleanFilters.plans = filters.plans;
    }

    // Valider la fourchette de prix
    if (filters.priceRange) {
      const priceRange: PriceRange = {};

      if (typeof filters.priceRange.min === 'number' && filters.priceRange.min >= 0) {
        priceRange.min = filters.priceRange.min;
      }

      if (typeof filters.priceRange.max === 'number' && filters.priceRange.max >= 0) {
        priceRange.max = filters.priceRange.max;
      }

      // S'assurer que min <= max
      if (priceRange.min !== undefined && priceRange.max !== undefined && priceRange.min > priceRange.max) {
        [priceRange.min, priceRange.max] = [priceRange.max, priceRange.min];
      }

      if (Object.keys(priceRange).length > 0) {
        cleanFilters.priceRange = priceRange;
      }
    }

    // Valider le statut de vérification
    if (typeof filters.verified === 'boolean') {
      cleanFilters.verified = filters.verified;
    }

    // Valider les filtres géographiques
    if (filters.location) {
      const { latitude, longitude, radius } = filters.location;
      if (typeof latitude === 'number' && typeof longitude === 'number' &&
        typeof radius === 'number' && radius > 0) {
        cleanFilters.location = filters.location;
      }
    }

    // Valider les filtres de localisation textuelle
    if (filters.city && typeof filters.city === 'string' && filters.city.trim().length > 0) {
      cleanFilters.city = filters.city.trim();
    }

    if (filters.region && typeof filters.region === 'string' && filters.region.trim().length > 0) {
      cleanFilters.region = filters.region.trim();
    }

    if (filters.country && typeof filters.country === 'string' && filters.country.trim().length > 0) {
      cleanFilters.country = filters.country.trim();
    }

    // Valider les tags
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      cleanFilters.tags = filters.tags.filter(tag =>
        typeof tag === 'string' && tag.trim().length > 0
      ).map(tag => tag.trim());
    }

    // Valider la plage de dates
    if (filters.dateRange) {
      const dateRange: DateRange = {};

      if (filters.dateRange.from instanceof Date) {
        dateRange.from = filters.dateRange.from;
      }

      if (filters.dateRange.to instanceof Date) {
        dateRange.to = filters.dateRange.to;
      }

      if (Object.keys(dateRange).length > 0) {
        cleanFilters.dateRange = dateRange;
      }
    }

    return cleanFilters;
  }

  /**
   * Valider une position géographique
   */
  private isValidGeoLocation(location: GeoLocation): boolean {
    if (!location) return false;

    const { latitude, longitude } = location;

    // Vérifier que les coordonnées sont des nombres valides
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }

    // Vérifier les limites géographiques
    if (latitude < -90 || latitude > 90) {
      return false;
    }

    if (longitude < -180 || longitude > 180) {
      return false;
    }

    return true;
  }

  /**
   * Calculer la distance entre deux points géographiques (formule de Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Arrondir à 2 décimales
  }

  /**
   * Convertir des degrés en radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Construire la configuration de highlighting pour mettre en évidence les termes
   */
  private buildHighlightConfig(): any {
    return {
      pre_tags: ['<mark>'],
      post_tags: ['</mark>'],
      fields: {
        'name': {
          fragment_size: 150,
          number_of_fragments: 1,
          analyzer: 'french_search_analyzer'
        },
        'description': {
          fragment_size: 200,
          number_of_fragments: 2,
          analyzer: 'french_search_analyzer'
        },
        'category.name': {
          fragment_size: 100,
          number_of_fragments: 1,
          analyzer: 'french_search_analyzer'
        },
        'tags': {
          fragment_size: 100,
          number_of_fragments: 3,
          analyzer: 'french_search_analyzer'
        }
      },
      require_field_match: false,
      fragment_size: 150,
      max_analyzed_offset: 1000000
    };
  }

  /**
   * Appliquer les filtres à la requête avec logique AND avancée
   */
  private applyFilters(query: any, filters: any): void {
    // Filtres par catégorie avec support hiérarchique
    if (filters.categories && filters.categories.length > 0) {
      query.query.bool.filter.push({
        terms: { 'category.id': filters.categories }
      });
    }

    // Filtres par type de ressource
    if (filters.resourceTypes && filters.resourceTypes.length > 0) {
      query.query.bool.filter.push({
        terms: { resourceType: filters.resourceTypes }
      });
    }

    // Filtres par plan avec support des options free, premium, featured
    if (filters.plans && filters.plans.length > 0) {
      query.query.bool.filter.push({
        terms: { plan: filters.plans }
      });
    }

    // Filtre par fourchette de prix
    if (filters.priceRange) {
      const priceFilter: any = {};

      if (filters.priceRange.min !== undefined && filters.priceRange.min >= 0) {
        priceFilter.gte = filters.priceRange.min;
      }

      if (filters.priceRange.max !== undefined && filters.priceRange.max >= 0) {
        priceFilter.lte = filters.priceRange.max;
      }

      // Ajouter le filtre de prix seulement si au moins une limite est définie
      if (Object.keys(priceFilter).length > 0) {
        query.query.bool.filter.push({
          range: { 'pricing.basePrice': priceFilter }
        });
      }
    }

    // Filtre par statut de vérification
    if (filters.verified !== undefined) {
      query.query.bool.filter.push({
        term: { verified: filters.verified }
      });
    }

    // Filtres géographiques avec geo_distance
    if (filters.location) {
      query.query.bool.filter.push({
        geo_distance: {
          distance: `${filters.location.radius}${filters.location.unit || 'km'}`,
          location: {
            lat: filters.location.latitude,
            lon: filters.location.longitude
          }
        }
      });
    }

    // Filtres par localisation textuelle avec support des variantes
    if (filters.city) {
      query.query.bool.filter.push({
        bool: {
          should: [
            // Correspondance exacte
            { term: { 'address.city.keyword': filters.city } },
            // Correspondance partielle avec analyseur français
            {
              match: {
                'address.city': {
                  query: filters.city,
                  analyzer: 'french_analyzer',
                  fuzziness: 'AUTO'
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      });
    }

    if (filters.region) {
      query.query.bool.filter.push({
        bool: {
          should: [
            // Correspondance exacte
            { term: { 'address.region.keyword': filters.region } },
            // Correspondance partielle avec analyseur français
            {
              match: {
                'address.region': {
                  query: filters.region,
                  analyzer: 'french_analyzer',
                  fuzziness: 'AUTO'
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      });
    }

    if (filters.country) {
      query.query.bool.filter.push({
        bool: {
          should: [
            // Correspondance exacte par code pays
            { term: { 'address.country.keyword': filters.country } },
            // Correspondance par nom de pays
            {
              match: {
                'address.countryName': {
                  query: filters.country,
                  analyzer: 'french_analyzer'
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      });
    }

    // Filtres par tags avec logique AND
    if (filters.tags && filters.tags.length > 0) {
      // Utiliser une logique AND pour les tags : toutes les tags doivent être présentes
      filters.tags.forEach(tag => {
        query.query.bool.filter.push({
          term: { 'tags.keyword': tag }
        });
      });
    }

    // Filtre par plage de dates
    if (filters.dateRange) {
      const dateFilter: any = {};
      if (filters.dateRange.from) {
        dateFilter.gte = filters.dateRange.from;
      }
      if (filters.dateRange.to) {
        dateFilter.lte = filters.dateRange.to;
      }

      if (Object.keys(dateFilter).length > 0) {
        query.query.bool.filter.push({
          range: { createdAt: dateFilter }
        });
      }
    }
  }

  /**
   * Construire la clause de tri avec support géographique amélioré
   */
  private buildSortClause(sort: any, filters?: SearchFilters): any[] {
    const sortClause: any[] = [];

    switch (sort.field) {
      case SortField.RELEVANCE:
        sortClause.push({ _score: { order: sort.order } });
        break;
      case SortField.NAME:
        sortClause.push({ 'name.keyword': { order: sort.order } });
        break;
      case SortField.CREATED_AT:
        sortClause.push({ createdAt: { order: sort.order } });
        break;
      case SortField.UPDATED_AT:
        sortClause.push({ updatedAt: { order: sort.order } });
        break;
      case SortField.DISTANCE:
        // Ajouter le tri par distance si un filtre géographique est présent
        if (filters?.location) {
          sortClause.push({
            _geo_distance: {
              location: {
                lat: filters.location.latitude,
                lon: filters.location.longitude
              },
              order: sort.order,
              unit: filters.location.unit || 'km',
              mode: 'min',
              distance_type: 'arc'
            }
          });
        } else {
          // Fallback sur le score si pas de localisation
          sortClause.push({ _score: { order: 'desc' } });
        }
        break;
      case SortField.POPULARITY:
        sortClause.push({ popularity: { order: sort.order } });
        break;
      case SortField.RATING:
        sortClause.push({ rating: { order: sort.order } });
        break;
      default:
        sortClause.push({ _score: { order: 'desc' } });
    }

    return sortClause;
  }

  /**
   * Ajouter les agrégations de facettes avec compteurs avancés
   */
  private addFacetAggregations(query: any, facets: string[]): void {
    facets.forEach(facet => {
      switch (facet) {
        case 'categories':
          query.aggs.categories = {
            terms: {
              field: 'category.id',
              size: 50,
              order: { _count: 'desc' }
            },
            aggs: {
              category_names: {
                terms: { field: 'category.name.keyword', size: 1 }
              }
            }
          };
          break;

        case 'resourceTypes':
          query.aggs.resourceTypes = {
            terms: {
              field: 'resourceType',
              size: 10,
              order: { _count: 'desc' }
            }
          };
          break;

        case 'plans':
          query.aggs.plans = {
            terms: {
              field: 'plan',
              size: 5,
              // Ordre personnalisé pour les plans : free, premium, featured
              order: [
                { _key: 'asc' },
                { _count: 'desc' }
              ]
            }
          };
          break;

        case 'priceRanges':
          query.aggs.priceRanges = {
            range: {
              field: 'pricing.basePrice',
              ranges: [
                { key: 'free', to: 0.01 },
                { key: 'low', from: 0.01, to: 50 },
                { key: 'medium', from: 50, to: 200 },
                { key: 'high', from: 200, to: 1000 },
                { key: 'premium', from: 1000 }
              ]
            }
          };
          break;

        case 'cities':
          query.aggs.cities = {
            terms: {
              field: 'address.city.keyword',
              size: 20,
              order: { _count: 'desc' }
            }
          };
          break;

        case 'regions':
          query.aggs.regions = {
            terms: {
              field: 'address.region.keyword',
              size: 20,
              order: { _count: 'desc' }
            }
          };
          break;

        case 'verified':
          query.aggs.verified = {
            terms: {
              field: 'verified',
              size: 2,
              order: { _key: 'desc' } // Verified first
            }
          };
          break;

        case 'tags':
          query.aggs.tags = {
            terms: {
              field: 'tags.keyword',
              size: 30,
              order: { _count: 'desc' },
              min_doc_count: 2 // Seulement les tags avec au moins 2 occurrences
            }
          };
          break;

        case 'popularity':
          query.aggs.popularity = {
            range: {
              field: 'popularity',
              ranges: [
                { key: 'low', to: 0.3 },
                { key: 'medium', from: 0.3, to: 0.7 },
                { key: 'high', from: 0.7 }
              ]
            }
          };
          break;

        case 'rating':
          query.aggs.rating = {
            range: {
              field: 'rating',
              ranges: [
                { key: '1-2', from: 1, to: 3 },
                { key: '3-4', from: 3, to: 4 },
                { key: '4-5', from: 4, to: 5 }
              ]
            }
          };
          break;
      }
    });

    // Ajouter des agrégations globales pour les statistiques
    if (facets.length > 0) {
      query.aggs.global_stats = {
        global: {},
        aggs: {
          total_resources: {
            value_count: { field: '_id' }
          },
          avg_rating: {
            avg: { field: 'rating' }
          },
          verified_count: {
            filter: { term: { verified: true } }
          }
        }
      };
    }
  }

  /**
   * Transformer les résultats Elasticsearch en SearchResults
   */
  private transformSearchResults(response: any, params: SearchParams): SearchResults {
    const userLanguage = params.language || SupportedLanguage.FRENCH;

    const hits: SearchHit[] = response.hits.hits.map((hit: any) => {
      // Détecter la langue du contenu pour chaque résultat
      const contentText = `${hit._source.name} ${hit._source.description || ''}`.trim();
      const languageDetection = this.languageDetectionService.detectLanguage(contentText);
      const contentLanguage = hit._source.language || languageDetection.language;

      // Calculer l'adaptation de langue
      const relevanceBoost = this.calculateLanguageRelevanceBoost(
        userLanguage,
        contentLanguage,
        languageDetection.confidence
      );

      return {
        id: hit._id,
        name: hit._source.name,
        description: hit._source.description,
        resourceType: hit._source.resourceType,
        category: hit._source.category,
        plan: hit._source.plan,
        verified: hit._source.verified,
        location: hit._source.location ? {
          latitude: hit._source.location.lat,
          longitude: hit._source.location.lon,
          city: hit._source.address?.city,
          region: hit._source.address?.region,
          country: hit._source.address?.country,
          distance: hit.sort && hit.sort.length > 1 ? hit.sort[1] : undefined
        } : undefined,
        contact: hit._source.contact,
        tags: hit._source.tags,
        createdAt: new Date(hit._source.createdAt),
        updatedAt: new Date(hit._source.updatedAt),
        score: hit._score * relevanceBoost, // Appliquer le boost de langue
        highlight: hit.highlight,
        language: contentLanguage,
        languageConfidence: languageDetection.confidence,
        languageAdaptation: {
          userLanguage,
          contentLanguage,
          relevanceBoost,
          translationAvailable: this.isTranslationAvailable(contentLanguage, userLanguage)
        }
      };
    });

    // Re-trier les résultats selon les nouveaux scores avec adaptation de langue
    hits.sort((a, b) => b.score - a.score);

    const facets: SearchFacets = this.transformFacets(response.aggregations || {});

    return {
      hits,
      total: response.hits.total.value,
      facets,
      took: response.took,
      page: params.pagination?.page,
      limit: params.pagination?.limit,
      hasMore: hits.length === (params.pagination?.limit || 20),
      metadata: {
        query: params.query,
        filters: params.filters,
        pagination: params.pagination,
        languageAdaptation: {
          userLanguage,
          adaptationApplied: true,
          boostApplied: true
        }
      }
    };
  }

  /**
   * Calculer le boost de pertinence selon la correspondance de langue
   * Requirements: 12.6, 12.7
   */
  private calculateLanguageRelevanceBoost(
    userLanguage: string,
    contentLanguage: string,
    confidence: number
  ): number {
    // Correspondance exacte de langue
    if (userLanguage === contentLanguage) {
      return 1.0 + (confidence * 0.3); // Boost jusqu'à 30% selon la confiance
    }

    // Langues compatibles (français/anglais dans contexte international)
    if (this.areLanguagesCompatible(userLanguage, contentLanguage)) {
      return 1.0 + (confidence * 0.1); // Boost léger pour langues compatibles
    }

    // Pas de correspondance mais contenu de qualité
    if (confidence > 0.8) {
      return 0.95; // Légère pénalité pour contenu de haute qualité
    }

    return 0.85; // Pénalité pour contenu dans une langue différente
  }

  /**
   * Vérifier si deux langues sont compatibles
   */
  private areLanguagesCompatible(lang1: string, lang2: string): boolean {
    const compatiblePairs = [
      ['fr', 'en'], // Français-Anglais (contexte international)
      ['en', 'fr']
    ];

    return compatiblePairs.some(pair =>
      (pair[0] === lang1 && pair[1] === lang2) ||
      (pair[0] === lang2 && pair[1] === lang1)
    );
  }

  /**
   * Vérifier si une traduction est disponible
   */
  private isTranslationAvailable(contentLanguage: string, userLanguage: string): boolean {
    // Pour l'instant, considérer que les traductions sont disponibles
    // entre français et anglais
    return this.areLanguagesCompatible(contentLanguage, userLanguage);
  }

  /**
   * Changer la langue de recherche et adapter les résultats
   * Requirements: 12.6, 12.7
   */
  async changeSearchLanguage(
    originalParams: SearchParams,
    newLanguage: string,
    cacheKey?: string
  ): Promise<SearchResults> {
    this.logger.debug(`Changing search language from ${originalParams.language} to ${newLanguage}`);

    // Valider la nouvelle langue
    if (!this.languageDetectionService.isSupportedLanguage(newLanguage)) {
      throw new Error(`Unsupported language: ${newLanguage}`);
    }

    // Créer de nouveaux paramètres avec la nouvelle langue
    const updatedParams: SearchParams = {
      ...originalParams,
      language: newLanguage
    };

    // Invalider le cache existant si fourni
    if (cacheKey) {
      await this.cacheService.invalidateSearchCache(cacheKey);
    }

    // Effectuer une nouvelle recherche avec la nouvelle langue
    const results = await this.search(updatedParams);

    this.logger.debug(`Language change completed: ${results.total} results adapted for ${newLanguage}`);

    return results;
  }

  /**
   * Obtenir les langues disponibles pour un ensemble de résultats
   */
  async getAvailableLanguagesForResults(resultIds: string[]): Promise<Record<string, string[]>> {
    try {
      const indexName = this.configService.get('elasticsearch.indices.resources');

      const query = {
        query: {
          terms: {
            id: resultIds
          }
        },
        aggs: {
          languages_per_result: {
            terms: {
              field: 'id',
              size: resultIds.length
            },
            aggs: {
              detected_language: {
                terms: {
                  field: 'language',
                  size: 10
                }
              }
            }
          }
        },
        size: 0
      };

      const response = await this.elasticsearchService.search(indexName, query);

      const languageMap: Record<string, string[]> = {};

      if (response.aggregations?.languages_per_result?.buckets) {
        response.aggregations.languages_per_result.buckets.forEach((bucket: any) => {
          const resultId = bucket.key;
          const languages = bucket.detected_language.buckets.map((langBucket: any) => langBucket.key);
          languageMap[resultId] = languages;
        });
      }

      return languageMap;
    } catch (error) {
      this.logger.error(`Failed to get available languages: ${error.message}`);
      return {};
    }
  }

  /**
   * Transformer les agrégations en facettes avec compteurs avancés
   */
  private transformFacets(aggregations: any): SearchFacets {
    const facets: SearchFacets = {
      categories: [],
      resourceTypes: [],
      plans: [],
      cities: [],
      regions: [],
      verified: [],
      tags: []
    };

    // Transformer les facettes de type terms
    Object.keys(aggregations).forEach(key => {
      if (facets.hasOwnProperty(key) && aggregations[key].buckets) {
        facets[key as keyof SearchFacets] = aggregations[key].buckets.map((bucket: any) => {
          const facetBucket: any = {
            key: bucket.key,
            count: bucket.doc_count
          };

          // Ajouter le nom de catégorie si disponible
          if (key === 'categories' && bucket.category_names?.buckets?.length > 0) {
            facetBucket.label = bucket.category_names.buckets[0].key;
          }

          return facetBucket;
        });
      }
    });

    // Transformer les facettes de type range (prix, popularité, rating)
    if (aggregations.priceRanges?.buckets) {
      facets.priceRanges = aggregations.priceRanges.buckets.map((bucket: any) => ({
        key: bucket.key,
        count: bucket.doc_count,
        label: this.getPriceRangeLabel(bucket.key)
      }));
    }

    if (aggregations.popularity?.buckets) {
      facets.popularity = aggregations.popularity.buckets.map((bucket: any) => ({
        key: bucket.key,
        count: bucket.doc_count,
        label: this.getPopularityLabel(bucket.key)
      }));
    }

    if (aggregations.rating?.buckets) {
      facets.rating = aggregations.rating.buckets.map((bucket: any) => ({
        key: bucket.key,
        count: bucket.doc_count,
        label: this.getRatingLabel(bucket.key)
      }));
    }

    // Ajouter les statistiques globales si disponibles
    if (aggregations.global_stats) {
      facets.globalStats = {
        totalResources: aggregations.global_stats.total_resources?.value || 0,
        averageRating: aggregations.global_stats.avg_rating?.value || 0,
        verifiedCount: aggregations.global_stats.verified_count?.doc_count || 0
      };
    }

    return facets;
  }

  /**
   * Obtenir le label pour une fourchette de prix
   */
  private getPriceRangeLabel(key: string): string {
    const labels: Record<string, string> = {
      'free': 'Gratuit',
      'low': '0€ - 50€',
      'medium': '50€ - 200€',
      'high': '200€ - 1000€',
      'premium': '1000€+'
    };
    return labels[key] || key;
  }

  /**
   * Obtenir le label pour un niveau de popularité
   */
  private getPopularityLabel(key: string): string {
    const labels: Record<string, string> = {
      'low': 'Peu populaire',
      'medium': 'Populaire',
      'high': 'Très populaire'
    };
    return labels[key] || key;
  }

  /**
   * Obtenir le label pour une fourchette de rating
   */
  private getRatingLabel(key: string): string {
    const labels: Record<string, string> = {
      '1-2': '⭐⭐ et moins',
      '3-4': '⭐⭐⭐ à ⭐⭐⭐⭐',
      '4-5': '⭐⭐⭐⭐⭐'
    };
    return labels[key] || key;
  }

  /**
   * Générer une clé de cache pour les suggestions
   */
  private generateSuggestionCacheKey(query: string, limit: number, userId?: string): string {
    return `suggest_${query}_${limit}_${userId || 'anonymous'}`;
  }

  /**
   * Construire la requête de suggestion avancée avec popularité et support multilingue
   */
  private buildAdvancedSuggestionQuery(query: string, limit: number, userId?: string, language?: SupportedLanguage): any {
    // Déterminer l'analyseur et les champs selon la langue
    const effectiveLanguage = language || SupportedLanguage.FRENCH;
    const analyzer = this.languageDetectionService.getSearchAnalyzerForLanguage(effectiveLanguage);

    // Champs de recherche selon la langue
    let nameField = 'name';
    let categoryField = 'category.name';
    let tagsField = 'tags';

    if (effectiveLanguage === SupportedLanguage.FRENCH) {
      nameField = 'name.french';
      categoryField = 'category.name.french';
      tagsField = 'tags.french';
    } else if (effectiveLanguage === SupportedLanguage.ENGLISH) {
      nameField = 'name.english';
      categoryField = 'category.name.english';
      tagsField = 'tags.english';
    }

    return {
      // Suggestions de completion avec contexte multilingue
      suggest: {
        name_suggest: {
          prefix: query,
          completion: {
            field: 'name.suggest',
            size: Math.ceil(limit * 0.6), // 60% pour les noms
            skip_duplicates: true,
            contexts: {
              resource_type: ['api', 'enterprise', 'service'],
              language: [effectiveLanguage]
            }
          }
        },
        category_suggest: {
          prefix: query,
          completion: {
            field: 'category.name.suggest',
            size: Math.ceil(limit * 0.3), // 30% pour les catégories
            skip_duplicates: true,
            contexts: {
              language: [effectiveLanguage]
            }
          }
        },
        tag_suggest: {
          prefix: query,
          completion: {
            field: 'tags.suggest',
            size: Math.ceil(limit * 0.1), // 10% pour les tags
            skip_duplicates: true
          }
        }
      },
      // Requête principale pour suggestions textuelles avec support multilingue
      query: {
        bool: {
          should: [
            // Correspondance exacte avec boost très élevé
            {
              match_phrase_prefix: {
                'name.exact': {
                  query: query,
                  boost: 5.0
                }
              }
            },
            // Correspondance avec analyseur spécifique à la langue
            {
              match_phrase_prefix: {
                [nameField]: {
                  query: query,
                  analyzer: analyzer,
                  boost: 4.0
                }
              }
            },
            // Correspondance dans les catégories
            {
              match_phrase_prefix: {
                [categoryField]: {
                  query: query,
                  analyzer: analyzer,
                  boost: 3.0
                }
              }
            },
            // Correspondance dans les tags
            {
              match_phrase_prefix: {
                [tagsField]: {
                  query: query,
                  analyzer: analyzer,
                  boost: 2.0
                }
              }
            },
            // Correspondance floue pour fautes de frappe
            {
              match: {
                [nameField]: {
                  query: query,
                  analyzer: analyzer,
                  fuzziness: 'AUTO',
                  prefix_length: 2,
                  boost: 1.5
                }
              }
            },
            // Boost pour ressources populaires et vérifiées
            { term: { verified: { value: true, boost: 1.5 } } },
            { range: { popularity: { gte: 0.7, boost: 1.3 } } },
            { range: { rating: { gte: 4.0, boost: 1.2 } } }
          ],
          minimum_should_match: 1
        }
      },
      size: limit,
      _source: [
        'name', 'category', 'resourceType', 'tags', 'verified',
        'popularity', 'rating', 'description', 'location'
      ],
      sort: [
        { _score: { order: 'desc' } },
        { popularity: { order: 'desc' } },
        { verified: { order: 'desc' } },
        { rating: { order: 'desc' } }
      ]
    };
  }

  /**
   * Construire la requête de suggestion optimisée pour le français (legacy)
   */
  private buildSuggestionQuery(query: string, limit: number): any {
    const normalizedQuery = this.normalizeFrenchQuery(query);

    return {
      suggest: {
        name_suggest: {
          prefix: normalizedQuery,
          completion: {
            field: 'name.suggest',
            size: limit,
            skip_duplicates: true,
            contexts: {
              resource_type: ['api', 'enterprise', 'service']
            }
          }
        },
        category_suggest: {
          prefix: normalizedQuery,
          completion: {
            field: 'category.name.suggest',
            size: Math.floor(limit / 2),
            skip_duplicates: true
          }
        }
      },
      query: {
        bool: {
          should: [
            // Correspondance exacte avec boost élevé
            {
              match_phrase_prefix: {
                'name.exact': {
                  query: normalizedQuery,
                  boost: 4.0
                }
              }
            },
            // Correspondance avec analyseur français
            {
              match_phrase_prefix: {
                name: {
                  query: normalizedQuery,
                  analyzer: 'french_search_analyzer',
                  boost: 3.0
                }
              }
            },
            // Correspondance dans les catégories
            {
              match_phrase_prefix: {
                'category.name': {
                  query: normalizedQuery,
                  analyzer: 'french_search_analyzer',
                  boost: 2.5
                }
              }
            },
            // Correspondance dans les tags
            {
              match_phrase_prefix: {
                tags: {
                  query: normalizedQuery,
                  analyzer: 'french_search_analyzer',
                  boost: 1.5
                }
              }
            },
            // Correspondance floue pour fautes de frappe
            {
              match: {
                name: {
                  query: normalizedQuery,
                  analyzer: 'french_search_analyzer',
                  fuzziness: 'AUTO',
                  prefix_length: 2,
                  boost: 1.0
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      },
      size: limit,
      _source: ['name', 'category', 'resourceType', 'tags', 'verified', 'popularity'],
      sort: [
        { _score: { order: 'desc' } },
        { popularity: { order: 'desc' } },
        { verified: { order: 'desc' } }
      ]
    };
  }

  /**
   * Transformer les résultats de suggestion avec classement avancé
   */
  private transformAdvancedSuggestionResults(response: any, query: string, userId?: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const seenTexts = new Set<string>();

    // 1. Traiter les suggestions de completion pour les noms
    if (response.suggest?.name_suggest) {
      response.suggest.name_suggest.forEach((suggest: any) => {
        suggest.options.forEach((option: any) => {
          if (!seenTexts.has(option.text.toLowerCase())) {
            seenTexts.add(option.text.toLowerCase());
            suggestions.push({
              text: option.text,
              type: SuggestionType.RESOURCE,
              score: this.calculateSuggestionScore(option, query, 'name'),
              category: option._source?.category?.name,
              resourceType: option._source?.resourceType,
              metadata: {
                id: option._id,
                description: option._source?.description,
                popularity: option._source?.popularity || 0,
                icon: this.getResourceTypeIcon(option._source?.resourceType)
              }
            });
          }
        });
      });
    }

    // 2. Traiter les suggestions de catégories
    if (response.suggest?.category_suggest) {
      response.suggest.category_suggest.forEach((suggest: any) => {
        suggest.options.forEach((option: any) => {
          if (!seenTexts.has(option.text.toLowerCase())) {
            seenTexts.add(option.text.toLowerCase());
            suggestions.push({
              text: option.text,
              type: SuggestionType.CATEGORY,
              score: this.calculateSuggestionScore(option, query, 'category'),
              category: option.text,
              metadata: {
                id: option._id,
                description: `Catégorie: ${option.text}`,
                icon: 'category'
              }
            });
          }
        });
      });
    }

    // 3. Traiter les suggestions de tags
    if (response.suggest?.tag_suggest) {
      response.suggest.tag_suggest.forEach((suggest: any) => {
        suggest.options.forEach((option: any) => {
          if (!seenTexts.has(option.text.toLowerCase())) {
            seenTexts.add(option.text.toLowerCase());
            suggestions.push({
              text: option.text,
              type: SuggestionType.TAG,
              score: this.calculateSuggestionScore(option, query, 'tag'),
              metadata: {
                description: `Tag: ${option.text}`,
                icon: 'tag'
              }
            });
          }
        });
      });
    }

    // 4. Traiter les suggestions de recherche textuelle
    if (response.hits?.hits) {
      response.hits.hits.forEach((hit: any) => {
        const resourceName = hit._source.name;
        if (!seenTexts.has(resourceName.toLowerCase())) {
          seenTexts.add(resourceName.toLowerCase());
          suggestions.push({
            text: resourceName,
            type: SuggestionType.RESOURCE,
            score: this.calculateSuggestionScore(hit, query, 'search'),
            category: hit._source.category?.name,
            resourceType: hit._source.resourceType,
            metadata: {
              id: hit._id,
              description: hit._source.description,
              popularity: hit._source.popularity || 0,
              icon: this.getResourceTypeIcon(hit._source.resourceType)
            }
          });
        }
      });
    }

    // 5. Trier par score avec logique avancée (requirement 3.2)
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        // Priorité 1: Score de pertinence
        if (Math.abs(a.score - b.score) > 0.1) {
          return b.score - a.score;
        }

        // Priorité 2: Type de suggestion (ressources > catégories > tags)
        const typeOrder = {
          [SuggestionType.RESOURCE]: 3,
          [SuggestionType.CATEGORY]: 2,
          [SuggestionType.TAG]: 1
        };
        const typeDiff = typeOrder[b.type] - typeOrder[a.type];
        if (typeDiff !== 0) {
          return typeDiff;
        }

        // Priorité 3: Popularité
        const aPopularity = a.metadata?.popularity || 0;
        const bPopularity = b.metadata?.popularity || 0;
        return bPopularity - aPopularity;
      })
      .slice(0, 10); // Limiter à 10 suggestions max

    this.logger.debug(`Transformed ${sortedSuggestions.length} suggestions for query: "${query}"`);
    return sortedSuggestions;
  }

  /**
   * Calculer le score d'une suggestion basé sur la pertinence et la popularité
   */
  private calculateSuggestionScore(item: any, query: string, type: 'name' | 'category' | 'tag' | 'search'): number {
    let baseScore = item._score || 1;

    // Bonus pour correspondance exacte au début
    const text = item.text || item._source?.name || '';
    if (text.toLowerCase().startsWith(query.toLowerCase())) {
      baseScore *= 1.5;
    }

    // Bonus pour ressources vérifiées
    if (item._source?.verified) {
      baseScore *= 1.3;
    }

    // Bonus basé sur la popularité
    const popularity = item._source?.popularity || 0;
    if (popularity > 0.7) {
      baseScore *= 1.2;
    } else if (popularity > 0.5) {
      baseScore *= 1.1;
    }

    // Bonus basé sur le rating
    const rating = item._source?.rating || 0;
    if (rating >= 4.0) {
      baseScore *= 1.1;
    }

    // Ajustement par type
    switch (type) {
      case 'name':
        baseScore *= 1.0; // Score de base
        break;
      case 'category':
        baseScore *= 0.8; // Légèrement moins prioritaire
        break;
      case 'tag':
        baseScore *= 0.6; // Moins prioritaire
        break;
      case 'search':
        baseScore *= 0.9; // Entre nom et catégorie
        break;
    }

    return Math.round(baseScore * 100) / 100; // Arrondir à 2 décimales
  }

  /**
   * Obtenir l'icône pour un type de ressource
   */
  private getResourceTypeIcon(resourceType: string): string {
    const iconMap: Record<string, string> = {
      'API': 'api',
      'ENTERPRISE': 'building',
      'SERVICE': 'service',
      'TOOL': 'tool',
      'LIBRARY': 'library'
    };

    return iconMap[resourceType] || 'resource';
  }

  /**
   * Transformer les résultats de suggestion (legacy)
   */
  private transformSuggestionResults(response: any, query: string): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Suggestions de completion
    if (response.suggest?.name_suggest) {
      response.suggest.name_suggest.forEach((suggest: any) => {
        suggest.options.forEach((option: any) => {
          suggestions.push({
            text: option.text,
            type: SuggestionType.RESOURCE,
            score: option._score || 1,
            metadata: {
              id: option._id,
              description: option._source?.description
            }
          });
        });
      });
    }

    // Suggestions de recherche textuelle
    if (response.hits?.hits) {
      response.hits.hits.forEach((hit: any) => {
        // Éviter les doublons
        if (!suggestions.find(s => s.text === hit._source.name)) {
          suggestions.push({
            text: hit._source.name,
            type: SuggestionType.RESOURCE,
            score: hit._score,
            category: hit._source.category?.name,
            resourceType: hit._source.resourceType,
            metadata: {
              id: hit._id,
              description: hit._source.description
            }
          });
        }
      });
    }

    // Trier par score et limiter
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Vérifier la santé de l'index
   */
  private async checkIndexHealth(): Promise<boolean> {
    try {
      const indexName = this.configService.get('elasticsearch.indices.resources');
      const health = await this.elasticsearchService.getIndexHealth(indexName);
      return health.status === 'green' || health.status === 'yellow';
    } catch (error) {
      this.logger.error(`Index health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Logger les analytics de recherche de manière asynchrone
   */
  private async logSearchAnalytics(
    params: SearchParams,
    results: SearchResults,
    took: number,
    detectedLanguage?: LanguageDetectionResult
  ): Promise<void> {
    try {
      // Extraire les informations de session et utilisateur depuis les paramètres
      const sessionId = params.sessionId || 'anonymous';
      const userId = params.userId;

      // Préparer les paramètres de log
      const logParams = {
        query: params.query || '',
        filters: params.filters || {},
        userId,
        sessionId,
        userAgent: undefined, // Sera fourni par le controller
        ipAddress: undefined, // Sera fourni par le controller
        resultsCount: results.total,
        took,
        language: params.language,
        detectedLanguage: detectedLanguage?.language
      };

      // Logger la recherche
      await this.analyticsService.logSearch(logParams);

      this.logger.debug(`Search analytics logged for query: "${params.query}" - Results: ${results.total} - Language: ${params.language || detectedLanguage?.language}`);
    } catch (error) {
      // Ne pas faire échouer la recherche si le logging échoue
      this.logger.warn('Failed to log search analytics', error);
    }
  }
}