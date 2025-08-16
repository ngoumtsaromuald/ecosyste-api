#!/usr/bin/env ts-node

/**
 * Script to generate TypeScript types from OpenAPI specification
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

async function generateTypes() {
  console.log('🔧 Generating TypeScript types from OpenAPI specification...');

  try {
    // Create the NestJS application
    const app = await NestFactory.create(AppModule, { logger: false });

    // Configure Swagger with the same configuration as main.ts
    const config = new DocumentBuilder()
      .setTitle('ROMAPI Backend Core')
      .setDescription(`
        Backend API Core for ROMAPI ecosystem - A comprehensive API for managing business resources, categories, and services.
        
        ## Features
        - **API Resources Management**: Create, read, update, and delete business resources
        - **Category Management**: Hierarchical category system with full CRUD operations
        - **Advanced Search**: Full-text search with location-based filtering
        - **Bulk Operations**: Efficient bulk ingestion with validation and error reporting
        - **Caching**: Redis-based caching for optimal performance
        - **Rate Limiting**: Built-in rate limiting for API protection
        
        ## Authentication
        Most endpoints require Bearer token authentication. Use the 'Authorize' button to set your token.
        
        ## Rate Limits
        - Anonymous: 100 requests per hour
        - Authenticated: 1000 requests per hour
        - Bulk operations: 10 requests per hour
        
        ## Response Format
        All responses follow a standard format:
        \`\`\`json
        {
          "success": true,
          "data": { ... },
          "timestamp": "2024-01-15T10:30:00Z"
        }
        \`\`\`
      `)
      .setVersion('1.0.0')
      .setContact(
        'ROMAPI Support',
        'https://romapi.com/support',
        'support@romapi.com'
      )
      .setLicense(
        'MIT License',
        'https://opensource.org/licenses/MIT'
      )
      .addServer('http://localhost:3000', 'Development Server')
      .addServer('https://api-dev.romapi.com', 'Development Environment')
      .addServer('https://api.romapi.com', 'Production Environment')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth'
      )
      .addTag('Health', 'Health check and system status endpoints')
      .addTag('API Resources', 'Manage business resources, services, and data entries')
      .addTag('Categories', 'Hierarchical category management system')
      .build();

    // Generate the OpenAPI document
    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => {
        // Create unique operation IDs by combining controller and method names
        const controllerName = controllerKey.replace('Controller', '').toLowerCase();
        return `${controllerName}_${methodKey}`;
      },
      deepScanRoutes: true,
    });

    // Ensure dist directory exists
    const distDir = join(__dirname, '../dist');
    if (!existsSync(distDir)) {
      mkdirSync(distDir, { recursive: true });
    }

    // Save the OpenAPI document
    const openApiPath = join(distDir, 'openapi.json');
    writeFileSync(openApiPath, JSON.stringify(document, null, 2));
    console.log(`📄 OpenAPI specification saved to: ${openApiPath}`);

    // Ensure types directory exists
    const typesDir = join(__dirname, '../src/types');
    if (!existsSync(typesDir)) {
      mkdirSync(typesDir, { recursive: true });
    }

    // Generate TypeScript types using openapi-typescript
    const typesPath = join(typesDir, 'api.ts');
    console.log('🔄 Generating TypeScript types...');
    
    try {
      execSync(`npx openapi-typescript "${openApiPath}" --output "${typesPath}"`, {
        stdio: 'inherit',
        cwd: join(__dirname, '..')
      });
      console.log(`✅ TypeScript types generated at: ${typesPath}`);
    } catch (error) {
      console.error('❌ Error generating TypeScript types:', error);
      throw error;
    }

    // Generate additional utility types and helpers
    const utilsPath = join(typesDir, 'api-utils.ts');
    const utilsContent = generateUtilityTypes();
    writeFileSync(utilsPath, utilsContent);
    console.log(`🛠️  Utility types generated at: ${utilsPath}`);

    // Generate type validation helpers
    const validatorsPath = join(typesDir, 'validators.ts');
    const validatorsContent = generateValidators(document);
    writeFileSync(validatorsPath, validatorsContent);
    console.log(`🔍 Type validators generated at: ${validatorsPath}`);

    // Generate API client types
    const clientTypesPath = join(typesDir, 'client.ts');
    const clientTypesContent = generateClientTypes(document);
    writeFileSync(clientTypesPath, clientTypesContent);
    console.log(`🌐 API client types generated at: ${clientTypesPath}`);

    await app.close();

    // Generate statistics
    const stats = {
      endpoints: Object.keys(document.paths || {}).length,
      schemas: Object.keys(document.components?.schemas || {}).length,
      tags: document.tags?.length || 0,
    };

    console.log('\n📊 Type Generation Statistics:');
    console.log(`   Endpoints: ${stats.endpoints}`);
    console.log(`   Schemas: ${stats.schemas}`);
    console.log(`   Tags: ${stats.tags}`);
    console.log(`   Generated Files: 4`);

    console.log('\n🎉 TypeScript types generation completed successfully!');
    console.log('\n📋 Generated Files:');
    console.log(`   - ${typesPath} (Main API types)`);
    console.log(`   - ${utilsPath} (Utility types)`);
    console.log(`   - ${validatorsPath} (Type validators)`);
    console.log(`   - ${clientTypesPath} (API client types)`);

  } catch (error) {
    console.error('❌ Error generating TypeScript types:', error);
    process.exit(1);
  }
}

function generateUtilityTypes(): string {
  return `/**
 * Utility types for ROMAPI Backend Core
 * Generated automatically - do not edit manually
 */

