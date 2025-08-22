// Types de base pour l'application ECOSYSTE

// Types d'authentification
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'individual' | 'enterprise';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Types pour les API
export interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  version: string;
  baseUrl: string;
  documentation: string;
  pricing: 'free' | 'freemium' | 'paid';
  rating: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

// Types pour la recherche
export interface SearchFilters {
  category?: string;
  pricing?: string[];
  rating?: number;
  tags?: string[];
}

export interface SearchResult {
  apis: ApiEndpoint[];
  total: number;
  page: number;
  limit: number;
  filters: SearchFilters;
}

// Types pour les dashboards
export interface DashboardStats {
  totalApis: number;
  favoriteApis: number;
  recentSearches: number;
  apiUsage: number;
}

export interface ApiUsage {
  apiId: string;
  apiName: string;
  requests: number;
  lastUsed: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Types d'erreur
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}