import { SearchParams, SearchResults } from './search.interfaces';
export interface CategorySearchParams extends SearchParams {
    includeSubcategories?: boolean;
    maxDepth?: number;
    showCounts?: boolean;
}
export interface CategorySearchResults extends SearchResults {
    category: CategoryInfo;
    subcategories: CategoryInfo[];
    breadcrumbs: CategoryBreadcrumb[];
    hierarchy: CategoryHierarchy;
}
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
    path: string;
    children?: CategoryInfo[];
}
export interface CategoryBreadcrumb {
    id: string;
    name: string;
    slug: string;
    url: string;
    level: number;
}
export interface CategoryHierarchy {
    root: CategoryInfo[];
    current: CategoryInfo;
    siblings: CategoryInfo[];
    children: CategoryInfo[];
    ancestors: CategoryInfo[];
}
export interface CategoryHierarchyParams {
    categoryId?: string;
    includeResourceCounts?: boolean;
    maxDepth?: number;
    onlyActive?: boolean;
}
export interface CategoryStats {
    categoryId: string;
    totalResources: number;
    verifiedResources: number;
    resourcesByType: Record<string, number>;
    resourcesByPlan: Record<string, number>;
    averageRating?: number;
    lastUpdated: Date;
}
export interface CategoryNavigation {
    current: CategoryInfo;
    parent?: CategoryInfo;
    children: CategoryInfo[];
    siblings: CategoryInfo[];
    breadcrumbs: CategoryBreadcrumb[];
    seoPath: string;
    canonicalUrl: string;
}
