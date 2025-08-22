// Interfaces simplifiées pour le système de recherche

export interface SearchParams {
  query?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResults {
  query: string;
  results: any[];
  total: number;
  limit: number;
  offset: number;
  took: number;
}

export interface SearchResponse {
  success: boolean;
  data?: SearchResults;
  error?: string;
  timestamp: string;
}