import { ResourceType, ResourceStatus, ResourcePlan } from '../domain/enums';
export declare class FindApiResourcesDto {
    search?: string;
    resourceType?: ResourceType;
    status?: ResourceStatus;
    plan?: ResourcePlan;
    categoryId?: string;
    city?: string;
    region?: string;
    country?: string;
    verified?: boolean;
    latitude?: number;
    longitude?: number;
    radius?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'publishedAt';
    sortOrder?: 'asc' | 'desc';
}