import type { paths, components } from './api';

// Extract response types from paths
export type ApiPaths = paths;
export type ApiComponents = components;
export type ApiSchemas = components['schemas'];

// Standard API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  timestamp: string;
}

// Error response type
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

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response wrapper
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Extract operation types
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

// Extract request/response types
export type ApiResourceResponse = ApiSchemas['ApiResourceResponseDto'];
export type CreateApiResourceRequest = ApiSchemas['CreateApiResourceDto'];
export type UpdateApiResourceRequest = ApiSchemas['UpdateApiResourceDto'];
export type IngestApiResourcesRequest = ApiSchemas['IngestApiResourcesDto'];

export type CategoryResponse = ApiSchemas['CategoryResponseDto'];
export type CreateCategoryRequest = ApiSchemas['CreateCategoryDto'];
export type UpdateCategoryRequest = ApiSchemas['UpdateCategoryDto'];

// Query parameter types
export type FindApiResourcesQuery = GetApiResources['parameters']['query'];
export type SearchApiResourcesQuery = SearchApiResources['parameters']['query'];
export type FindCategoriesQuery = GetCategories['parameters']['query'];

// Path parameter types
export type ApiResourceIdParam = GetApiResourceById['parameters']['path'];
export type CategoryIdParam = GetCategoryById['parameters']['path'];

// Enum types
export type ResourceType = ApiSchemas['ResourceTypeDto']['value'];
export type ResourceStatus = ApiSchemas['ResourceStatusDto']['value'];
export type ResourcePlan = ApiSchemas['ResourcePlanDto']['value'];
export type UserType = ApiSchemas['UserTypeDto']['value'];
export type Plan = ApiSchemas['PlanDto']['value'];
export type PricingTier = ApiSchemas['PricingTierDto']['value'];

// Helper type to extract response data from operations
export type ResponseData<T> = T extends { responses: { 200: { content: { 'application/json': infer R } } } }
  ? R extends ApiResponse<infer D>
    ? D
    : R
  : never;

// Helper type to extract request body from operations
export type RequestBody<T> = T extends { requestBody: { content: { 'application/json': infer R } } }
  ? R
  : never;

// Type guards
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return typeof obj === 'object' && obj !== null && 'success' in obj && 'data' in obj && 'timestamp' in obj;
}

export function isApiErrorResponse(obj: any): obj is ApiErrorResponse {
  return typeof obj === 'object' && obj !== null && obj.success === false && 'error' in obj;
}

export function isPaginatedResponse<T>(obj: any): obj is PaginatedResponse<T> {
  return isApiResponse(obj) && 'meta' in obj && typeof obj.meta === 'object';
}
`;
}

function generateValidators(document: any): string {
  const schemas = document.components?.schemas || {};
  const schemaNames = Object.keys(schemas);

  return `/**
 * Type validators for ROMAPI Backend Core
 * Generated automatically - do not edit manually
 */

import type { ApiSchemas } from './api-utils';

// Runtime type validation helpers
export class TypeValidators {
  static isResourceType(value: any): value is ApiSchemas['ResourceTypeDto']['value'] {
    return ['BUSINESS', 'SERVICE', 'DATA', 'API'].includes(value);
  }

