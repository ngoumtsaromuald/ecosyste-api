import { Injectable, Logger } from '@nestjs/common';
import { Counter, Gauge, Histogram, register } from 'prom-client';
import { SearchParams, SearchResults } from '../interfaces/search.interfaces';

export interface SearchMetrics {
  searchLatency: Histogram<string>;
  searchRequestsTotal: Counter<string>;
  searchResultsCount: Histogram<string>;
  searchErrorsTotal: Counter<string>;
  searchCacheHitRate: Gauge<string>;
  searchActiveQueries: Gauge<string>;
  searchIndexHealth: Gauge<string>;
  searchSuggestionLatency: Histogram<string>;
  searchGeographicQueries: Counter<string>;
  searchPersonalizedQueries: Counter<string>;
}

@Injectable()
export class SearchMetricsService {
  private readonly logger = new Logger(SearchMetricsService.name);
  
  // Search Performance Metrics
  private readonly searchLatency = new Histogram({
    name: 'search_duration_seconds',
    help: 'Duration of search requests in seconds',
    labelNames: ['search_type', 'status', 'cache_hit'],
    buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
  });

  private readonly searchRequestsTotal = new Counter({
    name: 'search_requests_total',
    help: 'Total number of search requests',
    labelNames: ['search_type', 'status', 'user_type']
  });

  private readonly searchResultsCount = new Histogram({
    name: 'search_results_count',
    help: 'Number of results returned by search queries',
    labelNames: ['search_type', 'has_filters'],
    buckets: [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000]
  });

  private readonly searchErrorsTotal = new Counter({
    name: 'search_errors_total',
    help: 'Total number of search errors',
    labelNames: ['error_type', 'search_type', 'component']
  });

  // Search Cache Metrics
  private readonly searchCacheHitRate = new Gauge({
    name: 'search_cache_hit_rate',
    help: 'Search cache hit rate percentage',
    labelNames: ['cache_type']
  });

  private readonly searchActiveQueries = new Gauge({
    name: 'search_active_queries',
    help: 'Number of currently active search queries'
  });

  // Search Infrastructure Metrics
  private readonly searchIndexHealth = new Gauge({
    name: 'search_index_health_score',
    help: 'Search index health score (0=red, 1=yellow, 2=green)',
    labelNames: ['index_name']
  });

  // Feature-specific Metrics
  private readonly searchSuggestionLatency = new Histogram({
    name: 'search_suggestion_duration_seconds',
    help: 'Duration of search suggestion requests in seconds',
    labelNames: ['suggestion_type'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5]
  });

  private readonly searchGeographicQueries = new Counter({
    name: 'search_geographic_queries_total',
    help: 'Total number of geographic search queries',
    labelNames: ['location_type', 'radius_range']
  });

  private readonly searchPersonalizedQueries = new Counter({
    name: 'search_personalized_queries_total',
    help: 'Total number of personalized search queries',
    labelNames: ['personalization_type', 'user_segment']
  });

  // Query Pattern Metrics
  private readonly searchQueryLength = new Histogram({
    name: 'search_query_length_chars',
    help: 'Length of search queries in characters',
    buckets: [0, 5, 10, 20, 50, 100, 200]
  });

  private readonly searchFilterUsage = new Counter({
    name: 'search_filter_usage_total',
    help: 'Usage count of different search filters',
    labelNames: ['filter_type', 'filter_value']
  });

  constructor() {
    this.logger.log('SearchMetricsService initialized with Prometheus metrics');
  }

  /**
   * Record search request latency
   */
  recordSearchLatency(
    duration: number,
    searchType: string,
    status: 'success' | 'error',
    cacheHit: boolean = false
  ): void {
    this.searchLatency
      .labels(searchType, status, cacheHit ? 'hit' : 'miss')
      .observe(duration / 1000); // Convert to seconds
  }

  /**
   * Record search request
   */
  recordSearchRequest(
    searchType: string,
    status: 'success' | 'error',
    userType: 'authenticated' | 'anonymous' = 'anonymous'
  ): void {
    this.searchRequestsTotal
      .labels(searchType, status, userType)
      .inc();
  }

  /**
   * Record search results count
   */
  recordSearchResults(
    resultsCount: number,
    searchType: string,
    hasFilters: boolean = false
  ): void {
    this.searchResultsCount
      .labels(searchType, hasFilters ? 'with_filters' : 'no_filters')
      .observe(resultsCount);
  }

