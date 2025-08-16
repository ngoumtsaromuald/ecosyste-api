import type { paths, components } from './api';
export type ApiPaths = paths;
export type ApiComponents = components;
export type ApiSchemas = components['schemas'];
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    timestamp: string;
}
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        timestamp: string;
        path: string;
        method: string;
    };
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
    meta: PaginationMeta;
}
export type GetApiResources = paths['/api-resources']['get'];
export type CreateApiResource = paths['/api-resources']['post'];
export type GetApiResourceById = paths['/api-resources/{id}']['get'];
export type UpdateApiResource = paths['/api-resources/{id}']['put'];
export type DeleteApiResource = paths['/api-resources/{id}']['delete'];
export type IngestApiResources = paths['/api-resources/ingest']['post'];
export type SearchApiResources = paths['/api-resources/search']['get'];
export type GetCategories = paths['/categories']['get'];
export type CreateCategory = paths['/categories']['post'];
export type GetCategoryById = paths['/categories/{id}']['get'];
export type UpdateCategory = paths['/categories/{id}']['put'];
export type DeleteCategory = paths['/categories/{id}']['delete'];
export type ApiResourceResponse = ApiSchemas['ApiResourceResponseDto'];
export type CreateApiResourceRequest = ApiSchemas['CreateApiResourceDto'];
export type UpdateApiResourceRequest = ApiSchemas['UpdateApiResourceDto'];
export type IngestApiResourcesRequest = ApiSchemas['IngestApiResourcesDto'];
export type CategoryResponse = ApiSchemas['CategoryResponseDto'];
export type CreateCategoryRequest = ApiSchemas['CreateCategoryDto'];
export type UpdateCategoryRequest = ApiSchemas['UpdateCategoryDto'];
export type FindApiResourcesQuery = GetApiResources['parameters']['query'];
export type SearchApiResourcesQuery = SearchApiResources['parameters']['query'];
export type FindCategoriesQuery = GetCategories['parameters']['query'];
export type ApiResourceIdParam = GetApiResourceById['parameters']['path'];
export type CategoryIdParam = GetCategoryById['parameters']['path'];
export type ResourceType = ApiSchemas['ResourceTypeDto']['value'];
export type ResourceStatus = ApiSchemas['ResourceStatusDto']['value'];
export type ResourcePlan = ApiSchemas['ResourcePlanDto']['value'];
export type UserType = ApiSchemas['UserTypeDto']['value'];
export type Plan = ApiSchemas['PlanDto']['value'];
export type PricingTier = ApiSchemas['PricingTierDto']['value'];
export type ResponseData<T> = T extends {
    responses: {
        200: {
            content: {
                'application/json': infer R;
            };
        };
    };
} ? R extends ApiResponse<infer D> ? D : R : never;
export type RequestBody<T> = T extends {
    requestBody: {
        content: {
            'application/json': infer R;
        };
    };
} ? R : never;
export declare function isApiResponse<T>(obj: any): obj is ApiResponse<T>;
export declare function isApiErrorResponse(obj: any): obj is ApiErrorResponse;
export declare function isPaginatedResponse<T>(obj: any): obj is PaginatedResponse<T>;
