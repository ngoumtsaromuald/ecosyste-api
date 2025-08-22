/**
 * Client principal pour l'API de recherche ROMAPI
 */

import fetch from 'cross-fetch';
import {
  ClientConfig,
  AdvancedConfig,
  SearchParams,
  SearchResults,
  GeoSearchParams,
  CategorySearchParams,
  CategorySearchResults,
  MultiTypeSearchParams,
  MultiTypeSearchResults,
  Suggestion,
  SuggestOptions,
  SearchOptions,
  SearchAnalytics,
  APIError,
  ErrorResponse,
  RequestOptions,
  CacheEntry,
  RateLimitInfo,
  EventCallback,
  SearchEvent
} from './types';

export class ROMAPISearchClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private retries: number;
  private userAgent: string;
  private defaultLimit: number;
  private enableCache: boolean;
  private cacheTimeout: number;
  private cache: Map<string, CacheEntry<any>>;
  private rateLimitInfo?: RateLimitInfo;
  private eventListeners: Map<string, EventCallback[]>;
  private config: AdvancedConfig;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://api.romapi.com/api/v1';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.userAgent = config.userAgent || `romapi-search-sdk-js/1.0.0`;
    this.defaultLimit = config.defaultLimit || 20;
    this.enableCache = config.enableCache !== false;
    this.cacheTimeout = config.cacheTimeout || 300000; // 5 minutes
    this.cache = new Map();
    this.eventListeners = new Map();
    this.config = config as AdvancedConfig;

    // Nettoyer le cache périodiquement
    if (this.enableCache) {
      setInterval(() => this.cleanCache(), 60000); // Chaque minute
    }
  }

  /**
   * Recherche principale avec filtres avancés
   */
  async search(params: SearchParams, options: SearchOptions = {}): Promise<SearchResults> {
    const url = this.buildUrl('/search', this.paramsToQuery(params));
    return this.makeRequest<SearchResults>(url, options);
  }

  /**
   * Suggestions auto-complete
   */
  async suggest(query: string, options: SuggestOptions = {}): Promise<Suggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const params = {
      q: query.trim(),
      limit: options.limit || 10,
      ...options
    };

    const url = this.buildUrl('/search/suggest', params);
    return this.makeRequest<Suggestion[]>(url);
  }

  /**
   * Suggestions populaires
   */
  async getPopularSuggestions(limit: number = 20): Promise<Suggestion[]> {
    const url = this.buildUrl('/search/suggest/popular', { limit });
    return this.makeRequest<Suggestion[]>(url);
  }

  /**
   * Suggestions intelligentes
   */
  async getSmartSuggestions(query: string, options: SuggestOptions = {}): Promise<Suggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const params = {
      q: query.trim(),
      limit: options.limit || 10,
      userId: options.userId
    };

    const url = this.buildUrl('/search/suggest/smart', params);
    return this.makeRequest<Suggestion[]>(url);
  }

  /**
   * Recherche géographique
   */
  async searchNearby(params: GeoSearchParams, options: SearchOptions = {}): Promise<SearchResults> {
    const queryParams = {
      ...this.paramsToQuery(params),
      latitude: params.location.latitude,
      longitude: params.location.longitude,
      radius: params.radius
    };

    const url = this.buildUrl('/search/nearby', queryParams);
    return this.makeRequest<SearchResults>(url, options);
  }

  /**
   * Recherche par catégorie
   */
  async searchByCategory(
    categoryId: string, 
    params: CategorySearchParams = {}, 
    options: SearchOptions = {}
  ): Promise<CategorySearchResults> {
    const queryParams = this.paramsToQuery(params);
    const url = this.buildUrl(`/search/categories/${categoryId}/hierarchy`, queryParams);
    return this.makeRequest<CategorySearchResults>(url, options);
  }

  /**
   * Recherche par slug de catégorie (SEO-friendly)
   */
  async searchByCategorySlug(
    slug: string, 
    params: CategorySearchParams = {}, 
    options: SearchOptions = {}
  ): Promise<CategorySearchResults> {
    const queryParams = this.paramsToQuery(params);
    const url = this.buildUrl(`/search/categories/${slug}`, queryParams);
    return this.makeRequest<CategorySearchResults>(url, options);
  }

  /**
   * Recherche multi-types
   */
  async searchMultiType(
    params: MultiTypeSearchParams, 
    options: SearchOptions = {}
  ): Promise<MultiTypeSearchResults> {
    const queryParams = this.paramsToQuery(params);
    const url = this.buildUrl('/search/multi-type', queryParams);
    return this.makeRequest<MultiTypeSearchResults>(url, options);
  }

  /**
   * Obtenir la hiérarchie des catégories
   */
  async getCategoryHierarchy(categoryId?: string, options: SearchOptions = {}): Promise<any> {
    const params = categoryId ? { categoryId } : {};
    const url = this.buildUrl('/search/categories/hierarchy', params);
    return this.makeRequest<any>(url, options);
  }

  /**
   * Analytics de recherche (nécessite authentification)
   */
  async getSearchAnalytics(period: string = '7d'): Promise<SearchAnalytics> {
    if (!this.apiKey) {
      throw new Error('API key required for analytics');
    }

    const url = this.buildUrl('/search/analytics', { period });
    return this.makeRequest<SearchAnalytics>(url);
  }

  /**
   * Recherche avec retry automatique
   */
  async searchWithRetry(params: SearchParams, maxRetries: number = 3): Promise<SearchResults> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.search(params);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Attendre avant de réessayer (backoff exponentiel)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Recherche avec debouncing pour suggestions
   */
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  async suggestWithDebounce(
    query: string, 
    options: SuggestOptions = {}, 
    delay: number = 300
  ): Promise<Suggestion[]> {
    return new Promise((resolve, reject) => {
      const key = `suggest_${query}_${JSON.stringify(options)}`;
      
      // Annuler le timer précédent
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Créer un nouveau timer
      const timer = setTimeout(async () => {
        try {
          const results = await this.suggest(query, options);
          resolve(results);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, delay);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Gestion des événements
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: SearchEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Utilitaires privés
   */
  private async makeRequest<T>(url: string, options: SearchOptions = {}): Promise<T> {
    const cacheKey = url;
    
    // Vérifier le cache
    if (this.enableCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const requestOptions: RequestOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': this.userAgent,
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      },
      signal: options.signal
    };

    // Appliquer les intercepteurs de requête
    if (this.config.interceptors?.request) {
      for (const interceptor of this.config.interceptors.request) {
        Object.assign(requestOptions, await interceptor(url, requestOptions));
      }
    }

    const startTime = Date.now();

    try {
      const fetchFn = this.config.customFetch || fetch;
      const response = await fetchFn(url, requestOptions);
      
      // Mettre à jour les informations de rate limiting
      this.updateRateLimitInfo(response);

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          success: false,
          error: {
            code: 'HTTP_ERROR',
            message: response.statusText,
            timestamp: new Date().toISOString(),
            path: url,
            method: 'GET'
          }
        }));

        throw new ROMAPIError(errorData.error, response.status);
      }

      let data: T = await response.json();

      // Appliquer les intercepteurs de réponse
      if (this.config.interceptors?.response) {
        for (const interceptor of this.config.interceptors.response) {
          data = await interceptor(data);
        }
      }

      // Mettre en cache
      if (this.enableCache) {
        this.setCache(cacheKey, data);
      }

      // Émettre l'événement de succès
      this.emit({
        type: 'search',
        data: { url, response: data, took: Date.now() - startTime },
        timestamp: new Date()
      });

      return data;

    } catch (error) {
      // Émettre l'événement d'erreur
      this.emit({
        type: 'error',
        data: { url, error, took: Date.now() - startTime },
        timestamp: new Date()
      });

      throw error;
    }
  }

  private buildUrl(path: string, params: Record<string, any> = {}): string {
    const url = new URL(path, this.baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });

    return url.toString();
  }

  private paramsToQuery(params: SearchParams): Record<string, any> {
    const query: Record<string, any> = {};

    if (params.query) query.q = params.query;
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query[key] = value;
        }
      });
    }
    if (params.sort) {
      query.sort = params.sort.field;
      query.order = params.sort.order;
    }
    if (params.pagination) {
      query.page = params.pagination.page;
      query.limit = params.pagination.limit;
    }
    if (params.facets) query.facets = params.facets;
    if (params.userId) query.userId = params.userId;
    if (params.sessionId) query.sessionId = params.sessionId;

    return query;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.cacheTimeout
    });
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private updateRateLimitInfo(response: Response): void {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        resetTime: new Date(parseInt(reset) * 1000)
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Getters publics
   */
  get rateLimits(): RateLimitInfo | undefined {
    return this.rateLimitInfo;
  }

  get cacheSize(): number {
    return this.cache.size;
  }

  /**
   * Méthodes utilitaires publiques
   */
  clearCache(): void {
    this.cache.clear();
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }
}

/**
 * Classe d'erreur personnalisée
 */
export class ROMAPIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: string;
  public readonly path: string;
  public readonly method: string;
  public readonly details?: any;

  constructor(error: APIError, statusCode: number) {
    super(error.message);
    this.name = 'ROMAPIError';
    this.code = error.code;
    this.statusCode = statusCode;
    this.timestamp = error.timestamp;
    this.path = error.path;
    this.method = error.method;
    this.details = error.details;
  }
}

/**
 * Factory function pour créer un client
 */
export function createSearchClient(config: ClientConfig = {}): ROMAPISearchClient {
  return new ROMAPISearchClient(config);
}

// Export par défaut
export default ROMAPISearchClient;