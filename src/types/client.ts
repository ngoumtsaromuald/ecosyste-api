/**
 * API client types for ROMAPI Backend Core
 * Generated automatically - do not edit manually
 */

import type { 
  ApiResponse, 
  ApiErrorResponse, 
  PaginatedResponse,
  ApiResourceResponse,
  CreateApiResourceRequest,
  UpdateApiResourceRequest,
  IngestApiResourcesRequest,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  FindApiResourcesQuery,
  SearchApiResourcesQuery,
  FindCategoriesQuery
} from './api-utils';

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

// API client interface
export interface ApiClient {
  // Base request method
  request<T = any>(config: RequestConfig): Promise<ApiResponse<T>>;
  
  // Convenience methods
  get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
  post<T = any>(url: string, data?: any): Promise<ApiResponse<T>>;
  put<T = any>(url: string, data?: any): Promise<ApiResponse<T>>;
  delete<T = any>(url: string): Promise<ApiResponse<T>>;
  
  // Authentication
  setAuthToken(token: string): void;
  clearAuthToken(): void;
}

// API Resources endpoints
export interface ApiResourcesEndpoints {
  // GET /api-resources
  getApiResources(query?: FindApiResourcesQuery): Promise<PaginatedResponse<ApiResourceResponse>>;
  
  // POST /api-resources
  createApiResource(data: CreateApiResourceRequest): Promise<ApiResponse<ApiResourceResponse>>;
  
  // GET /api-resources/{id}
  getApiResourceById(id: string): Promise<ApiResponse<ApiResourceResponse>>;
  
  // PUT /api-resources/{id}
  updateApiResource(id: string, data: UpdateApiResourceRequest): Promise<ApiResponse<ApiResourceResponse>>;
  
  // DELETE /api-resources/{id}
  deleteApiResource(id: string): Promise<ApiResponse<void>>;
  
  // POST /api-resources/ingest
  ingestApiResources(data: IngestApiResourcesRequest): Promise<ApiResponse<any>>;
  
  // GET /api-resources/search
  searchApiResources(query: SearchApiResourcesQuery): Promise<PaginatedResponse<ApiResourceResponse>>;
  
  // GET /api-resources/by-user/{userId}
  getApiResourcesByUser(userId: string, query?: FindApiResourcesQuery): Promise<PaginatedResponse<ApiResourceResponse>>;
  
  // GET /api-resources/by-category/{categoryId}
  getApiResourcesByCategory(categoryId: string, query?: FindApiResourcesQuery): Promise<PaginatedResponse<ApiResourceResponse>>;
  
  // GET /api-resources/by-slug/{slug}
  getApiResourceBySlug(slug: string): Promise<ApiResponse<ApiResourceResponse>>;
  
  // GET /api-resources/statistics
  getApiResourcesStatistics(): Promise<ApiResponse<any>>;
}

// Categories endpoints
export interface CategoriesEndpoints {
  // GET /categories
  getCategories(query?: FindCategoriesQuery): Promise<ApiResponse<CategoryResponse[]>>;
  
  // POST /categories
  createCategory(data: CreateCategoryRequest): Promise<ApiResponse<CategoryResponse>>;
  
  // GET /categories/{id}
  getCategoryById(id: string): Promise<ApiResponse<CategoryResponse>>;
  
  // PUT /categories/{id}
  updateCategory(id: string, data: UpdateCategoryRequest): Promise<ApiResponse<CategoryResponse>>;
  
  // DELETE /categories/{id}
  deleteCategory(id: string): Promise<ApiResponse<void>>;
}

// Health endpoints
export interface HealthEndpoints {
  // GET /health
  getHealth(): Promise<ApiResponse<any>>;
  
  // GET /metrics
  getMetrics(): Promise<string>;
}

// Complete API interface
export interface RomapiClient extends ApiClient {
  apiResources: ApiResourcesEndpoints;
  categories: CategoriesEndpoints;
  health: HealthEndpoints;
}

// Error types
export type ApiError = ApiErrorResponse['error'];

export interface ApiClientError extends Error {
  status?: number;
  code?: string;
  response?: ApiErrorResponse;
}

// Configuration types
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  authToken?: string;
  retries?: number;
  retryDelay?: number;
}

// Request interceptor types
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor<T = any> = (response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
export type ErrorInterceptor = (error: ApiClientError) => Promise<never> | ApiClientError;

// Interceptor management
export interface InterceptorManager {
  request: {
    use(interceptor: RequestInterceptor): number;
    eject(id: number): void;
  };
  response: {
    use<T = any>(interceptor: ResponseInterceptor<T>, errorInterceptor?: ErrorInterceptor): number;
    eject(id: number): void;
  };
}

// Extended API client with interceptors
export interface ExtendedApiClient extends RomapiClient {
  interceptors: InterceptorManager;
  defaults: ApiClientConfig;
}

// Factory function type
export type CreateApiClient = (config: ApiClientConfig) => ExtendedApiClient;

// Utility types for working with API responses
export type UnwrapApiResponse<T> = T extends ApiResponse<infer U> ? U : T;
export type UnwrapPaginatedResponse<T> = T extends PaginatedResponse<infer U> ? U[] : T;

// Type helpers for endpoint parameters
export type EndpointParams<T> = T extends (...args: infer P) => any ? P : never;
export type EndpointReturn<T> = T extends (...args: any[]) => infer R ? R : never;
