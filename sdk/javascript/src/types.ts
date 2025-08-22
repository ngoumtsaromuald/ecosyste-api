/**
 * Types TypeScript pour le SDK de recherche ROMAPI
 */

export enum ResourceType {
  API = 'API',
  BUSINESS = 'BUSINESS',
  SERVICE = 'SERVICE'
}

export enum ResourcePlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  FEATURED = 'FEATURED'
}

export enum SortField {
  RELEVANCE = 'relevance',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  POPULARITY = 'popularity',
  RATING = 'rating',
  DISTANCE = 'distance'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export enum SuggestionType {
  QUERY = 'query',
  CATEGORY = 'category',
  RESOURCE = 'resource',
  POPULAR = 'popular'
}

// Interfaces de base
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface PriceRange {
  min?: number;
  max?: number;
}

export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface Contact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

// Paramètres de recherche
export interface SearchFilters {
  categories?: string[];
  resourceTypes?: ResourceType[];
  plans?: ResourcePlan[];
  priceRange?: PriceRange;
  verified?: boolean;
  city?: string;
  region?: string;
  tags?: string[];
}

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SearchParams {
  query?: string;
  filters?: SearchFilters;
  sort?: SortOptions;
  pagination?: PaginationParams;
  facets?: string[];
  userId?: string;
  sessionId?: string;
}

export interface GeoSearchParams extends SearchParams {
  location: GeoLocation;
  radius: number;
}

export interface CategorySearchParams extends SearchParams {
  includeSubcategories?: boolean;
  maxDepth?: number;
  showCounts?: boolean;
}

export interface MultiTypeSearchParams extends SearchParams {
  includeTypes?: ResourceType[];
  groupByType?: boolean;
  globalRelevanceSort?: boolean;
}

// Résultats de recherche
export interface SearchHit {
  id: string;
  name: string;
  slug: string;
  description: string;
  resourceType: ResourceType;
  plan: ResourcePlan;
  verified: boolean;
  score: number;
  category: Category;
  address?: Address;
  contact?: Contact;
  tags: string[];
  rating?: number;
  distance?: number;
  createdAt: string;
  updatedAt?: string;
  highlights?: string[];
}

export interface SearchFacet {
  name: string;
  values: Record<string, number>;
  total: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchMetadata {
  query?: string;
  appliedFilters: string[];
  searchId: string;
}

export interface SearchResults {
  hits: SearchHit[];
  total: number;
  took: number;
  facets: SearchFacet[];
  suggestions?: string[];
  pagination: PaginationInfo;
  metadata: SearchMetadata;
}

// Suggestions
export interface Suggestion {
  text: string;
  score: number;
  type: SuggestionType;
  count?: number;
  category?: Category;
  highlighted?: string;
}

// Recherche multi-types
export interface TypedSearchResults {
  hits: SearchHit[];
  total: number;
  facets: SearchFacet[];
}

export interface MultiTypeSearchResults {
  resultsByType: Record<string, TypedSearchResults>;
  totalAcrossTypes: number;
  took: number;
  mixedResults?: SearchHit[];
  paginationByType: Record<string, PaginationInfo>;
}

// Recherche par catégorie
export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  resourceCount: number;
}

export interface Breadcrumb {
  id: string;
  name: string;
  slug: string;
  url: string;
}

export interface SEOInfo {
  title: string;
  description: string;
  canonicalUrl: string;
  shareUrl: string;
  breadcrumbsSchema?: any;
}

export interface CategorySearchResults extends SearchResults {
  categoryInfo: CategoryInfo;
  breadcrumbs: Breadcrumb[];
  subcategories: CategoryInfo[];
  parentCategory?: CategoryInfo;
  seo: SEOInfo;
}

// Analytics
export interface PopularTerm {
  term: string;
  count: number;
  percentage: number;
}

export interface NoResultsQuery {
  query: string;
  count: number;
  lastSeen: string;
}

export interface SearchMetrics {
  averageResponseTime: number;
  totalSearches: number;
  successRate: number;
  cacheHitRate: number;
}

export interface SearchAnalytics {
  popularTerms: PopularTerm[];
  noResultsQueries: NoResultsQuery[];
  metrics: SearchMetrics;
}

// Configuration du client
export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  userAgent?: string;
  defaultLimit?: number;
  enableCache?: boolean;
  cacheTimeout?: number;
}

// Erreurs
export interface APIError {
  code: string;
  message: string;
  timestamp: string;
  path: string;
  method: string;
  details?: any;
}

export interface ErrorResponse {
  success: false;
  error: APIError;
}

// Options pour les méthodes
export interface SuggestOptions {
  limit?: number;
  userId?: string;
  includePopular?: boolean;
  sessionId?: string;
}

export interface SearchOptions {
  signal?: AbortSignal;
  timeout?: number;
}

// Événements et callbacks
export interface SearchEvent {
  type: 'search' | 'suggest' | 'error';
  data: any;
  timestamp: Date;
}

export type EventCallback = (event: SearchEvent) => void;

// Utilitaires
export interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
}

// Types pour les hooks et middleware
export type RequestInterceptor = (url: string, options: RequestOptions) => Promise<RequestOptions> | RequestOptions;
export type ResponseInterceptor<T> = (response: T) => Promise<T> | T;

export interface Interceptors {
  request?: RequestInterceptor[];
  response?: ResponseInterceptor<any>[];
}

// Configuration avancée
export interface AdvancedConfig extends ClientConfig {
  interceptors?: Interceptors;
  customFetch?: typeof fetch;
  logger?: {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
  };
}