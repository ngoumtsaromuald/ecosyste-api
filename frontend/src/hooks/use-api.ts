import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCatalogStore } from '@/lib/stores/catalog';
import { ApiEndpoint, ApiCategory, SearchResult, SearchFilters } from '@/lib/types';
import apiClient from '@/lib/api/client';

/**
 * Hook pour récupérer toutes les API
 */
export function useApis() {
  return useQuery({
    queryKey: ['apis'],
    queryFn: async () => {
      const response = await apiClient.get<ApiEndpoint[]>('/apis');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour récupérer une API spécifique
 */
export function useApi(apiId: string) {
  return useQuery({
    queryKey: ['api', apiId],
    queryFn: async () => {
      const response = await apiClient.get<ApiEndpoint>(`/apis/${apiId}`);
      return response.data;
    },
    enabled: !!apiId,
  });
}

/**
 * Hook pour récupérer les catégories d'API
 */
export function useApiCategories() {
  return useQuery({
    queryKey: ['api-categories'],
    queryFn: async () => {
      const response = await apiClient.get<ApiCategory[]>('/apis/categories');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook pour récupérer les API en vedette
 */
export function useFeaturedApis() {
  return useQuery({
    queryKey: ['featured-apis'],
    queryFn: async () => {
      const response = await apiClient.get<ApiEndpoint[]>('/apis/featured');
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook pour la recherche d'API
 */
export function useSearchApis(query: string, filters: SearchFilters = {}) {
  return useQuery({
    queryKey: ['search-apis', query, filters],
    queryFn: async () => {
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
      return response.data;
    },
    enabled: !!query || Object.keys(filters).length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour récupérer les API favorites de l'utilisateur
 */
export function useFavoriteApis() {
  return useQuery({
    queryKey: ['favorite-apis'],
    queryFn: async () => {
      const response = await apiClient.get<ApiEndpoint[]>('/user/favorites');
      return response.data;
    },
  });
}

/**
 * Hook pour gérer les favoris (ajouter/supprimer)
 */
export function useFavoriteMutation() {
  const queryClient = useQueryClient();
  const { toggleFavorite } = useCatalogStore();

  const addToFavorites = useMutation({
    mutationFn: async (apiId: string) => {
      const response = await apiClient.post(`/user/favorites/${apiId}`);
      return response.data;
    },
    onSuccess: (_, apiId) => {
      // Mettre à jour le store local
      toggleFavorite(apiId);
      // Invalider les requêtes liées aux favoris
      queryClient.invalidateQueries({ queryKey: ['favorite-apis'] });
    },
  });

  const removeFromFavorites = useMutation({
    mutationFn: async (apiId: string) => {
      const response = await apiClient.delete(`/user/favorites/${apiId}`);
      return response.data;
    },
    onSuccess: (_, apiId) => {
      // Mettre à jour le store local
      toggleFavorite(apiId);
      // Invalider les requêtes liées aux favoris
      queryClient.invalidateQueries({ queryKey: ['favorite-apis'] });
    },
  });

  return {
    addToFavorites,
    removeFromFavorites,
  };
}

/**
 * Hook pour récupérer les statistiques du dashboard
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/user/dashboard/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour récupérer l'historique d'utilisation des API
 */
export function useApiUsageHistory() {
  return useQuery({
    queryKey: ['api-usage-history'],
    queryFn: async () => {
      const response = await apiClient.get('/user/api-usage');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook pour récupérer les recommandations d'API
 */
export function useApiRecommendations() {
  return useQuery({
    queryKey: ['api-recommendations'],
    queryFn: async () => {
      const response = await apiClient.get<ApiEndpoint[]>('/apis/recommendations');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}