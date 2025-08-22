'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchApi, SearchQuery, SearchResponse } from '../services/searchApi';

interface UseSearchOptions {
  indexName: string;
  initialQuery?: string;
  initialFilters?: Record<string, string[]>;
  pageSize?: number;
  debounceMs?: number;
  enableCache?: boolean;
}

interface UseSearchState {
  // Data
  results: SearchResponse | null;
  suggestions: string[];
  
  // Loading states
  isLoading: boolean;
  isSuggestionsLoading: boolean;
  
  // Error states
  error: string | null;
  suggestionsError: string | null;
  
  // Search parameters
  query: string;
  filters: Record<string, string[]>;
  currentPage: number;
  
  // Actions
  search: (newQuery?: string) => void;
  setFilters: (filters: Record<string, string[]>) => void;
  setPage: (page: number) => void;
  clearSearch: () => void;
  getSuggestions: (query: string) => void;
  retry: () => void;
}

// Cache simple pour les résultats de recherche
const searchCache = new Map<string, { data: SearchResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSearch(options: UseSearchOptions): UseSearchState {
  const {
    indexName,
    initialQuery = '',
    initialFilters = {},
    pageSize = 10,
    debounceMs = 300,
    enableCache = true
  } = options;

  // State
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFiltersState] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  // Refs pour les timeouts et abort controllers
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const suggestionsAbortControllerRef = useRef<AbortController | null>(null);

  // Fonction pour générer une clé de cache
  const getCacheKey = useCallback((searchQuery: SearchQuery) => {
    return JSON.stringify({
      indexName,
      query: searchQuery.query,
      filters: searchQuery.filters,
      page: searchQuery.page,
      size: searchQuery.size
    });
  }, [indexName]);

  // Fonction pour vérifier le cache
  const getFromCache = useCallback((cacheKey: string): SearchResponse | null => {
    if (!enableCache) return null;
    
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    if (cached) {
      searchCache.delete(cacheKey);
    }
    
    return null;
  }, [enableCache]);

  // Fonction pour mettre en cache
  const setCache = useCallback((cacheKey: string, data: SearchResponse) => {
    if (!enableCache) return;
    
    searchCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Nettoyer le cache si il devient trop grand
    if (searchCache.size > 100) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }
  }, [enableCache]);

  // Fonction de recherche principale
  const performSearch = useCallback(async (searchQuery: SearchQuery) => {
    // Annuler la recherche précédente
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;

    try {
      setIsLoading(true);
      setError(null);

      // Vérifier le cache
      const cacheKey = getCacheKey(searchQuery);
      const cachedResult = getFromCache(cacheKey);
      
      if (cachedResult) {
        setResults(cachedResult);
        setIsLoading(false);
        return;
      }

      // Effectuer la recherche
      const response = await searchApi.search(indexName, searchQuery);
      
      if (!abortController.signal.aborted) {
        setResults(response);
        setCache(cacheKey, response);
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        setError(err.message || 'Erreur lors de la recherche');
        setResults(null);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [indexName, getCacheKey, getFromCache, setCache]);

  // Fonction de recherche avec debounce
  const search = useCallback((newQuery?: string) => {
    const searchQuery = newQuery !== undefined ? newQuery : query;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const searchParams: SearchQuery = {
        query: searchQuery,
        filters,
        page: newQuery !== undefined ? 1 : currentPage, // Reset page si nouvelle query
        size: pageSize
      };

      if (newQuery !== undefined) {
        setQuery(newQuery);
        setCurrentPage(1);
      }

      performSearch(searchParams);
    }, debounceMs);
  }, [query, filters, currentPage, pageSize, debounceMs, performSearch]);

  // Fonction pour obtenir des suggestions
  const getSuggestions = useCallback(async (suggestionQuery: string) => {
    if (!suggestionQuery || suggestionQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    // Annuler la requête précédente
    if (suggestionsAbortControllerRef.current) {
      suggestionsAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    suggestionsAbortControllerRef.current = abortController;

    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    suggestionsTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSuggestionsLoading(true);
        setSuggestionsError(null);

        const suggestions = await searchApi.getSuggestions(indexName, suggestionQuery);
        
        if (!abortController.signal.aborted) {
          setSuggestions(suggestions);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted) {
          setSuggestionsError(err.message || 'Erreur lors de la récupération des suggestions');
          setSuggestions([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsSuggestionsLoading(false);
        }
      }
    }, 150); // Debounce plus court pour les suggestions
  }, [indexName]);

  // Fonction pour définir les filtres
  const setFilters = useCallback((newFilters: Record<string, string[]>) => {
    setFiltersState(newFilters);
    setCurrentPage(1);
    
    // Relancer la recherche avec les nouveaux filtres
    const searchParams: SearchQuery = {
      query,
      filters: newFilters,
      page: 1,
      size: pageSize
    };
    
    performSearch(searchParams);
  }, [query, pageSize, performSearch]);

  // Fonction pour changer de page
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    
    const searchParams: SearchQuery = {
      query,
      filters,
      page,
      size: pageSize
    };
    
    performSearch(searchParams);
  }, [query, filters, pageSize, performSearch]);

  // Fonction pour vider la recherche
  const clearSearch = useCallback(() => {
    setQuery('');
    setFiltersState({});
    setCurrentPage(1);
    setResults(null);
    setError(null);
    setSuggestions([]);
    setSuggestionsError(null);
    
    // Annuler les requêtes en cours
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    if (suggestionsAbortControllerRef.current) {
      suggestionsAbortControllerRef.current.abort();
    }
  }, []);

  // Fonction pour réessayer
  const retry = useCallback(() => {
    const searchParams: SearchQuery = {
      query,
      filters,
      page: currentPage,
      size: pageSize
    };
    
    performSearch(searchParams);
  }, [query, filters, currentPage, pageSize, performSearch]);

  // Recherche initiale si une query est fournie
  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
    }
  }, []); // Seulement au montage

  // Nettoyage
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
      if (suggestionsAbortControllerRef.current) {
        suggestionsAbortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Data
    results,
    suggestions,
    
    // Loading states
    isLoading,
    isSuggestionsLoading,
    
    // Error states
    error,
    suggestionsError,
    
    // Search parameters
    query,
    filters,
    currentPage,
    
    // Actions
    search,
    setFilters,
    setPage,
    clearSearch,
    getSuggestions,
    retry
  };
}

export default useSearch;