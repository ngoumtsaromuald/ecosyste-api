import { create } from 'zustand';
import { ApiEndpoint, ApiCategory, SearchFilters, SearchResult } from '../types';
import apiClient from '../api/client';

interface CatalogState {
  // État des API
  apis: ApiEndpoint[];
  categories: ApiCategory[];
  featuredApis: ApiEndpoint[];
  
  // État de la recherche
  searchResults: SearchResult | null;
  searchQuery: string;
  searchFilters: SearchFilters;
  
  // État de chargement
  isLoading: boolean;
  isSearching: boolean;
  
  // API favorites
  favoriteApis: string[];
}

interface CatalogActions {
  // Actions pour les API
  fetchApis: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchFeaturedApis: () => Promise<void>;
  
  // Actions de recherche
  searchApis: (query: string, filters?: SearchFilters) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: SearchFilters) => void;
  clearSearch: () => void;
  
  // Actions pour les favoris
  toggleFavorite: (apiId: string) => void;
  fetchFavorites: () => Promise<void>;
  
  // Actions utilitaires
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
}

type CatalogStore = CatalogState & CatalogActions;

export const useCatalogStore = create<CatalogStore>()((set, get) => ({
  // État initial
  apis: [],
  categories: [],
  featuredApis: [],
  searchResults: null,
  searchQuery: '',
  searchFilters: {},
  isLoading: false,
  isSearching: false,
  favoriteApis: [],

  // Actions pour les API
  fetchApis: async () => {
    try {
      set({ isLoading: true });
      
      const response = await apiClient.get<ApiEndpoint[]>('/apis');
      
      set({
        apis: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchCategories: async () => {
    try {
      const response = await apiClient.get<ApiCategory[]>('/apis/categories');
      
      set({ categories: response.data });
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  },

  fetchFeaturedApis: async () => {
    try {
      const response = await apiClient.get<ApiEndpoint[]>('/apis/featured');
      
      set({ featuredApis: response.data });
    } catch (error) {
      console.error('Erreur lors du chargement des API en vedette:', error);
    }
  },

  // Actions de recherche
  searchApis: async (query: string, filters: SearchFilters = {}) => {
    try {
      set({ isSearching: true, searchQuery: query, searchFilters: filters });
      
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.category) params.append('category', filters.category);
      if (filters.pricing) {
        filters.pricing.forEach(p => params.append('pricing', p));
      }
      if (filters.rating) params.append('rating', filters.rating.toString());
      if (filters.tags) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }
      
      const response = await apiClient.get<SearchResult>(`/apis/search?${params.toString()}`);
      
      set({
        searchResults: response.data,
        isSearching: false,
      });
    } catch (error) {
      set({ isSearching: false });
      throw error;
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSearchFilters: (filters: SearchFilters) => {
    set({ searchFilters: filters });
  },

  clearSearch: () => {
    set({
      searchResults: null,
      searchQuery: '',
      searchFilters: {},
    });
  },

  // Actions pour les favoris
  toggleFavorite: (apiId: string) => {
    const { favoriteApis } = get();
    const isFavorite = favoriteApis.includes(apiId);
    
    if (isFavorite) {
      set({ favoriteApis: favoriteApis.filter(id => id !== apiId) });
      // Appel API pour supprimer des favoris
      apiClient.delete(`/user/favorites/${apiId}`).catch(console.error);
    } else {
      set({ favoriteApis: [...favoriteApis, apiId] });
      // Appel API pour ajouter aux favoris
      apiClient.post(`/user/favorites/${apiId}`).catch(console.error);
    }
  },

  fetchFavorites: async () => {
    try {
      const response = await apiClient.get<string[]>('/user/favorites');
      
      set({ favoriteApis: response.data });
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  },

  // Actions utilitaires
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setSearching: (searching: boolean) => {
    set({ isSearching: searching });
  },
}));