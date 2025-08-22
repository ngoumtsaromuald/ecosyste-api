export interface Facet {
    name: string;
    field: string;
    type: FacetType;
    buckets: FacetBucket[];
    totalCount: number;
    otherCount?: number;
    missing?: number;
}
export declare enum FacetType {
    TERMS = "terms",
    RANGE = "range",
    DATE_HISTOGRAM = "date_histogram",
    HISTOGRAM = "histogram",
    GEO_DISTANCE = "geo_distance",
    NESTED = "nested"
}
export interface FacetBucket {
    key: string | number;
    count: number;
    selected?: boolean;
    from?: number;
    to?: number;
    label?: string;
    children?: FacetBucket[];
}
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
export interface FacetOrder {
    field: '_count' | '_key';
    direction: 'asc' | 'desc';
}
export interface FacetRange {
    from?: number;
    to?: number;
    key?: string;
    label?: string;
}
export interface AppliedFacetFilter {
    facetName: string;
    field: string;
    values: (string | number | FacetRange)[];
    operator: FacetOperator;
}
export declare enum FacetOperator {
    AND = "and",
    OR = "or",
    NOT = "not"
}
export interface FacetState {
    facets: Record<string, Facet>;
    appliedFilters: AppliedFacetFilter[];
    isLoading: boolean;
    error?: string;
}
export interface FacetParams {
    configs: FacetConfig[];
    filters?: AppliedFacetFilter[];
    query?: string;
}
export interface FacetResults {
    facets: Record<string, Facet>;
    totalHits: number;
    took: number;
}
export interface HierarchicalFacet extends Facet {
    levels: FacetLevel[];
    separator: string;
}
export interface FacetLevel {
    name: string;
    field: string;
    buckets: FacetBucket[];
}
export interface GeoFacet extends Facet {
    center: {
        latitude: number;
        longitude: number;
    };
    ranges: GeoRange[];
}
export interface GeoRange {
    from: number;
    to: number;
    key: string;
    label: string;
    unit: 'km' | 'mi';
}
export interface DateFacet extends Facet {
    interval: string;
    format: string;
    timeZone?: string;
    minDocCount?: number;
}
export interface FacetMetrics {
    facetName: string;
    totalSelections: number;
    popularValues: FacetValueMetric[];
    averageSelections: number;
    conversionRate: number;
}
export interface FacetValueMetric {
    value: string;
    count: number;
    percentage: number;
    conversionRate: number;
}
export interface FacetEvent {
    type: FacetEventType;
    facetName: string;
    value: string | number;
    userId?: string;
    sessionId: string;
    timestamp: Date;
}
export declare enum FacetEventType {
    SELECTED = "selected",
    DESELECTED = "deselected",
    EXPANDED = "expanded",
    COLLAPSED = "collapsed",
    CLEARED = "cleared"
}
