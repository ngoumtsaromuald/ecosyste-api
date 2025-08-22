'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SearchFilters, SearchResult } from '../services/searchApi';

// Types
interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  suggestions: string[];
  isLoading: boolean;
  isLoadingSuggestions: boolean;
  error: string | null;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  resultsPerPage: number;
  searchHistory: string[];
  recentSearches: string[];
  cache: Record<string, {
    results: SearchResult[];
    totalResults: number;
    timestamp: number;
  }>;
}

type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<SearchFilters> }
  | { type: 'SET_RESULTS'; payload: { results: SearchResult[]; totalResults: number; currentPage: number } }
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_SUGGESTIONS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_RESULTS_PER_PAGE'; payload: number }
  | { type: 'ADD_TO_HISTORY'; payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'CACHE_RESULTS'; payload: { key: string; results: SearchResult[]; totalResults: number } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'RESET_SEARCH' };

interface SearchContextType {
  state: SearchState;
  dispatch: React.Dispatch<SearchAction>;
  // Helper functions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setResults: (results: SearchResult[], totalResults: number, currentPage: number) => void;
  setSuggestions: (suggestions: string[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingSuggestions: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setResultsPerPage: (perPage: number) => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  cacheResults: (key: string, results: SearchResult[], totalResults: number) => void;
  getCachedResults: (key: string) => { results: SearchResult[]; totalResults: number } | null;
  clearCache: () => void;
  resetSearch: () => void;
}

// Initial state
const initialState: SearchState = {
  query: '',
  filters: {
    categories: [],
    tags: [],
    authors: [],
    dateRange: {
      start: null,
      end: null
    },
    sortBy: 'relevance',
    sortOrder: 'desc'
  },
  results: [],
  suggestions: [],
  isLoading: false,
  isLoadingSuggestions: false,
  error: null,
  totalResults: 0,
  currentPage: 1,
  totalPages: 0,
  resultsPerPage: 10,
  searchHistory: [],
  recentSearches: [],
  cache: {}
};

// Reducer
function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case 'SET_RESULTS':
      const { results, totalResults, currentPage } = action.payload;
      return {
        ...state,
        results,
        totalResults,
        currentPage,
        totalPages: Math.ceil(totalResults / state.resultsPerPage),
        isLoading: false,
        error: null
      };

    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload,
        isLoadingSuggestions: false
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error
      };

    case 'SET_LOADING_SUGGESTIONS':
      return {
        ...state,
        isLoadingSuggestions: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isLoadingSuggestions: false
      };

    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.payload
      };

    case 'SET_RESULTS_PER_PAGE':
      return {
        ...state,
        resultsPerPage: action.payload,
        totalPages: Math.ceil(state.totalResults / action.payload),
        currentPage: 1
      };

    case 'ADD_TO_HISTORY':
      const query = action.payload.trim();
      if (!query || state.searchHistory.includes(query)) {
        return state;
      }
      
      const newHistory = [query, ...state.searchHistory.slice(0, 19)]; // Keep last 20
      const newRecent = [query, ...state.recentSearches.filter(q => q !== query).slice(0, 4)]; // Keep last 5
      
      return {
        ...state,
        searchHistory: newHistory,
        recentSearches: newRecent
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        searchHistory: [],
        recentSearches: []
      };

    case 'CACHE_RESULTS':
      const { key, results: cachedResults, totalResults: cachedTotal } = action.payload;
      return {
        ...state,
        cache: {
          ...state.cache,
          [key]: {
            results: cachedResults,
            totalResults: cachedTotal,
            timestamp: Date.now()
          }
        }
      };

    case 'CLEAR_CACHE':
      return {
        ...state,
        cache: {}
      };

    case 'RESET_SEARCH':
      return {
        ...initialState,
        searchHistory: state.searchHistory,
        recentSearches: state.recentSearches,
        cache: state.cache
      };

    default:
      return state;
  }
}

// Context
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Provider component
interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  // Helper functions
  const setQuery = (query: string) => {
    dispatch({ type: 'SET_QUERY', payload: query });
  };

  const setFilters = (filters: Partial<SearchFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setResults = (results: SearchResult[], totalResults: number, currentPage: number) => {
    dispatch({ type: 'SET_RESULTS', payload: { results, totalResults, currentPage } });
  };

  const setSuggestions = (suggestions: string[]) => {
    dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setLoadingSuggestions = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING_SUGGESTIONS', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setPage = (page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  };

  const setResultsPerPage = (perPage: number) => {
    dispatch({ type: 'SET_RESULTS_PER_PAGE', payload: perPage });
  };

  const addToHistory = (query: string) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: query });
  };

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' });
  };

  const cacheResults = (key: string, results: SearchResult[], totalResults: number) => {
    dispatch({ type: 'CACHE_RESULTS', payload: { key, results, totalResults } });
  };

  const getCachedResults = (key: string) => {
    const cached = state.cache[key];
    if (!cached) return null;
    
    // Check if cache is still valid (5 minutes)
    const isValid = Date.now() - cached.timestamp < 5 * 60 * 1000;
    if (!isValid) {
      return null;
    }
    
    return {
      results: cached.results,
      totalResults: cached.totalResults
    };
  };

  const clearCache = () => {
    dispatch({ type: 'CLEAR_CACHE' });
  };

  const resetSearch = () => {
    dispatch({ type: 'RESET_SEARCH' });
  };

  const contextValue: SearchContextType = {
    state,
    dispatch,
    setQuery,
    setFilters,
    setResults,
    setSuggestions,
    setLoading,
    setLoadingSuggestions,
    setError,
    setPage,
    setResultsPerPage,
    addToHistory,
    clearHistory,
    cacheResults,
    getCachedResults,
    clearCache,
    resetSearch
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

// Hook to use the search context
export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
}

// Export types
export type { SearchState, SearchAction, SearchContextType };
export { SearchContext };