  static isResourceStatus(value: any): value is ApiSchemas['ResourceStatusDto']['value'] {
    return ['ACTIVE', 'PENDING', 'SUSPENDED'].includes(value);
  }

  static isResourcePlan(value: any): value is ApiSchemas['ResourcePlanDto']['value'] {
    return ['FREE', 'PREMIUM', 'FEATURED'].includes(value);
  }

  static isUserType(value: any): value is ApiSchemas['UserTypeDto']['value'] {
    return ['INDIVIDUAL', 'BUSINESS', 'ADMIN'].includes(value);
  }

  static isPlan(value: any): value is ApiSchemas['PlanDto']['value'] {
    return ['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE'].includes(value);
  }

  static isPricingTier(value: any): value is ApiSchemas['PricingTierDto']['value'] {
    return ['STANDARD', 'BUSINESS', 'ENTERPRISE'].includes(value);
  }

  static isUUID(value: any): value is string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof value === 'string' && uuidRegex.test(value);
  }

  static isEmail(value: any): value is string {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return typeof value === 'string' && emailRegex.test(value);
  }

  static isUrl(value: any): value is string {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  static isPhoneNumber(value: any): value is string {
    const phoneRegex = /^\\+?[1-9]\\d{1,14}$/;
    return typeof value === 'string' && phoneRegex.test(value.replace(/[\\s-()]/g, ''));
  }

  static isSlug(value: any): value is string {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return typeof value === 'string' && slugRegex.test(value);
  }

  static isLatitude(value: any): value is number {
    return typeof value === 'number' && value >= -90 && value <= 90;
  }

  static isLongitude(value: any): value is number {
    return typeof value === 'number' && value >= -180 && value <= 180;
  }

  static isPostalCode(value: any): value is string {
    // Basic postal code validation (can be extended for specific countries)
    const postalCodeRegex = /^[A-Z0-9\\s-]{3,10}$/i;
    return typeof value === 'string' && postalCodeRegex.test(value);
  }

  static isCountryCode(value: any): value is string {
    // ISO 3166-1 alpha-2 country codes
    const countryCodeRegex = /^[A-Z]{2}$/;
    return typeof value === 'string' && countryCodeRegex.test(value);
  }
}

// Schema validation functions
export const validateApiResource = (data: any): data is ApiSchemas['ApiResourceResponseDto'] => {
  return (
    typeof data === 'object' &&
    data !== null &&
    TypeValidators.isUUID(data.id) &&
    typeof data.name === 'string' &&
    TypeValidators.isSlug(data.slug) &&
    TypeValidators.isResourceType(data.resourceType) &&
    TypeValidators.isUUID(data.categoryId) &&
    TypeValidators.isResourceStatus(data.status) &&
    TypeValidators.isResourcePlan(data.plan) &&
    typeof data.verified === 'boolean' &&
    data.createdAt instanceof Date &&
    data.updatedAt instanceof Date
  );
};

export const validateCategory = (data: any): data is ApiSchemas['CategoryResponseDto'] => {
  return (
    typeof data === 'object' &&
    data !== null &&
    TypeValidators.isUUID(data.id) &&
    typeof data.name === 'string' &&
    TypeValidators.isSlug(data.slug) &&
    data.createdAt instanceof Date
  );
};

export const validateCreateApiResourceRequest = (data: any): data is ApiSchemas['CreateApiResourceDto'] => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    TypeValidators.isResourceType(data.resourceType) &&
    TypeValidators.isUUID(data.categoryId)
  );
};

export const validateCreateCategoryRequest = (data: any): data is ApiSchemas['CreateCategoryDto'] => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    (!data.parentId || TypeValidators.isUUID(data.parentId))
  );
};

// Error validation - using boolean return since ApiErrorResponse is not in schemas
export const validateApiError = (data: any): boolean => {
  return (
    typeof data === 'object' &&
    data !== null &&
    data.success === false &&
    typeof data.error === 'object' &&
    typeof data.error.code === 'string' &&
    typeof data.error.message === 'string' &&
    typeof data.error.timestamp === 'string' &&
    typeof data.error.path === 'string' &&
    typeof data.error.method === 'string'
  );
};
`;
}

function generateClientTypes(document: any): string {
  const paths = document.paths || {};
  const endpoints = Object.keys(paths);

  return `/**
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
`;
}

// Run the generation if this script is executed directly
if (require.main === module) {
  generateTypes();
}

export { generateTypes };