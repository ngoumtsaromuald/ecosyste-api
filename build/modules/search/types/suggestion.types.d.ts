export interface Suggestion {
    text: string;
    type: SuggestionType;
    score: number;
    category?: string;
    resourceType?: string;
    metadata?: SuggestionMetadata;
}
export declare enum SuggestionType {
    QUERY = "query",
    RESOURCE = "resource",
    CATEGORY = "category",
    TAG = "tag",
    LOCATION = "location"
}
export interface SuggestionMetadata {
    id?: string;
    icon?: string;
    description?: string;
    popularity?: number;
    lastUsed?: Date;
}
export interface SuggestionParams {
    query: string;
    limit?: number;
    types?: SuggestionType[];
    userId?: string;
    includePopular?: boolean;
    includeRecent?: boolean;
}
export interface SuggestionResults {
    suggestions: Suggestion[];
    total: number;
    took: number;
}
export interface SuggestionConfig {
    minQueryLength: number;
    maxSuggestions: number;
    debounceMs: number;
    enableKeyboardNavigation: boolean;
    autoExecuteOnSelect: boolean;
    highlightMatches: boolean;
}
export interface SuggestionContext {
    currentQuery: string;
    selectedIndex: number;
    isVisible: boolean;
    isLoading: boolean;
    error?: string;
}
export interface SuggestionHistory {
    userId: string;
    suggestions: string[];
    maxItems: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface SuggestionMetrics {
    totalRequests: number;
    averageResponseTime: number;
    popularSuggestions: PopularSuggestion[];
    clickThroughRate: number;
    conversionRate: number;
}
export interface PopularSuggestion {
    text: string;
    count: number;
    type: SuggestionType;
    lastUsed: Date;
}
export interface SuggestionEvent {
    type: SuggestionEventType;
    suggestion: Suggestion;
    query: string;
    userId?: string;
    sessionId: string;
    timestamp: Date;
}
export declare enum SuggestionEventType {
    REQUESTED = "requested",
    DISPLAYED = "displayed",
    SELECTED = "selected",
    EXECUTED = "executed",
    DISMISSED = "dismissed"
}
