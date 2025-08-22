import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CategorySearchParams,
  CategorySearchResults,
  CategoryInfo,
  CategoryBreadcrumb,
  CategoryHierarchy,
  CategoryHierarchyParams,
  CategoryStats,
  CategoryNavigation
} from '../interfaces/category-search.interfaces';
import { SearchParams, SearchResults, SearchFilters } from '../interfaces/search.interfaces';
import { SearchService } from './search.service';
import { SearchCacheService } from './search-cache.service';
import { CategoryRepository } from '../../../repositories/category.repository';
import { ElasticsearchService } from './elasticsearch.service';

@Injectable()
export class CategorySearchService {
  private readonly logger = new Logger(CategorySearchService.name);

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly cacheService: SearchCacheService,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Recherche par catégorie avec navigation hiérarchique
   * Requirements: 6.1, 6.2, 6.4
   */
  async searchByCategory(
    categoryId: string,
    params: CategorySearchParams
  ): Promise<CategorySearchResults> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Category search: categoryId=${categoryId}, includeSubcategories=${params.includeSubcategories}`);

      // Vérifier le cache
      const cacheKey = this.generateCategoryCacheKey(categoryId, params);
      const cachedResults = await this.cacheService.getCachedSearchResults(cacheKey);
      if (cachedResults) {
        return cachedResults as CategorySearchResults;
      }

      // Obtenir les informations de la catégorie
      const categoryInfo = await this.getCategoryInfo(categoryId, params.showCounts !== false);
      if (!categoryInfo) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }

      // Construire les paramètres de recherche
      const searchParams = await this.buildCategorySearchParams(categoryId, params);

      // Effectuer la recherche directement avec Elasticsearch
      const searchResults = await this.performElasticsearchSearch(searchParams);

      // Obtenir la hiérarchie des catégories
      const hierarchy = await this.getCategoryHierarchy({
        categoryId,
        includeResourceCounts: params.showCounts !== false,
        maxDepth: params.maxDepth || 3
      });

      // Obtenir les sous-catégories avec compteurs
      const subcategories = await this.getSubcategoriesWithCounts(
        categoryId,
        params.includeSubcategories !== false,
        params.maxDepth || 2
      );

      // Construire les breadcrumbs
      const breadcrumbs = await this.buildCategoryBreadcrumbs(categoryId);

      // Construire les résultats enrichis
      const results: CategorySearchResults = {
        ...searchResults,
        category: categoryInfo,
        subcategories,
        breadcrumbs,
        hierarchy,
        took: Date.now() - startTime
      };

      // Mettre en cache
      await this.cacheService.cacheSearchResults(cacheKey, results);

      this.logger.debug(`Category search completed in ${results.took}ms`);
      return results;

    } catch (error) {
      this.logger.error(`Category search failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtenir la hiérarchie complète des catégories
   */
  async getCategoryHierarchy(params: CategoryHierarchyParams): Promise<CategoryHierarchy> {
    try {
      const cacheKey = `category_hierarchy_${params.categoryId || 'root'}_${JSON.stringify(params)}`;
      const cached = await this.cacheService.redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      let current: CategoryInfo | null = null;
      let ancestors: CategoryInfo[] = [];
      let siblings: CategoryInfo[] = [];
      let children: CategoryInfo[] = [];

      if (params.categoryId) {
        // Obtenir la catégorie courante
        current = await this.getCategoryInfo(params.categoryId, params.includeResourceCounts !== false);
        if (!current) {
          throw new NotFoundException(`Category ${params.categoryId} not found`);
        }

        // Obtenir les ancêtres
        ancestors = await this.getCategoryAncestors(params.categoryId);

        // Obtenir les frères et sœurs
        siblings = await this.getCategorySiblings(params.categoryId);

        // Obtenir les enfants
        children = await this.getCategoryChildren(params.categoryId, params.includeResourceCounts !== false);
      }

      // Obtenir les catégories racines
      const root = await this.getRootCategories(params.includeResourceCounts !== false);

      const hierarchy: CategoryHierarchy = {
        root,
        current: current!,
        siblings,
        children,
        ancestors
      };

      // Mettre en cache pour 1 heure
      await this.cacheService.redisClient.setex(cacheKey, 3600, JSON.stringify(hierarchy));

      return hierarchy;

    } catch (error) {
      this.logger.error(`Failed to get category hierarchy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir une catégorie par son slug
   * Requirements: 6.6, 6.7
   */
  async getCategoryBySlug(slug: string): Promise<CategoryInfo | null> {
    try {
      const category = await this.categoryRepository.findBySlug(slug, {
        parent: true,
        children: true,
        _count: {
          select: {
            children: true,
            apiResources: true
          }
        }
      });

      if (!category) {
        return null;
      }

      // Calculer le niveau dans la hiérarchie
      const level = await this.calculateCategoryLevel(category.id);

      // Construire le chemin hiérarchique
      const path = await this.buildCategoryPath(category.id);

      const categoryInfo: CategoryInfo = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || undefined,
        icon: category.icon || undefined,
        parentId: category.parentId || undefined,
        level,
        resourceCount: (category as any)._count?.apiResources || 0,
        subcategoryCount: (category as any)._count?.children || 0,
        path
      };

      return categoryInfo;

    } catch (error) {
      this.logger.error(`Failed to get category by slug: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtenir les informations d'une catégorie avec compteurs
   */
  async getCategoryInfo(categoryId: string, includeCounts = true): Promise<CategoryInfo | null> {
    try {
      const category = await this.categoryRepository.findById(categoryId, {
        parent: true,
        children: true,
        _count: includeCounts ? {
          select: {
            children: true,
            apiResources: true
          }
        } : undefined
      });

      if (!category) {
        return null;
      }

      // Calculer le niveau dans la hiérarchie
      const level = await this.calculateCategoryLevel(categoryId);

      // Construire le chemin hiérarchique
      const path = await this.buildCategoryPath(categoryId);

      const categoryInfo: CategoryInfo = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || undefined,
        icon: category.icon || undefined,
        parentId: category.parentId || undefined,
        level,
        resourceCount: includeCounts ? (category as any)._count?.apiResources || 0 : 0,
        subcategoryCount: includeCounts ? (category as any)._count?.children || 0 : 0,
        path
      };

      return categoryInfo;

    } catch (error) {
      this.logger.error(`Failed to get category info: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtenir les sous-catégories avec compteurs de ressources
   */
  async getSubcategoriesWithCounts(
    categoryId: string,
    includeSubcategories = true,
    maxDepth = 2
  ): Promise<CategoryInfo[]> {
    if (!includeSubcategories) {
      return [];
    }

    try {
      const subcategories = await this.categoryRepository.findMany({
        where: { parentId: categoryId },
        include: {
          children: maxDepth > 1,
          _count: {
            select: {
              children: true,
              apiResources: true
            }
          }
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      const results: CategoryInfo[] = [];

      for (const subcategory of subcategories) {
        const level = await this.calculateCategoryLevel(subcategory.id);
        const path = await this.buildCategoryPath(subcategory.id);

        const categoryInfo: CategoryInfo = {
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
          description: subcategory.description || undefined,
          icon: subcategory.icon || undefined,
          parentId: subcategory.parentId || undefined,
          level,
          resourceCount: (subcategory as any)._count?.apiResources || 0,
          subcategoryCount: (subcategory as any)._count?.children || 0,
          path
        };

        // Récursivement obtenir les enfants si nécessaire
        if (maxDepth > 1 && (subcategory as any)._count?.children > 0) {
          categoryInfo.children = await this.getSubcategoriesWithCounts(
            subcategory.id,
            true,
            maxDepth - 1
          );
        }

        results.push(categoryInfo);
      }

      return results;

    } catch (error) {
      this.logger.error(`Failed to get subcategories: ${error.message}`);
      return [];
    }
  }

  /**
   * Construire les breadcrumbs de navigation
   */
  async buildCategoryBreadcrumbs(categoryId: string): Promise<CategoryBreadcrumb[]> {
    try {
      const ancestors = await this.getCategoryAncestors(categoryId);
      const current = await this.getCategoryInfo(categoryId, false);

      if (!current) {
        return [];
      }

      const breadcrumbs: CategoryBreadcrumb[] = [];

      // Ajouter la racine
      breadcrumbs.push({
        id: 'root',
        name: 'Toutes les catégories',
        slug: '',
        url: '/categories',
        level: 0
      });

      // Ajouter les ancêtres
      ancestors.forEach((ancestor, index) => {
        breadcrumbs.push({
          id: ancestor.id,
          name: ancestor.name,
          slug: ancestor.slug,
          url: `/categories/${ancestor.slug}`,
          level: index + 1
        });
      });

      // Ajouter la catégorie courante
      breadcrumbs.push({
        id: current.id,
        name: current.name,
        slug: current.slug,
        url: `/categories/${current.slug}`,
        level: current.level
      });

      return breadcrumbs;

    } catch (error) {
      this.logger.error(`Failed to build breadcrumbs: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtenir les statistiques d'une catégorie
   */
  async getCategoryStats(categoryId: string): Promise<CategoryStats> {
    try {
      const indexName = this.configService.get('elasticsearch.indices.resources');
      
      const query = {
        query: {
          term: { 'category.id': categoryId }
        },
        size: 0,
        aggs: {
          total_resources: {
            value_count: { field: 'id' }
          },
          verified_resources: {
            filter: { term: { verified: true } },
            aggs: {
              count: { value_count: { field: 'id' } }
            }
          },
          resource_types: {
            terms: { field: 'resourceType', size: 20 }
          },
          resource_plans: {
            terms: { field: 'plan', size: 10 }
          },
          avg_rating: {
            avg: { field: 'rating' }
          }
        }
      };

      const response = await this.elasticsearchService.search(indexName, query);

      const stats: CategoryStats = {
        categoryId,
        totalResources: response.aggregations?.total_resources?.value || 0,
        verifiedResources: response.aggregations?.verified_resources?.count?.value || 0,
        resourcesByType: {},
        resourcesByPlan: {},
        averageRating: response.aggregations?.avg_rating?.value || undefined,
        lastUpdated: new Date()
      };

      // Transformer les agrégations
      if (response.aggregations?.resource_types?.buckets) {
        response.aggregations.resource_types.buckets.forEach((bucket: any) => {
          stats.resourcesByType[bucket.key] = bucket.doc_count;
        });
      }

      if (response.aggregations?.resource_plans?.buckets) {
        response.aggregations.resource_plans.buckets.forEach((bucket: any) => {
          stats.resourcesByPlan[bucket.key] = bucket.doc_count;
        });
      }

      return stats;

    } catch (error) {
      this.logger.error(`Failed to get category stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Construire les paramètres de recherche pour une catégorie
   */
  private async buildCategorySearchParams(
    categoryId: string,
    params: CategorySearchParams
  ): Promise<SearchParams> {
    const categories = [categoryId];

    // Inclure les sous-catégories si demandé
    if (params.includeSubcategories !== false) {
      const subcategories = await this.getAllSubcategoryIds(categoryId, params.maxDepth || 3);
      categories.push(...subcategories);
    }

    const searchParams: SearchParams = {
      ...params,
      filters: {
        ...params.filters,
        categories
      }
    };

    return searchParams;
  }

  /**
   * Obtenir tous les IDs des sous-catégories récursivement
   */
  private async getAllSubcategoryIds(categoryId: string, maxDepth: number): Promise<string[]> {
    if (maxDepth <= 0) {
      return [];
    }

    try {
      const children = await this.categoryRepository.findMany({
        where: { parentId: categoryId }
      });

      const childIds = children.map(child => child.id);
      const allIds = [...childIds];

      // Récursivement obtenir les sous-catégories
      for (const childId of childIds) {
        const grandChildren = await this.getAllSubcategoryIds(childId, maxDepth - 1);
        allIds.push(...grandChildren);
      }

      return allIds;

    } catch (error) {
      this.logger.error(`Failed to get subcategory IDs: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculer le niveau d'une catégorie dans la hiérarchie
   */
  private async calculateCategoryLevel(categoryId: string): Promise<number> {
    let level = 0;
    let currentId: string | null = categoryId;

    while (currentId) {
      const category = await this.categoryRepository.findById(currentId, {
        parent: { select: { id: true } }
      });

      if (!category || !category.parentId) {
        break;
      }

      level++;
      currentId = category.parentId;

      // Protection contre les boucles infinies
      if (level > 10) {
        this.logger.warn(`Category hierarchy too deep for ${categoryId}`);
        break;
      }
    }

    return level;
  }

  /**
   * Construire le chemin hiérarchique d'une catégorie
   */
  private async buildCategoryPath(categoryId: string): Promise<string> {
    const ancestors = await this.getCategoryAncestors(categoryId);
    const current = await this.getCategoryInfo(categoryId, false);

    if (!current) {
      return '';
    }

    const pathParts = ancestors.map(ancestor => ancestor.slug);
    pathParts.push(current.slug);

    return pathParts.join('/');
  }

  /**
   * Obtenir les ancêtres d'une catégorie
   */
  private async getCategoryAncestors(categoryId: string): Promise<CategoryInfo[]> {
    const ancestors: CategoryInfo[] = [];
    let currentId: string | null = categoryId;

    while (currentId) {
      const category = await this.categoryRepository.findById(currentId, {
        parent: true
      });

      if (!category || !category.parentId) {
        break;
      }

      const parentInfo = await this.getCategoryInfo(category.parentId, false);
      if (parentInfo) {
        ancestors.unshift(parentInfo); // Ajouter au début pour avoir l'ordre correct
      }

      currentId = category.parentId;

      // Protection contre les boucles infinies
      if (ancestors.length > 10) {
        this.logger.warn(`Category hierarchy too deep for ${categoryId}`);
        break;
      }
    }

    return ancestors;
  }

  /**
   * Obtenir les catégories sœurs
   */
  private async getCategorySiblings(categoryId: string): Promise<CategoryInfo[]> {
    try {
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        return [];
      }

      const siblings = await this.categoryRepository.findMany({
        where: {
          parentId: category.parentId,
          id: { not: categoryId }
        },
        include: {
          _count: {
            select: {
              children: true,
              apiResources: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      const results: CategoryInfo[] = [];
      for (const sibling of siblings) {
        const info = await this.getCategoryInfo(sibling.id, true);
        if (info) {
          results.push(info);
        }
      }

      return results;

    } catch (error) {
      this.logger.error(`Failed to get category siblings: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtenir les enfants directs d'une catégorie
   */
  private async getCategoryChildren(categoryId: string, includeCounts = true): Promise<CategoryInfo[]> {
    return this.getSubcategoriesWithCounts(categoryId, true, 1);
  }

  /**
   * Obtenir les catégories racines
   */
  private async getRootCategories(includeCounts = true): Promise<CategoryInfo[]> {
    try {
      const rootCategories = await this.categoryRepository.findMany({
        where: { parentId: null },
        include: {
          _count: includeCounts ? {
            select: {
              children: true,
              apiResources: true
            }
          } : undefined
        },
        orderBy: { name: 'asc' }
      });

      const results: CategoryInfo[] = [];
      for (const category of rootCategories) {
        const info = await this.getCategoryInfo(category.id, includeCounts);
        if (info) {
          results.push(info);
        }
      }

      return results;

    } catch (error) {
      this.logger.error(`Failed to get root categories: ${error.message}`);
      return [];
    }
  }

  /**
   * Effectuer une recherche Elasticsearch directement
   */
  private async performElasticsearchSearch(params: SearchParams): Promise<SearchResults> {
    try {
      const indexName = this.configService.get('elasticsearch.indices.resources');
      
      // Construire la requête Elasticsearch
      const query = this.buildElasticsearchQuery(params);
      
      // Effectuer la recherche
      const response = await this.elasticsearchService.search(indexName, query);
      
      // Transformer la réponse en SearchResults
      return this.transformElasticsearchResponse(response, params);
      
    } catch (error) {
      this.logger.error(`Elasticsearch search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Construire la requête Elasticsearch
   */
  private buildElasticsearchQuery(params: SearchParams): any {
    const query: any = {
      size: params.pagination?.limit || 20,
      from: ((params.pagination?.page || 1) - 1) * (params.pagination?.limit || 20),
      query: {
        bool: {
          must: [],
          filter: [],
          should: []
        }
      }
    };

    // Recherche textuelle
    if (params.query) {
      query.query.bool.must.push({
        multi_match: {
          query: params.query,
          fields: [
            'name^3',
            'description^2',
            'category.name^2',
            'tags'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    } else {
      query.query.bool.must.push({ match_all: {} });
    }

    // Filtres de catégorie
    if (params.filters?.categories && params.filters.categories.length > 0) {
      query.query.bool.filter.push({
        terms: { 'category.id': params.filters.categories }
      });
    }

    // Autres filtres
    if (params.filters?.resourceTypes && params.filters.resourceTypes.length > 0) {
      query.query.bool.filter.push({
        terms: { 'resourceType': params.filters.resourceTypes }
      });
    }

    if (params.filters?.plans && params.filters.plans.length > 0) {
      query.query.bool.filter.push({
        terms: { 'plan': params.filters.plans }
      });
    }

    if (params.filters?.verified !== undefined) {
      query.query.bool.filter.push({
        term: { 'verified': params.filters.verified }
      });
    }

    // Tri
    if (params.sort) {
      const sortField = params.sort.field === 'relevance' ? '_score' : params.sort.field;
      query.sort = [{ [sortField]: { order: params.sort.order?.toLowerCase() || 'desc' } }];
    }

    // Agrégations pour facettes
    if (params.facets && params.facets.length > 0) {
      query.aggs = {};
      params.facets.forEach(facet => {
        query.aggs[facet] = {
          terms: { field: facet, size: 20 }
        };
      });
    }

    return query;
  }

  /**
   * Transformer la réponse Elasticsearch en SearchResults
   */
  private transformElasticsearchResponse(response: any, params: SearchParams): SearchResults {
    const hits = response.hits.hits.map((hit: any) => ({
      id: hit._source.id,
      score: hit._score,
      source: hit._source
    }));

    const facets: any = {};
    if (response.aggregations) {
      Object.keys(response.aggregations).forEach(key => {
        facets[key] = response.aggregations[key].buckets.map((bucket: any) => ({
          key: bucket.key,
          count: bucket.doc_count
        }));
      });
    }

    return {
      hits,
      total: response.hits.total.value || response.hits.total,
      facets,
      took: response.took,
      metadata: {
        query: params.query,
        filters: params.filters,
        pagination: params.pagination
      }
    };
  }

  /**
   * Générer une clé de cache pour la recherche par catégorie
   */
  private generateCategoryCacheKey(categoryId: string, params: CategorySearchParams): string {
    const keyParts = [
      'category_search',
      categoryId,
      params.query || '',
      JSON.stringify(params.filters || {}),
      JSON.stringify(params.sort || {}),
      JSON.stringify(params.pagination || {}),
      params.includeSubcategories?.toString() || 'true',
      params.maxDepth?.toString() || '3',
      params.showCounts?.toString() || 'true'
    ];

    return keyParts.join('|');
  }
}