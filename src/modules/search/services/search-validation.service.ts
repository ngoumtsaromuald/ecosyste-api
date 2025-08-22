import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SearchParams, SearchFilters, GeoFilter, PriceRange, DateRange } from '../interfaces/search.interfaces';
import { ResourceType, ResourcePlan } from '@prisma/client';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  sanitizedParams?: SearchParams;
}

export interface ValidationOptions {
  maxQueryLength?: number;
  maxFiltersCount?: number;
  allowedResourceTypes?: ResourceType[];
  allowedPlans?: ResourcePlan[];
  maxPriceRange?: number;
  maxGeoRadius?: number;
  strictMode?: boolean;
}

@Injectable()
export class SearchValidationService {
  private readonly logger = new Logger(SearchValidationService.name);

  private readonly defaultOptions: ValidationOptions = {
    maxQueryLength: 200,
    maxFiltersCount: 50,
    allowedResourceTypes: Object.values(ResourceType),
    allowedPlans: Object.values(ResourcePlan),
    maxPriceRange: 10000000, // 10M FCFA
    maxGeoRadius: 1000, // 1000 km
    strictMode: false
  };

  // Patterns suspects pour protection contre injection
  private readonly suspiciousPatterns = [
    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*src\s*=\s*["']?javascript:/gi,
    
    // Template injection patterns
    /\{\{.*\}\}/g,
    /\$\{.*\}/g,
    /#\{.*\}/g,
    
    // Elasticsearch injection patterns
    /\{.*"script".*\}/gi,
    /\{.*"source".*\}/gi,
    /"_source":/gi,
    /"query":\s*\{.*"script"/gi,
    
    // SQL injection patterns (au cas où)
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    /update\s+set/gi,
    
    // Command injection patterns
    /;\s*(rm|del|format|shutdown)/gi,
    /\|\s*(curl|wget|nc|netcat)/gi,
    /`.*`/g,
    /\$\(.*\)/g
  ];

  // Caractères dangereux à échapper
  private readonly dangerousChars = [
    '<', '>', '"', "'", '&', '{', '}', '[', ']', 
    '(', ')', ';', '|', '`', '$', '\n', '\r', '\t'
  ];

  /**
   * Valide et nettoie les paramètres de recherche
   */
  async validateSearchParams(
    params: SearchParams, 
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Validation de la requête textuelle
      if (params.query !== undefined) {
        const queryValidation = this.validateQuery(params.query, opts);
        if (!queryValidation.isValid) {
          errors.push(...queryValidation.errors);
        }
        if (queryValidation.warnings) {
          warnings.push(...queryValidation.warnings);
        }
      }

      // Validation des filtres
      if (params.filters) {
        const filtersValidation = this.validateFilters(params.filters, opts);
        if (!filtersValidation.isValid) {
          errors.push(...filtersValidation.errors);
        }
        if (filtersValidation.warnings) {
          warnings.push(...filtersValidation.warnings);
        }
      }

      // Validation de la pagination
      if (params.pagination) {
        const paginationValidation = this.validatePagination(params.pagination);
        if (!paginationValidation.isValid) {
          errors.push(...paginationValidation.errors);
        }
      }

      // Validation des facettes
      if (params.facets) {
        const facetsValidation = this.validateFacets(params.facets);
        if (!facetsValidation.isValid) {
          errors.push(...facetsValidation.errors);
        }
      }

      // Validation de la langue
      if (params.language) {
        const languageValidation = this.validateLanguage(params.language);
        if (!languageValidation.isValid) {
          errors.push(...languageValidation.errors);
        }
      }

      // Créer les paramètres nettoyés
      const sanitizedParams = this.sanitizeSearchParams(params);

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
        sanitizedParams
      };

      if (!result.isValid) {
        this.logger.warn(`Search validation failed: ${errors.join(', ')}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Search validation error: ${error.message}`, error.stack);
      return {
        isValid: false,
        errors: ['Erreur interne de validation']
      };
    }
  }

  /**
   * Valide une requête textuelle
   */
  private validateQuery(query: string, options: ValidationOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier la longueur
    if (query.length > options.maxQueryLength!) {
      errors.push(`La requête est trop longue (max ${options.maxQueryLength} caractères)`);
    }

    // Vérifier les patterns suspects
    if (this.containsSuspiciousPatterns(query)) {
      errors.push('La requête contient des caractères ou patterns non autorisés');
    }

    // Vérifier les caractères dangereux
    if (this.containsDangerousChars(query)) {
      if (options.strictMode) {
        errors.push('La requête contient des caractères dangereux');
      } else {
        warnings.push('La requête contient des caractères qui seront échappés');
      }
    }

    // Vérifier si la requête est vide ou ne contient que des espaces
    if (query.trim().length === 0) {
      warnings.push('La requête est vide');
    }

    // Vérifier la longueur minimale
    if (query.trim().length > 0 && query.trim().length < 2) {
      warnings.push('La requête est très courte, les résultats peuvent être limités');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Valide les filtres de recherche
   */
  private validateFilters(filters: SearchFilters, options: ValidationOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Compter le nombre total de filtres
    const filterCount = this.countFilters(filters);
    if (filterCount > options.maxFiltersCount!) {
      errors.push(`Trop de filtres appliqués (max ${options.maxFiltersCount})`);
    }

    // Valider les catégories
    if (filters.categories) {
      const categoryValidation = this.validateCategories(filters.categories);
      if (!categoryValidation.isValid) {
        errors.push(...categoryValidation.errors);
      }
    }

    // Valider les types de ressources
    if (filters.resourceTypes) {
      const typeValidation = this.validateResourceTypes(filters.resourceTypes, options);
      if (!typeValidation.isValid) {
        errors.push(...typeValidation.errors);
      }
    }

    // Valider les plans
    if (filters.plans) {
      const planValidation = this.validatePlans(filters.plans, options);
      if (!planValidation.isValid) {
        errors.push(...planValidation.errors);
      }
    }

    // Valider la fourchette de prix
    if (filters.priceRange) {
      const priceValidation = this.validatePriceRange(filters.priceRange, options);
      if (!priceValidation.isValid) {
        errors.push(...priceValidation.errors);
      }
    }

    // Valider le filtre géographique
    if (filters.location) {
      const geoValidation = this.validateGeoFilter(filters.location, options);
      if (!geoValidation.isValid) {
        errors.push(...geoValidation.errors);
      }
    }

    // Valider les champs textuels (ville, région, pays)
    if (filters.city) {
      const cityValidation = this.validateTextFilter(filters.city, 'ville');
      if (!cityValidation.isValid) {
        errors.push(...cityValidation.errors);
      }
    }

    if (filters.region) {
      const regionValidation = this.validateTextFilter(filters.region, 'région');
      if (!regionValidation.isValid) {
        errors.push(...regionValidation.errors);
      }
    }

    if (filters.country) {
      const countryValidation = this.validateTextFilter(filters.country, 'pays');
      if (!countryValidation.isValid) {
        errors.push(...countryValidation.errors);
      }
    }

    // Valider les tags
    if (filters.tags) {
      const tagsValidation = this.validateTags(filters.tags);
      if (!tagsValidation.isValid) {
        errors.push(...tagsValidation.errors);
      }
    }

    // Valider la fourchette de dates
    if (filters.dateRange) {
      const dateValidation = this.validateDateRange(filters.dateRange);
      if (!dateValidation.isValid) {
        errors.push(...dateValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Valide les paramètres de pagination
   */
  private validatePagination(pagination: any): ValidationResult {
    const errors: string[] = [];

    if (pagination.page !== undefined) {
      if (!Number.isInteger(pagination.page) || pagination.page < 1) {
        errors.push('Le numéro de page doit être un entier positif');
      }
      if (pagination.page > 1000) {
        errors.push('Le numéro de page est trop élevé (max 1000)');
      }
    }

    if (pagination.limit !== undefined) {
      if (!Number.isInteger(pagination.limit) || pagination.limit < 1) {
        errors.push('La limite doit être un entier positif');
      }
      if (pagination.limit > 100) {
        errors.push('La limite est trop élevée (max 100)');
      }
    }

    if (pagination.offset !== undefined) {
      if (!Number.isInteger(pagination.offset) || pagination.offset < 0) {
        errors.push('L\'offset doit être un entier positif ou zéro');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide les facettes demandées
   */
  private validateFacets(facets: string[]): ValidationResult {
    const errors: string[] = [];
    const allowedFacets = [
      'categories', 'resourceTypes', 'plans', 'verified', 
      'tags', 'cities', 'regions', 'countries'
    ];

    if (facets.length > 20) {
      errors.push('Trop de facettes demandées (max 20)');
    }

    for (const facet of facets) {
      if (!allowedFacets.includes(facet)) {
        errors.push(`Facette non autorisée: ${facet}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide la langue
   */
  private validateLanguage(language: string): ValidationResult {
    const errors: string[] = [];
    const allowedLanguages = ['fr', 'en', 'auto'];

    if (!allowedLanguages.includes(language)) {
      errors.push(`Langue non supportée: ${language}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide les catégories
   */
  private validateCategories(categories: string[]): ValidationResult {
    const errors: string[] = [];

    if (categories.length > 20) {
      errors.push('Trop de catégories sélectionnées (max 20)');
    }

    for (const categoryId of categories) {
      if (!this.isValidUUID(categoryId)) {
        errors.push(`ID de catégorie invalide: ${categoryId}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide les types de ressources
   */
  private validateResourceTypes(types: ResourceType[], options: ValidationOptions): ValidationResult {
    const errors: string[] = [];

    for (const type of types) {
      if (!options.allowedResourceTypes!.includes(type)) {
        errors.push(`Type de ressource non autorisé: ${type}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide les plans
   */
  private validatePlans(plans: ResourcePlan[], options: ValidationOptions): ValidationResult {
    const errors: string[] = [];

    for (const plan of plans) {
      if (!options.allowedPlans!.includes(plan)) {
        errors.push(`Plan non autorisé: ${plan}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide la fourchette de prix
   */
  private validatePriceRange(priceRange: PriceRange, options: ValidationOptions): ValidationResult {
    const errors: string[] = [];

    if (priceRange.min !== undefined) {
      if (priceRange.min < 0) {
        errors.push('Le prix minimum ne peut pas être négatif');
      }
      if (priceRange.min > options.maxPriceRange!) {
        errors.push(`Le prix minimum est trop élevé (max ${options.maxPriceRange})`);
      }
    }

    if (priceRange.max !== undefined) {
      if (priceRange.max < 0) {
        errors.push('Le prix maximum ne peut pas être négatif');
      }
      if (priceRange.max > options.maxPriceRange!) {
        errors.push(`Le prix maximum est trop élevé (max ${options.maxPriceRange})`);
      }
    }

    if (priceRange.min !== undefined && priceRange.max !== undefined) {
      if (priceRange.min > priceRange.max) {
        errors.push('Le prix minimum ne peut pas être supérieur au prix maximum');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide le filtre géographique
   */
  private validateGeoFilter(geoFilter: GeoFilter, options: ValidationOptions): ValidationResult {
    const errors: string[] = [];

    // Valider la latitude
    if (geoFilter.latitude < -90 || geoFilter.latitude > 90) {
      errors.push('La latitude doit être comprise entre -90 et 90');
    }

    // Valider la longitude
    if (geoFilter.longitude < -180 || geoFilter.longitude > 180) {
      errors.push('La longitude doit être comprise entre -180 et 180');
    }

    // Valider le rayon
    if (geoFilter.radius <= 0) {
      errors.push('Le rayon doit être positif');
    }
    if (geoFilter.radius > options.maxGeoRadius!) {
      errors.push(`Le rayon est trop grand (max ${options.maxGeoRadius} km)`);
    }

    // Valider l'unité
    if (geoFilter.unit && !['km', 'mi'].includes(geoFilter.unit)) {
      errors.push('L\'unité doit être "km" ou "mi"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide un filtre textuel
   */
  private validateTextFilter(text: string, fieldName: string): ValidationResult {
    const errors: string[] = [];

    if (text.length > 100) {
      errors.push(`Le champ ${fieldName} est trop long (max 100 caractères)`);
    }

    if (this.containsSuspiciousPatterns(text)) {
      errors.push(`Le champ ${fieldName} contient des caractères non autorisés`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide les tags
   */
  private validateTags(tags: string[]): ValidationResult {
    const errors: string[] = [];

    if (tags.length > 50) {
      errors.push('Trop de tags sélectionnés (max 50)');
    }

    for (const tag of tags) {
      if (tag.length > 50) {
        errors.push(`Tag trop long: ${tag} (max 50 caractères)`);
      }
      if (this.containsSuspiciousPatterns(tag)) {
        errors.push(`Tag contient des caractères non autorisés: ${tag}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide la fourchette de dates
   */
  private validateDateRange(dateRange: DateRange): ValidationResult {
    const errors: string[] = [];

    if (dateRange.from && dateRange.to) {
      if (dateRange.from > dateRange.to) {
        errors.push('La date de début ne peut pas être postérieure à la date de fin');
      }
    }

    // Vérifier que les dates ne sont pas trop anciennes ou futures
    const now = new Date();
    const maxPastDate = new Date(now.getFullYear() - 50, 0, 1);
    const maxFutureDate = new Date(now.getFullYear() + 10, 11, 31);

    if (dateRange.from && dateRange.from < maxPastDate) {
      errors.push('La date de début est trop ancienne');
    }

    if (dateRange.to && dateRange.to > maxFutureDate) {
      errors.push('La date de fin est trop future');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Nettoie et sécurise les paramètres de recherche
   */
  private sanitizeSearchParams(params: SearchParams): SearchParams {
    const sanitized: SearchParams = { ...params };

    // Nettoyer la requête
    if (sanitized.query) {
      sanitized.query = this.sanitizeString(sanitized.query);
    }

    // Nettoyer les filtres textuels
    if (sanitized.filters) {
      if (sanitized.filters.city) {
        sanitized.filters.city = this.sanitizeString(sanitized.filters.city);
      }
      if (sanitized.filters.region) {
        sanitized.filters.region = this.sanitizeString(sanitized.filters.region);
      }
      if (sanitized.filters.country) {
        sanitized.filters.country = this.sanitizeString(sanitized.filters.country);
      }
      if (sanitized.filters.tags) {
        sanitized.filters.tags = sanitized.filters.tags.map(tag => this.sanitizeString(tag));
      }
    }

    return sanitized;
  }

  /**
   * Nettoie une chaîne de caractères
   */
  private sanitizeString(input: string): string {
    let sanitized = input.trim();

    // Échapper les caractères dangereux
    for (const char of this.dangerousChars) {
      sanitized = sanitized.replace(new RegExp(`\\${char}`, 'g'), '');
    }

    // Supprimer les patterns suspects
    for (const pattern of this.suspiciousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Normaliser les espaces
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  /**
   * Vérifie si une chaîne contient des patterns suspects
   */
  private containsSuspiciousPatterns(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Vérifie si une chaîne contient des caractères dangereux
   */
  private containsDangerousChars(input: string): boolean {
    return this.dangerousChars.some(char => input.includes(char));
  }

  /**
   * Compte le nombre total de filtres
   */
  private countFilters(filters: SearchFilters): number {
    let count = 0;
    
    if (filters.categories) count += filters.categories.length;
    if (filters.resourceTypes) count += filters.resourceTypes.length;
    if (filters.plans) count += filters.plans.length;
    if (filters.tags) count += filters.tags.length;
    if (filters.location) count += 1;
    if (filters.priceRange) count += 1;
    if (filters.verified !== undefined) count += 1;
    if (filters.city) count += 1;
    if (filters.region) count += 1;
    if (filters.country) count += 1;
    if (filters.dateRange) count += 1;

    return count;
  }

  /**
   * Vérifie si une chaîne est un UUID valide
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Valide et lance une exception si les paramètres sont invalides
   */
  async validateAndThrow(params: SearchParams, options: ValidationOptions = {}): Promise<SearchParams> {
    const validation = await this.validateSearchParams(params, options);
    
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Paramètres de recherche invalides',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    return validation.sanitizedParams!;
  }
}