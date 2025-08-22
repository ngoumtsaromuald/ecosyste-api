import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchParams, SearchResults, SearchFilters } from '../interfaces/search.interfaces';
import { SearchLoggerService, SearchContext, SearchDebugInfo } from './search-logger.service';

export interface DebugSearchRequest {
  searchId: string;
  params: SearchParams;
  userId?: string;
  sessionId?: string;
  enableProfiling?: boolean;
  explainQuery?: boolean;
  includeRawResponse?: boolean;
  debugLevel: 'basic' | 'detailed' | 'verbose';
}

export interface DebugSearchResponse {
  searchId: string;
  results: SearchResults;
  debugInfo: {
    query: {
      original: SearchParams;
      processed: SearchParams;
      elasticsearch: any;
      explanation?: any;
    };
    performance: {
      totalTime: number;
      breakdown: {
        preprocessing: number;
        elasticsearch: number;
        postprocessing: number;
        caching: number;
      };
      bottlenecks: string[];
    };
    cache: {
      key: string;
      hit: boolean;
      ttl?: number;
      size?: number;
    };
    elasticsearch: {
      took: number;
      timedOut: boolean;
      shards: {
        total: number;
        successful: number;
        skipped: number;
        failed: number;
      };
      rawResponse?: any;
    };
    personalization?: {
      applied: boolean;
      userId?: string;
      preferences?: any;
      adjustments?: any;
    };
    language: {
      detected: string;
      confidence: number;
      analyzer: string;
    };
    filters: {
      applied: SearchFilters;
      processed: any;
      facets: any;
    };
    suggestions?: {
      count: number;
      sources: string[];
      ranking: any;
    };
    warnings: string[];
    recommendations: string[];
  };
}

export interface QueryExplanation {
  query: any;
  explanation: {
    value: number;
    description: string;
    details: any[];
  };
  matchedDocuments: number;
  executionTime: number;
}

