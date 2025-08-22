// Types pour les suggestions auto-complete

// Suggestion de recherche
export interface Suggestion {
  text: string;
  type: SuggestionType;
  score: number;
  category?: string;
  resourceType?: string;
  metadata?: SuggestionMetadata;
}

// Type de suggestion
export enum SuggestionType {
  QUERY = 'query',
  RESOURCE = 'resource',
  CATEGORY = 'category',
  TAG = 'tag',
  LOCATION = 'location'
}

// Métadonnées de suggestion
export interface SuggestionMetadata {
  id?: string;
  icon?: string;
  description?: string;
  popularity?: number;
  lastUsed?: Date;
}

// Paramètres de suggestion
export interface SuggestionParams {
  query: string;
  limit?: number;
  types?: SuggestionType[];
  userId?: string;
  includePopular?: boolean;
  includeRecent?: boolean;
}

// Résultats de suggestion
export interface SuggestionResults {
  suggestions: Suggestion[];
  total: number;
  took: number;
}

// Configuration de suggestion
export interface SuggestionConfig {
  minQueryLength: number;
  maxSuggestions: number;
  debounceMs: number;
  enableKeyboardNavigation: boolean;
  autoExecuteOnSelect: boolean;
  highlightMatches: boolean;
}

// Contexte de suggestion
export interface SuggestionContext {
  currentQuery: string;
  selectedIndex: number;
  isVisible: boolean;
  isLoading: boolean;
  error?: string;
}

// Historique de suggestion
export interface SuggestionHistory {
  userId: string;
  suggestions: string[];
  maxItems: number;
  createdAt: Date;
  updatedAt: Date;
}

// Métriques de suggestion
export interface SuggestionMetrics {
  totalRequests: number;
  averageResponseTime: number;
  popularSuggestions: PopularSuggestion[];
  clickThroughRate: number;
  conversionRate: number;
}

// Suggestion populaire
export interface PopularSuggestion {
  text: string;
  count: number;
  type: SuggestionType;
  lastUsed: Date;
}

// Événement de suggestion
export interface SuggestionEvent {
  type: SuggestionEventType;
  suggestion: Suggestion;
  query: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
}

// Type d'événement de suggestion
export enum SuggestionEventType {
  REQUESTED = 'requested',
  DISPLAYED = 'displayed',
  SELECTED = 'selected',
  EXECUTED = 'executed',
  DISMISSED = 'dismissed'
}