import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  Headers,
  HttpStatus,
  HttpException,
  Logger,
  ValidationPipe,
  UsePipes,
  ParseIntPipe,
  ParseFloatPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  ParseArrayPipe,
  Req,
  Ip
} from '@nestjs/common';
import { Request } from 'express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery, 
  ApiParam
} from '@nestjs/swagger';
import { SearchService } from '../modules/search/services/search.service';
import { CategorySearchService } from '../modules/search/services/category-search.service';
import { MultiTypeSearchService } from '../modules/search/services/multi-type-search.service';
import { SearchFilterPersistenceService } from '../modules/search/services/search-filter-persistence.service';
import { SearchAnalyticsService } from '../modules/search/services/search-analytics.service';
import { SavedSearchService, SavedSearchDto } from '../modules/search/services/saved-search.service';
import {
  SearchParams,
  SearchResults,
  SearchFilters,
  SortField,
  SortOrder,
  GeoLocation,
  MultiTypeSearchParams,
  MultiTypeSearchResults
} from '../modules/search/interfaces/search.interfaces';
import {
  CategorySearchParams,
  CategorySearchResults
} from '../modules/search/interfaces/category-search.interfaces';
import { ResourceType, ResourcePlan } from '@prisma/client';
import { Suggestion } from '../modules/search/types/suggestion.types';