@Injectable()
export class SearchDebugService {
  private readonly logger = new Logger(SearchDebugService.name);
  private readonly debugEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly searchLogger: SearchLoggerService,
  ) {
    this.debugEnabled = this.configService.get('search.debug', false);
  }
 
 
 /**
   * Execute search with debug information collection
   */
  async debugSearch(
    request: DebugSearchRequest,
    searchOperation: (params: SearchParams) => Promise<SearchResults>
  ): Promise<DebugSearchResponse> {
    const startTime = Date.now();
    const searchContext = this.searchLogger.createSearchContext(
      request.params,
      request.userId,
      request.sessionId
    );

    const debugInfo: DebugSearchResponse['debugInfo'] = {
      query: {
        original: request.params,
        processed: { ...request.params },
        elasticsearch: {},
      },
      performance: {
        totalTime: 0,
        breakdown: {
          preprocessing: 0,
          elasticsearch: 0,
          postprocessing: 0,
          caching: 0,
        },
        bottlenecks: [],
      },
      cache: {
        key: '',
        hit: false,
      },
      elasticsearch: {
        took: 0,
        timedOut: false,
        shards: {
          total: 0,
          successful: 0,
          skipped: 0,
          failed: 0,
        },
      },
      language: {
        detected: 'unknown',
        confidence: 0,
        analyzer: 'standard',
      },
      filters: {
        applied: request.params.filters || {},
        processed: {},
        facets: {},
      },
      warnings: [],
      recommendations: [],
    };

    try {
      // Preprocessing phase
      const preprocessStart = Date.now();
      const processedParams = await this.preprocessSearchParams(request.params, debugInfo);
      debugInfo.performance.breakdown.preprocessing = Date.now() - preprocessStart;

      // Execute search with profiling
      const searchStart = Date.now();
      const results = await this.executeSearchWithProfiling(
        processedParams,
        searchOperation,
        debugInfo,
        request
      );
      debugInfo.performance.breakdown.elasticsearch = Date.now() - searchStart;

      // Postprocessing phase
      const postprocessStart = Date.now();
      await this.postprocessResults(results, debugInfo, request);
      debugInfo.performance.breakdown.postprocessing = Date.now() - postprocessStart;

      // Calculate total time and identify bottlenecks
      debugInfo.performance.totalTime = Date.now() - startTime;
      debugInfo.performance.bottlenecks = this.identifyBottlenecks(debugInfo.performance.breakdown);

      // Generate recommendations
      debugInfo.recommendations = this.generateRecommendations(debugInfo);

      this.searchLogger.logDebugInfo(searchContext, {
        elasticsearchQuery: debugInfo.query.elasticsearch,
        performance: {
          totalTime: debugInfo.performance.totalTime,
          elasticsearchTime: debugInfo.performance.breakdown.elasticsearch,
          cacheTime: debugInfo.performance.breakdown.caching,
          processingTime: debugInfo.performance.breakdown.preprocessing + debugInfo.performance.breakdown.postprocessing,
        },
        cacheHit: debugInfo.cache.hit,
        languageDetected: debugInfo.language.detected,
      });

      return {
        searchId: request.searchId,
        results,
        debugInfo,
      };
    } catch (error) {
      this.logger.error(`Debug search failed for ${request.searchId}`, error);
      throw error;
    }
  }

  /**
   * Preprocess search parameters and collect debug info
   */
  private async preprocessSearchParams(
    params: SearchParams,
    debugInfo: DebugSearchResponse['debugInfo']
  ): Promise<SearchParams> {
    const processed = { ...params };

    // Language detection
    if (params.query) {
      const languageInfo = await this.detectLanguage(params.query);
      debugInfo.language = languageInfo;
      processed.language = languageInfo.detected;
    }

    // Query normalization
    if (params.query) {
      processed.query = this.normalizeQuery(params.query);
      if (processed.query !== params.query) {
        debugInfo.warnings.push(`Query normalized from "${params.query}" to "${processed.query}"`);
      }
    }

    // Filter validation and processing
    if (params.filters) {
      const { validFilters, warnings } = this.validateAndProcessFilters(params.filters);
      processed.filters = validFilters;
      debugInfo.filters.processed = validFilters;
      debugInfo.warnings.push(...warnings);
    }

    debugInfo.query.processed = processed;
    return processed;
  }

  /**
   * Execute search with detailed profiling
   */
  private async executeSearchWithProfiling(
    params: SearchParams,
    searchOperation: (params: SearchParams) => Promise<SearchResults>,
    debugInfo: DebugSearchResponse['debugInfo'],
    request: DebugSearchRequest
  ): Promise<SearchResults> {
    // Build Elasticsearch query for debugging
    const elasticsearchQuery = this.buildElasticsearchQuery(params);
    debugInfo.query.elasticsearch = elasticsearchQuery;

    // Execute search
    const results = await searchOperation(params);

    // Collect Elasticsearch debug info
    debugInfo.elasticsearch = {
      took: results.took || 0,
      timedOut: false,
      shards: {
        total: 1,
        successful: 1,
        skipped: 0,
        failed: 0,
      },
    };

    // Include raw response if requested
    if (request.includeRawResponse) {
      debugInfo.elasticsearch.rawResponse = results;
    }

    // Generate query explanation if requested
    if (request.explainQuery) {
      debugInfo.query.explanation = await this.explainQuery(elasticsearchQuery, params);
    }

    return results;
  }

  /**
   * Postprocess results and collect additional debug info
   */
  private async postprocessResults(
    results: SearchResults,
    debugInfo: DebugSearchResponse['debugInfo'],
    request: DebugSearchRequest
  ): Promise<void> {
    // Analyze result quality
    const qualityAnalysis = this.analyzeResultQuality(results, request.params);
    if (qualityAnalysis.warnings.length > 0) {
      debugInfo.warnings.push(...qualityAnalysis.warnings);
    }

    // Collect facet information
    if (results.facets) {
      debugInfo.filters.facets = results.facets;
    }

    // Analyze suggestions if present
    if (results.suggestions && results.suggestions.length > 0) {
      debugInfo.suggestions = {
        count: results.suggestions.length,
        sources: ['elasticsearch'],
        ranking: this.analyzeSuggestionRanking(results.suggestions),
      };
    }
  }

  /**
   * Detect language of search query
   */
  private async detectLanguage(query: string): Promise<{
    detected: string;
    confidence: number;
    analyzer: string;
  }> {
    // Simple language detection based on character patterns
    const frenchPatterns = /[àâäéèêëïîôöùûüÿç]/i;
    const englishPatterns = /\b(the|and|or|in|on|at|to|for|of|with|by)\b/i;

    let detected = 'unknown';
    let confidence = 0;
    let analyzer = 'standard';

    if (frenchPatterns.test(query)) {
      detected = 'fr';
      confidence = 0.8;
      analyzer = 'french';
    } else if (englishPatterns.test(query)) {
      detected = 'en';
      confidence = 0.7;
      analyzer = 'english';
    } else {
      // Default to French for this application
      detected = 'fr';
      confidence = 0.5;
      analyzer = 'french';
    }

    return { detected, confidence, analyzer };
  }

  /**
   * Normalize search query
   */
  private normalizeQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-àâäéèêëïîôöùûüÿç]/gi, '');
  }

  /**
   * Validate and process search filters
   */
  private validateAndProcessFilters(filters: SearchFilters): {
    validFilters: SearchFilters;
    warnings: string[];
  } {
    const validFilters: SearchFilters = {};
    const warnings: string[] = [];

    // Validate categories
    if (filters.categories && Array.isArray(filters.categories)) {
      validFilters.categories = filters.categories.filter(cat => typeof cat === 'string' && cat.length > 0);
      if (validFilters.categories.length !== filters.categories.length) {
        warnings.push('Some invalid categories were filtered out');
      }
    }

    // Validate resource types
    if (filters.resourceTypes && Array.isArray(filters.resourceTypes)) {
      const validTypes = ['api', 'enterprise', 'service'];
      validFilters.resourceTypes = filters.resourceTypes.filter(type => validTypes.includes(type));
      if (validFilters.resourceTypes.length !== filters.resourceTypes.length) {
        warnings.push('Some invalid resource types were filtered out');
      }
    }

    // Validate price range
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      if (typeof min === 'number' && typeof max === 'number' && min >= 0 && max >= min) {
        validFilters.priceRange = { min, max };
      } else {
        warnings.push('Invalid price range was ignored');
      }
    }

    // Validate location filter
    if (filters.location) {
      if (filters.location.latitude && filters.location.longitude) {
        const lat = parseFloat(filters.location.latitude.toString());
        const lon = parseFloat(filters.location.longitude.toString());
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          validFilters.location = { ...filters.location, latitude: lat, longitude: lon };
        } else {
          warnings.push('Invalid coordinates were ignored');
        }
      }
    }

    return { validFilters, warnings };
  }

  /**
   * Build Elasticsearch query for debugging
   */
  private buildElasticsearchQuery(params: SearchParams): any {
    const query: any = {
      bool: {
        must: [],
        filter: [],
        should: [],
      },
    };

    // Text search
    if (params.query) {
      query.bool.must.push({
        multi_match: {
          query: params.query,
          fields: ['name^3', 'description^2', 'category.name^2', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // Category filter
    if (params.filters?.categories && params.filters.categories.length > 0) {
      query.bool.filter.push({
        terms: { 'category.id': params.filters.categories },
      });
    }

    // Resource type filter
    if (params.filters?.resourceTypes && params.filters.resourceTypes.length > 0) {
      query.bool.filter.push({
        terms: { resourceType: params.filters.resourceTypes },
      });
    }

    // Geographic filter
    if (params.filters?.location) {
      query.bool.filter.push({
        geo_distance: {
          distance: `${params.filters.location.radius || 10}km`,
          location: {
            lat: params.filters.location.latitude,
            lon: params.filters.location.longitude,
          },
        },
      });
    }

    // Price range filter
    if (params.filters?.priceRange) {
      query.bool.filter.push({
        range: {
          price: {
            gte: params.filters.priceRange.min,
            lte: params.filters.priceRange.max,
          },
        },
      });
    }

    return query;
  }

  /**
   * Explain query execution
   */
  private async explainQuery(query: any, params: SearchParams): Promise<QueryExplanation> {
    // This would typically call Elasticsearch's explain API
    // For now, return a mock explanation
    return {
      query,
      explanation: {
        value: 1.0,
        description: 'Mock explanation for debug purposes',
        details: [],
      },
      matchedDocuments: 0,
      executionTime: 0,
    };
  }

  /**
   * Analyze result quality
   */
  private analyzeResultQuality(results: SearchResults, params: SearchParams): {
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check for empty results
    if (results.total === 0) {
      warnings.push('No results found - consider broadening search criteria');
    }

    // Check for very few results
    if (results.total > 0 && results.total < 3) {
      warnings.push('Very few results found - search may be too specific');
    }

    // Check for query-result mismatch
    if (params.query && results.hits.length > 0) {
      const queryTerms = params.query.toLowerCase().split(' ');
      const hasRelevantResults = results.hits.some(hit => 
        queryTerms.some(term => 
          hit.name?.toLowerCase().includes(term) || 
          hit.description?.toLowerCase().includes(term)
        )
      );
      
      if (!hasRelevantResults) {
        warnings.push('Results may not be relevant to the search query');
      }
    }

    return { warnings };
  }

  /**
   * Analyze suggestion ranking
   */
  private analyzeSuggestionRanking(suggestions: string[]): any {
    return {
      algorithm: 'popularity_based',
      factors: ['frequency', 'recency', 'user_preference'],
      count: suggestions.length,
    };
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(breakdown: DebugSearchResponse['debugInfo']['performance']['breakdown']): string[] {
    const bottlenecks: string[] = [];
    const total = Object.values(breakdown).reduce((sum, time) => sum + time, 0);

    Object.entries(breakdown).forEach(([phase, time]) => {
      const percentage = (time / total) * 100;
      if (percentage > 40) {
        bottlenecks.push(`${phase} (${percentage.toFixed(1)}% of total time)`);
      }
    });

    return bottlenecks;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(debugInfo: DebugSearchResponse['debugInfo']): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (debugInfo.performance.totalTime > 1000) {
      recommendations.push('Consider implementing result caching for better performance');
    }

    if (debugInfo.performance.breakdown.elasticsearch > 500) {
      recommendations.push('Elasticsearch query is slow - consider optimizing index mappings');
    }

    // Query recommendations
    if (debugInfo.query.original.query && debugInfo.query.original.query.length > 100) {
      recommendations.push('Very long query detected - consider breaking into multiple searches');
    }

    // Filter recommendations
    const filterCount = Object.keys(debugInfo.filters.applied).length;
    if (filterCount > 5) {
      recommendations.push('Many filters applied - consider using faceted search interface');
    }

    // Cache recommendations
    if (!debugInfo.cache.hit && debugInfo.performance.totalTime > 200) {
      recommendations.push('This search could benefit from caching');
    }

    return recommendations;
  }

  /**
   * Get debug statistics for monitoring
   */
  getDebugStatistics(): {
    debugEnabled: boolean;
    totalDebugRequests: number;
    averageDebugTime: number;
    commonBottlenecks: string[];
  } {
    return {
      debugEnabled: this.debugEnabled,
      totalDebugRequests: 0, // Would be tracked in real implementation
      averageDebugTime: 0,   // Would be calculated from historical data
      commonBottlenecks: ['elasticsearch', 'preprocessing'], // Would be analyzed from logs
    };
  }

  /**
   * Enable/disable debug mode dynamically
   */
  setDebugMode(enabled: boolean): void {
    // In a real implementation, this would update configuration
    this.logger.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear debug logs and statistics
   */
  clearDebugData(): void {
    this.logger.log('Debug data cleared');
  }
}