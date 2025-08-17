import { Injectable } from '@nestjs/common';
import { Prisma, ApiKey } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';
import { PaginationOptions } from './types';

export interface ApiKeyFindManyParams {
  where?: Prisma.ApiKeyWhereInput;
  include?: Prisma.ApiKeyInclude;
  orderBy?: Prisma.ApiKeyOrderByWithRelationInput | Prisma.ApiKeyOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface CreateApiKeyData {
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions?: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

export interface UpdateApiKeyData {
  name?: string;
  permissions?: string[];
  rateLimit?: number;
  isActive?: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

export interface ApiKeyFilters {
  userId?: string;
  isActive?: boolean;
  name?: string;
  hasExpired?: boolean;
  permissions?: string[];
}

export interface ApiKeyWithUser extends ApiKey {
  user?: {
    id: string;
    email: string;
    name: string;
    userType: string;
    plan: string;
  };
}

@Injectable()
export class ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find multiple API keys with optional filters
   */
  async findMany(params: ApiKeyFindManyParams): Promise<ApiKey[]> {
    return this.prisma.apiKey.findMany(params);
  }

  /**
   * Find API key by ID
   */
  async findById(id: string, include?: Prisma.ApiKeyInclude): Promise<ApiKey | null> {
    return this.prisma.apiKey.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find API key by prefix (for validation)
   */
  async findByPrefix(keyPrefix: string, include?: Prisma.ApiKeyInclude): Promise<ApiKeyWithUser | null> {
    return this.prisma.apiKey.findFirst({
      where: { 
        keyPrefix,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            plan: true,
          },
        },
        ...include,
      },
    }) as Promise<ApiKeyWithUser | null>;
  }

  /**
   * Find API key by ID and user ID (for user-specific operations)
   */
  async findByIdAndUserId(id: string, userId: string, include?: Prisma.ApiKeyInclude): Promise<ApiKey | null> {
    return this.prisma.apiKey.findFirst({
      where: { 
        id,
        userId,
      },
      include,
    });
  }

  /**
   * Find all API keys for a specific user
   */
  async findByUserId(
    userId: string, 
    pagination: PaginationOptions = {},
    includeInactive: boolean = false
  ): Promise<{ apiKeys: ApiKey[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    const where: Prisma.ApiKeyWhereInput = { 
      userId,
      ...(includeInactive ? {} : { isActive: true }),
    };

    const [apiKeys, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.apiKey.count({ where }),
    ]);

    return { apiKeys, total };
  }

  /**
   * Create a new API key
   */
  async create(data: CreateApiKeyData): Promise<ApiKey> {
    return this.prisma.apiKey.create({
      data: {
        ...data,
        permissions: data.permissions || [],
        rateLimit: data.rateLimit || 1000,
      },
    });
  }

  /**
   * Update an existing API key
   */
  async update(id: string, data: UpdateApiKeyData): Promise<ApiKey> {
    return this.prisma.apiKey.update({
      where: { id },
      data,
    });
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(id: string): Promise<ApiKey> {
    return this.prisma.apiKey.update({
      where: { id },
      data: {
        lastUsedAt: new Date(),
      },
    });
  }

  /**
   * Deactivate an API key (soft delete)
   */
  async deactivate(id: string): Promise<ApiKey> {
    return this.prisma.apiKey.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Reactivate an API key
   */
  async reactivate(id: string): Promise<ApiKey> {
    return this.prisma.apiKey.update({
      where: { id },
      data: {
        isActive: true,
      },
    });
  }

  /**
   * Delete an API key (hard delete - use with caution)
   */
  async delete(id: string): Promise<ApiKey> {
    return this.prisma.apiKey.delete({
      where: { id },
    });
  }

  /**
   * Search API keys with filters
   */
  async search(
    filters: ApiKeyFilters,
    pagination: PaginationOptions = {},
  ): Promise<{ apiKeys: ApiKey[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    const where: Prisma.ApiKeyWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters.hasExpired !== undefined) {
      if (filters.hasExpired) {
        where.expiresAt = {
          lt: new Date(),
        };
      } else {
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ];
      }
    }

    if (filters.permissions && filters.permissions.length > 0) {
      // For JSON array search, we need to use path for PostgreSQL
      where.permissions = {
        path: filters.permissions,
      } as any;
    }

    const [apiKeys, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.apiKey.count({ where }),
    ]);

    return { apiKeys, total };
  }

  /**
   * Get expired API keys
   */
  async getExpiredKeys(): Promise<ApiKey[]> {
    return this.prisma.apiKey.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Get API keys expiring soon
   */
  async getKeysExpiringSoon(daysAhead: number = 7): Promise<ApiKey[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.apiKey.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gte: new Date(),
          lte: futureDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Bulk deactivate API keys
   */
  async bulkDeactivate(keyIds: string[]): Promise<Prisma.BatchPayload> {
    return this.prisma.apiKey.updateMany({
      where: {
        id: {
          in: keyIds,
        },
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Deactivate all expired keys
   */
  async deactivateExpiredKeys(): Promise<Prisma.BatchPayload> {
    return this.prisma.apiKey.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Get API key statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
    recentCount: number;
    avgRateLimit: number;
    topUsers: Array<{ userId: string; count: number; userName: string }>;
  }> {
    const now = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      total,
      active,
      inactive,
      expired,
      recentCount,
      avgRateLimit,
    ] = await Promise.all([
      this.prisma.apiKey.count(),
      this.prisma.apiKey.count({ where: { isActive: true } }),
      this.prisma.apiKey.count({ where: { isActive: false } }),
      this.prisma.apiKey.count({
        where: {
          isActive: true,
          expiresAt: { lt: now },
        },
      }),
      this.prisma.apiKey.count({
        where: {
          createdAt: { gte: weekAgo },
        },
      }),
      this.prisma.apiKey.aggregate({
        _avg: { rateLimit: true },
      }),
    ]);

    // Get top users by counting API keys manually
    const topUsersRaw = await this.prisma.$queryRaw<Array<{ userId: string; count: bigint }>>`
      SELECT "userId", COUNT(*) as count
      FROM "api_keys"
      GROUP BY "userId"
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get user names for top users
    const userIds = topUsersRaw.map(u => u.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const topUsersWithNames = topUsersRaw.map(stat => ({
      userId: stat.userId,
      count: Number(stat.count),
      userName: users.find(u => u.id === stat.userId)?.name || 'Unknown',
    }));

    return {
      total,
      active,
      inactive,
      expired,
      recentCount,
      avgRateLimit: Math.round((avgRateLimit._avg.rateLimit || 0) * 100) / 100,
      topUsers: topUsersWithNames,
    };
  }

  /**
   * Get most used API keys
   */
  async getMostUsedKeys(limit: number = 10): Promise<ApiKey[]> {
    return this.prisma.apiKey.findMany({
      where: {
        isActive: true,
        lastUsedAt: { not: null },
      },
      orderBy: { lastUsedAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get unused API keys (never used or not used recently)
   */
  async getUnusedKeys(daysThreshold: number = 30): Promise<ApiKey[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    return this.prisma.apiKey.findMany({
      where: {
        isActive: true,
        OR: [
          { lastUsedAt: null },
          { lastUsedAt: { lt: thresholdDate } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Update API key permissions
   */
  async updatePermissions(id: string, permissions: string[]): Promise<ApiKey> {
    return this.prisma.apiKey.update({
      where: { id },
      data: { permissions },
    });
  }

  /**
   * Update API key rate limit
   */
  async updateRateLimit(id: string, rateLimit: number): Promise<ApiKey> {
    return this.prisma.apiKey.update({
      where: { id },
      data: { rateLimit },
    });
  }

  /**
   * Check if API key name is unique for user
   */
  async isNameUniqueForUser(userId: string, name: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ApiKeyWhereInput = { 
      userId,
      name,
      isActive: true,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.apiKey.count({ where });
    return count === 0;
  }
}