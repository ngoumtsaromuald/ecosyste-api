import { Prisma, ApiResource } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';
import { ApiResourceDomain } from '../domain/models/api-resource-domain';
import { ResourceStatus, ResourceType, ResourcePlan } from '../domain/enums';
import { PaginationOptions } from './types';
export interface ApiResourceFindManyParams {
    where?: Prisma.ApiResourceWhereInput;
    include?: Prisma.ApiResourceInclude;
    orderBy?: Prisma.ApiResourceOrderByWithRelationInput | Prisma.ApiResourceOrderByWithRelationInput[];
    take?: number;
    skip?: number;
}
export interface CreateApiResourceData {
    userId: string;
    name: string;
    slug: string;
    description?: string | null;
    resourceType: ResourceType;
    categoryId: string;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    status?: ResourceStatus;
    plan?: ResourcePlan;
    verified?: boolean;
    metaTitle?: string | null;
    metaDescription?: string | null;
}
export interface UpdateApiResourceData {
    name?: string;
    slug?: string;
    description?: string | null;
    resourceType?: ResourceType;
    categoryId?: string;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    status?: ResourceStatus;
    plan?: ResourcePlan;
    verified?: boolean;
    metaTitle?: string | null;
    metaDescription?: string | null;
    publishedAt?: Date | null;
}
export interface SearchFilters {
    name?: string;
    categoryId?: string;
    status?: ResourceStatus;
    plan?: ResourcePlan;
    resourceType?: ResourceType;
    verified?: boolean;
    city?: string;
    region?: string;
    country?: string;
    userId?: string;
}
export declare class ApiResourceRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMany(params: ApiResourceFindManyParams): Promise<ApiResource[]>;
    findById(id: string, include?: Prisma.ApiResourceInclude): Promise<ApiResource | null>;
    findBySlug(slug: string, include?: Prisma.ApiResourceInclude): Promise<ApiResource | null>;
    create(data: CreateApiResourceData): Promise<ApiResource>;
    update(id: string, data: UpdateApiResourceData): Promise<ApiResource>;
    softDelete(id: string): Promise<ApiResource>;
    hardDelete(id: string): Promise<ApiResource>;
    count(where?: Prisma.ApiResourceWhereInput): Promise<number>;
    search(filters: SearchFilters, pagination?: PaginationOptions): Promise<{
        resources: ApiResource[];
        total: number;
    }>;
    findByUserId(userId: string, pagination?: PaginationOptions): Promise<{
        resources: ApiResource[];
        total: number;
    }>;
    findByCategory(categoryId: string, pagination?: PaginationOptions): Promise<{
        resources: ApiResource[];
        total: number;
    }>;
    findNearLocation(latitude: number, longitude: number, radiusKm?: number, pagination?: PaginationOptions): Promise<{
        resources: ApiResource[];
        total: number;
    }>;
    isSlugUnique(slug: string, excludeId?: string): Promise<boolean>;
    bulkCreate(data: CreateApiResourceData[]): Promise<Prisma.BatchPayload>;
    getStatistics(): Promise<{
        total: number;
        byStatus: Record<ResourceStatus, number>;
        byPlan: Record<ResourcePlan, number>;
        byType: Record<ResourceType, number>;
        recentCount: number;
    }>;
    toDomain(resource: ApiResource): ApiResourceDomain;
    fromDomain(domain: ApiResourceDomain): CreateApiResourceData;
}
