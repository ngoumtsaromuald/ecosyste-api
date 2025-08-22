import { Injectable, NestMiddleware, Logger, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SearchValidationService, ValidationOptions } from '../services/search-validation.service';
import { SearchParams, SearchFilters, SortField, SortOrder } from '../interfaces/search.interfaces';
import { ResourceType, ResourcePlan } from '@prisma/client';

@Injectable()
export class SearchValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SearchValidationMiddleware.name);

  constructor(private readonly validationService: SearchValidationService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extraire les paramètres de recherche de la requête
      const searchParams = this.extractSearchParams(req);
      
      // Options de validation basées sur l'endpoint
      const validationOptions = this.getValidationOptions(req.path, req.method);
      
      // Valider les paramètres
      const validation = await this.validationService.validateSearchParams(
        searchParams, 
        validationOptions
      );

      if (!validation.isValid) {
        this.logger.warn(`Search validation failed for ${req.path}: ${validation.errors.join(', ')}`);
        
        throw new BadRequestException({
          message: 'Paramètres de recherche invalides',
          errors: validation.errors,
          warnings: validation.warnings,
          path: req.path,
          timestamp: new Date().toISOString()
        });
      }

      // Ajouter les paramètres nettoyés à la requête
      req.body.validatedSearchParams = validation.sanitizedParams;
      req.body.validationWarnings = validation.warnings;

      // Logger les warnings si présents
      if (validation.warnings && validation.warnings.length > 0) {
        this.logger.warn(`Search validation warnings for ${req.path}: ${validation.warnings.join(', ')}`);
      }

      next();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Search validation middleware error: ${error.message}`, error.stack);
      throw new BadRequestException({
        message: 'Erreur de validation des paramètres de recherche',
        error: error.message
      });
    }
  }

  /**
   * Extrait les paramètres de recherche de la requête HTTP
   */
  private extractSearchParams(req: Request): SearchParams {
    const query = req.query;
    const params: SearchParams = {};

    // Requête textuelle
    if (query.q && typeof query.q === 'string') {
      params.query = query.q;
    }

    // Filtres
    const filters: SearchFilters = {};

    // Catégories
    if (query.categories) {
      if (typeof query.categories === 'string') {
        filters.categories = query.categories.split(',').filter(c => c.trim());
      } else if (Array.isArray(query.categories)) {
        filters.categories = query.categories.filter(c => typeof c === 'string');
      }
    }

    // Types de ressources
    if (query.resourceTypes) {
      if (typeof query.resourceTypes === 'string') {
        filters.resourceTypes = query.resourceTypes.split(',').filter(t => 
          Object.values(ResourceType).includes(t as ResourceType)
        ) as ResourceType[];
      } else if (Array.isArray(query.resourceTypes)) {
        filters.resourceTypes = query.resourceTypes.filter(t => 
          typeof t === 'string' && Object.values(ResourceType).includes(t as ResourceType)
        ) as ResourceType[];
      }
    }

    // Plans
    if (query.plans) {
      if (typeof query.plans === 'string') {
        filters.plans = query.plans.split(',').filter(p => 
          Object.values(ResourcePlan).includes(p as ResourcePlan)
        ) as ResourcePlan[];
      } else if (Array.isArray(query.plans)) {
        filters.plans = query.plans.filter(p => 
          typeof p === 'string' && Object.values(ResourcePlan).includes(p as ResourcePlan)
        ) as ResourcePlan[];
      }
    }

    // Fourchette de prix
    if (query.minPrice || query.maxPrice) {
      filters.priceRange = {};
      if (query.minPrice && typeof query.minPrice === 'string') {
        const minPrice = parseInt(query.minPrice, 10);
        if (!isNaN(minPrice)) {
          filters.priceRange.min = minPrice;
        }
      }
      if (query.maxPrice && typeof query.maxPrice === 'string') {
        const maxPrice = parseInt(query.maxPrice, 10);
        if (!isNaN(maxPrice)) {
          filters.priceRange.max = maxPrice;
        }
      }
    }

    // Filtre vérifié
    if (query.verified !== undefined) {
      if (typeof query.verified === 'string') {
        filters.verified = query.verified.toLowerCase() === 'true';
      } else if (typeof query.verified === 'boolean') {
        filters.verified = query.verified;
      }
    }

    // Filtres géographiques textuels
    if (query.city && typeof query.city === 'string') {
      filters.city = query.city;
    }
    if (query.region && typeof query.region === 'string') {
      filters.region = query.region;
    }
    if (query.country && typeof query.country === 'string') {
      filters.country = query.country;
    }

    // Tags
    if (query.tags) {
      if (typeof query.tags === 'string') {
        filters.tags = query.tags.split(',').filter(t => t.trim());
      } else if (Array.isArray(query.tags)) {
        filters.tags = query.tags.filter(t => typeof t === 'string');
      }
    }

    // Filtre géographique avec coordonnées
    if (query.latitude && query.longitude && query.radius) {
      const lat = parseFloat(query.latitude as string);
      const lng = parseFloat(query.longitude as string);
      const radius = parseFloat(query.radius as string);
      
      if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
        filters.location = {
          latitude: lat,
          longitude: lng,
          radius,
          unit: (query.unit as string) === 'mi' ? 'mi' : 'km'
        };
      }
    }

    // Fourchette de dates
    if (query.fromDate || query.toDate) {
      filters.dateRange = {};
      if (query.fromDate && typeof query.fromDate === 'string') {
        const fromDate = new Date(query.fromDate);
        if (!isNaN(fromDate.getTime())) {
          filters.dateRange.from = fromDate;
        }
      }
      if (query.toDate && typeof query.toDate === 'string') {
        const toDate = new Date(query.toDate);
        if (!isNaN(toDate.getTime())) {
          filters.dateRange.to = toDate;
        }
      }
    }

    // Ajouter les filtres s'ils existent
    if (Object.keys(filters).length > 0) {
      params.filters = filters;
    }

    // Tri
    if (query.sort || query.order) {
      params.sort = {
        field: (query.sort as SortField) || SortField.RELEVANCE,
        order: (query.order as string) === 'asc' ? SortOrder.ASC : SortOrder.DESC
      };
    }

    // Pagination
    const page = query.page ? parseInt(query.page as string, 10) : undefined;
    const limit = query.limit ? parseInt(query.limit as string, 10) : undefined;
    const offset = query.offset ? parseInt(query.offset as string, 10) : undefined;

    if (page || limit || offset) {
      params.pagination = {};
      if (page && !isNaN(page)) params.pagination.page = page;
      if (limit && !isNaN(limit)) params.pagination.limit = limit;
      if (offset && !isNaN(offset)) params.pagination.offset = offset;
      if (query.searchAfter && typeof query.searchAfter === 'string') {
        params.pagination.searchAfter = query.searchAfter;
      }
    }

    // Facettes
    if (query.facets) {
      if (typeof query.facets === 'string') {
        params.facets = query.facets.split(',').filter(f => f.trim());
      } else if (Array.isArray(query.facets)) {
        params.facets = query.facets.filter(f => typeof f === 'string');
      }
    }

    // Langue
    if (query.language && typeof query.language === 'string') {
      params.language = query.language;
    }

    // IDs utilisateur et session
    if (query.userId && typeof query.userId === 'string') {
      params.userId = query.userId;
    }
    if (query.sessionId && typeof query.sessionId === 'string') {
      params.sessionId = query.sessionId;
    }

    return params;
  }

  /**
   * Détermine les options de validation selon l'endpoint
   */
  private getValidationOptions(path: string, method: string): ValidationOptions {
    const baseOptions: ValidationOptions = {
      maxQueryLength: 200,
      maxFiltersCount: 50,
      strictMode: false
    };

    // Options spécifiques par endpoint
    if (path.includes('/suggest')) {
      return {
        ...baseOptions,
        maxQueryLength: 100,
        maxFiltersCount: 10,
        strictMode: true // Plus strict pour les suggestions
      };
    }

    if (path.includes('/category')) {
      return {
        ...baseOptions,
        maxFiltersCount: 30 // Moins de filtres pour les catégories
      };
    }

    if (path.includes('/multi-type')) {
      return {
        ...baseOptions,
        maxFiltersCount: 100 // Plus de filtres pour la recherche multi-type
      };
    }

    if (path.includes('/analytics')) {
      return {
        ...baseOptions,
        strictMode: true, // Mode strict pour les analytics
        maxQueryLength: 500 // Requêtes plus longues autorisées pour l'analyse
      };
    }

    return baseOptions;
  }
}

/**
 * Middleware spécialisé pour les suggestions
 */
@Injectable()
export class SuggestionValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SuggestionValidationMiddleware.name);

  constructor(private readonly validationService: SearchValidationService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;

      if (!query) {
        throw new BadRequestException({
          message: 'Paramètre "q" requis pour les suggestions',
          path: req.path
        });
      }

      if (query.length < 2) {
        // Retourner une réponse vide plutôt qu'une erreur
        res.json([]);
        return;
      }

      if (query.length > 100) {
        throw new BadRequestException({
          message: 'Requête trop longue pour les suggestions (max 100 caractères)',
          path: req.path
        });
      }

      // Validation spécifique pour les suggestions
      const validation = await this.validationService.validateSearchParams(
        { query },
        { 
          maxQueryLength: 100, 
          strictMode: true,
          maxFiltersCount: 0 // Pas de filtres pour les suggestions
        }
      );

      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'Requête de suggestion invalide',
          errors: validation.errors
        });
      }

      // Ajouter la requête nettoyée
      req.body.sanitizedQuery = validation.sanitizedParams?.query;

      next();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Suggestion validation error: ${error.message}`, error.stack);
      throw new BadRequestException({
        message: 'Erreur de validation de la suggestion',
        error: error.message
      });
    }
  }
}

