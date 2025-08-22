import { registerAs } from '@nestjs/config';

export default registerAs('elasticsearch', () => ({
  host: process.env.ELASTICSEARCH_HOST || 'localhost',
  port: parseInt(process.env.ELASTICSEARCH_PORT, 10) || 9200,
  username: process.env.ELASTICSEARCH_USERNAME || '',
  password: process.env.ELASTICSEARCH_PASSWORD || '',
  indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'romapi',
  maxRetries: parseInt(process.env.ELASTICSEARCH_MAX_RETRIES, 10) || 3,
  requestTimeout: parseInt(process.env.ELASTICSEARCH_REQUEST_TIMEOUT, 10) || 30000,
  
  // Index names
  indices: {
    resources: `${process.env.ELASTICSEARCH_INDEX_PREFIX || 'romapi'}_resources`,
    suggestions: `${process.env.ELASTICSEARCH_INDEX_PREFIX || 'romapi'}_suggestions`,
  },
  
  // Search configuration
  search: {
    cacheTtl: parseInt(process.env.SEARCH_CACHE_TTL, 10) || 300,
    suggestionsCacheTtl: parseInt(process.env.SEARCH_SUGGESTIONS_CACHE_TTL, 10) || 3600,
    facetsCacheTtl: parseInt(process.env.SEARCH_FACETS_CACHE_TTL, 10) || 86400,
    maxResults: parseInt(process.env.SEARCH_MAX_RESULTS, 10) || 1000,
    defaultSize: parseInt(process.env.SEARCH_DEFAULT_SIZE, 10) || 20,
  },
}));