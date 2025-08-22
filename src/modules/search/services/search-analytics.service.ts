import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { ISearchAnalyticsService } from '../interfaces/search-analytics.interface';
import { SearchLogParams, SearchMetrics, PopularTerm, NoResultsQuery, DateRangeWithGranularity } from '../interfaces/search.interfaces';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class SearchAnalyticsService implements ISearchAnalyticsService {
  private readonly logger = new Logger(SearchAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Logger une recherche avec anonymisation RGPD
   */
  async logSearch(params: SearchLogParams): Promise<string> {
    try {
      // Anonymiser l'adresse IP pour respecter le RGPD
      const anonymizedIp = this.anonymizeIpAddress(params.ipAddress);

      // Créer le log de recherche
      const searchLog = await this.prisma.searchLog.create({
        data: {
          query: params.query.trim().toLowerCase(), // Normaliser la requête
          filters: params.filters as Prisma.JsonObject,
          userId: params.userId,
          sessionId: params.sessionId,
          userAgent: params.userAgent?.substring(0, 500), // Limiter la taille
          ipAddress: anonymizedIp,
          resultsCount: params.resultsCount,
          took: params.took,
        },
      });

      this.logger.debug(`Search logged: ${searchLog.id} - Query: "${params.query}" - Results: ${params.resultsCount}`);

      return searchLog.id;
    } catch (error) {
      this.logger.error('Failed to log search', error);
      throw error;
    }
  }

  /**
   * Logger un clic sur un résultat de recherche
   */
  async logClick(searchLogId: string, resourceId: string, position: number, userId?: string): Promise<void> {
    try {
      await this.prisma.searchClick.create({
        data: {
          searchLogId,
          resourceId,
          userId,
          position,
        },
      });

      this.logger.debug(`Click logged: SearchLog ${searchLogId} - Resource ${resourceId} - Position ${position}`);
    } catch (error) {
      this.logger.error('Failed to log click', error);
      throw error;
    }
  }

  /**
   * Obtenir les termes de recherche les plus populaires
   */
  async getPopularTerms(period: DateRangeWithGranularity, limit: number = 50): Promise<PopularTerm[]> {
    try {
      const result = await this.prisma.searchLog.groupBy({
        by: ['query'],
        where: {
          createdAt: {
            gte: period.from,
            lte: period.to,
          },
          query: {
            not: '', // Exclure les recherches vides
          },
        },
        _count: {
          query: true,
        },
        orderBy: {
          _count: {
            query: 'desc',
          },
        },
        take: limit,
      });

      // Calculer le total pour les pourcentages
      const totalSearches = await this.prisma.searchLog.count({
        where: {
          createdAt: {
            gte: period.from,
            lte: period.to,
          },
          query: {
            not: '',
          },
        },
      });

      return result.map(item => ({
        term: item.query,
        count: item._count.query,
        percentage: totalSearches > 0 ? (item._count.query / totalSearches) * 100 : 0,
      }));
    } catch (error) {
      this.logger.error('Failed to get popular terms', error);
      throw error;
    }
  }

  /**
   * Obtenir les requêtes qui n'ont donné aucun résultat
   */
  async getNoResultsQueries(period: DateRangeWithGranularity, limit: number = 50): Promise<NoResultsQuery[]> {
    try {
      const result = await this.prisma.searchLog.groupBy({
        by: ['query'],
        where: {
          createdAt: {
            gte: period.from,
            lte: period.to,
          },
          resultsCount: 0,
          query: {
            not: '',
          },
        },
        _count: {
          query: true,
        },
        _max: {
          createdAt: true,
        },
        orderBy: {
          _count: {
            query: 'desc',
          },
        },
        take: limit,
      });

      return result.map(item => ({
        query: item.query,
        count: item._count.query,
        lastSearched: item._max.createdAt || new Date(),
      }));
    } catch (error) {
      this.logger.error('Failed to get no results queries', error);
      throw error;
    }
  }

  /**
   * Obtenir les métriques de performance de recherche
   */
  async getSearchMetrics(period: DateRangeWithGranularity): Promise<SearchMetrics> {
    try {
      // Métriques de base
      const [totalSearches, averageResponseTime, popularTerms, noResultsQueries] = await Promise.all([
        this.getTotalSearches(period),
        this.getAverageResponseTime(period),
        this.getPopularTerms(period, 10),
        this.getNoResultsQueries(period, 10),
      ]);

      // Calculer le taux de clic
      const clickThroughRate = await this.getClickThroughRate(period);

      return {
        totalSearches,
        averageResponseTime,
        popularTerms,
        noResultsQueries,
        clickThroughRate,
        period,
      };
    } catch (error) {
      this.logger.error('Failed to get search metrics', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de clics par ressource
   */
  async getClickStats(resourceId: string, period: DateRangeWithGranularity): Promise<{
    totalClicks: number;
    uniqueUsers: number;
    averagePosition: number;
    clickThroughRate: number;
  }> {
    try {
      const [clickStats, searchStats] = await Promise.all([
        this.prisma.searchClick.aggregate({
          where: {
            resourceId,
            createdAt: {
              gte: period.from,
              lte: period.to,
            },
          },
          _count: {
            id: true,
          },
          _avg: {
            position: true,
          },
        }),
        this.prisma.searchClick.findMany({
          where: {
            resourceId,
            createdAt: {
              gte: period.from,
              lte: period.to,
            },
          },
          select: {
            userId: true,
            searchLogId: true,
          },
          distinct: ['userId'],
        }),
      ]);

      const totalClicks = clickStats._count.id;
      const uniqueUsers = searchStats.length;
      const averagePosition = clickStats._avg.position || 0;

      // Calculer le CTR pour cette ressource spécifique
      const searchLogIds = [...new Set(searchStats.map(s => s.searchLogId))];
      const totalSearchesWithResource = searchLogIds.length;
      const clickThroughRate = totalSearchesWithResource > 0 ? (totalClicks / totalSearchesWithResource) * 100 : 0;

      return {
        totalClicks,
        uniqueUsers,
        averagePosition,
        clickThroughRate,
      };
    } catch (error) {
      this.logger.error('Failed to get click stats', error);
      throw error;
    }
  }

  /**
   * Obtenir l'historique de recherche d'un utilisateur
   */
  async getUserSearchHistory(userId: string, limit: number = 100): Promise<{
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
  }> {
    try {
      // Récupérer les recherches récentes
      const searches = await this.prisma.searchLog.findMany({
        where: {
          userId,
        },
        select: {
          query: true,
          filters: true,
          createdAt: true,
          resultsCount: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      // Analyser les catégories les plus recherchées
      const categoryFilters = searches
        .map(s => (s.filters as any)?.categories)
        .filter(Boolean)
        .flat();

      const categoryStats = categoryFilters.reduce((acc, categoryId) => {
        acc[categoryId] = (acc[categoryId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Récupérer les noms des catégories
      const topCategoryIds = Object.keys(categoryStats)
        .sort((a, b) => categoryStats[b] - categoryStats[a])
        .slice(0, 10);

      const categories = await this.prisma.category.findMany({
        where: {
          id: {
            in: topCategoryIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const topCategories = categories.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        searchCount: categoryStats[cat.id],
      }));

      // Analyser les termes les plus recherchés
      const termStats = searches
        .map(s => s.query.toLowerCase().trim())
        .filter(q => q.length > 0)
        .reduce((acc, term) => {
          acc[term] = (acc[term] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topTerms = Object.entries(termStats)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([term, count]) => ({ term, count: count as number }));

      return {
        searches,
        topCategories,
        topTerms,
      };
    } catch (error) {
      this.logger.error('Failed to get user search history', error);
      throw error;
    }
  }

  /**
   * Nettoyer les anciens logs selon la politique de rétention RGPD
   */
  async cleanupOldLogs(retentionDays: number): Promise<{
    deletedSearchLogs: number;
    deletedSearchClicks: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      this.logger.log(`Starting cleanup of logs older than ${cutoffDate.toISOString()}`);

      // Supprimer les clics en premier (contrainte de clé étrangère)
      const deletedClicks = await this.prisma.searchClick.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // Supprimer les logs de recherche
      const deletedLogs = await this.prisma.searchLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Cleanup completed: ${deletedLogs.count} search logs and ${deletedClicks.count} clicks deleted`);

      return {
        deletedSearchLogs: deletedLogs.count,
        deletedSearchClicks: deletedClicks.count,
      };
    } catch (error) {
      this.logger.error('Failed to cleanup old logs', error);
      throw error;
    }
  }

  /**
   * Anonymiser une adresse IP pour respecter le RGPD
   */
  private anonymizeIpAddress(ipAddress?: string): string | null {
    if (!ipAddress) return null;

    try {
      // Pour IPv4, masquer le dernier octet
      if (ipAddress.includes('.')) {
        const parts = ipAddress.split('.');
        if (parts.length === 4) {
          return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
        }
      }

      // Pour IPv6, masquer les 64 derniers bits
      if (ipAddress.includes(':')) {
        const parts = ipAddress.split(':');
        if (parts.length >= 4) {
          return `${parts.slice(0, 4).join(':')}::`;
        }
      }

      // Si le format n'est pas reconnu, hasher l'IP
      return crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16);
    } catch (error) {
      this.logger.warn('Failed to anonymize IP address', error);
      return null;
    }
  }

  /**
   * Obtenir le nombre total de recherches pour une période
   */
  private async getTotalSearches(period: DateRangeWithGranularity): Promise<number> {
    return this.prisma.searchLog.count({
      where: {
        createdAt: {
          gte: period.from,
          lte: period.to,
        },
      },
    });
  }

  /**
   * Obtenir le temps de réponse moyen pour une période
   */
  private async getAverageResponseTime(period: DateRangeWithGranularity): Promise<number> {
    const result = await this.prisma.searchLog.aggregate({
      where: {
        createdAt: {
          gte: period.from,
          lte: period.to,
        },
      },
      _avg: {
        took: true,
      },
    });

    return result._avg.took || 0;
  }

  /**
   * Calculer le taux de clic pour une période
   */
  private async getClickThroughRate(period: DateRangeWithGranularity): Promise<number> {
    const [totalSearches, searchesWithClicks] = await Promise.all([
      this.getTotalSearches(period),
      this.prisma.searchLog.count({
        where: {
          createdAt: {
            gte: period.from,
            lte: period.to,
          },
          clicks: {
            some: {},
          },
        },
      }),
    ]);

    return totalSearches > 0 ? (searchesWithClicks / totalSearches) * 100 : 0;
  }
}