/**
 * Example usage of generated TypeScript types
 * This file demonstrates how to use the generated types in a client application
 */

import type {
  ApiResourceResponse,
  CreateApiResourceRequest,
  CategoryResponse,
  ApiResponse,
  PaginatedResponse,
  ResourceType,
  ResourceStatus,
  FindApiResourcesQuery
} from '../src/types/api-utils';

import { TypeValidators } from '../src/types/validators';
import type { RomapiClient, ApiClientConfig } from '../src/types/client';

// Example 1: Type-safe API client implementation
class ExampleApiClient implements RomapiClient {
  private baseURL: string;
  private authToken?: string;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.authToken = config.authToken;
  }

  // Implement required methods from RomapiClient interface
  async request<T = any>(config: any): Promise<ApiResponse<T>> {
    // Implementation would go here
    throw new Error('Not implemented');
  }

  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    // Implementation would go here
    throw new Error('Not implemented');
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    // Implementation would go here
    throw new Error('Not implemented');
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    // Implementation would go here
    throw new Error('Not implemented');
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    // Implementation would go here
    throw new Error('Not implemented');
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = undefined;
  }

  // API Resources endpoints
  apiResources = {
    async getApiResources(query?: FindApiResourcesQuery): Promise<PaginatedResponse<ApiResourceResponse>> {
      // Type-safe implementation
      const response = await this.get<ApiResourceResponse[]>('/api-resources', query);
      return response as PaginatedResponse<ApiResourceResponse>;
    },

    async createApiResource(data: CreateApiResourceRequest): Promise<ApiResponse<ApiResourceResponse>> {
      return this.post<ApiResourceResponse>('/api-resources', data);
    },

    async getApiResourceById(id: string): Promise<ApiResponse<ApiResourceResponse>> {
      if (!TypeValidators.isUUID(id)) {
        throw new Error('Invalid UUID format');
      }
      return this.get<ApiResourceResponse>(`/api-resources/${id}`);
    },

    // ... other methods would be implemented similarly
  };

  // Categories endpoints
  categories = {
    async getCategories(): Promise<ApiResponse<CategoryResponse[]>> {
      return this.get<CategoryResponse[]>('/categories');
    },

    // ... other methods would be implemented similarly
  };

  // Health endpoints
  health = {
    async getHealth(): Promise<ApiResponse<any>> {
      return this.get<any>('/health');
    },

    async getMetrics(): Promise<string> {
      const response = await this.get<string>('/metrics');
      return response.data;
    }
  };
}

// Example 2: Type-safe data handling
function handleApiResource(resource: ApiResourceResponse): void {
  // TypeScript knows the exact shape of the resource
  console.log(`Resource: ${resource.name} (${resource.resourceType})`);
  
  // Type checking with validators
  if (TypeValidators.isResourceStatus(resource.status)) {
    console.log(`Status: ${resource.status}`);
  }

  // Optional properties are properly typed
  if (resource.address) {
    console.log(`Location: ${resource.address.city}, ${resource.address.country}`);
  }

  // Arrays are properly typed
  resource.images.forEach(image => {
    console.log(`Image: ${image.url} (Primary: ${image.isPrimary})`);
  });
}

// Example 3: Creating type-safe requests
function createBusinessResource(): CreateApiResourceRequest {
  const resourceData: CreateApiResourceRequest = {
    name: "My Restaurant",
    description: "A great place to eat",
    resourceType: "BUSINESS", // TypeScript ensures this is a valid ResourceType
    categoryId: "123e4567-e89b-12d3-a456-426614174000",
    address: {
      addressLine1: "123 Main Street",
      city: "Yaoundé",
      region: "Centre",
      country: "CM"
    },
    contact: {
      phone: "+237123456789",
      email: "contact@myrestaurant.cm",
      website: "https://myrestaurant.cm"
    }
  };

  return resourceData;
}

// Example 4: Type guards and validation
function processApiResponse(response: unknown): void {
  // Runtime type checking
  if (isApiResponse(response)) {
    console.log('Valid API response:', response.data);
    console.log('Timestamp:', response.timestamp);
  } else if (isApiErrorResponse(response)) {
    console.error('API Error:', response.error.message);
    console.error('Error Code:', response.error.code);
  } else {
    console.error('Unknown response format');
  }
}

// Type guard functions (would be imported from api-utils)
function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return typeof obj === 'object' && obj !== null && 'success' in obj && 'data' in obj && 'timestamp' in obj;
}

function isApiErrorResponse(obj: any): obj is any {
  return typeof obj === 'object' && obj !== null && obj.success === false && 'error' in obj;
}

// Example 5: Working with enums
function filterByResourceType(resources: ApiResourceResponse[], type: ResourceType): ApiResourceResponse[] {
  return resources.filter(resource => resource.resourceType === type);
}

// Example 6: Query building with type safety
function buildSearchQuery(): FindApiResourcesQuery {
  const query: FindApiResourcesQuery = {
    search: "restaurant",
    resourceType: "BUSINESS",
    status: "ACTIVE",
    city: "Yaoundé",
    limit: 20,
    offset: 0,
    sortBy: "name",
    sortOrder: "asc"
  };

  return query;
}

// Example 7: Error handling with types
async function handleApiCall(): Promise<void> {
  const client = new ExampleApiClient({
    baseURL: 'https://api.romapi.com',
    authToken: 'your-jwt-token'
  });

  try {
    const response = await client.apiResources.getApiResources();
    
    if (response.success) {
      response.data.forEach(handleApiResource);
    }
  } catch (error) {
    if (isApiErrorResponse(error)) {
      console.error(`API Error ${error.error.code}: ${error.error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 8: Pagination handling
async function loadAllResources(client: ExampleApiClient): Promise<ApiResourceResponse[]> {
  const allResources: ApiResourceResponse[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await client.apiResources.getApiResources({
      limit,
      offset,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    if (!response.success || response.data.length === 0) {
      break;
    }

    allResources.push(...response.data);
    offset += limit;

    // Check if we've loaded all resources (assuming meta is available)
    // if (response.meta && offset >= response.meta.total) {
    //   break;
    // }
  }

  return allResources;
}

export {
  ExampleApiClient,
  handleApiResource,
  createBusinessResource,
  processApiResponse,
  filterByResourceType,
  buildSearchQuery,
  handleApiCall,
  loadAllResources
};