import type { ApiResponse, ApiErrorResponse, PaginatedResponse, ApiResourceResponse, CreateApiResourceRequest, UpdateApiResourceRequest, IngestApiResourcesRequest, CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest, FindApiResourcesQuery, SearchApiResourcesQuery, FindCategoriesQuery } from './api-utils';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export interface RequestConfig {
    method: HttpMethod;
    url: string;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
    timeout?: number;
}
export interface ApiClient {
    request<T = any>(config: RequestConfig): Promise<ApiResponse<T>>;
    get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
    post<T = any>(url: string, data?: any): Promise<ApiResponse<T>>;
    put<T = any>(url: string, data?: any): Promise<ApiResponse<T>>;
    delete<T = any>(url: string): Promise<ApiResponse<T>>;
    setAuthToken(token: string): void;
    clearAuthToken(): void;
}
export interface ApiResourcesEndpoints {
    getApiResources(query?: FindApiResourcesQuery): Promise<PaginatedResponse<ApiResourceResponse>>;
    createApiResource(data: CreateApiResourceRequest): Promise<ApiResponse<ApiResourceResponse>>;
    getApiResourceById(id: string): Promise<ApiResponse<ApiResourceResponse>>;
    updateApiResource(id: string, data: UpdateApiResourceRequest): Promise<ApiResponse<ApiResourceResponse>>;
    deleteApiResource(id: string): Promise<ApiResponse<void>>;
    ingestApiResources(data: IngestApiResourcesRequest): Promise<ApiResponse<any>>;
    searchApiResources(query: SearchApiResourcesQuery): Promise<PaginatedResponse<ApiResourceResponse>>;
    getApiResourcesByUser(userId: string, query?: FindApiResourcesQuery): Promise<PaginatedResponse<ApiResourceResponse>>;
    getApiResourcesByCategory(categoryId: string, query?: FindApiResourcesQuery): Promise<PaginatedResponse<ApiResourceResponse>>;
    getApiResourceBySlug(slug: string): Promise<ApiResponse<ApiResourceResponse>>;
    getApiResourcesStatistics(): Promise<ApiResponse<any>>;
}
export interface CategoriesEndpoints {
    getCategories(query?: FindCategoriesQuery): Promise<ApiResponse<CategoryResponse[]>>;
    createCategory(data: CreateCategoryRequest): Promise<ApiResponse<CategoryResponse>>;
    getCategoryById(id: string): Promise<ApiResponse<CategoryResponse>>;
    updateCategory(id: string, data: UpdateCategoryRequest): Promise<ApiResponse<CategoryResponse>>;
    deleteCategory(id: string): Promise<ApiResponse<void>>;
}
export interface HealthEndpoints {
    getHealth(): Promise<ApiResponse<any>>;
    getMetrics(): Promise<string>;
}
export interface RomapiClient extends ApiClient {
    apiResources: ApiResourcesEndpoints;
    categories: CategoriesEndpoints;
    health: HealthEndpoints;
}
export type ApiError = ApiErrorResponse['error'];
export interface ApiClientError extends Error {
    status?: number;
    code?: string;
    response?: ApiErrorResponse;
}
export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    authToken?: string;
    retries?: number;
    retryDelay?: number;
}
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor<T = any> = (response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
export type ErrorInterceptor = (error: ApiClientError) => Promise<never> | ApiClientError;
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
export interface ExtendedApiClient extends RomapiClient {
    interceptors: InterceptorManager;
    defaults: ApiClientConfig;
}
export type CreateApiClient = (config: ApiClientConfig) => ExtendedApiClient;
export type UnwrapApiResponse<T> = T extends ApiResponse<infer U> ? U : T;
export type UnwrapPaginatedResponse<T> = T extends PaginatedResponse<infer U> ? U[] : T;
export type EndpointParams<T> = T extends (...args: infer P) => any ? P : never;
export type EndpointReturn<T> = T extends (...args: any[]) => infer R ? R : never;
