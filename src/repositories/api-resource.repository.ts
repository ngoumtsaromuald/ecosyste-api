import { Injectable } from '@nestjs/common';
import { Prisma, ApiResource } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';
import { ApiResourceDomain } from '../domain/models/api-resource-domain';
import { ResourceStatus, ResourceType, ResourcePlan } from '../domain/enums';
import { Address, Contact, SeoData } from '../domain/value-objects';
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



@Injectable()
export class ApiResourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find multiple API resources with filters and pagination
   */
  async findMany(params: ApiResourceFindManyParams): Promise<ApiResource[]> {
    return this.prisma.apiResource.findMany({
      ...params,
      where: {
        ...params.where,
        deletedAt: null, // Always exclude soft-deleted resources
      },
    });
  }

  /**
   * Find API resource by ID
   */
  async findById(id: string, include?: Prisma.ApiResourceInclude): Promise<ApiResource | null> {
    return this.prisma.apiResource.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include,
    });
  }

  /**
   * Find API resource by slug
   */
  async findBySlug(slug: string, include?: Prisma.ApiResourceInclude): Promise<ApiResource | null> {
    return this.prisma.apiResource.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include,
    });
  }

  /**
   * Create a new API resource
   */
  async create(data: CreateApiResourceData): Promise<ApiResource> {
    return this.prisma.apiResource.create({
      data: {
        ...data,
        status: data.status || ResourceStatus.PENDING,
        plan: data.plan || ResourcePlan.FREE,
        verified: data.verified || false,
        country: data.country || 'CM',
      },
    });
  }

  /**
   * Update an existing API resource
   */
  async update(id: string, data: UpdateApiResourceData): Promise<ApiResource> {
    return this.prisma.apiResource.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete an API resource
   */
  async softDelete(id: string): Promise<ApiResource> {
    return this.prisma.apiResource.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Hard delete an API resource (use with caution)
   */
  async hardDelete(id: string): Promise<ApiResource> {
    return this.prisma.apiResource.delete({
      where: { id },
    });
  }

  /**
   * Count API resources with filters
   */
  async count(where?: Prisma.ApiResourceWhereInput): Promise<number> {
    return this.prisma.apiResource.count({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  /**
   * Search API resources with filters and pagination
   */
  async search(
    filters: SearchFilters,
    pagination: PaginationOptions = {},
  ): Promise<{ resources: ApiResource[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    // Build where clause
    const where: Prisma.ApiResourceWhereInput = {
      deletedAt: null,
    };

    if (filters.name) {
      where.OR = [
        { name: { contains: filters.name, mode: 'insensitive' } },
        { description: { contains: filters.name, mode: 'insensitive' } },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.plan) {
      where.plan = filters.plan;
    }

    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters.verified !== undefined) {
      where.verified = filters.verified;
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.region) {
      where.region = { contains: filters.region, mode: 'insensitive' };
    }

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Execute queries in parallel
    const [resources, total] = await Promise.all([
      this.prisma.apiResource.findMany({
        where,
        include: {
          category: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        orderBy: [
          { plan: 'desc' }, // Featured/Premium first
          { verified: 'desc' }, // Verified first
          { createdAt: 'desc' }, // Newest first
        ],
        take: limit,
        skip: offset,
      }),
      this.prisma.apiResource.count({ where }),
    ]);

    return { resources, total };
  }

  /**
   * Find resources by user ID
   */
  async findByUserId(
    userId: string,
    pagination: PaginationOptions = {},
  ): Promise<{ resources: ApiResource[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    const where: Prisma.ApiResourceWhereInput = {
      userId,
      deletedAt: null,
    };

    const [resources, total] = await Promise.all([
      this.prisma.apiResource.findMany({
        where,
        include: {
          category: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.apiResource.count({ where }),
    ]);

    return { resources, total };
  }

  /**
   * Find resources by category
   */
  async findByCategory(
    categoryId: string,
    pagination: PaginationOptions = {},
  ): Promise<{ resources: ApiResource[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    const where: Prisma.ApiResourceWhereInput = {
      categoryId,
      deletedAt: null,
      status: ResourceStatus.ACTIVE, // Only active resources for public category browsing
    };

    const [resources, total] = await Promise.all([
      this.prisma.apiResource.findMany({
        where,
        include: {
          category: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        orderBy: [
          { plan: 'desc' },
          { verified: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      this.prisma.apiResource.count({ where }),
    ]);

    return { resources, total };
  }

  /**
   * Find resources near a location (requires latitude and longitude)
   */
  async findNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    pagination: PaginationOptions = {},
  ): Promise<{ resources: ApiResource[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    // Calculate bounding box for initial filtering
    const latDelta = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
    const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const where: Prisma.ApiResourceWhereInput = {
      deletedAt: null,
      status: ResourceStatus.ACTIVE,
      latitude: {
        gte: latitude - latDelta,
        lte: latitude + latDelta,
      },
      longitude: {
        gte: longitude - lonDelta,
        lte: longitude + lonDelta,
      },
    };

    // Note: For production, consider using PostGIS for more accurate distance calculations
    const [resources, total] = await Promise.all([
      this.prisma.apiResource.findMany({
        where,
        include: {
          category: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        orderBy: [
          { plan: 'desc' },
          { verified: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      this.prisma.apiResource.count({ where }),
    ]);

    return { resources, total };
  }

  /**
   * Check if slug is unique (excluding a specific resource ID)
   */
  async isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ApiResourceWhereInput = {
      slug,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.apiResource.count({ where });
    return count === 0;
  }

  /**
   * Bulk create API resources (for data ingestion)
   */
  async bulkCreate(data: CreateApiResourceData[]): Promise<Prisma.BatchPayload> {
    return this.prisma.apiResource.createMany({
      data: data.map(item => ({
        ...item,
        status: item.status || ResourceStatus.PENDING,
        plan: item.plan || ResourcePlan.FREE,
        verified: item.verified || false,
        country: item.country || 'CM',
      })),
      skipDuplicates: true, // Skip records with duplicate unique fields
    });
  }

  /**
   * Get statistics for dashboard
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<ResourceStatus, number>;
    byPlan: Record<ResourcePlan, number>;
    byType: Record<ResourceType, number>;
    recentCount: number;
  }> {
    const [
      total,
      statusStats,
      planStats,
      typeStats,
      recentCount,
    ] = await Promise.all([
      this.prisma.apiResource.count({ where: { deletedAt: null } }),
      this.prisma.apiResource.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.apiResource.groupBy({
        by: ['plan'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.apiResource.groupBy({
        by: ['resourceType'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.apiResource.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      total,
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<ResourceStatus, number>),
      byPlan: planStats.reduce((acc, stat) => {
        acc[stat.plan] = stat._count;
        return acc;
      }, {} as Record<ResourcePlan, number>),
      byType: typeStats.reduce((acc, stat) => {
        acc[stat.resourceType] = stat._count;
        return acc;
      }, {} as Record<ResourceType, number>),
      recentCount,
    };
  }

  /**
   * Convert Prisma model to domain model
   */
  toDomain(resource: ApiResource): ApiResourceDomain {
    const address = resource.addressLine1 || resource.city || resource.region
      ? new Address(
          resource.addressLine1 || null,
          resource.addressLine2 || null,
          resource.city || null,
          resource.region || null,
          resource.postalCode || null,
          resource.country || 'CM',
          resource.latitude || null,
          resource.longitude || null,
        )
      : null;

    const contact = resource.phone || resource.email || resource.website
      ? new Contact(
          resource.phone || null,
          resource.email || null,
          resource.website || null,
        )
      : null;

    const seo = resource.metaTitle || resource.metaDescription
      ? new SeoData(
          resource.metaTitle || null,
          resource.metaDescription || null,
        )
      : null;

    return new ApiResourceDomain(
      resource.id,
      resource.userId,
      resource.name,
      resource.slug,
      resource.description,
      resource.resourceType as ResourceType,
      resource.categoryId,
      address,
      contact,
      resource.status as ResourceStatus,
      resource.plan as ResourcePlan,
      resource.verified,
      seo,
      resource.createdAt,
      resource.updatedAt,
      resource.publishedAt,
      resource.deletedAt,
    );
  }

  /**
   * Convert domain model to Prisma data
   */
  fromDomain(domain: ApiResourceDomain): CreateApiResourceData {
    return {
      userId: domain.userId,
      name: domain.name,
      slug: domain.slug,
      description: domain.description,
      resourceType: domain.resourceType,
      categoryId: domain.categoryId,
      addressLine1: domain.address?.addressLine1 || null,
      addressLine2: domain.address?.addressLine2 || null,
      city: domain.address?.city || null,
      region: domain.address?.region || null,
      postalCode: domain.address?.postalCode || null,
      country: domain.address?.country || 'CM',
      latitude: domain.address?.latitude ? domain.address.latitude.toNumber() : null,
      longitude: domain.address?.longitude ? domain.address.longitude.toNumber() : null,
      phone: domain.contact?.phone || null,
      email: domain.contact?.email || null,
      website: domain.contact?.website || null,
      status: domain.status,
      plan: domain.plan,
      verified: domain.verified,
      metaTitle: domain.seo?.metaTitle || null,
      metaDescription: domain.seo?.metaDescription || null,
    };
  }
}