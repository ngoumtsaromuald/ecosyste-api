// Types pour les facettes de recherche

// Facette de recherche
export interface Facet {
  name: string;
  field: string;
  type: FacetType;
  buckets: FacetBucket[];
  totalCount: number;
  otherCount?: number;
  missing?: number;
}

// Type de facette
export enum FacetType {
  TERMS = 'terms',
  RANGE = 'range',
  DATE_HISTOGRAM = 'date_histogram',
  HISTOGRAM = 'histogram',
  GEO_DISTANCE = 'geo_distance',
  NESTED = 'nested'
}

// Bucket de facette (redéfini ici pour plus de détails)
export interface FacetBucket {
  key: string | number;
  count: number;
  selected?: boolean;
  from?: number;
  to?: number;
  label?: string;
  children?: FacetBucket[];
}

// Configuration de facette
export interface FacetConfig {
  name: string;
  field: string;
  type: FacetType;
  size?: number;
  minCount?: number;
  order?: FacetOrder;
  ranges?: FacetRange[];
  interval?: number | string;
  format?: string;
  nested?: string;
}

// Ordre de facette
export interface FacetOrder {
  field: '_count' | '_key';
  direction: 'asc' | 'desc';
}

// Plage de facette
export interface FacetRange {
  from?: number;
  to?: number;
  key?: string;
  label?: string;
}

// Filtre de facette appliqué
export interface AppliedFacetFilter {
  facetName: string;
  field: string;
  values: (string | number | FacetRange)[];
  operator: FacetOperator;
}

// Opérateur de facette
export enum FacetOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

// État des facettes
export interface FacetState {
  facets: Record<string, Facet>;
  appliedFilters: AppliedFacetFilter[];
  isLoading: boolean;
  error?: string;
}

// Paramètres de facette
export interface FacetParams {
  configs: FacetConfig[];
  filters?: AppliedFacetFilter[];
  query?: string;
}

// Résultats de facette
export interface FacetResults {
  facets: Record<string, Facet>;
  totalHits: number;
  took: number;
}

// Facette hiérarchique
export interface HierarchicalFacet extends Facet {
  levels: FacetLevel[];
  separator: string;
}

// Niveau de facette hiérarchique
export interface FacetLevel {
  name: string;
  field: string;
  buckets: FacetBucket[];
}

// Facette géographique
export interface GeoFacet extends Facet {
  center: {
    latitude: number;
    longitude: number;
  };
  ranges: GeoRange[];
}

// Plage géographique
export interface GeoRange {
  from: number;
  to: number;
  key: string;
  label: string;
  unit: 'km' | 'mi';
}

// Facette de date
export interface DateFacet extends Facet {
  interval: string;
  format: string;
  timeZone?: string;
  minDocCount?: number;
}

// Métriques de facette
export interface FacetMetrics {
  facetName: string;
  totalSelections: number;
  popularValues: FacetValueMetric[];
  averageSelections: number;
  conversionRate: number;
}

// Métrique de valeur de facette
export interface FacetValueMetric {
  value: string;
  count: number;
  percentage: number;
  conversionRate: number;
}

// Événement de facette
export interface FacetEvent {
  type: FacetEventType;
  facetName: string;
  value: string | number;
  userId?: string;
  sessionId: string;
  timestamp: Date;
}

// Type d'événement de facette
export enum FacetEventType {
  SELECTED = 'selected',
  DESELECTED = 'deselected',
  EXPANDED = 'expanded',
  COLLAPSED = 'collapsed',
  CLEARED = 'cleared'
}