@ApiTags('Search')
@Controller('api/v1/search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly categorySearchService: CategorySearchService,
    private readonly multiTypeSearchService: MultiTypeSearchService,
    private readonly filterPersistenceService: SearchFilterPersistenceService,
    private readonly analyticsService: SearchAnalyticsService,
    private readonly savedSearchService: SavedSearchService
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Recherche avancée avec filtres',
    description: `
    Effectue une recherche textuelle avancée avec support complet des filtres, facettes et tri.
    
    **Fonctionnalités principales :**
    - Recherche textuelle en langage naturel avec correction orthographique
    - Filtrage par catégorie, type de ressource, plan tarifaire
    - Filtrage géographique par ville/région
    - Filtrage par prix avec fourchettes personnalisées
    - Tri par pertinence, date, nom, popularité, note
    - Facettes avec compteurs pour affinage des résultats
    - Pagination optimisée avec métadonnées complètes
    - Support des highlights pour mise en évidence des termes
    
    **Exemples d'utilisation :**
    - Recherche simple : \`?q=restaurant\`
    - Recherche avec filtres : \`?q=restaurant&city=Douala&verified=true&sort=rating&order=desc\`
    - Recherche par catégorie : \`?categories=123e4567-e89b-12d3-a456-426614174000&resourceTypes=BUSINESS\`
    - Recherche avec prix : \`?q=hotel&minPrice=10000&maxPrice=50000&plans=PREMIUM\`
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultats de recherche avec facettes, pagination et métadonnées complètes'
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur de validation des paramètres'
  })
  @ApiResponse({
    status: 429,
    description: 'Limite de taux dépassée'
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur interne du serveur'
  })
  @ApiQuery({ 
    name: 'q', 
    required: false, 
    description: 'Requête de recherche textuelle en langage naturel (max 200 caractères)',
    example: 'restaurant douala cuisine africaine',
    schema: { type: 'string', maxLength: 200 }
  })
  @ApiQuery({ 
    name: 'categories', 
    required: false, 
    description: 'IDs des catégories à filtrer (séparés par virgule). Utilise une logique AND.',
    example: '123e4567-e89b-12d3-a456-426614174000,456e7890-e89b-12d3-a456-426614174001',
    schema: { type: 'array', items: { type: 'string', format: 'uuid' } }
  })
  @ApiQuery({ 
    name: 'resourceTypes', 
    required: false, 
    description: 'Types de ressources à inclure dans les résultats',
    example: 'BUSINESS,API',
    enum: ResourceType,
    isArray: true
  })
  @ApiQuery({ 
    name: 'plans', 
    required: false, 
    description: 'Plans tarifaires à filtrer',
    example: 'FREE,PREMIUM',
    enum: ResourcePlan,
    isArray: true
  })
  @ApiQuery({ 
    name: 'minPrice', 
    required: false, 
    description: 'Prix minimum en FCFA (inclus)',
    example: 1000,
    schema: { type: 'integer', minimum: 0 }
  })
  @ApiQuery({ 
    name: 'maxPrice', 
    required: false, 
    description: 'Prix maximum en FCFA (inclus)',
    example: 50000,
    schema: { type: 'integer', minimum: 0 }
  })
  @ApiQuery({ 
    name: 'verified', 
    required: false, 
    description: 'Filtrer uniquement les ressources vérifiées par l\'équipe ROMAPI',
    example: true,
    schema: { type: 'boolean' }
  })
  @ApiQuery({ 
    name: 'city', 
    required: false, 
    description: 'Ville pour filtrage géographique (insensible à la casse)',
    example: 'Douala',
    schema: { type: 'string' }
  })
  @ApiQuery({ 
    name: 'region', 
    required: false, 
    description: 'Région pour filtrage géographique (insensible à la casse)',
    example: 'Littoral',
    schema: { type: 'string' }
  })
  @ApiQuery({ 
    name: 'tags', 
    required: false, 
    description: 'Tags à rechercher (séparés par virgule, logique OR)',
    example: 'cuisine,livraison,africaine',
    schema: { type: 'array', items: { type: 'string' } }
  })
  @ApiQuery({ 
    name: 'sort', 
    required: false, 
    description: 'Champ de tri des résultats',
    example: 'relevance',
    enum: ['relevance', 'createdAt', 'updatedAt', 'name', 'popularity', 'rating', 'distance']
  })
  @ApiQuery({ 
    name: 'order', 
    required: false, 
    description: 'Ordre de tri (croissant ou décroissant)',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Numéro de page (commence à 1)',
    example: 1,
    schema: { type: 'integer', minimum: 1 }
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Nombre de résultats par page (maximum 100)',
    example: 20,
    schema: { type: 'integer', minimum: 1, maximum: 100 }
  })
  @ApiQuery({ 
    name: 'facets', 
    required: false, 
    description: 'Facettes à inclure dans la réponse pour filtrage dynamique',
    example: 'categories,resourceTypes,plans,verified',
    schema: { 
      type: 'array', 
      items: { 
        type: 'string', 
        enum: ['categories', 'resourceTypes', 'plans', 'verified', 'tags', 'cities', 'regions'] 
      } 
    }
  })
  @ApiQuery({ 
    name: 'language', 
    required: false, 
    description: 'Langue préférée pour la recherche et les résultats',
    example: 'fr',
    enum: ['fr', 'en', 'auto'],
    schema: { type: 'string' }
  })
  async search(
    @Req() request: Request,
    @Ip() ipAddress: string,
    @Query('q') query?: string,
    @Query('categories', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) categories?: string[],
    @Query('resourceTypes', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) resourceTypes?: ResourceType[],
    @Query('plans', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) plans?: ResourcePlan[],
    @Query('minPrice', new DefaultValuePipe(undefined), new ParseIntPipe({ optional: true })) minPrice?: number,
    @Query('maxPrice', new DefaultValuePipe(undefined), new ParseIntPipe({ optional: true })) maxPrice?: number,
    @Query('verified', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) verified?: boolean,
    @Query('city') city?: string,
    @Query('region') region?: string,
    @Query('tags', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) tags?: string[],
    @Query('sort', new DefaultValuePipe(SortField.RELEVANCE)) sort?: SortField,
    @Query('order', new DefaultValuePipe(SortOrder.DESC)) order?: SortOrder,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('facets', new DefaultValuePipe('categories,resourceTypes,plans,verified'), new ParseArrayPipe({ items: String, separator: ',', optional: true })) facets?: string[],
    @Query('language') language?: string
  ): Promise<SearchResults> {
    try {
      this.logger.debug(`Search request: q="${query}", filters=${JSON.stringify({
        categories, resourceTypes, plans, minPrice, maxPrice, verified, city, region, tags
      })}`);

      // Construire les filtres
      const filters: SearchFilters = {};

      if (categories && categories.length > 0 && categories[0] !== '') {
        filters.categories = categories;
      }

      if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
        filters.resourceTypes = resourceTypes;
      }

      if (plans && plans.length > 0 && plans[0]) {
        filters.plans = plans;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        filters.priceRange = {};
        if (minPrice !== undefined) filters.priceRange.min = minPrice;
        if (maxPrice !== undefined) filters.priceRange.max = maxPrice;
      }

      if (verified !== undefined) {
        filters.verified = verified;
      }

      if (city) {
        filters.city = city;
      }

      if (region) {
        filters.region = region;
      }

      if (tags && tags.length > 0 && tags[0] !== '') {
        filters.tags = tags;
      }

      // Générer un ID de session unique pour cette recherche
      const sessionId = this.generateSessionId(request);
      const userId = this.extractUserId(request); // Extraire l'ID utilisateur si authentifié

      // Construire les paramètres de recherche
      const searchParams: SearchParams = {
        query: query || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sort: {
          field: sort || SortField.RELEVANCE,
          order: order || SortOrder.DESC
        },
        pagination: {
          page: page || 1,
          limit: Math.min(limit || 20, 100) // Limiter à 100 résultats max
        },
        facets: facets && facets.length > 0 ? facets : ['categories', 'resourceTypes', 'plans', 'verified'],
        userId,
        sessionId,
        language: language || undefined
      };

      const results = await this.searchService.search(searchParams);

      // Logger les analytics de recherche de manière asynchrone
      this.logSearchAnalytics(searchParams, results, request, ipAddress).catch(error => {
        this.logger.warn('Failed to log search analytics', error);
      });

      this.logger.debug(`Search completed: ${results.total} results found in ${results.took}ms`);

      return results;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la recherche',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('suggest')
  @ApiOperation({ 
    summary: 'Suggestions auto-complete avancées',
    description: `
    Fournit des suggestions de recherche intelligentes avec auto-complétion en temps réel.
    
    **Fonctionnalités :**
    - Suggestions basées sur la popularité et la pertinence
    - Support de la personnalisation utilisateur
    - Correction orthographique automatique
    - Suggestions de catégories et ressources
    - Rate limiting par session/utilisateur
    - Debouncing côté client recommandé (300ms)
    
    **Types de suggestions :**
    - \`query\` : Requêtes de recherche populaires
    - \`category\` : Noms de catégories correspondants
    - \`resource\` : Noms de ressources spécifiques
    - \`popular\` : Suggestions tendances
    
    **Optimisations :**
    - Cache Redis pour réponses rapides
    - Pré-calcul des suggestions populaires
    - Limitation automatique des requêtes abusives
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des suggestions classées par pertinence avec métadonnées'
  })
  @ApiResponse({
    status: 400,
    description: 'Requête trop courte ou paramètres invalides'
  })
  @ApiResponse({
    status: 429,
    description: 'Limite de suggestions dépassée'
  })
  @ApiQuery({ 
    name: 'q', 
    required: true, 
    description: 'Début de la requête pour suggestions (minimum 2 caractères, maximum 100)',
    example: 'rest',
    schema: { type: 'string', minLength: 2, maxLength: 100 }
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Nombre maximum de suggestions à retourner (maximum 20)',
    example: 10,
    schema: { type: 'integer', minimum: 1, maximum: 20 }
  })
  @ApiQuery({ 
    name: 'userId', 
    required: false, 
    description: 'ID utilisateur pour personnalisation des suggestions basée sur l\'historique',
    example: 'user_123456',
    schema: { type: 'string' }
  })
  @ApiQuery({ 
    name: 'includePopular', 
    required: false, 
    description: 'Inclure les suggestions populaires même si elles ne matchent pas exactement',
    example: true,
    schema: { type: 'boolean' }
  })
  @ApiQuery({ 
    name: 'sessionId', 
    required: false, 
    description: 'ID de session pour rate limiting et analytics',
    example: 'session_789012',
    schema: { type: 'string' }
  })
  @ApiQuery({ 
    name: 'language', 
    required: false, 
    description: 'Langue préférée pour les suggestions',
    example: 'fr',
    enum: ['fr', 'en', 'auto'],
    schema: { type: 'string' }
  })
  async suggest(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('userId') userId?: string,
    @Query('includePopular', new DefaultValuePipe(true), new ParseBoolPipe({ optional: true })) includePopular?: boolean,
    @Query('sessionId') sessionId?: string,
    @Query('language') language?: string
  ): Promise<Suggestion[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      this.logger.debug(`Advanced suggestion request: q="${query}", limit=${limit}, userId=${userId}, includePopular=${includePopular}`);

      // Utiliser les suggestions avec rate limiting si sessionId fourni
      let suggestions: Suggestion[];
      
      if (sessionId || userId) {
        suggestions = await this.searchService.suggestWithRateLimit(
          query.trim(),
          Math.min(limit || 10, 20),
          userId,
          sessionId,
          language
        );
      } else {
        // Utiliser les suggestions avec classement par popularité
        suggestions = await this.searchService.suggestWithPopularityRanking(
          query.trim(),
          Math.min(limit || 10, 20),
          userId,
          includePopular,
          language
        );
      }

      this.logger.debug(`Advanced suggestions completed: ${suggestions.length} suggestions found`);

      return suggestions;
    } catch (error) {
      this.logger.error(`Advanced suggestions failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des suggestions',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('suggest/popular')
  @ApiOperation({ 
    summary: 'Suggestions populaires',
    description: 'Obtient les suggestions les plus populaires pour pré-cache ou affichage initial'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des suggestions populaires',
    type: [Object]
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre maximum de suggestions populaires' })
  async getPopularSuggestions(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ): Promise<Suggestion[]> {
    try {
      this.logger.debug(`Popular suggestions request: limit=${limit}`);

      const suggestions = await this.searchService.getPopularSuggestions(
        Math.min(limit || 20, 50) // Limiter à 50 suggestions max
      );

      this.logger.debug(`Popular suggestions completed: ${suggestions.length} suggestions found`);

      return suggestions;
    } catch (error) {
      this.logger.error(`Popular suggestions failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des suggestions populaires',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('suggest/smart')
  @ApiOperation({ 
    summary: 'Suggestions intelligentes avec auto-complétion',
    description: 'Obtient des suggestions avec stratégies multiples (exact, fuzzy, populaire)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des suggestions intelligentes',
    type: [Object]
  })
  @ApiQuery({ name: 'q', required: true, description: 'Requête pour suggestions intelligentes' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre maximum de suggestions' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID utilisateur pour personnalisation' })
  async getSmartSuggestions(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('userId') userId?: string
  ): Promise<Suggestion[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      this.logger.debug(`Smart suggestions request: q="${query}", limit=${limit}, userId=${userId}`);

      const suggestions = await this.searchService.getSmartAutocompleteSuggestions(
        query.trim(),
        Math.min(limit || 10, 20),
        userId
      );

      this.logger.debug(`Smart suggestions completed: ${suggestions.length} suggestions found`);

      return suggestions;
    } catch (error) {
      this.logger.error(`Smart suggestions failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des suggestions intelligentes',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('category/:categoryId')
  @ApiOperation({ 
    summary: 'Recherche par catégorie',
    description: 'Recherche toutes les ressources d\'une catégorie spécifique'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultats de la catégorie avec facettes',
    type: Object
  })
  async searchByCategory(
    @Param('categoryId') categoryId: string,
    @Query('q') query?: string,
    @Query('resourceTypes', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) resourceTypes?: ResourceType[],
    @Query('plans', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) plans?: ResourcePlan[],
    @Query('verified', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) verified?: boolean,
    @Query('sort', new DefaultValuePipe(SortField.RELEVANCE)) sort?: SortField,
    @Query('order', new DefaultValuePipe(SortOrder.DESC)) order?: SortOrder,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ): Promise<SearchResults> {
    try {
      if (!categoryId) {
        throw new HttpException('Category ID is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Category search request: categoryId="${categoryId}", q="${query}"`);

      // Construire les filtres pour la catégorie
      const filters: SearchFilters = {
        categories: [categoryId]
      };

      if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
        filters.resourceTypes = resourceTypes;
      }

      if (plans && plans.length > 0 && plans[0]) {
        filters.plans = plans;
      }

      if (verified !== undefined) {
        filters.verified = verified;
      }

      const searchParams: SearchParams = {
        query: query || undefined,
        filters,
        sort: {
          field: sort || SortField.RELEVANCE,
          order: order || SortOrder.DESC
        },
        pagination: {
          page: page || 1,
          limit: Math.min(limit || 20, 100)
        },
        facets: ['resourceTypes', 'plans', 'verified', 'tags']
      };

      const results = await this.searchService.searchByCategory(categoryId, searchParams);

      this.logger.debug(`Category search completed: ${results.total} results found`);

      return results;
    } catch (error) {
      this.logger.error(`Category search failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la recherche par catégorie',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('categories/:categoryId/hierarchy')
  @ApiOperation({ 
    summary: 'Recherche par catégorie avec navigation hiérarchique',
    description: 'Recherche avec informations complètes de hiérarchie, sous-catégories et breadcrumbs'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultats avec navigation hiérarchique complète',
    type: Object
  })
  @ApiQuery({ name: 'includeSubcategories', required: false, description: 'Inclure les sous-catégories dans la recherche' })
  @ApiQuery({ name: 'maxDepth', required: false, description: 'Profondeur maximale de la hiérarchie' })
  @ApiQuery({ name: 'showCounts', required: false, description: 'Afficher les compteurs de ressources' })
  async searchByCategoryWithHierarchy(
    @Param('categoryId') categoryId: string,
    @Query('q') query?: string,
    @Query('includeSubcategories', new DefaultValuePipe(true), new ParseBoolPipe({ optional: true })) includeSubcategories?: boolean,
    @Query('maxDepth', new DefaultValuePipe(3), ParseIntPipe) maxDepth?: number,
    @Query('showCounts', new DefaultValuePipe(true), new ParseBoolPipe({ optional: true })) showCounts?: boolean,
    @Query('resourceTypes', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) resourceTypes?: ResourceType[],
    @Query('plans', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) plans?: ResourcePlan[],
    @Query('verified', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) verified?: boolean,
    @Query('sort', new DefaultValuePipe(SortField.RELEVANCE)) sort?: SortField,
    @Query('order', new DefaultValuePipe(SortOrder.DESC)) order?: SortOrder,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ): Promise<CategorySearchResults> {
    try {
      if (!categoryId) {
        throw new HttpException('Category ID is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Hierarchical category search: categoryId="${categoryId}", includeSubcategories=${includeSubcategories}, maxDepth=${maxDepth}`);

      // Construire les filtres de recherche
      const filters: SearchFilters = {};

      if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
        filters.resourceTypes = resourceTypes;
      }

      if (plans && plans.length > 0 && plans[0]) {
        filters.plans = plans;
      }

      if (verified !== undefined) {
        filters.verified = verified;
      }

      // Construire les paramètres de recherche par catégorie
      const categorySearchParams: CategorySearchParams = {
        query: query || undefined,
        filters,
        sort: {
          field: sort || SortField.RELEVANCE,
          order: order || SortOrder.DESC
        },
        pagination: {
          page: page || 1,
          limit: Math.min(limit || 20, 100)
        },
        facets: ['resourceTypes', 'plans', 'verified', 'tags', 'categories'],
        includeSubcategories: includeSubcategories !== false,
        maxDepth: maxDepth || 3,
        showCounts: showCounts !== false
      };

      // Utiliser CategorySearchService pour la recherche hiérarchique
      const results = await this.categorySearchService.searchByCategory(categoryId, categorySearchParams);

      this.logger.debug(`Hierarchical category search completed: ${results.total} results found`);

      return results;
    } catch (error) {
      this.logger.error(`Hierarchical category search failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la recherche hiérarchique par catégorie',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('categories/hierarchy')
  @ApiOperation({ 
    summary: 'Obtenir la hiérarchie complète des catégories',
    description: 'Retourne la structure hiérarchique des catégories avec compteurs'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Hiérarchie complète des catégories',
    type: Object
  })
  @ApiQuery({ name: 'categoryId', required: false, description: 'ID de la catégorie courante pour contexte' })
  @ApiQuery({ name: 'includeResourceCounts', required: false, description: 'Inclure les compteurs de ressources' })
  @ApiQuery({ name: 'maxDepth', required: false, description: 'Profondeur maximale' })
  async getCategoryHierarchy(
    @Query('categoryId') categoryId?: string,
    @Query('includeResourceCounts', new DefaultValuePipe(true), new ParseBoolPipe({ optional: true })) includeResourceCounts?: boolean,
    @Query('maxDepth', new DefaultValuePipe(5), ParseIntPipe) maxDepth?: number
  ): Promise<any> {
    try {
      this.logger.debug(`Category hierarchy request: categoryId=${categoryId}, includeResourceCounts=${includeResourceCounts}, maxDepth=${maxDepth}`);

      // Utiliser CategorySearchService pour obtenir la hiérarchie
      const hierarchy = await this.categorySearchService.getCategoryHierarchy({
        categoryId: categoryId || undefined,
        includeResourceCounts: includeResourceCounts !== false,
        maxDepth: maxDepth || 5
      });

      this.logger.debug(`Category hierarchy completed`);

      return hierarchy;
    } catch (error) {
      this.logger.error(`Category hierarchy failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération de la hiérarchie des catégories',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('categories/:slug')
  @ApiOperation({ 
    summary: 'Recherche par catégorie avec slug SEO-friendly',
    description: 'Effectue une recherche dans une catégorie spécifique en utilisant son slug pour des URLs SEO-friendly'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultats de recherche par catégorie avec navigation',
    type: Object
  })
  @ApiQuery({ name: 'q', required: false, description: 'Requête de recherche textuelle' })
  @ApiQuery({ name: 'includeSubcategories', required: false, description: 'Inclure les sous-catégories' })
  @ApiQuery({ name: 'maxDepth', required: false, description: 'Profondeur maximale de la hiérarchie' })
  @ApiQuery({ name: 'showCounts', required: false, description: 'Afficher les compteurs de ressources' })
  @ApiQuery({ name: 'resourceTypes', required: false, description: 'Types de ressources (séparés par virgule)' })
  @ApiQuery({ name: 'plans', required: false, description: 'Plans tarifaires (séparés par virgule)' })
  @ApiQuery({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' })
  @ApiQuery({ name: 'sort', required: false, description: 'Champ de tri' })
  @ApiQuery({ name: 'order', required: false, description: 'Ordre de tri (asc/desc)' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre de résultats par page' })
  async searchByCategorySlug(
    @Param('slug') slug: string,
    @Query('q') query?: string,
    @Query('includeSubcategories', new DefaultValuePipe(true), new ParseBoolPipe({ optional: true })) includeSubcategories?: boolean,
    @Query('maxDepth', new DefaultValuePipe(3), ParseIntPipe) maxDepth?: number,
    @Query('showCounts', new DefaultValuePipe(true), new ParseBoolPipe({ optional: true })) showCounts?: boolean,
    @Query('resourceTypes', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) resourceTypes?: ResourceType[],
    @Query('plans', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) plans?: ResourcePlan[],
    @Query('verified', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) verified?: boolean,
    @Query('sort', new DefaultValuePipe(SortField.RELEVANCE)) sort?: SortField,
    @Query('order', new DefaultValuePipe(SortOrder.DESC)) order?: SortOrder,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ): Promise<CategorySearchResults> {
    try {
      if (!slug) {
        throw new HttpException('Category slug is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`SEO-friendly category search: slug="${slug}", includeSubcategories=${includeSubcategories}`);

      // Trouver la catégorie par slug
      const categoryInfo = await this.categorySearchService.getCategoryBySlug(slug);
      if (!categoryInfo) {
        throw new HttpException(`Category with slug "${slug}" not found`, HttpStatus.NOT_FOUND);
      }

      // Construire les filtres de recherche
      const filters: SearchFilters = {};

      if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
        filters.resourceTypes = resourceTypes;
      }

      if (plans && plans.length > 0 && plans[0]) {
        filters.plans = plans;
      }

      if (verified !== undefined) {
        filters.verified = verified;
      }

      // Construire les paramètres de recherche par catégorie
      const categorySearchParams: CategorySearchParams = {
        query: query || undefined,
        filters,
        sort: {
          field: sort || SortField.RELEVANCE,
          order: order || SortOrder.DESC
        },
        pagination: {
          page: page || 1,
          limit: Math.min(limit || 20, 100)
        },
        facets: ['resourceTypes', 'plans', 'verified', 'tags', 'categories'],
        includeSubcategories: includeSubcategories !== false,
        maxDepth: maxDepth || 3,
        showCounts: showCounts !== false
      };

      // Utiliser CategorySearchService pour la recherche hiérarchique
      const results = await this.categorySearchService.searchByCategory(categoryInfo.id, categorySearchParams);

      // Enrichir avec des informations SEO
      const enrichedResults = {
        ...results,
        seo: {
          canonicalUrl: `/api/v1/search/categories/${slug}`,
          shareUrl: `${process.env.BASE_URL || 'https://api.romapi.com'}/search/categories/${slug}`,
          title: `${categoryInfo.name} - Recherche API`,
          description: categoryInfo.description || `Découvrez les API et services dans la catégorie ${categoryInfo.name}`,
          breadcrumbsSchema: this.generateBreadcrumbsSchema(results.breadcrumbs)
        }
      };

      this.logger.debug(`SEO-friendly category search completed: ${results.total} results found`);

      return enrichedResults;
    } catch (error) {
      this.logger.error(`SEO-friendly category search failed: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          message: 'Erreur lors de la recherche par catégorie',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('multi-type')
  @ApiOperation({ 
    summary: 'Recherche multi-types avec groupement',
    description: 'Effectue une recherche simultanée dans tous les types de ressources (API, entreprises, services) avec groupement par type'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultats groupés par type de ressource avec onglets',
    type: Object
  })
  @ApiQuery({ name: 'q', required: false, description: 'Requête de recherche textuelle' })
  @ApiQuery({ name: 'includeTypes', required: false, description: 'Types de ressources à inclure (séparés par virgule)' })
  @ApiQuery({ name: 'groupByType', required: false, description: 'Grouper les résultats par type' })
  @ApiQuery({ name: 'globalRelevanceSort', required: false, description: 'Tri par pertinence globale' })
  @ApiQuery({ name: 'categories', required: false, description: 'IDs des catégories (séparés par virgule)' })
  @ApiQuery({ name: 'plans', required: false, description: 'Plans tarifaires (séparés par virgule)' })
  @ApiQuery({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' })
  @ApiQuery({ name: 'city', required: false, description: 'Ville' })
  @ApiQuery({ name: 'region', required: false, description: 'Région' })
  @ApiQuery({ name: 'sort', required: false, description: 'Champ de tri', enum: SortField })
  @ApiQuery({ name: 'order', required: false, description: 'Ordre de tri', enum: SortOrder })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre de résultats par page' })
  async searchMultiType(
    @Query('q') query?: string,
    @Query('includeTypes', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) includeTypes?: ResourceType[],
    @Query('groupByType', new DefaultValuePipe(true), new ParseBoolPipe({ optional: true })) groupByType?: boolean,
    @Query('globalRelevanceSort', new DefaultValuePipe(true), new ParseBoolPipe({ optional: true })) globalRelevanceSort?: boolean,
    @Query('categories', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) categories?: string[],
    @Query('plans', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) plans?: ResourcePlan[],
    @Query('verified', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) verified?: boolean,
    @Query('city') city?: string,
    @Query('region') region?: string,
    @Query('sort', new DefaultValuePipe(SortField.RELEVANCE)) sort?: SortField,
    @Query('order', new DefaultValuePipe(SortOrder.DESC)) order?: SortOrder,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ): Promise<MultiTypeSearchResults> {
    try {
      this.logger.debug(`Multi-type search request: q="${query}", includeTypes=${includeTypes?.join(',')}, groupByType=${groupByType}`);

      // Construire les filtres
      const filters: SearchFilters = {};

      if (categories && categories.length > 0 && categories[0] !== '') {
        filters.categories = categories;
      }

      if (plans && plans.length > 0 && plans[0]) {
        filters.plans = plans;
      }

      if (verified !== undefined) {
        filters.verified = verified;
      }

      if (city) {
        filters.city = city;
      }

      if (region) {
        filters.region = region;
      }

      // Construire les paramètres de recherche multi-type
      const multiTypeParams: MultiTypeSearchParams = {
        query: query || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sort: {
          field: sort || SortField.RELEVANCE,
          order: order || SortOrder.DESC
        },
        pagination: {
          page: page || 1,
          limit: Math.min(limit || 20, 100)
        },
        facets: ['categories', 'resourceTypes', 'plans', 'verified'],
        includeTypes: includeTypes && includeTypes.length > 0 && includeTypes[0] ? includeTypes : undefined,
        groupByType: groupByType !== false,
        globalRelevanceSort: globalRelevanceSort !== false
      };

      const results = await this.multiTypeSearchService.searchAllTypes(multiTypeParams);

      this.logger.debug(`Multi-type search completed: ${results.totalAcrossTypes} total results found in ${results.took}ms`);

      return results;
    } catch (error) {
      this.logger.error(`Multi-type search failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la recherche multi-types',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('multi-type/distribution')
  @ApiOperation({ 
    summary: 'Distribution des types pour une requête',
    description: 'Obtient le nombre de résultats par type de ressource pour une requête donnée'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Distribution des résultats par type de ressource',
    type: Object
  })
  @ApiQuery({ name: 'q', required: false, description: 'Requête de recherche textuelle' })
  @ApiQuery({ name: 'categories', required: false, description: 'IDs des catégories (séparés par virgule)' })
  @ApiQuery({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' })
  @ApiQuery({ name: 'city', required: false, description: 'Ville' })
  @ApiQuery({ name: 'region', required: false, description: 'Région' })
  async getTypeDistribution(
    @Query('q') query?: string,
    @Query('categories', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) categories?: string[],
    @Query('verified', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) verified?: boolean,
    @Query('city') city?: string,
    @Query('region') region?: string
  ): Promise<{ [key in ResourceType]: number }> {
    try {
      this.logger.debug(`Type distribution request: q="${query}"`);

      // Construire les filtres
      const filters: SearchFilters = {};

      if (categories && categories.length > 0 && categories[0] !== '') {
        filters.categories = categories;
      }

      if (verified !== undefined) {
        filters.verified = verified;
      }

      if (city) {
        filters.city = city;
      }

      if (region) {
        filters.region = region;
      }

      const params: MultiTypeSearchParams = {
        query: query || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      };

      const distribution = await this.multiTypeSearchService.getTypeDistribution(params);

      this.logger.debug(`Type distribution completed: ${JSON.stringify(distribution)}`);

      return distribution;
    } catch (error) {
      this.logger.error(`Type distribution failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération de la distribution des types',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('multi-type/export')
  @ApiOperation({ 
    summary: 'Exporter les résultats par type',
    description: 'Exporte les résultats de recherche groupés par type de ressource dans différents formats'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Données exportées par type de ressource',
    type: Object
  })
  @ApiQuery({ name: 'q', required: false, description: 'Requête de recherche textuelle' })
  @ApiQuery({ name: 'exportTypes', required: true, description: 'Types de ressources à exporter (séparés par virgule)' })
  @ApiQuery({ name: 'format', required: false, description: 'Format d\'export (json, csv, xlsx)' })
  @ApiQuery({ name: 'categories', required: false, description: 'IDs des catégories (séparés par virgule)' })
  @ApiQuery({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' })
  @ApiQuery({ name: 'city', required: false, description: 'Ville' })
  @ApiQuery({ name: 'region', required: false, description: 'Région' })
  @ApiQuery({ name: 'maxResults', required: false, description: 'Nombre maximum de résultats par type' })
  async exportResultsByType(
    @Query('exportTypes', new ParseArrayPipe({ items: String, separator: ',' })) exportTypes: ResourceType[],
    @Query('q') query?: string,
    @Query('format', new DefaultValuePipe('json')) format?: 'json' | 'csv' | 'xlsx',
    @Query('categories', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) categories?: string[],
    @Query('verified', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) verified?: boolean,
    @Query('city') city?: string,
    @Query('region') region?: string,
    @Query('maxResults', new DefaultValuePipe(1000), ParseIntPipe) maxResults?: number
  ): Promise<{ [key in ResourceType]?: any }> {
    try {
      if (!exportTypes || exportTypes.length === 0) {
        throw new HttpException('Export types are required', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Export request: types=${exportTypes.join(',')}, format=${format}, q="${query}"`);

      // Construire les filtres
      const filters: SearchFilters = {};

      if (categories && categories.length > 0 && categories[0] !== '') {
        filters.categories = categories;
      }

      if (verified !== undefined) {
        filters.verified = verified;
      }

      if (city) {
        filters.city = city;
      }

      if (region) {
        filters.region = region;
      }

      // Construire les limites par type
      const limitsPerType: { [key in ResourceType]?: number } = {};
      exportTypes.forEach(type => {
        limitsPerType[type] = Math.min(maxResults || 1000, 5000); // Limite maximale de 5000
      });

      const params: MultiTypeSearchParams = {
        query: query || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        limitsPerType
      };

      const exportResults = await this.multiTypeSearchService.exportResultsByType(
        params,
        exportTypes,
        format || 'json'
      );

      this.logger.debug(`Export completed for ${exportTypes.length} types`);

      return exportResults;
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de l\'export des résultats',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('type/:resourceType')
  @ApiOperation({ 
    summary: 'Recherche dans un type spécifique avec contexte multi-type',
    description: 'Effectue une recherche dans un type de ressource spécifique avec des métadonnées de contexte multi-type'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultats de recherche pour le type spécifique avec contexte',
    type: Object
  })
  @ApiQuery({ name: 'q', required: false, description: 'Requête de recherche textuelle' })
  @ApiQuery({ name: 'categories', required: false, description: 'IDs des catégories (séparés par virgule)' })
  @ApiQuery({ name: 'plans', required: false, description: 'Plans tarifaires (séparés par virgule)' })
  @ApiQuery({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' })
  @ApiQuery({ name: 'city', required: false, description: 'Ville' })
  @ApiQuery({ name: 'region', required: false, description: 'Région' })
  @ApiQuery({ name: 'sort', required: false, description: 'Champ de tri', enum: SortField })
  @ApiQuery({ name: 'order', required: false, description: 'Ordre de tri', enum: SortOrder })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre de résultats par page' })
  async searchSingleTypeWithContext(
    @Param('resourceType') resourceType: ResourceType,
    @Query('q') query?: string,
    @Query('categories', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) categories?: string[],
    @Query('plans', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) plans?: ResourcePlan[],
    @Query('verified', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) verified?: boolean,
    @Query('city') city?: string,
    @Query('region') region?: string,
    @Query('sort', new DefaultValuePipe(SortField.RELEVANCE)) sort?: SortField,
    @Query('order', new DefaultValuePipe(SortOrder.DESC)) order?: SortOrder,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ): Promise<SearchResults> {
    try {
      // Valider le type de ressource
      if (!Object.values(ResourceType).includes(resourceType)) {
        throw new HttpException(`Invalid resource type: ${resourceType}`, HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Single type search with context: type=${resourceType}, q="${query}"`);

      // Construire les filtres
      const filters: SearchFilters = {};

      if (categories && categories.length > 0 && categories[0] !== '') {
        filters.categories = categories;
      }

      if (plans && plans.length > 0 && plans[0]) {
        filters.plans = plans;
      }

      if (verified !== undefined) {
        filters.verified = verified;
      }

      if (city) {
        filters.city = city;
      }

      if (region) {
        filters.region = region;
      }

      const searchParams: SearchParams = {
        query: query || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sort: {
          field: sort || SortField.RELEVANCE,
          order: order || SortOrder.DESC
        },
        pagination: {
          page: page || 1,
          limit: Math.min(limit || 20, 100)
        },
        facets: ['categories', 'plans', 'verified', 'tags']
      };

      const results = await this.multiTypeSearchService.searchSingleTypeWithContext(resourceType, searchParams);

      this.logger.debug(`Single type search completed: ${results.total} results found for type ${resourceType}`);

      return results;
    } catch (error) {
      this.logger.error(`Single type search failed: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          message: 'Erreur lors de la recherche par type',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('categories/:slug/share')
  @ApiOperation({ 
    summary: 'Obtenir les informations de partage pour une catégorie',
    description: 'Retourne les métadonnées nécessaires pour le partage social d\'une catégorie'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Métadonnées de partage pour la catégorie',
    type: Object
  })
  async getCategoryShareInfo(@Param('slug') slug: string): Promise<any> {
    try {
      if (!slug) {
        throw new HttpException('Category slug is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Getting share info for category: ${slug}`);

      // Trouver la catégorie par slug
      const categoryInfo = await this.categorySearchService.getCategoryBySlug(slug);
      if (!categoryInfo) {
        throw new HttpException(`Category with slug "${slug}" not found`, HttpStatus.NOT_FOUND);
      }

      // Obtenir les statistiques de la catégorie
      const stats = await this.categorySearchService.getCategoryStats(categoryInfo.id);

      // Construire les métadonnées de partage
      const shareInfo = {
        title: `${categoryInfo.name} - API ROMAPI`,
        description: categoryInfo.description || `Découvrez ${stats.totalResources} API et services dans la catégorie ${categoryInfo.name}`,
        url: `${process.env.BASE_URL || 'https://api.romapi.com'}/search/categories/${slug}`,
        image: categoryInfo.icon ? `${process.env.BASE_URL || 'https://api.romapi.com'}/images/categories/${categoryInfo.icon}` : `${process.env.BASE_URL || 'https://api.romapi.com'}/images/default-category.png`,
        type: 'website',
        siteName: 'ROMAPI',
        category: categoryInfo.name,
        resourceCount: stats.totalResources,
        verifiedCount: stats.verifiedResources,
        breadcrumbs: await this.categorySearchService.buildCategoryBreadcrumbs(categoryInfo.id),
        openGraph: {
          title: `${categoryInfo.name} - API ROMAPI`,
          description: categoryInfo.description || `Découvrez ${stats.totalResources} API et services dans la catégorie ${categoryInfo.name}`,
          url: `${process.env.BASE_URL || 'https://api.romapi.com'}/search/categories/${slug}`,
          image: categoryInfo.icon ? `${process.env.BASE_URL || 'https://api.romapi.com'}/images/categories/${categoryInfo.icon}` : `${process.env.BASE_URL || 'https://api.romapi.com'}/images/default-category.png`,
          type: 'website',
          siteName: 'ROMAPI'
        },
        twitter: {
          card: 'summary_large_image',
          title: `${categoryInfo.name} - API ROMAPI`,
          description: categoryInfo.description || `Découvrez ${stats.totalResources} API et services dans la catégorie ${categoryInfo.name}`,
          image: categoryInfo.icon ? `${process.env.BASE_URL || 'https://api.romapi.com'}/images/categories/${categoryInfo.icon}` : `${process.env.BASE_URL || 'https://api.romapi.com'}/images/default-category.png`
        }
      };

      this.logger.debug(`Share info retrieved for category: ${slug}`);

      return shareInfo;
    } catch (error) {
      this.logger.error(`Failed to get category share info: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des informations de partage',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('nearby')
  @ApiOperation({ 
    summary: 'Recherche géographique',
    description: 'Recherche des ressources près d\'une localisation'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultats triés par distance',
    type: Object
  })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lon', required: true, description: 'Longitude' })
  @ApiQuery({ name: 'radius', required: false, description: 'Rayon de recherche en km' })
  async searchNearby(
    @Query('lat', ParseFloatPipe) latitude: number,
    @Query('lon', ParseFloatPipe) longitude: number,
    @Query('radius', new DefaultValuePipe(10), ParseIntPipe) radius?: number,
    @Query('q') query?: string,
    @Query('categories', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) categories?: string[],
    @Query('resourceTypes', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) resourceTypes?: ResourceType[],
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ): Promise<SearchResults> {
    try {
      if (latitude === undefined || longitude === undefined) {
        throw new HttpException('Latitude and longitude are required', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Nearby search request: lat=${latitude}, lon=${longitude}, radius=${radius}km`);

      const location: GeoLocation = { latitude, longitude };

      // Construire les filtres additionnels
      const filters: SearchFilters = {};

      if (categories && categories.length > 0 && categories[0] !== '') {
        filters.categories = categories;
      }

      if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
        filters.resourceTypes = resourceTypes;
      }

      const searchParams: SearchParams = {
        query: query || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        pagination: {
          page: page || 1,
          limit: Math.min(limit || 20, 100)
        },
        facets: ['categories', 'resourceTypes', 'cities', 'regions']
      };

      const results = await this.searchService.searchNearby(
        location, 
        radius || 10, 
        searchParams
      );

      this.logger.debug(`Nearby search completed: ${results.total} results found`);

      return results;
    } catch (error) {
      this.logger.error(`Nearby search failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la recherche géographique',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('filters/save')
  @ApiOperation({ 
    summary: 'Sauvegarder les filtres de recherche',
    description: 'Sauvegarde les filtres de recherche pour une session utilisateur pour persistance entre onglets'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Filtres sauvegardés avec succès',
    type: Object
  })
  async saveFilters(
    @Headers('x-session-id') sessionId: string,
    @Body() body: {
      filters: SearchFilters;
      activeTab?: ResourceType;
      searchQuery?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!sessionId) {
        throw new HttpException('Session ID is required in x-session-id header', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Saving filters for session: ${sessionId}`);

      await this.filterPersistenceService.saveFilters(
        sessionId,
        body.filters,
        body.activeTab,
        body.searchQuery
      );

      // Enregistrer l'utilisation du filtre pour les statistiques
      await this.filterPersistenceService.recordFilterUsage(body.filters);

      // Ajouter à l'historique
      await this.filterPersistenceService.addToFilterHistory(
        sessionId,
        body.filters,
        body.searchQuery
      );

      return {
        success: true,
        message: 'Filtres sauvegardés avec succès'
      };
    } catch (error) {
      this.logger.error(`Failed to save filters: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la sauvegarde des filtres',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('filters/load')
  @ApiOperation({ 
    summary: 'Charger les filtres sauvegardés',
    description: 'Récupère les filtres de recherche sauvegardés pour une session utilisateur'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Filtres récupérés avec succès',
    type: Object
  })
  async loadFilters(
    @Headers('x-session-id') sessionId: string
  ): Promise<{
    filters: SearchFilters;
    activeTab?: ResourceType;
    searchQuery?: string;
    timestamp: Date;
  } | null> {
    try {
      if (!sessionId) {
        throw new HttpException('Session ID is required in x-session-id header', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Loading filters for session: ${sessionId}`);

      const savedFilters = await this.filterPersistenceService.getFilters(sessionId);

      return savedFilters;
    } catch (error) {
      this.logger.error(`Failed to load filters: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors du chargement des filtres',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('filters/tab')
  @ApiOperation({ 
    summary: 'Mettre à jour l\'onglet actif',
    description: 'Met à jour l\'onglet actif sans changer les filtres sauvegardés'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Onglet actif mis à jour avec succès',
    type: Object
  })
  async updateActiveTab(
    @Headers('x-session-id') sessionId: string,
    @Body() body: { activeTab: ResourceType }
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!sessionId) {
        throw new HttpException('Session ID is required in x-session-id header', HttpStatus.BAD_REQUEST);
      }

      if (!Object.values(ResourceType).includes(body.activeTab)) {
        throw new HttpException(`Invalid resource type: ${body.activeTab}`, HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Updating active tab to ${body.activeTab} for session: ${sessionId}`);

      await this.filterPersistenceService.updateActiveTab(sessionId, body.activeTab);

      return {
        success: true,
        message: 'Onglet actif mis à jour avec succès'
      };
    } catch (error) {
      this.logger.error(`Failed to update active tab: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la mise à jour de l\'onglet actif',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('filters/clear')
  @ApiOperation({ 
    summary: 'Effacer les filtres sauvegardés',
    description: 'Supprime tous les filtres sauvegardés pour une session utilisateur'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Filtres effacés avec succès',
    type: Object
  })
  async clearFilters(
    @Headers('x-session-id') sessionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!sessionId) {
        throw new HttpException('Session ID is required in x-session-id header', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Clearing filters for session: ${sessionId}`);

      await this.filterPersistenceService.clearFilters(sessionId);

      return {
        success: true,
        message: 'Filtres effacés avec succès'
      };
    } catch (error) {
      this.logger.error(`Failed to clear filters: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de l\'effacement des filtres',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('filters/history')
  @ApiOperation({ 
    summary: 'Obtenir l\'historique des filtres',
    description: 'Récupère l\'historique des filtres utilisés par une session utilisateur'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Historique des filtres récupéré avec succès',
    type: [Object]
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre maximum d\'entrées dans l\'historique' })
  async getFilterHistory(
    @Headers('x-session-id') sessionId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number
  ): Promise<{
    filters: SearchFilters;
    searchQuery?: string;
    timestamp: Date;
  }[]> {
    try {
      if (!sessionId) {
        throw new HttpException('Session ID is required in x-session-id header', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Getting filter history for session: ${sessionId}`);

      const history = await this.filterPersistenceService.getFilterHistory(
        sessionId,
        Math.min(limit || 10, 50) // Limiter à 50 entrées max
      );

      return history;
    } catch (error) {
      this.logger.error(`Failed to get filter history: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération de l\'historique des filtres',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('filters/popular')
  @ApiOperation({ 
    summary: 'Obtenir les filtres populaires',
    description: 'Récupère les filtres les plus utilisés pour suggestions'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Filtres populaires récupérés avec succès',
    type: [Object]
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre maximum de filtres populaires' })
  async getPopularFilters(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number
  ): Promise<{
    filters: Partial<SearchFilters>;
    usage: number;
  }[]> {
    try {
      this.logger.debug(`Getting popular filters, limit: ${limit}`);

      const popularFilters = await this.filterPersistenceService.getPopularFilters(
        Math.min(limit || 10, 20) // Limiter à 20 filtres max
      );

      return popularFilters;
    } catch (error) {
      this.logger.error(`Failed to get popular filters: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des filtres populaires',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('multi-type/with-persistence')
  @ApiOperation({ 
    summary: 'Recherche multi-types avec filtres persistés',
    description: 'Effectue une recherche multi-types en appliquant automatiquement les filtres persistés de la session'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultats de recherche avec filtres persistés appliqués',
    type: Object
  })
  @ApiQuery({ name: 'q', required: false, description: 'Requête de recherche textuelle' })
  @ApiQuery({ name: 'includeTypes', required: false, description: 'Types de ressources à inclure (séparés par virgule)' })
  @ApiQuery({ name: 'overrideFilters', required: false, description: 'Ignorer les filtres persistés' })
  async searchMultiTypeWithPersistence(
    @Headers('x-session-id') sessionId: string,
    @Query('q') query?: string,
    @Query('includeTypes', new DefaultValuePipe(''), new ParseArrayPipe({ items: String, separator: ',', optional: true })) includeTypes?: ResourceType[],
    @Query('overrideFilters', new DefaultValuePipe(false), new ParseBoolPipe({ optional: true })) overrideFilters?: boolean,
    @Query('groupByType', new DefaultValuePipe(true), new ParseBoolPipe({ optional: true })) groupByType?: boolean,
    @Query('globalRelevanceSort', new DefaultValuePipe(true), new ParseBoolPipe({ optional: true })) globalRelevanceSort?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ): Promise<MultiTypeSearchResults> {
    try {
      this.logger.debug(`Multi-type search with persistence for session: ${sessionId}`);

      // Construire les paramètres de base
      let searchParams: MultiTypeSearchParams = {
        query: query || undefined,
        includeTypes: includeTypes && includeTypes.length > 0 && includeTypes[0] ? includeTypes : undefined,
        groupByType: groupByType !== false,
        globalRelevanceSort: globalRelevanceSort !== false,
        pagination: {
          page: page || 1,
          limit: Math.min(limit || 20, 100)
        },
        facets: ['categories', 'resourceTypes', 'plans', 'verified']
      };

      // Appliquer les filtres persistés si demandé et si session ID fourni
      if (sessionId && !overrideFilters) {
        searchParams = await this.filterPersistenceService.applyPersistedFilters(sessionId, searchParams);
      }

      const results = await this.multiTypeSearchService.searchAllTypes(searchParams);

      this.logger.debug(`Multi-type search with persistence completed: ${results.totalAcrossTypes} total results found`);

      return results;
    } catch (error) {
      this.logger.error(`Multi-type search with persistence failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la recherche multi-types avec persistance',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Générer le schéma de breadcrumbs pour le SEO
   */
  private generateBreadcrumbsSchema(breadcrumbs: any[]): any {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": breadcrumb.name,
        "item": `${process.env.BASE_URL || 'https://api.romapi.com'}${breadcrumb.url}`
      }))
    };
  }

  /**
   * Générer un ID de session unique basé sur la requête
   */
  private generateSessionId(request: Request): string {
    // Utiliser l'ID de session existant s'il est fourni dans les headers
    const existingSessionId = request.headers['x-session-id'] as string;
    if (existingSessionId) {
      return existingSessionId;
    }

    // Générer un nouvel ID de session basé sur l'IP et l'user-agent
    const userAgent = request.headers['user-agent'] || '';
    const ip = request.ip || request.connection.remoteAddress || '';
    const timestamp = Date.now();
    
    // Créer un hash simple pour l'ID de session
    const sessionData = `${ip}_${userAgent}_${timestamp}`;
    return Buffer.from(sessionData).toString('base64').substring(0, 32);
  }

  /**
   * Extraire l'ID utilisateur de la requête (si authentifié)
   */
  private extractUserId(request: Request): string | undefined {
    // Vérifier s'il y a un token d'authentification
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    // Pour l'instant, retourner undefined car l'authentification n'est pas encore implémentée
    // TODO: Implémenter l'extraction de l'ID utilisateur depuis le JWT
    return undefined;
  }

  /**
   * Logger les analytics de recherche de manière asynchrone
   */
  private async logSearchAnalytics(
    params: SearchParams, 
    results: SearchResults, 
    request: Request, 
    ipAddress: string
  ): Promise<void> {
    try {
      const logParams = {
        query: params.query || '',
        filters: params.filters || {},
        userId: params.userId,
        sessionId: params.sessionId || 'anonymous',
        userAgent: request.headers['user-agent'],
        ipAddress,
        resultsCount: results.total,
        took: results.took || 0,
      };

      await this.analyticsService.logSearch(logParams);
      
      this.logger.debug(`Search analytics logged for query: "${params.query}" - Results: ${results.total}`);
    } catch (error) {
      this.logger.warn('Failed to log search analytics in controller', error);
    }
  }

  /**
   * Créer un endpoint pour logger les clics sur les résultats de recherche
   */
  @Post('click')
  @ApiOperation({ 
    summary: 'Logger un clic sur un résultat de recherche',
    description: 'Enregistre qu\'un utilisateur a cliqué sur un résultat de recherche pour les analytics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Clic enregistré avec succès',
    type: Object
  })
  async logClick(
    @Body() body: {
      searchLogId?: string;
      resourceId: string;
      position: number;
      query?: string;
      sessionId?: string;
    },
    @Req() request: Request,
    @Ip() ipAddress: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { searchLogId, resourceId, position, query, sessionId } = body;

      if (!resourceId || position === undefined) {
        throw new HttpException('resourceId and position are required', HttpStatus.BAD_REQUEST);
      }

      // Si pas de searchLogId fourni, essayer de créer un log de recherche minimal
      let finalSearchLogId = searchLogId;
      if (!finalSearchLogId && query && sessionId) {
        const logParams = {
          query,
          filters: {},
          sessionId,
          userAgent: request.headers['user-agent'],
          ipAddress,
          resultsCount: 0, // Inconnu dans ce contexte
          took: 0,
        };
        
        finalSearchLogId = await this.analyticsService.logSearch(logParams);
      }

      if (finalSearchLogId) {
        const userId = this.extractUserId(request);
        await this.analyticsService.logClick(finalSearchLogId, resourceId, position, userId);
      }

      this.logger.debug(`Click logged: Resource ${resourceId} at position ${position}`);

      return {
        success: true,
        message: 'Clic enregistré avec succès'
      };
    } catch (error) {
      this.logger.error(`Failed to log click: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de l\'enregistrement du clic',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtenir les termes de recherche les plus populaires
   */
  @Get('analytics/popular-terms')
  @ApiOperation({ 
    summary: 'Obtenir les termes de recherche populaires',
    description: 'Retourne les termes de recherche les plus utilisés avec leurs statistiques'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Termes populaires récupérés avec succès',
    type: [Object]
  })
  @ApiQuery({ name: 'from', required: false, description: 'Date de début (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO string)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre maximum de termes' })
  async getPopularTerms(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number
  ): Promise<any[]> {
    try {
      // Construire la période par défaut (30 derniers jours)
      const period = {
        from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
        granularity: 'day' as const
      };

      this.logger.debug(`Getting popular terms for period: ${period.from.toISOString()} to ${period.to.toISOString()}`);

      const popularTerms = await this.analyticsService.getPopularTerms(period, Math.min(limit || 50, 100));

      return popularTerms;
    } catch (error) {
      this.logger.error(`Failed to get popular terms: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des termes populaires',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtenir les requêtes sans résultats
   */
  @Get('analytics/no-results')
  @ApiOperation({ 
    summary: 'Obtenir les requêtes sans résultats',
    description: 'Retourne les requêtes qui n\'ont donné aucun résultat pour améliorer le système'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Requêtes sans résultats récupérées avec succès',
    type: [Object]
  })
  @ApiQuery({ name: 'from', required: false, description: 'Date de début (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO string)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre maximum de requêtes' })
  async getNoResultsQueries(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number
  ): Promise<any[]> {
    try {
      // Construire la période par défaut (30 derniers jours)
      const period = {
        from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
        granularity: 'day' as const
      };

      this.logger.debug(`Getting no-results queries for period: ${period.from.toISOString()} to ${period.to.toISOString()}`);

      const noResultsQueries = await this.analyticsService.getNoResultsQueries(period, Math.min(limit || 50, 100));

      return noResultsQueries;
    } catch (error) {
      this.logger.error(`Failed to get no-results queries: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des requêtes sans résultats',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtenir les métriques de performance de recherche
   */
  @Get('analytics/metrics')
  @ApiOperation({ 
    summary: 'Obtenir les métriques de recherche',
    description: 'Retourne les métriques de performance et d\'utilisation du système de recherche'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Métriques récupérées avec succès',
    type: Object
  })
  @ApiQuery({ name: 'from', required: false, description: 'Date de début (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO string)' })
  async getSearchMetrics(
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<any> {
    try {
      // Construire la période par défaut (30 derniers jours)
      const period = {
        from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
        granularity: 'day' as const
      };

      this.logger.debug(`Getting search metrics for period: ${period.from.toISOString()} to ${period.to.toISOString()}`);

      const metrics = await this.analyticsService.getSearchMetrics(period);

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get search metrics: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des métriques de recherche',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtenir les statistiques de clics pour une ressource
   */
  @Get('analytics/resource/:resourceId/clicks')
  @ApiOperation({ 
    summary: 'Obtenir les statistiques de clics d\'une ressource',
    description: 'Retourne les statistiques détaillées des clics pour une ressource spécifique'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques de clics récupérées avec succès',
    type: Object
  })
  @ApiQuery({ name: 'from', required: false, description: 'Date de début (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO string)' })
  async getResourceClickStats(
    @Param('resourceId') resourceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<any> {
    try {
      if (!resourceId) {
        throw new HttpException('Resource ID is required', HttpStatus.BAD_REQUEST);
      }

      // Construire la période par défaut (30 derniers jours)
      const period = {
        from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
        granularity: 'day' as const
      };

      this.logger.debug(`Getting click stats for resource ${resourceId} for period: ${period.from.toISOString()} to ${period.to.toISOString()}`);

      const clickStats = await this.analyticsService.getClickStats(resourceId, period);

      return {
        resourceId,
        period,
        ...clickStats
      };
    } catch (error) {
      this.logger.error(`Failed to get resource click stats: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération des statistiques de clics',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Dashboard d'analytics pour administrateurs
   */
  @Get('analytics/dashboard')
  @ApiOperation({ 
    summary: 'Dashboard d\'analytics pour administrateurs',
    description: 'Retourne un tableau de bord complet avec toutes les métriques importantes'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard récupéré avec succès',
    type: Object
  })
  @ApiQuery({ name: 'from', required: false, description: 'Date de début (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO string)' })
  async getAnalyticsDashboard(
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<any> {
    try {
      // Construire la période par défaut (30 derniers jours)
      const period = {
        from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: to ? new Date(to) : new Date(),
        granularity: 'day' as const
      };

      this.logger.debug(`Getting analytics dashboard for period: ${period.from.toISOString()} to ${period.to.toISOString()}`);

      // Récupérer toutes les métriques en parallèle
      const [metrics, popularTerms, noResultsQueries] = await Promise.all([
        this.analyticsService.getSearchMetrics(period),
        this.analyticsService.getPopularTerms(period, 10),
        this.analyticsService.getNoResultsQueries(period, 10)
      ]);

      // Construire le dashboard
      const dashboard = {
        period,
        overview: {
          totalSearches: metrics.totalSearches,
          averageResponseTime: metrics.averageResponseTime,
          clickThroughRate: metrics.clickThroughRate,
          noResultsRate: noResultsQueries.reduce((sum, q) => sum + q.count, 0) / metrics.totalSearches * 100
        },
        popularTerms: metrics.popularTerms,
        noResultsQueries: metrics.noResultsQueries,
        trends: {
          // TODO: Ajouter des tendances temporelles
          searchVolumeGrowth: 0,
          performanceImprovement: 0,
          userSatisfactionScore: metrics.clickThroughRate
        },
        recommendations: this.generateRecommendations(metrics, popularTerms, noResultsQueries)
      };

      return dashboard;
    } catch (error) {
      this.logger.error(`Failed to get analytics dashboard: ${error.message}`, error.stack);
      throw new HttpException(
        {
          message: 'Erreur lors de la récupération du dashboard d\'analytics',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Générer des recommandations basées sur les analytics
   */
  private generateRecommendations(metrics: any, popularTerms: any[], noResultsQueries: any[]): any[] {
    const recommendations = [];

    // Recommandation sur les performances
    if (metrics.averageResponseTime > 500) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Temps de réponse élevé',
        description: `Le temps de réponse moyen (${metrics.averageResponseTime}ms) dépasse les 500ms recommandés`,
        action: 'Optimiser les requêtes Elasticsearch et vérifier les performances du cache'
      });
    }

    // Recommandation sur le taux de clic
    if (metrics.clickThroughRate < 30) {
      recommendations.push({
        type: 'relevance',
        priority: 'medium',
        title: 'Taux de clic faible',
        description: `Le taux de clic (${metrics.clickThroughRate.toFixed(1)}%) est inférieur à 30%`,
        action: 'Améliorer la pertinence des résultats et l\'affichage des extraits'
      });
    }

    // Recommandation sur les requêtes sans résultats
    if (noResultsQueries.length > 0) {
      const totalNoResults = noResultsQueries.reduce((sum, q) => sum + q.count, 0);
      if (totalNoResults > metrics.totalSearches * 0.1) {
        recommendations.push({
          type: 'content',
          priority: 'high',
          title: 'Trop de requêtes sans résultats',
          description: `${totalNoResults} requêtes (${(totalNoResults / metrics.totalSearches * 100).toFixed(1)}%) n'ont donné aucun résultat`,
          action: 'Analyser les termes sans résultats et enrichir le contenu ou améliorer les synonymes'
        });
      }
    }

    // Recommandation sur les termes populaires
    if (popularTerms.length > 0) {
      const topTerm = popularTerms[0];
      if (topTerm.percentage > 20) {
        recommendations.push({
          type: 'optimization',
          priority: 'low',
          title: 'Terme très dominant',
          description: `Le terme "${topTerm.term}" représente ${topTerm.percentage.toFixed(1)}% des recherches`,
          action: 'Optimiser spécifiquement les résultats pour ce terme et créer des suggestions associées'
        });
      }
    }

    return recommendations;
  }

  /**
   * Servir le dashboard d'analytics HTML
   */
  @Get('analytics/dashboard-ui')
  @ApiOperation({ 
    summary: 'Interface du dashboard d\'analytics',
    description: 'Retourne l\'interface HTML du dashboard d\'analytics pour les administrateurs'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Interface HTML du dashboard',
    content: {
      'text/html': {
        schema: {
          type: 'string'
        }
      }
    }
  })
  getDashboardUI(): string {
    // En production, ceci devrait être servi par un serveur de fichiers statiques
    // Pour le développement, on peut rediriger vers le fichier HTML
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="refresh" content="0; url=/analytics-dashboard.html">
        <title>Redirection vers le Dashboard</title>
      </head>
      <body>
        <p>Redirection vers le <a href="/analytics-dashboard.html">Dashboard Analytics</a>...</p>
      </body>
      </html>
    `;
  }

  // ===== SAVED SEARCHES ENDPOINTS =====

  @Post('saved')
  @ApiOperation({ 
    summary: 'Créer une recherche sauvegardée',
    description: 'Sauvegarde une recherche avec ses paramètres pour réutilisation future'
  })
  @ApiResponse({ status: 201, description: 'Recherche sauvegardée créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  async createSavedSearch(
    @Body() data: SavedSearchDto,
    @Headers('x-user-id') userId?: string
  ) {
    try {
      if (!userId) {
        throw new HttpException('User authentication required', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Creating saved search for user ${userId}: ${data.name}`);

      const savedSearch = await this.savedSearchService.createSavedSearch(userId, data);

      return {
        success: true,
        data: savedSearch,
        message: 'Saved search created successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to create saved search: ${error.message}`);
      
      if (error.message.includes('already exists')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      
      throw new HttpException(
        error.message || 'Failed to create saved search',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('personalized')
  @ApiOperation({ 
    summary: 'Recherche personnalisée',
    description: 'Effectue une recherche personnalisée basée sur l\'historique utilisateur'
  })
  @ApiResponse({ status: 200, description: 'Résultats de recherche personnalisés' })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  @ApiQuery({ name: 'q', required: false, description: 'Requête de recherche textuelle' })
  @ApiQuery({ name: 'categories', required: false, description: 'IDs des catégories (séparés par virgule)' })
  @ApiQuery({ name: 'resourceTypes', required: false, description: 'Types de ressources (séparés par virgule)' })
  @ApiQuery({ name: 'plans', required: false, description: 'Plans tarifaires (séparés par virgule)' })
  @ApiQuery({ name: 'verified', required: false, description: 'Ressources vérifiées uniquement' })
  @ApiQuery({ name: 'city', required: false, description: 'Ville' })
  @ApiQuery({ name: 'region', required: false, description: 'Région' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre de résultats par page (défaut: 20)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Champ de tri' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Ordre de tri (asc/desc)' })
  @ApiQuery({ name: 'personalizationWeight', required: false, description: 'Poids de personnalisation (0.0-1.0, défaut: 0.3)' })
  async personalizedSearch(
    @Headers('x-user-id') userId?: string,
    @Query('q') query?: string,
    @Query('categories', new ParseArrayPipe({ items: String, separator: ',' })) categories?: string[],
    @Query('resourceTypes', new ParseArrayPipe({ items: String, separator: ',' })) resourceTypes?: ResourceType[],
    @Query('plans', new ParseArrayPipe({ items: String, separator: ',' })) plans?: ResourcePlan[],
    @Query('verified', ParseBoolPipe) verified?: boolean,
    @Query('city') city?: string,
    @Query('region') region?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('sortBy') sortBy?: SortField,
    @Query('sortOrder') sortOrder?: SortOrder,
    @Query('personalizationWeight', new DefaultValuePipe(0.3), ParseFloatPipe) personalizationWeight: number = 0.3,
    @Req() request?: Request
  ) {
    try {
      if (!userId) {
        throw new HttpException('User authentication required', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Personalized search request for user ${userId}: q="${query}"`);

      // Construire les filtres
      const filters: SearchFilters = {};

      if (categories && categories.length > 0 && categories[0] !== '') {
        filters.categories = categories;
      }

      if (resourceTypes && resourceTypes.length > 0 && resourceTypes[0]) {
        filters.resourceTypes = resourceTypes;
      }

      if (plans && plans.length > 0 && plans[0]) {
        filters.plans = plans;
      }

      if (verified !== undefined) {
        filters.verified = verified;
      }

      if (city) {
        filters.city = city;
      }

      if (region) {
        filters.region = region;
      }

      // Construire les paramètres de recherche
      const searchParams: SearchParams = {
        query: query?.trim(),
        filters,
        sort: sortBy && sortOrder ? { field: sortBy, order: sortOrder } : undefined,
        pagination: { page, limit },
        userId,
        sessionId: (request as any)?.sessionID || 'anonymous'
      };

      // Exécuter la recherche personnalisée
      const results = await this.searchService.personalizedSearch(
        userId,
        searchParams,
        true,
        personalizationWeight
      );

      return {
        success: true,
        data: results,
        message: 'Personalized search completed successfully'
      };
    } catch (error) {
      this.logger.error(`Personalized search failed: ${error.message}`);
      throw new HttpException(
        'Personalized search failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('saved')
  @ApiOperation({ 
    summary: 'Obtenir les recherches sauvegardées',
    description: 'Récupère toutes les recherches sauvegardées de l\'utilisateur'
  })
  @ApiResponse({ status: 200, description: 'Liste des recherches sauvegardées' })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page (défaut: 20)' })
  async getUserSavedSearches(
    @Headers('x-user-id') userId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20
  ) {
    try {
      if (!userId) {
        throw new HttpException('User authentication required', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Getting saved searches for user ${userId}, page ${page}`);

      const result = await this.savedSearchService.getUserSavedSearches(userId, page, limit);

      return {
        success: true,
        data: result,
        message: 'Saved searches retrieved successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to get saved searches: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve saved searches',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('saved/:searchId')
  @ApiOperation({ 
    summary: 'Obtenir une recherche sauvegardée',
    description: 'Récupère une recherche sauvegardée spécifique par son ID'
  })
  @ApiResponse({ status: 200, description: 'Recherche sauvegardée trouvée' })
  @ApiResponse({ status: 404, description: 'Recherche sauvegardée non trouvée' })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  async getSavedSearchById(
    @Param('searchId') searchId: string,
    @Headers('x-user-id') userId?: string
  ) {
    try {
      if (!userId) {
        throw new HttpException('User authentication required', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Getting saved search ${searchId} for user ${userId}`);

      const savedSearch = await this.savedSearchService.getSavedSearchById(userId, searchId);

      return {
        success: true,
        data: savedSearch,
        message: 'Saved search retrieved successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to get saved search: ${error.message}`);
      
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        'Failed to retrieve saved search',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('saved/:searchId')
  @ApiOperation({ 
    summary: 'Mettre à jour une recherche sauvegardée',
    description: 'Met à jour les paramètres d\'une recherche sauvegardée existante'
  })
  @ApiResponse({ status: 200, description: 'Recherche sauvegardée mise à jour' })
  @ApiResponse({ status: 404, description: 'Recherche sauvegardée non trouvée' })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  async updateSavedSearch(
    @Param('searchId') searchId: string,
    @Body() data: Partial<SavedSearchDto>,
    @Headers('x-user-id') userId?: string
  ) {
    try {
      if (!userId) {
        throw new HttpException('User authentication required', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Updating saved search ${searchId} for user ${userId}`);

      const updatedSearch = await this.savedSearchService.updateSavedSearch(userId, searchId, data);

      return {
        success: true,
        data: updatedSearch,
        message: 'Saved search updated successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to update saved search: ${error.message}`);
      
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      
      if (error.message.includes('already exists')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      
      throw new HttpException(
        error.message || 'Failed to update saved search',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete('saved/:searchId')
  @ApiOperation({ 
    summary: 'Supprimer une recherche sauvegardée',
    description: 'Supprime définitivement une recherche sauvegardée'
  })
  @ApiResponse({ status: 200, description: 'Recherche sauvegardée supprimée' })
  @ApiResponse({ status: 404, description: 'Recherche sauvegardée non trouvée' })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  async deleteSavedSearch(
    @Param('searchId') searchId: string,
    @Headers('x-user-id') userId?: string
  ) {
    try {
      if (!userId) {
        throw new HttpException('User authentication required', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Deleting saved search ${searchId} for user ${userId}`);

      await this.savedSearchService.deleteSavedSearch(userId, searchId);

      return {
        success: true,
        message: 'Saved search deleted successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to delete saved search: ${error.message}`);
      
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        'Failed to delete saved search',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('saved/:searchId/execute')
  @ApiOperation({ 
    summary: 'Exécuter une recherche sauvegardée',
    description: 'Exécute une recherche sauvegardée et retourne les résultats actuels'
  })
  @ApiResponse({ status: 200, description: 'Résultats de la recherche sauvegardée' })
  @ApiResponse({ status: 404, description: 'Recherche sauvegardée non trouvée' })
  @ApiResponse({ status: 401, description: 'Authentification requise' })
  @ApiQuery({ name: 'personalized', required: false, description: 'Appliquer la personnalisation (défaut: true)' })
  @ApiQuery({ name: 'personalizationWeight', required: false, description: 'Poids de personnalisation (0.0-1.0, défaut: 0.3)' })
  async executeSavedSearch(
    @Param('searchId') searchId: string,
    @Headers('x-user-id') userId?: string,
    @Query('personalized', new DefaultValuePipe(true), ParseBoolPipe) personalized: boolean = true,
    @Query('personalizationWeight', new DefaultValuePipe(0.3), ParseFloatPipe) personalizationWeight: number = 0.3
  ) {
    try {
      if (!userId) {
        throw new HttpException('User authentication required', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Executing saved search ${searchId} for user ${userId}, personalized: ${personalized}`);

      // Convertir la recherche sauvegardée en paramètres de recherche
      const searchParams = await this.savedSearchService.convertToSearchParams(userId, searchId);

      // Exécuter la recherche avec personnalisation si demandée
      let results: SearchResults;
      if (personalized) {
        results = await this.searchService.personalizedSearch(
          userId,
          searchParams,
          true,
          personalizationWeight
        );
      } else {
        results = await this.searchService.search(searchParams);
      }

      return {
        success: true,
        data: results,
        message: 'Saved search executed successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to execute saved search: ${error.message}`);
      
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        'Failed to execute saved search',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== LANGUAGE ENDPOINTS =====

  @Post('language/set')
  @ApiOperation({ 
    summary: 'Définir la langue de recherche préférée',
    description: `
    Permet de définir la langue préférée pour les recherches de l'utilisateur.
    Cette préférence sera utilisée pour prioriser les résultats dans la langue choisie
    et adapter les analyseurs de recherche.
    
    **Langues supportées :**
    - \`fr\` : Français (par défaut)
    - \`en\` : Anglais
    - \`auto\` : Détection automatique
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Langue définie avec succès'
  })
  @ApiResponse({
    status: 400,
    description: 'Langue non supportée'
  })
  async setSearchLanguage(
    @Body() body: { language: string },
    @Req() req: Request,
    @Ip() ip: string
  ) {
    try {
      const { language } = body;

      // Valider la langue
      if (!language || !['fr', 'en', 'auto'].includes(language)) {
        throw new HttpException(
          'Langue non supportée. Langues disponibles: fr, en, auto',
          HttpStatus.BAD_REQUEST
        );
      }

      // Pour l'instant, on retourne juste la confirmation
      // Dans une implémentation complète, on sauvegarderait la préférence en base
      this.logger.log(`Language preference set to ${language} for IP ${ip}`);

      return {
        success: true,
        data: {
          language,
          message: `Langue de recherche définie sur ${language}`,
          supportedLanguages: ['fr', 'en', 'auto']
        }
      };
    } catch (error) {
      this.logger.error(`Failed to set search language: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erreur lors de la définition de la langue',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('language/detect')
  @ApiOperation({ 
    summary: 'Détecter la langue d\'une requête de recherche',
    description: `
    Analyse une requête de recherche pour détecter automatiquement sa langue.
    Utile pour adapter les résultats et les analyseurs selon le contenu de la requête.
    
    **Fonctionnalités :**
    - Détection basée sur les mots-clés et patterns linguistiques
    - Score de confiance pour chaque langue détectée
    - Recommandations d'analyseurs appropriés
    `
  })
  @ApiQuery({ 
    name: 'q', 
    description: 'Requête de recherche à analyser',
    required: true,
    example: 'restaurant français à Douala'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Langue détectée avec score de confiance'
  })
  @ApiResponse({
    status: 400,
    description: 'Requête manquante ou invalide'
  })
  async detectQueryLanguage(
    @Query('q') query: string
  ) {
    try {
      if (!query || query.trim().length === 0) {
        throw new HttpException(
          'Paramètre de requête "q" requis',
          HttpStatus.BAD_REQUEST
        );
      }

      // Utiliser le service de détection de langue
      const languageDetectionService = this.searchService['languageDetectionService'];
      const detection = languageDetectionService.detectLanguage(query);

      return {
        success: true,
        data: {
          query,
          detectedLanguage: detection.language,
          confidence: detection.confidence,
          allLanguages: detection.detectedLanguages,
          recommendedAnalyzer: languageDetectionService.getAnalyzerForLanguage(detection.language),
          recommendedSearchAnalyzer: languageDetectionService.getSearchAnalyzerForLanguage(detection.language),
          recommendedFields: languageDetectionService.getSearchFieldsForLanguage(detection.language)
        }
      };
    } catch (error) {
      this.logger.error(`Failed to detect query language: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erreur lors de la détection de langue',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('language/supported')
  @ApiOperation({ 
    summary: 'Obtenir les langues supportées',
    description: `
    Retourne la liste des langues supportées par le système de recherche
    avec leurs codes ISO et descriptions.
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des langues supportées'
  })
  async getSupportedLanguages() {
    try {
      return {
        success: true,
        data: {
          supportedLanguages: [
            {
              code: 'fr',
              name: 'Français',
              description: 'Langue française avec analyseur optimisé',
              default: true
            },
            {
              code: 'en',
              name: 'English',
              description: 'English language with optimized analyzer',
              default: false
            },
            {
              code: 'auto',
              name: 'Détection automatique',
              description: 'Détection automatique de la langue selon le contenu',
              default: false
            }
          ],
          defaultLanguage: 'fr',
          autoDetectionAvailable: true
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get supported languages: ${error.message}`);
      
      throw new HttpException(
        'Erreur lors de la récupération des langues supportées',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('language/change')
  @ApiOperation({ 
    summary: 'Changer la langue de recherche',
    description: `
    Change la langue de recherche et adapte les résultats existants selon la nouvelle langue.
    
    **Fonctionnalités :**
    - Adaptation des résultats selon la nouvelle langue utilisateur
    - Recalcul des scores de pertinence avec boost de langue
    - Invalidation du cache pour forcer la mise à jour
    - Indication de langue pour chaque résultat
    - Support des traductions disponibles
    
    **Cas d'usage :**
    - Utilisateur change de langue dans l'interface
    - Adaptation dynamique des résultats sans nouvelle recherche
    - Personnalisation selon les préférences linguistiques
    
    Requirements: 12.6, 12.7
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultats adaptés à la nouvelle langue avec métadonnées d\'adaptation'
  })
  @ApiResponse({
    status: 400,
    description: 'Langue non supportée ou paramètres invalides'
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur lors du changement de langue'
  })
  async changeSearchLanguage(
    @Body() body: {
      searchParams: SearchParams;
      newLanguage: string;
      cacheKey?: string;
    }
  ): Promise<SearchResults> {
    try {
      const { searchParams, newLanguage, cacheKey } = body;

      if (!searchParams) {
        throw new HttpException(
          'Les paramètres de recherche sont requis',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!newLanguage) {
        throw new HttpException(
          'La nouvelle langue est requise',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.debug(`Language change request: ${searchParams.language} -> ${newLanguage}`);

      const results = await this.searchService.changeSearchLanguage(
        searchParams,
        newLanguage,
        cacheKey
      );

      this.logger.debug(`Language change completed: ${results.total} results adapted`);

      return results;
    } catch (error) {
      this.logger.error(`Language change failed: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          message: 'Erreur lors du changement de langue',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('results/:resultId/languages')
  @ApiOperation({ 
    summary: 'Obtenir les langues disponibles pour un résultat',
    description: `
    Retourne les langues dans lesquelles un résultat spécifique est disponible,
    avec indication des traductions possibles.
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Langues disponibles pour le résultat'
  })
  @ApiParam({ 
    name: 'resultId', 
    description: 'ID du résultat de recherche',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getResultLanguages(
    @Param('resultId') resultId: string
  ): Promise<{ languages: string[]; translationsAvailable: boolean }> {
    try {
      if (!resultId) {
        throw new HttpException('Result ID is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.debug(`Getting languages for result: ${resultId}`);

      const languageMap = await this.searchService.getAvailableLanguagesForResults([resultId]);
      const languages = languageMap[resultId] || [];

      return {
        languages,
        translationsAvailable: languages.length > 1
      };
    } catch (error) {
      this.logger.error(`Failed to get result languages: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erreur lors de la récupération des langues du résultat',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}