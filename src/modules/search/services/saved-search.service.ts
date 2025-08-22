import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { SearchParams, SearchFilters } from '../interfaces/search.interfaces';
import { Prisma } from '@prisma/client';

export interface SavedSearchDto {
  name: string;
  query: string;
  filters: SearchFilters;
  isPublic?: boolean;
}

export interface SavedSearchResponse {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface SavedSearchListResponse {
  searches: SavedSearchResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

@Injectable()
export class SavedSearchService {
  private readonly logger = new Logger(SavedSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une nouvelle recherche sauvegardée
   * Requirements: 10.3, 10.4
   */
  async createSavedSearch(userId: string, data: SavedSearchDto): Promise<SavedSearchResponse> {
    try {
      this.logger.debug(`Creating saved search for user ${userId}: ${data.name}`);

      // Valider les données
      this.validateSavedSearchData(data);

      // Vérifier que l'utilisateur n'a pas déjà une recherche avec ce nom
      const existingSearch = await this.prisma.savedSearch.findFirst({
        where: {
          userId,
          name: data.name
        }
      });

      if (existingSearch) {
        throw new Error(`A saved search with name "${data.name}" already exists`);
      }

      // Créer la recherche sauvegardée
      const savedSearch = await this.prisma.savedSearch.create({
        data: {
          userId,
          name: data.name.trim(),
          query: data.query.trim(),
          filters: data.filters as Prisma.JsonObject,
          isPublic: data.isPublic || false
        }
      });

      this.logger.debug(`Created saved search: ${savedSearch.id}`);

      return this.transformSavedSearch(savedSearch);
    } catch (error) {
      this.logger.error(`Failed to create saved search: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir toutes les recherches sauvegardées d'un utilisateur
   * Requirements: 10.3, 10.4
   */
  async getUserSavedSearches(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<SavedSearchListResponse> {
    try {
      this.logger.debug(`Getting saved searches for user ${userId}, page ${page}`);

      const offset = (page - 1) * limit;

      const [searches, total] = await Promise.all([
        this.prisma.savedSearch.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          skip: offset,
          take: limit
        }),
        this.prisma.savedSearch.count({
          where: { userId }
        })
      ]);

      const transformedSearches = searches.map(search => this.transformSavedSearch(search));

      return {
        searches: transformedSearches,
        total,
        page,
        limit,
        hasMore: offset + searches.length < total
      };
    } catch (error) {
      this.logger.error(`Failed to get user saved searches: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir une recherche sauvegardée par ID
   * Requirements: 10.3, 10.4
   */
  async getSavedSearchById(userId: string, searchId: string): Promise<SavedSearchResponse> {
    try {
      this.logger.debug(`Getting saved search ${searchId} for user ${userId}`);

      const savedSearch = await this.prisma.savedSearch.findFirst({
        where: {
          id: searchId,
          OR: [
            { userId }, // Propriétaire
            { isPublic: true } // Ou recherche publique
          ]
        }
      });

      if (!savedSearch) {
        throw new NotFoundException(`Saved search with ID ${searchId} not found`);
      }

      return this.transformSavedSearch(savedSearch);
    } catch (error) {
      this.logger.error(`Failed to get saved search: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mettre à jour une recherche sauvegardée
   * Requirements: 10.3, 10.4
   */
  async updateSavedSearch(
    userId: string,
    searchId: string,
    data: Partial<SavedSearchDto>
  ): Promise<SavedSearchResponse> {
    try {
      this.logger.debug(`Updating saved search ${searchId} for user ${userId}`);

      // Vérifier que la recherche existe et appartient à l'utilisateur
      const existingSearch = await this.prisma.savedSearch.findFirst({
        where: {
          id: searchId,
          userId
        }
      });

      if (!existingSearch) {
        throw new NotFoundException(`Saved search with ID ${searchId} not found`);
      }

      // Valider les nouvelles données
      if (data.name !== undefined || data.query !== undefined || data.filters !== undefined) {
        this.validateSavedSearchData({
          name: data.name || existingSearch.name,
          query: data.query || existingSearch.query,
          filters: data.filters || (existingSearch.filters as SearchFilters)
        });
      }

      // Vérifier l'unicité du nom si il est modifié
      if (data.name && data.name !== existingSearch.name) {
        const nameConflict = await this.prisma.savedSearch.findFirst({
          where: {
            userId,
            name: data.name,
            id: { not: searchId }
          }
        });

        if (nameConflict) {
          throw new Error(`A saved search with name "${data.name}" already exists`);
        }
      }

      // Mettre à jour la recherche
      const updatedSearch = await this.prisma.savedSearch.update({
        where: { id: searchId },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.query && { query: data.query.trim() }),
          ...(data.filters && { filters: data.filters as Prisma.JsonObject }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic })
        }
      });

      this.logger.debug(`Updated saved search: ${updatedSearch.id}`);

      return this.transformSavedSearch(updatedSearch);
    } catch (error) {
      this.logger.error(`Failed to update saved search: ${error.message}`);
      throw error;
    }
  }

  /**
   * Supprimer une recherche sauvegardée
   * Requirements: 10.3, 10.4
   */
  async deleteSavedSearch(userId: string, searchId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting saved search ${searchId} for user ${userId}`);

      // Vérifier que la recherche existe et appartient à l'utilisateur
      const existingSearch = await this.prisma.savedSearch.findFirst({
        where: {
          id: searchId,
          userId
        }
      });

      if (!existingSearch) {
        throw new NotFoundException(`Saved search with ID ${searchId} not found`);
      }

      // Supprimer la recherche
      await this.prisma.savedSearch.delete({
        where: { id: searchId }
      });

      this.logger.debug(`Deleted saved search: ${searchId}`);
    } catch (error) {
      this.logger.error(`Failed to delete saved search: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir les recherches publiques populaires
   * Requirements: 10.6
   */
  async getPopularPublicSearches(limit: number = 10): Promise<SavedSearchResponse[]> {
    try {
      this.logger.debug(`Getting popular public searches, limit: ${limit}`);

      // Pour l'instant, trier par date de création
      // Dans une implémentation future, on pourrait ajouter un compteur d'utilisation
      const searches = await this.prisma.savedSearch.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return searches.map(search => this.transformSavedSearch(search));
    } catch (error) {
      this.logger.error(`Failed to get popular public searches: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convertir une recherche sauvegardée en paramètres de recherche
   * Requirements: 10.3, 10.4
   */
  async convertToSearchParams(userId: string, searchId: string): Promise<SearchParams> {
    try {
      const savedSearch = await this.getSavedSearchById(userId, searchId);

      return {
        query: savedSearch.query,
        filters: savedSearch.filters,
        userId
      };
    } catch (error) {
      this.logger.error(`Failed to convert saved search to params: ${error.message}`);
      throw error;
    }
  }

  /**
   * Dupliquer une recherche sauvegardée
   * Requirements: 10.4
   */
  async duplicateSavedSearch(
    userId: string,
    searchId: string,
    newName?: string
  ): Promise<SavedSearchResponse> {
    try {
      this.logger.debug(`Duplicating saved search ${searchId} for user ${userId}`);

      const originalSearch = await this.getSavedSearchById(userId, searchId);

      // Générer un nom unique si non fourni
      const duplicateName = newName || `${originalSearch.name} (Copy)`;

      const duplicateData: SavedSearchDto = {
        name: duplicateName,
        query: originalSearch.query,
        filters: originalSearch.filters,
        isPublic: false // Les duplicatas sont privés par défaut
      };

      return await this.createSavedSearch(userId, duplicateData);
    } catch (error) {
      this.logger.error(`Failed to duplicate saved search: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des recherches sauvegardées d'un utilisateur
   * Requirements: 10.6
   */
  async getUserSavedSearchStats(userId: string): Promise<{
    totalSearches: number;
    publicSearches: number;
    privateSearches: number;
    mostUsedCategories: Array<{ category: string; count: number }>;
    recentActivity: Date | null;
  }> {
    try {
      this.logger.debug(`Getting saved search stats for user ${userId}`);

      const [totalSearches, publicSearches, searches] = await Promise.all([
        this.prisma.savedSearch.count({ where: { userId } }),
        this.prisma.savedSearch.count({ where: { userId, isPublic: true } }),
        this.prisma.savedSearch.findMany({
          where: { userId },
          select: { filters: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' }
        })
      ]);

      // Analyser les catégories les plus utilisées
      const categoryStats: Record<string, number> = {};
      searches.forEach(search => {
        const filters = search.filters as any;
        if (filters.categories && Array.isArray(filters.categories)) {
          filters.categories.forEach((categoryId: string) => {
            categoryStats[categoryId] = (categoryStats[categoryId] || 0) + 1;
          });
        }
      });

      const mostUsedCategories = Object.entries(categoryStats)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const recentActivity = searches.length > 0 ? searches[0].updatedAt : null;

      return {
        totalSearches,
        publicSearches,
        privateSearches: totalSearches - publicSearches,
        mostUsedCategories,
        recentActivity
      };
    } catch (error) {
      this.logger.error(`Failed to get user saved search stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valider les données d'une recherche sauvegardée
   */
  private validateSavedSearchData(data: SavedSearchDto): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Search name is required');
    }

    if (data.name.trim().length > 100) {
      throw new Error('Search name must be less than 100 characters');
    }

    if (!data.query || data.query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    if (data.query.trim().length > 500) {
      throw new Error('Search query must be less than 500 characters');
    }

    if (!data.filters) {
      throw new Error('Search filters are required');
    }
  }

  /**
   * Transformer une recherche sauvegardée pour la réponse
   */
  private transformSavedSearch(search: any): SavedSearchResponse {
    return {
      id: search.id,
      name: search.name,
      query: search.query,
      filters: search.filters as SearchFilters,
      isPublic: search.isPublic,
      createdAt: search.createdAt,
      updatedAt: search.updatedAt,
      userId: search.userId
    };
  }
}