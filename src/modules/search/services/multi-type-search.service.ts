import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResourceType } from '@prisma/client';
import {
  MultiTypeSearchParams,
  MultiTypeSearchResults,
  SearchResults,
  SearchParams,
  SearchHit,
  SearchFacets,
  SortField,
  SortOrder
} from '../interfaces/search.interfaces';
import {
  IMultiTypeSearchService,
  ExportConfig,
  ExportResults
} from '../interfaces/multi-type-search.interface';
import { SearchService } from './search.service';
import { ElasticsearchService } from './elasticsearch.service';
import { SearchCacheService } from './search-cache.service';

@Injectable()
export class MultiTypeSearchService implements IMultiTypeSearchService {
  private readonly logger = new Logger(MultiTypeSearchService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly cacheService: SearchCacheService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Recherche simultanée dans tous les types de ressources
   * Requirements: 7.1, 7.2
   */
  async searchAllTypes(params: MultiTypeSearchParams): Promise<MultiTypeSearchResults> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Multi-type search started with params: ${JSON.stringify(params)}`);

      // Déterminer les types à inclure
      const typesToSearch = params.includeTypes && params.includeTypes.length > 0 
        ? params.includeTypes 
        : Object.values(ResourceType);

      this.logger.debug(`Searching in types: ${typesToSearch.join(', ')}`);

      // Générer la clé de cache
      const cacheKey = this.generateMultiTypeCacheKey(params);

      // Vérifier le cache
      const cachedResults = await this.cacheService.getCachedSearchResults(cacheKey);
      if (cachedResults && this.isValidMultiTypeCache(cachedResults)) {
        this.logger.debug(`Returning cached multi-type results for key: ${cacheKey}`);
        return cachedResults as MultiTypeSearchResults;
      }

      // Effectuer les recherches par type en parallèle
      const searchPromises = typesToSearch.map(type => 
        this.searchSingleTypeWithContext(type, params)
      );

      const typeResults = await Promise.allSettled(searchPromises);

      // Construire les résultats groupés par type
      const resultsByType: MultiTypeSearchResults['resultsByType'] = {} as any;
      const allHits: SearchHit[] = [];
      let totalAcrossTypes = 0;
      const typeDistribution: { [key in ResourceType]: number } = {} as any;

      typesToSearch.forEach((type, index) => {
        const result = typeResults[index];
        
        if (result.status === 'fulfilled') {
          const searchResult = result.value;
          resultsByType[type] = {
            hits: searchResult.hits,
            total: searchResult.total,
            facets: searchResult.facets
          };
          
          // Ajouter les hits à la liste combinée
          allHits.push(...searchResult.hits);
          totalAcrossTypes += searchResult.total;
          typeDistribution[type] = searchResult.total;
        } else {
          this.logger.error(`Search failed for type ${type}: ${result.reason}`);
          resultsByType[type] = {
            hits: [],
            total: 0,
            facets: this.getEmptyFacets()
          };
          typeDistribution[type] = 0;
        }
      });

      // Trier les résultats combinés par pertinence globale
      const combinedResults = this.sortByGlobalRelevance(allHits, params);

      // Construire les facettes globales
      const globalFacets = this.buildGlobalFacets(resultsByType);

      // Construire les résultats finaux
      const multiTypeResults: MultiTypeSearchResults = {
        resultsByType,
        combinedResults: this.applyPagination(combinedResults, params.pagination),
        totalAcrossTypes,
        globalFacets,
        took: Date.now() - startTime,
        page: params.pagination?.page,
        limit: params.pagination?.limit,
        hasMore: this.calculateHasMore(combinedResults.length, params.pagination),
        metadata: {
          query: params.query,
          filters: params.filters,
          pagination: params.pagination,
          typeDistribution,
          searchedTypes: typesToSearch,
          groupByType: params.groupByType,
          globalRelevanceSort: params.globalRelevanceSort
        }
      };

      // Mettre en cache les résultats
      await this.cacheService.cacheSearchResults(cacheKey, multiTypeResults);

      this.logger.debug(`Multi-type search completed in ${multiTypeResults.took}ms, found ${totalAcrossTypes} total results`);

      return multiTypeResults;
    } catch (error) {
      this.logger.error(`Multi-type search failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Recherche avec groupement par type et onglets
   * Requirements: 7.2, 7.4
   */
  async searchWithTypeGrouping(params: MultiTypeSearchParams): Promise<MultiTypeSearchResults> {
    // Forcer le groupement par type
    const groupedParams: MultiTypeSearchParams = {
      ...params,
      groupByType: true,
      globalRelevanceSort: false
    };

    return this.searchAllTypes(groupedParams);
  }

  /**
   * Recherche dans un type spécifique avec contexte multi-type
   * Requirements: 7.3
   */
  async searchSingleTypeWithContext(
    resourceType: ResourceType, 
    params: SearchParams
  ): Promise<SearchResults> {
    try {
      this.logger.debug(`Single type search for: ${resourceType}`);

      // Ajouter le filtre de type aux paramètres
      const typeFilteredParams: SearchParams = {
        ...params,
        filters: {
          ...params.filters,
          resourceTypes: [resourceType]
        }
      };

      // Utiliser le service de recherche standard avec filtre de type
      const results = await this.searchService.search(typeFilteredParams);

      // Enrichir avec des métadonnées de contexte multi-type
      return {
        ...results,
        metadata: {
          ...results.metadata,
          searchedType: resourceType,
          isMultiTypeContext: true
        }
      };
    } catch (error) {
      this.logger.error(`Single type search failed for ${resourceType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir la distribution des types pour une requête
   * Requirements: 7.2
   */
  async getTypeDistribution(params: MultiTypeSearchParams): Promise<{
    [key in ResourceType]: number;
  }> {
    try {
      this.logger.debug(`Getting type distribution for query: ${params.query}`);

      // Construire une requête Elasticsearch pour obtenir les compteurs par type
      const indexName = this.configService.get('elasticsearch.indices.resources');
      
      const query = this.buildTypeDistributionQuery(params);

      const response = await this.elasticsearchService.search(indexName, query);

      // Extraire les compteurs par type depuis les agrégations
      const distribution: { [key in ResourceType]: number } = {} as any;

      if (response.aggregations?.type_distribution?.buckets) {
        response.aggregations.type_distribution.buckets.forEach((bucket: any) => {
          const resourceType = bucket.key as ResourceType;
          distribution[resourceType] = bucket.doc_count;
        });
      }

      // S'assurer que tous les types sont présents avec 0 si nécessaire
      Object.values(ResourceType).forEach(type => {
        if (!(type in distribution)) {
          distribution[type] = 0;
        }
      });

      this.logger.debug(`Type distribution: ${JSON.stringify(distribution)}`);

      return distribution;
    } catch (error) {
      this.logger.error(`Failed to get type distribution: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exporter les résultats par type
   * Requirements: 7.6, 7.7
   */
  async exportResultsByType(
    params: MultiTypeSearchParams,
    exportTypes: ResourceType[],
    format: 'json' | 'csv' | 'xlsx'
  ): Promise<{
    [key in ResourceType]?: any;
  }> {
    try {
      this.logger.debug(`Exporting results by type: ${exportTypes.join(', ')} in format: ${format}`);

      const exportResults: { [key in ResourceType]?: any } = {};

      // Rechercher chaque type avec une limite élevée pour l'export
      const exportPromises = exportTypes.map(async (type) => {
        const exportParams: SearchParams = {
          ...params,
          filters: {
            ...params.filters,
            resourceTypes: [type]
          },
          pagination: {
            page: 1,
            limit: params.limitsPerType?.[type] || 1000 // Limite par défaut pour export
          }
        };

        const results = await this.searchService.search(exportParams);
        
        return {
          type,
          data: this.formatExportData(results.hits, format),
          count: results.total,
          exportedAt: new Date()
        };
      });

      const exportData = await Promise.all(exportPromises);

      // Organiser les données par type
      exportData.forEach(({ type, data, count, exportedAt }) => {
        exportResults[type] = {
          data,
          count,
          exportedAt,
          format
        };
      });

      this.logger.debug(`Export completed for ${exportTypes.length} types`);

      return exportResults;
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Construire une requête pour la distribution des types
   */
  private buildTypeDistributionQuery(params: MultiTypeSearchParams): any {
    const query: any = {
      size: 0, // Pas besoin des documents, juste des agrégations
      query: {
        bool: {
          must: [],
          filter: []
        }
      },
      aggs: {
        type_distribution: {
          terms: {
            field: 'resourceType',
            size: Object.values(ResourceType).length
          }
        }
      }
    };

    // Ajouter la requête textuelle si présente
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
    }

    // Ajouter les filtres
    if (params.filters) {
      if (params.filters.categories && params.filters.categories.length > 0) {
        query.query.bool.filter.push({
          terms: { 'category.id': params.filters.categories }
        });
      }

      if (params.filters.verified !== undefined) {
        query.query.bool.filter.push({
          term: { verified: params.filters.verified }
        });
      }

      if (params.filters.plans && params.filters.plans.length > 0) {
        query.query.bool.filter.push({
          terms: { plan: params.filters.plans }
        });
      }

      // Ajouter d'autres filtres selon les besoins
    }

    return query;
  }

  /**
   * Trier les résultats par pertinence globale
   */
  private sortByGlobalRelevance(hits: SearchHit[], params: MultiTypeSearchParams): SearchHit[] {
    if (!params.globalRelevanceSort) {
      return hits;
    }

    return hits.sort((a, b) => {
      // Tri principal par score de pertinence
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // Tri secondaire par type (priorité: API > SERVICE > BUSINESS > DATA)
      const typePriority = {
        [ResourceType.API]: 4,
        [ResourceType.SERVICE]: 3,
        [ResourceType.BUSINESS]: 2,
        [ResourceType.DATA]: 1
      };

      const aPriority = typePriority[a.resourceType] || 0;
      const bPriority = typePriority[b.resourceType] || 0;

      if (bPriority !== aPriority) {
        return bPriority - aPriority;
      }

      // Tri tertiaire par statut vérifié
      if (a.verified !== b.verified) {
        return a.verified ? -1 : 1;
      }

      // Tri final par date de mise à jour
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  /**
   * Construire les facettes globales à partir des résultats par type
   */
  private buildGlobalFacets(resultsByType: MultiTypeSearchResults['resultsByType']): SearchFacets {
    const globalFacets: SearchFacets = {
      categories: [],
      resourceTypes: [],
      plans: [],
      cities: [],
      regions: [],
      verified: [],
      tags: []
    };

    // Agréger les facettes de tous les types
    Object.values(resultsByType).forEach(typeResult => {
      if (typeResult.facets) {
        // Fusionner les catégories
        this.mergeFacetBuckets(globalFacets.categories, typeResult.facets.categories);
        
        // Fusionner les types de ressources
        this.mergeFacetBuckets(globalFacets.resourceTypes, typeResult.facets.resourceTypes);
        
        // Fusionner les plans
        this.mergeFacetBuckets(globalFacets.plans, typeResult.facets.plans);
        
        // Fusionner les villes
        this.mergeFacetBuckets(globalFacets.cities, typeResult.facets.cities);
        
        // Fusionner les régions
        this.mergeFacetBuckets(globalFacets.regions, typeResult.facets.regions);
        
        // Fusionner les statuts vérifiés
        this.mergeFacetBuckets(globalFacets.verified, typeResult.facets.verified);
        
        // Fusionner les tags
        this.mergeFacetBuckets(globalFacets.tags, typeResult.facets.tags);
      }
    });

    // Trier les facettes par compteur décroissant
    Object.keys(globalFacets).forEach(key => {
      if (Array.isArray(globalFacets[key])) {
        globalFacets[key].sort((a, b) => b.count - a.count);
      }
    });

    return globalFacets;
  }

  /**
   * Fusionner les buckets de facettes
   */
  private mergeFacetBuckets(target: any[], source: any[]): void {
    if (!source || !Array.isArray(source)) return;

    source.forEach(sourceBucket => {
      const existingBucket = target.find(bucket => bucket.key === sourceBucket.key);
      
      if (existingBucket) {
        existingBucket.count += sourceBucket.count;
      } else {
        target.push({ ...sourceBucket });
      }
    });
  }

  /**
   * Appliquer la pagination aux résultats combinés
   */
  private applyPagination(hits: SearchHit[], pagination?: any): SearchHit[] {
    if (!pagination) return hits;

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const offset = (page - 1) * limit;

    return hits.slice(offset, offset + limit);
  }

  /**
   * Calculer s'il y a plus de résultats
   */
  private calculateHasMore(totalHits: number, pagination?: any): boolean {
    if (!pagination) return false;

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const offset = (page - 1) * limit;

    return totalHits > offset + limit;
  }

  /**
   * Formater les données pour l'export
   */
  private formatExportData(hits: SearchHit[], format: string): any[] {
    switch (format) {
      case 'json':
        return hits.map(hit => ({
          id: hit.id,
          name: hit.name,
          description: hit.description,
          resourceType: hit.resourceType,
          category: hit.category.name,
          plan: hit.plan,
          verified: hit.verified,
          location: hit.location,
          contact: hit.contact,
          tags: hit.tags,
          createdAt: hit.createdAt,
          updatedAt: hit.updatedAt,
          score: hit.score
        }));

      case 'csv':
        return hits.map(hit => ({
          ID: hit.id,
          Nom: hit.name,
          Description: hit.description,
          Type: hit.resourceType,
          Catégorie: hit.category.name,
          Plan: hit.plan,
          Vérifié: hit.verified ? 'Oui' : 'Non',
          Ville: hit.location?.city || '',
          Région: hit.location?.region || '',
          Email: hit.contact?.email || '',
          Téléphone: hit.contact?.phone || '',
          Site_Web: hit.contact?.website || '',
          Tags: hit.tags?.join(', ') || '',
          Date_Création: hit.createdAt,
          Date_Modification: hit.updatedAt,
          Score_Pertinence: hit.score
        }));

      default:
        return hits;
    }
  }

  /**
   * Générer une clé de cache pour la recherche multi-type
   */
  private generateMultiTypeCacheKey(params: MultiTypeSearchParams): string {
    const keyParts = [
      'multitype',
      params.query || 'empty',
      JSON.stringify(params.filters || {}),
      JSON.stringify(params.includeTypes || []),
      params.groupByType ? 'grouped' : 'combined',
      params.globalRelevanceSort ? 'global' : 'type',
      JSON.stringify(params.pagination || {}),
      JSON.stringify(params.sort || {})
    ];

    return keyParts.join(':');
  }

  /**
   * Vérifier si le cache multi-type est valide
   */
  private isValidMultiTypeCache(cached: any): boolean {
    return cached && 
           cached.resultsByType && 
           cached.combinedResults && 
           typeof cached.totalAcrossTypes === 'number';
  }

  /**
   * Obtenir des facettes vides
   */
  private getEmptyFacets(): SearchFacets {
    return {
      categories: [],
      resourceTypes: [],
      plans: [],
      cities: [],
      regions: [],
      verified: [],
      tags: []
    };
  }
}