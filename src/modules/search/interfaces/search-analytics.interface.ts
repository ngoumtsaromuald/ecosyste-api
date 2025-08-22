import { SearchLogParams, SearchMetrics, PopularTerm, NoResultsQuery, DateRangeWithGranularity } from './search.interfaces';

/**
 * Interface pour le service d'analytics de recherche
 */
export interface ISearchAnalyticsService {
  /**
   * Logger une recherche avec anonymisation RGPD
   */
  logSearch(params: SearchLogParams): Promise<string>;

  /**
   * Logger un clic sur un résultat de recherche
   */
  logClick(searchLogId: string, resourceId: string, position: number, userId?: string): Promise<void>;

  /**
   * Obtenir les termes de recherche les plus populaires
   */
  getPopularTerms(period: DateRangeWithGranularity, limit?: number): Promise<PopularTerm[]>;

  /**
   * Obtenir les requêtes qui n'ont donné aucun résultat
   */
  getNoResultsQueries(period: DateRangeWithGranularity, limit?: number): Promise<NoResultsQuery[]>;

  /**
   * Obtenir les métriques de performance de recherche
   */
  getSearchMetrics(period: DateRangeWithGranularity): Promise<SearchMetrics>;

  /**
   * Obtenir les statistiques de clics par ressource
   */
  getClickStats(resourceId: string, period: DateRangeWithGranularity): Promise<{
    totalClicks: number;
    uniqueUsers: number;
    averagePosition: number;
    clickThroughRate: number;
  }>;

  /**
   * Obtenir l'historique de recherche d'un utilisateur (pour personnalisation)
   */
  getUserSearchHistory(userId: string, limit?: number): Promise<{
    searches: Array<{
      query: string;
      filters: any;
      createdAt: Date;
      resultsCount: number;
    }>;
    topCategories: Array<{
      categoryId: string;
      categoryName: string;
      searchCount: number;
    }>;
    topTerms: Array<{
      term: string;
      count: number;
    }>;
  }>;

  /**
   * Nettoyer les anciens logs selon la politique de rétention RGPD
   */
  cleanupOldLogs(retentionDays: number): Promise<{
    deletedSearchLogs: number;
    deletedSearchClicks: number;
  }>;
}