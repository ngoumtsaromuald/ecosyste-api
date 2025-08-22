import { ResourceType, ResourcePlan } from '@prisma/client';

// Enum pour les périodes de temps
export enum TimePeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

// Enum pour les champs de tri
export enum SortField {
  RELEVANCE = 'relevance',
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  POPULARITY = 'popularity',
  RATING = 'rating',
  DISTANCE = 'distance'
}

// Enum pour l'ordre de tri
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// Paramètres de recherche
export interface SearchParams {
  query?: string;
  filters?: SearchFilters;
  sort?: SortOptions;
  pagination?: PaginationParams;
  facets?: string[];
  userId?: string;
  sessionId?: string;
  language?: string; // Langue préférée de l'utilisateur (fr, en, auto)
}

// Paramètres de recherche multi-types
export interface MultiTypeSearchParams extends SearchParams {
  // Types de ressources à inclure dans la recherche (si vide, tous les types)
  includeTypes?: ResourceType[];
  // Grouper les résultats par type
  groupByType?: boolean;
  // Tri par pertinence globale ou par type
  globalRelevanceSort?: boolean;
  // Limites par type de ressource
  limitsPerType?: {
    [key in ResourceType]?: number;
  };
}

// Filtres de recherche
export interface SearchFilters {
  categories?: string[];
  resourceTypes?: ResourceType[];
  plans?: ResourcePlan[];
  location?: GeoFilter;
  priceRange?: PriceRange;
  verified?: boolean;
  city?: string;
  region?: string;
  country?: string;
  tags?: string[];
  dateRange?: DateRange;
}

// Filtre géographique
export interface GeoFilter {
  latitude: number;
  longitude: number;
  radius: number; // en kilomètres
  unit?: 'km' | 'mi';
}

// Fourchette de prix
export interface PriceRange {
  min?: number;
  max?: number;
  currency?: string;
}

// Fourchette de dates
export interface DateRange {
  from?: Date;
  to?: Date;
}

// Options de tri
export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

// Note: SortField and SortOrder enums are already defined above

// Paramètres de pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  searchAfter?: string; // Pour pagination Elasticsearch
}

// Résultats de recherche
export interface SearchResults {
  hits: SearchHit[];
  total: number;
  facets: SearchFacets;
  suggestions?: string[];
  took: number; // Temps de réponse en ms
  page?: number;
  limit?: number;
  hasMore?: boolean;
  metadata?: {
    query?: string;
    filters?: SearchFilters;
    pagination?: PaginationParams;
    categoryId?: string;
    subcategoriesIncluded?: number;
    totalCategoriesSearched?: number;
    [key: string]: any;
  };
}

// Résultats de recherche multi-types avec groupement par type
export interface MultiTypeSearchResults {
  // Résultats groupés par type de ressource
  resultsByType: {
    [key in ResourceType]: {
      hits: SearchHit[];
      total: number;
      facets: SearchFacets;
    };
  };
  // Résultats combinés triés par pertinence globale
  combinedResults: SearchHit[];
  // Total global de tous les types
  totalAcrossTypes: number;
  // Facettes globales
  globalFacets: SearchFacets;
  // Métadonnées de recherche
  took: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  metadata?: {
    query?: string;
    filters?: SearchFilters;
    pagination?: PaginationParams;
    typeDistribution: {
      [key in ResourceType]: number;
    };
    [key: string]: any;
  };
}

// Résultat individuel
export interface SearchHit {
  id: string;
  name: string;
  description?: string;
  resourceType: ResourceType;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  plan: ResourcePlan;
  verified: boolean;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    region?: string;
    country: string;
    distance?: number; // Distance en km si recherche géographique
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  score: number; // Score de pertinence Elasticsearch
  highlight?: Record<string, string[]>; // Extraits mis en surbrillance
  language?: string; // Langue détectée du contenu (fr, en)
  languageConfidence?: number; // Confiance de la détection de langue
  languageAdaptation?: {
    userLanguage: string; // Langue préférée de l'utilisateur
    contentLanguage: string; // Langue détectée du contenu
    relevanceBoost: number; // Boost appliqué selon la correspondance de langue
    translationAvailable?: boolean; // Si une traduction est disponible
  };
}

// Facettes de recherche
export interface SearchFacets {
  categories: FacetBucket[];
  resourceTypes: FacetBucket[];
  plans: FacetBucket[];
  cities: FacetBucket[];
  regions: FacetBucket[];
  verified: FacetBucket[];
  tags: FacetBucket[];
  priceRanges?: FacetBucket[];
  popularity?: FacetBucket[];
  rating?: FacetBucket[];
  globalStats?: {
    totalResources: number;
    averageRating: number;
    verifiedCount: number;
  };
}

// Bucket de facette
export interface FacetBucket {
  key: string;
  count: number;
  selected?: boolean;
  label?: string; // Label affiché à l'utilisateur
}

// Position géographique
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Métriques de recherche
export interface SearchMetrics {
  totalSearches: number;
  averageResponseTime: number;
  popularTerms: PopularTerm[];
  noResultsQueries: NoResultsQuery[];
  clickThroughRate: number;
  period: DateRangeWithGranularity;
}

// Terme populaire
export interface PopularTerm {
  term: string;
  count: number;
  percentage: number;
}

// Requête sans résultats
export interface NoResultsQuery {
  query: string;
  count: number;
  lastSearched: Date;
}

// Période de temps avec dates
export interface DateRangeWithGranularity {
  from: Date;
  to: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

// Paramètres de log de recherche
export interface SearchLogParams {
  query: string;
  filters: SearchFilters;
  userId?: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  resultsCount: number;
  took: number;
  language?: string; // Langue utilisée pour la recherche
  detectedLanguage?: string; // Langue détectée automatiquement
}

// Statut de santé de l'index
export interface IndexHealth {
  status: 'green' | 'yellow' | 'red';
  totalDocs: number;
  indexSize: string;
  lastUpdate: Date;
  errors?: string[];
  shards?: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Statut de santé général
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: {
    elasticsearch: 'fulfilled' | 'rejected';
    redis: 'fulfilled' | 'rejected';
    index: 'fulfilled' | 'rejected';
  };
  details?: Record<string, any>;
}