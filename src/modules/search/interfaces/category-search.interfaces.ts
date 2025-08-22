import { SearchParams, SearchResults, FacetBucket } from './search.interfaces';

/**
 * Interface pour la recherche par catégories avec navigation hiérarchique
 */
export interface CategorySearchParams extends SearchParams {
  includeSubcategories?: boolean;
  maxDepth?: number;
  showCounts?: boolean;
}

/**
 * Résultats de recherche par catégorie avec informations hiérarchiques
 */
export interface CategorySearchResults extends SearchResults {
  category: CategoryInfo;
  subcategories: CategoryInfo[];
  breadcrumbs: CategoryBreadcrumb[];
  hierarchy: CategoryHierarchy;
}

/**
 * Informations sur une catégorie
 */
export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  level: number;
  resourceCount: number;
  subcategoryCount: number;
  path: string; // Chemin hiérarchique complet
  children?: CategoryInfo[];
}

/**
 * Élément de breadcrumb pour navigation
 */
export interface CategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
  url: string;
  level: number;
}

/**
 * Hiérarchie complète des catégories
 */
export interface CategoryHierarchy {
  root: CategoryInfo[];
  current: CategoryInfo;
  siblings: CategoryInfo[];
  children: CategoryInfo[];
  ancestors: CategoryInfo[];
}

/**
 * Paramètres pour obtenir la hiérarchie des catégories
 */
export interface CategoryHierarchyParams {
  categoryId?: string;
  includeResourceCounts?: boolean;
  maxDepth?: number;
  onlyActive?: boolean;
}

/**
 * Statistiques par catégorie
 */
export interface CategoryStats {
  categoryId: string;
  totalResources: number;
  verifiedResources: number;
  resourcesByType: Record<string, number>;
  resourcesByPlan: Record<string, number>;
  averageRating?: number;
  lastUpdated: Date;
}

/**
 * Navigation de catégorie pour URLs SEO-friendly
 */
export interface CategoryNavigation {
  current: CategoryInfo;
  parent?: CategoryInfo;
  children: CategoryInfo[];
  siblings: CategoryInfo[];
  breadcrumbs: CategoryBreadcrumb[];
  seoPath: string;
  canonicalUrl: string;
}