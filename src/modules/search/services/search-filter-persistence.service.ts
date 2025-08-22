import { Injectable, Logger } from '@nestjs/common';
import { SearchCacheService } from './search-cache.service';
import { SearchFilters, MultiTypeSearchParams } from '../interfaces/search.interfaces';
import { ResourceType } from '@prisma/client';

/**
 * Service pour gérer la persistance des filtres de recherche entre les onglets
 * Requirements: 7.7
 */
@Injectable()
export class SearchFilterPersistenceService {
  private readonly logger = new Logger(SearchFilterPersistenceService.name);
  private readonly FILTER_CACHE_PREFIX = 'search_filters';
  private readonly FILTER_TTL = 3600; // 1 heure

  constructor(
    private readonly cacheService: SearchCacheService,
  ) {}

  /**
   * Sauvegarder les filtres pour une session utilisateur
   */
  async saveFilters(
    sessionId: string,
    filters: SearchFilters,
    activeTab?: ResourceType,
    searchQuery?: string
  ): Promise<void> {
    try {
      const filterState = {
        filters,
        activeTab,
        searchQuery,
        timestamp: new Date(),
        lastUpdated: Date.now()
      };

      const cacheKey = this.generateFilterCacheKey(sessionId);
      
      await this.cacheService.redisClient.setex(
        cacheKey,
        this.FILTER_TTL,
        JSON.stringify(filterState)
      );

      this.logger.debug(`Filters saved for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to save filters for session ${sessionId}: ${error.message}`);
    }
  }