  /**
   * Record search error
   */
  recordSearchError(
    errorType: string,
    searchType: string,
    component: string = 'search_service'
  ): void {
    this.searchErrorsTotal
      .labels(errorType, searchType, component)
      .inc();
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate(cacheType: string, hitRate: number): void {
    this.searchCacheHitRate
      .labels(cacheType)
      .set(hitRate);
  }

  /**
   * Update active queries count
   */
  updateActiveQueries(count: number): void {
    this.searchActiveQueries.set(count);
  }

  /**
   * Update index health score
   */
  updateIndexHealth(indexName: string, healthStatus: 'green' | 'yellow' | 'red'): void {
    const healthScore = healthStatus === 'green' ? 2 : healthStatus === 'yellow' ? 1 : 0;
    this.searchIndexHealth
      .labels(indexName)
      .set(healthScore);
  }

  /**
   * Record suggestion request latency
   */
  recordSuggestionLatency(duration: number, suggestionType: string): void {
    this.searchSuggestionLatency
      .labels(suggestionType)
      .observe(duration / 1000);
  }

  /**
   * Record geographic search query
   */
  recordGeographicQuery(locationType: string, radiusKm: number): void {
    const radiusRange = this.getRadiusRange(radiusKm);
    this.searchGeographicQueries
      .labels(locationType, radiusRange)
      .inc();
  }

  /**
   * Record personalized search query
   */
  recordPersonalizedQuery(personalizationType: string, userSegment: string): void {
    this.searchPersonalizedQueries
      .labels(personalizationType, userSegment)
      .inc();
  }

  /**
   * Record query characteristics
   */
  recordQueryCharacteristics(params: SearchParams): void {
    if (params.query) {
      this.searchQueryLength.observe(params.query.length);
    }

    // Record filter usage
    if (params.filters) {
      if (params.filters.categories?.length) {
        this.searchFilterUsage.labels('category', 'multiple').inc();
      }
      if (params.filters.resourceTypes?.length) {
        this.searchFilterUsage.labels('resource_type', 'multiple').inc();
      }
      if (params.filters.plans?.length) {
        this.searchFilterUsage.labels('plan', 'multiple').inc();
      }
      if (params.filters.location) {
        this.searchFilterUsage.labels('location', 'geographic').inc();
      }
      if (params.filters.priceRange) {
        this.searchFilterUsage.labels('price', 'range').inc();
      }
    }
  }

  /**
   * Record comprehensive search metrics
   */
  recordSearchMetrics(
    params: SearchParams,
    results: SearchResults,
    duration: number,
    searchType: string,
    cacheHit: boolean = false,
    userType: 'authenticated' | 'anonymous' = 'anonymous'
  ): void {
    // Record basic metrics
    this.recordSearchLatency(duration, searchType, 'success', cacheHit);
    this.recordSearchRequest(searchType, 'success', userType);
    this.recordSearchResults(results.total, searchType, !!params.filters);
    
    // Record query characteristics
    this.recordQueryCharacteristics(params);

    // Record geographic queries
    if (params.filters?.location) {
      this.recordGeographicQuery('user_location', 10); // Default radius
    }
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    try {
      return await register.metrics();
    } catch (error) {
      this.logger.error('Failed to get search metrics:', error);
      return '';
    }
  }

  /**
   * Get search-specific metrics summary
   */
  getSearchMetricsSummary(): SearchMetrics {
    return {
      searchLatency: this.searchLatency,
      searchRequestsTotal: this.searchRequestsTotal,
      searchResultsCount: this.searchResultsCount,
      searchErrorsTotal: this.searchErrorsTotal,
      searchCacheHitRate: this.searchCacheHitRate,
      searchActiveQueries: this.searchActiveQueries,
      searchIndexHealth: this.searchIndexHealth,
      searchSuggestionLatency: this.searchSuggestionLatency,
      searchGeographicQueries: this.searchGeographicQueries,
      searchPersonalizedQueries: this.searchPersonalizedQueries
    };
  }

  /**
   * Clear all search metrics (for testing)
   */
  clearMetrics(): void {
    register.clear();
    this.logger.debug('Search metrics cleared');
  }

  /**
   * Helper method to categorize radius ranges
   */
  private getRadiusRange(radiusKm: number): string {
    if (radiusKm <= 1) return '0-1km';
    if (radiusKm <= 5) return '1-5km';
    if (radiusKm <= 10) return '5-10km';
    if (radiusKm <= 25) return '10-25km';
    if (radiusKm <= 50) return '25-50km';
    return '50km+';
  }
}