/**
 * Middleware pour la validation des paramètres géographiques
 */
@Injectable()
export class GeoValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GeoValidationMiddleware.name);

  constructor(private readonly validationService: SearchValidationService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const { latitude, longitude, radius } = req.query;

      if (latitude || longitude || radius) {
        // Si des paramètres géographiques sont présents, tous doivent être valides
        if (!latitude || !longitude || !radius) {
          throw new BadRequestException({
            message: 'Paramètres géographiques incomplets (latitude, longitude, radius requis)',
            path: req.path
          });
        }

        const lat = parseFloat(latitude as string);
        const lng = parseFloat(longitude as string);
        const rad = parseFloat(radius as string);

        if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
          throw new BadRequestException({
            message: 'Paramètres géographiques invalides (doivent être des nombres)',
            path: req.path
          });
        }

        // Validation stricte des coordonnées géographiques
        const geoFilter = { latitude: lat, longitude: lng, radius: rad };
        const validation = await this.validationService.validateSearchParams(
          { filters: { location: geoFilter } },
          { strictMode: true, maxGeoRadius: 1000 }
        );

        if (!validation.isValid) {
          throw new BadRequestException({
            message: 'Paramètres géographiques invalides',
            errors: validation.errors,
            path: req.path
          });
        }

        // Ajouter les coordonnées validées
        req.body.validatedGeoFilter = geoFilter;
      }

      next();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Geo validation error: ${error.message}`, error.stack);
      throw new BadRequestException({
        message: 'Erreur de validation géographique',
        error: error.message
      });
    }
  }
}