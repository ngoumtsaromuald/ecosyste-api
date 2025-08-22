/**
 * SDK JavaScript officiel pour l'API de recherche ROMAPI
 * 
 * @example
 * ```typescript
 * import { ROMAPISearchClient, ResourceType } from '@romapi/search-sdk';
 * 
 * const client = new ROMAPISearchClient({
 *   baseUrl: 'https://api.romapi.com/api/v1',
 *   apiKey: 'your-api-key' // optionnel
 * });
 * 
 * // Recherche simple
 * const results = await client.search({
 *   query: 'restaurant douala',
 *   filters: {
 *     resourceTypes: [ResourceType.BUSINESS],
 *     verified: true
 *   },
 *   pagination: { page: 1, limit: 10 }
 * });
 * 
 * // Suggestions
 * const suggestions = await client.suggest('rest', { limit: 5 });
 * ```
 */

// Exports principaux
export { ROMAPISearchClient, ROMAPIError, createSearchClient } from './client';

// Exports des types
export * from './types';

// Exports des utilitaires
export * from './utils';

// Version du SDK
export const VERSION = '1.0.0';

// Configuration par défaut
export const DEFAULT_CONFIG = {
  baseUrl: 'https://api.romapi.com/api/v1',
  timeout: 30000,
  retries: 3,
  defaultLimit: 20,
  enableCache: true,
  cacheTimeout: 300000 // 5 minutes
};

// Export par défaut
export { ROMAPISearchClient as default } from './client';