  /**
   * Récupérer les filtres sauvegardés pour une session
   */
  async getFilters(sessionId: string): Promise<{
    filters: SearchFilters;
    activeTab?: ResourceType;
    searchQuery?: string;
    timestamp: Date;
  } | null> {
    try {
      const cacheKey = this.generateFilterCacheKey(sessionId);
      const cached = await this.cacheService.redisClient.get(cacheKey);

      if (!cached) {
        return null;
      }

      const filterState = JSON.parse(cached);
      
      // Vérifier que les données ne sont pas trop anciennes (plus de 1 heure)
      const age = Date.now() - filterState.lastUpdated;
      if (age > this.FILTER_TTL * 1000) {
        await this.clearFilters(sessionId);
        return null;
      }

      this.logger.debug(`Filters retrieved for session: ${sessionId}`);
      
      return {
        filters: filterState.filters,
        activeTab: filterState.activeTab,
        searchQuery: filterState.searchQuery,
        timestamp: new Date(filterState.timestamp)
      };
    } catch (error) {
      this.logger.error(`Failed to get filters for session ${sessionId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Mettre à jour l'onglet actif sans changer les filtres
   */
  async updateActiveTab(sessionId: string, activeTab: ResourceType): Promise<void> {
    try {
      const existing = await this.getFilters(sessionId);
      
      if (existing) {
        await this.saveFilters(
          sessionId,
          existing.filters,
          activeTab,
          existing.searchQuery
        );
        
        this.logger.debug(`Active tab updated to ${activeTab} for session: ${sessionId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update active tab for session ${sessionId}: ${error.message}`);
    }
  }

  /**
   * Mettre à jour les filtres en conservant l'onglet actif
   */
  async updateFilters(
    sessionId: string,
    filters: SearchFilters,
    searchQuery?: string
  ): Promise<void> {
    try {
      const existing = await this.getFilters(sessionId);
      
      await this.saveFilters(
        sessionId,
        filters,
        existing?.activeTab,
        searchQuery || existing?.searchQuery
      );
      
      this.logger.debug(`Filters updated for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to update filters for session ${sessionId}: ${error.message}`);
    }
  }

  /**
   * Effacer les filtres sauvegardés
   */
  async clearFilters(sessionId: string): Promise<void> {
    try {
      const cacheKey = this.generateFilterCacheKey(sessionId);
      await this.cacheService.redisClient.del(cacheKey);
      
      this.logger.debug(`Filters cleared for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to clear filters for session ${sessionId}: ${error.message}`);
    }
  }

  /**
   * Appliquer les filtres persistés à des paramètres de recherche multi-type
   */
  async applyPersistedFilters(
    sessionId: string,
    params: MultiTypeSearchParams
  ): Promise<MultiTypeSearchParams> {
    try {
      const persisted = await this.getFilters(sessionId);
      
      if (!persisted) {
        return params;
      }

      // Fusionner les filtres persistés avec les paramètres actuels
      const mergedFilters = this.mergeFilters(persisted.filters, params.filters);
      
      const enhancedParams: MultiTypeSearchParams = {
        ...params,
        filters: mergedFilters,
        // Utiliser la requête persistée si aucune n'est fournie
        query: params.query || persisted.searchQuery
      };

      // Si un onglet actif est persisté et qu'aucun type n'est spécifié, l'utiliser
      if (persisted.activeTab && (!params.includeTypes || params.includeTypes.length === 0)) {
        enhancedParams.includeTypes = [persisted.activeTab];
      }

      this.logger.debug(`Applied persisted filters for session: ${sessionId}`);
      
      return enhancedParams;
    } catch (error) {
      this.logger.error(`Failed to apply persisted filters for session ${sessionId}: ${error.message}`);
      return params;
    }
  }

  /**
   * Obtenir l'historique des filtres pour une session
   */
  async getFilterHistory(sessionId: string, limit = 10): Promise<{
    filters: SearchFilters;
    searchQuery?: string;
    timestamp: Date;
  }[]> {
    try {
      const historyKey = `${this.generateFilterCacheKey(sessionId)}_history`;
      const cached = await this.cacheService.redisClient.lrange(historyKey, 0, limit - 1);
      
      const history = cached.map(item => {
        const parsed = JSON.parse(item);
        return {
          filters: parsed.filters,
          searchQuery: parsed.searchQuery,
          timestamp: new Date(parsed.timestamp)
        };
      });

      this.logger.debug(`Retrieved filter history for session: ${sessionId}, ${history.length} items`);
      
      return history;
    } catch (error) {
      this.logger.error(`Failed to get filter history for session ${sessionId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Ajouter une entrée à l'historique des filtres
   */
  async addToFilterHistory(
    sessionId: string,
    filters: SearchFilters,
    searchQuery?: string
  ): Promise<void> {
    try {
      const historyKey = `${this.generateFilterCacheKey(sessionId)}_history`;
      const historyItem = {
        filters,
        searchQuery,
        timestamp: new Date()
      };

      // Ajouter au début de la liste
      await this.cacheService.redisClient.lpush(historyKey, JSON.stringify(historyItem));
      
      // Limiter l'historique à 20 entrées
      await this.cacheService.redisClient.ltrim(historyKey, 0, 19);
      
      // Définir une expiration pour l'historique
      await this.cacheService.redisClient.expire(historyKey, this.FILTER_TTL * 24); // 24 heures

      this.logger.debug(`Added to filter history for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to add to filter history for session ${sessionId}: ${error.message}`);
    }
  }

  /**
   * Obtenir les filtres les plus utilisés pour des suggestions
   */
  async getPopularFilters(limit = 10): Promise<{
    filters: Partial<SearchFilters>;
    usage: number;
  }[]> {
    try {
      const popularKey = `${this.FILTER_CACHE_PREFIX}_popular`;
      const cached = await this.cacheService.redisClient.zrevrange(popularKey, 0, limit - 1, 'WITHSCORES');
      
      const popular: { filters: Partial<SearchFilters>; usage: number }[] = [];
      
      for (let i = 0; i < cached.length; i += 2) {
        const filtersJson = cached[i];
        const score = parseInt(cached[i + 1]);
        
        try {
          const filters = JSON.parse(filtersJson);
          popular.push({ filters, usage: score });
        } catch (parseError) {
          this.logger.warn(`Failed to parse popular filter: ${filtersJson}`);
        }
      }

      this.logger.debug(`Retrieved ${popular.length} popular filters`);
      
      return popular;
    } catch (error) {
      this.logger.error(`Failed to get popular filters: ${error.message}`);
      return [];
    }
  }

  /**
   * Enregistrer l'utilisation d'un filtre pour les statistiques
   */
  async recordFilterUsage(filters: SearchFilters): Promise<void> {
    try {
      const popularKey = `${this.FILTER_CACHE_PREFIX}_popular`;
      const filtersKey = JSON.stringify(this.normalizeFiltersForStats(filters));
      
      // Incrémenter le score du filtre
      await this.cacheService.redisClient.zincrby(popularKey, 1, filtersKey);
      
      // Définir une expiration pour les statistiques
      await this.cacheService.redisClient.expire(popularKey, this.FILTER_TTL * 24 * 7); // 7 jours
      
    } catch (error) {
      this.logger.error(`Failed to record filter usage: ${error.message}`);
    }
  }

  /**
   * Générer la clé de cache pour les filtres
   */
  private generateFilterCacheKey(sessionId: string): string {
    return `${this.FILTER_CACHE_PREFIX}:${sessionId}`;
  }

  /**
   * Fusionner deux objets de filtres
   */
  private mergeFilters(
    persistedFilters: SearchFilters,
    currentFilters?: SearchFilters
  ): SearchFilters {
    if (!currentFilters) {
      return persistedFilters;
    }

    return {
      // Les filtres actuels ont la priorité
      ...persistedFilters,
      ...currentFilters,
      
      // Fusionner les tableaux
      categories: currentFilters.categories || persistedFilters.categories,
      resourceTypes: currentFilters.resourceTypes || persistedFilters.resourceTypes,
      plans: currentFilters.plans || persistedFilters.plans,
      tags: currentFilters.tags || persistedFilters.tags,
      
      // Fusionner les objets complexes
      priceRange: currentFilters.priceRange || persistedFilters.priceRange,
      location: currentFilters.location || persistedFilters.location,
      dateRange: currentFilters.dateRange || persistedFilters.dateRange
    };
  }

  /**
   * Normaliser les filtres pour les statistiques (enlever les données sensibles)
   */
  private normalizeFiltersForStats(filters: SearchFilters): Partial<SearchFilters> {
    return {
      categories: filters.categories,
      resourceTypes: filters.resourceTypes,
      plans: filters.plans,
      verified: filters.verified,
      // Exclure les données de localisation et autres données sensibles
      city: filters.city,
      region: filters.region,
      country: filters.country
    };
  }
}