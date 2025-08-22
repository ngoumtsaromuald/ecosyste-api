import { ResourceType } from '@prisma/client';
import { 
  MultiTypeSearchParams, 
  MultiTypeSearchResults, 
  SearchResults,
  SearchParams 
} from './search.interfaces';

/**
 * Interface pour le service de recherche multi-types
 * Requirements: 7.1, 7.2, 7.4
 */
export interface IMultiTypeSearchService {
  /**
   * Recherche simultanée dans tous les types de ressources
   * Requirements: 7.1, 7.2
   */
  searchAllTypes(params: MultiTypeSearchParams): Promise<MultiTypeSearchResults>;

  /**
   * Recherche avec groupement par type et onglets
   * Requirements: 7.2, 7.4
   */
  searchWithTypeGrouping(params: MultiTypeSearchParams): Promise<MultiTypeSearchResults>;

  /**
   * Recherche dans un type spécifique avec contexte multi-type
   * Requirements: 7.3
   */
  searchSingleTypeWithContext(
    resourceType: ResourceType, 
    params: SearchParams
  ): Promise<SearchResults>;

  /**
   * Obtenir la distribution des types pour une requête
   * Requirements: 7.2
   */
  getTypeDistribution(params: MultiTypeSearchParams): Promise<{
    [key in ResourceType]: number;
  }>;

  /**
   * Exporter les résultats par type
   * Requirements: 7.6, 7.7
   */
  exportResultsByType(
    params: MultiTypeSearchParams,
    exportTypes: ResourceType[],
    format: 'json' | 'csv' | 'xlsx'
  ): Promise<{
    [key in ResourceType]?: any;
  }>;
}

/**
 * Configuration pour l'export de résultats
 */
export interface ExportConfig {
  format: 'json' | 'csv' | 'xlsx';
  includeTypes: ResourceType[];
  maxResultsPerType?: number;
  includeMetadata?: boolean;
  filename?: string;
}

/**
 * Résultats d'export par type
 */
export interface ExportResults {
  [key: string]: {
    type: ResourceType;
    data: any[];
    count: number;
    exportedAt: Date;
  };
}