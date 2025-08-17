import { Injectable } from '@nestjs/common';
import { Prisma, User, UserType, Plan, PricingTier } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';
import { PaginationOptions } from './types';

export interface UserFindManyParams {
  where?: Prisma.UserWhereInput;
  include?: Prisma.UserInclude;
  orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface CreateUserData {
  email: string;
  passwordHash?: string | null;
  name: string;
  userType?: UserType;
  plan?: Plan;
  apiQuota?: number;
  pricingTier?: PricingTier;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
}

export interface UpdateUserData {
  email?: string;
  passwordHash?: string;
  name?: string;
  userType?: UserType;
  plan?: Plan;
  apiQuota?: number;
  apiUsage?: number;
  pricingTier?: PricingTier;
  loginAttempts?: number;
  lockedUntil?: Date | null;
  lastLoginAt?: Date;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
}

export interface UserWithStats extends User {
  _count?: {
    apiResources: number;
    apiKeys: number;
    subscriptions: number;
  };
}

export interface UserFilters {
  userType?: UserType;
  plan?: Plan;
  pricingTier?: PricingTier;
  email?: string;
  name?: string;
  isActive?: boolean;
  hasApiResources?: boolean;
}



@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find multiple users with optional filters
   */
  async findMany(params: UserFindManyParams): Promise<User[]> {
    return this.prisma.user.findMany(params);
  }

  /**
   * Find user by ID
   */
  async findById(id: string, include?: Prisma.UserInclude): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string, include?: Prisma.UserInclude): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include,
    });
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        userType: data.userType || UserType.INDIVIDUAL,
        plan: data.plan || Plan.FREE,
        apiQuota: data.apiQuota || 1000,
        pricingTier: data.pricingTier || PricingTier.STANDARD,
      },
    });
  }

  /**
   * Update an existing user
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a user (hard delete - use with caution)
   */
  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Find users by type with statistics
   */
  async findByType(
    userType: UserType,
    pagination: PaginationOptions = {},
  ): Promise<{ users: UserWithStats[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    const where: Prisma.UserWhereInput = { userType };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              apiResources: {
                where: { deletedAt: null },
              },
              apiKeys: {
                where: { isActive: true },
              },
              subscriptions: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users: users as UserWithStats[], total };
  }

  /**
   * Find individual users (non-business, non-admin)
   */
  async findIndividualUsers(
    pagination: PaginationOptions = {},
  ): Promise<{ users: UserWithStats[]; total: number }> {
    return this.findByType(UserType.INDIVIDUAL, pagination);
  }

  /**
   * Find business users
   */
  async findBusinessUsers(
    pagination: PaginationOptions = {},
  ): Promise<{ users: UserWithStats[]; total: number }> {
    return this.findByType(UserType.BUSINESS, pagination);
  }

  /**
   * Find admin users
   */
  async findAdminUsers(
    pagination: PaginationOptions = {},
  ): Promise<{ users: UserWithStats[]; total: number }> {
    return this.findByType(UserType.ADMIN, pagination);
  }

  /**
   * Find users by plan
   */
  async findByPlan(
    plan: Plan,
    pagination: PaginationOptions = {},
  ): Promise<{ users: UserWithStats[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    const where: Prisma.UserWhereInput = { plan };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              apiResources: {
                where: { deletedAt: null },
              },
              apiKeys: {
                where: { isActive: true },
              },
              subscriptions: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users: users as UserWithStats[], total };
  }

  /**
   * Search users with filters
   */
  async search(
    filters: UserFilters,
    pagination: PaginationOptions = {},
  ): Promise<{ users: UserWithStats[]; total: number }> {
    const { limit = 20, offset = 0 } = pagination;

    const where: Prisma.UserWhereInput = {};

    if (filters.userType) {
      where.userType = filters.userType;
    }

    if (filters.plan) {
      where.plan = filters.plan;
    }

    if (filters.pricingTier) {
      where.pricingTier = filters.pricingTier;
    }

    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters.hasApiResources !== undefined) {
      if (filters.hasApiResources) {
        where.apiResources = {
          some: {
            deletedAt: null,
          },
        };
      } else {
        where.apiResources = {
          none: {
            deletedAt: null,
          },
        };
      }
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              apiResources: {
                where: { deletedAt: null },
              },
              apiKeys: {
                where: { isActive: true },
              },
              subscriptions: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users: users as UserWithStats[], total };
  }

  /**
   * Update user API usage
   */
  async updateApiUsage(userId: string, usage: number): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { apiUsage: usage },
    });
  }

  /**
   * Increment user API usage
   */
  async incrementApiUsage(userId: string, increment: number = 1): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        apiUsage: {
          increment,
        },
      },
    });
  }

  /**
   * Reset API usage for all users (monthly reset)
   */
  async resetApiUsage(): Promise<Prisma.BatchPayload> {
    return this.prisma.user.updateMany({
      data: {
        apiUsage: 0,
      },
    });
  }

  /**
   * Get users approaching API quota limit
   */
  async getUsersNearQuotaLimit(
    thresholdPercentage: number = 80,
  ): Promise<User[]> {
    // Use raw SQL for complex calculations
    return this.prisma.$queryRaw<User[]>`
      SELECT * FROM users 
      WHERE api_usage >= (api_quota * ${thresholdPercentage / 100})
      ORDER BY api_usage DESC, api_quota ASC
    `;
  }

  /**
   * Get users who exceeded their quota
   */
  async getUsersOverQuota(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        apiUsage: {
          gt: this.prisma.user.fields.apiQuota,
        },
      },
      orderBy: { apiUsage: 'desc' },
    });
  }

  /**
   * Upgrade user plan
   */
  async upgradePlan(
    userId: string,
    newPlan: Plan,
    newQuota?: number,
    newPricingTier?: PricingTier,
  ): Promise<User> {
    const updateData: UpdateUserData = {
      plan: newPlan,
    };

    if (newQuota !== undefined) {
      updateData.apiQuota = newQuota;
    }

    if (newPricingTier !== undefined) {
      updateData.pricingTier = newPricingTier;
    }

    return this.update(userId, updateData);
  }

  /**
   * Check if email is unique (excluding a specific user ID)
   */
  async isEmailUnique(email: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.UserWhereInput = { email };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.user.count({ where });
    return count === 0;
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Record<UserType, number>;
    byPlan: Record<Plan, number>;
    byPricingTier: Record<PricingTier, number>;
    recentCount: number;
    activeUsersCount: number;
    avgApiUsage: number;
  }> {
    const [
      total,
      typeStats,
      planStats,
      tierStats,
      recentCount,
      activeUsersCount,
      avgApiUsage,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ['userType'],
        _count: true,
      }),
      this.prisma.user.groupBy({
        by: ['plan'],
        _count: true,
      }),
      this.prisma.user.groupBy({
        by: ['pricingTier'],
        _count: true,
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prisma.user.count({
        where: {
          apiResources: {
            some: {
              deletedAt: null,
            },
          },
        },
      }),
      this.prisma.user.aggregate({
        _avg: {
          apiUsage: true,
        },
      }),
    ]);

    return {
      total,
      byType: typeStats.reduce((acc, stat) => {
        acc[stat.userType as UserType] = stat._count;
        return acc;
      }, {} as Record<UserType, number>),
      byPlan: planStats.reduce((acc, stat) => {
        acc[stat.plan as Plan] = stat._count;
        return acc;
      }, {} as Record<Plan, number>),
      byPricingTier: tierStats.reduce((acc, stat) => {
        acc[stat.pricingTier as PricingTier] = stat._count;
        return acc;
      }, {} as Record<PricingTier, number>),
      recentCount,
      activeUsersCount,
      avgApiUsage: Math.round((avgApiUsage._avg.apiUsage || 0) * 100) / 100,
    };
  }

  /**
   * Get top users by API usage
   */
  async getTopUsersByApiUsage(limit: number = 10): Promise<UserWithStats[]> {
    return this.prisma.user.findMany({
      include: {
        _count: {
          select: {
            apiResources: {
              where: { deletedAt: null },
            },
            apiKeys: {
              where: { isActive: true },
            },
            subscriptions: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: { apiUsage: 'desc' },
      take: limit,
    }) as Promise<UserWithStats[]>;
  }

  /**
   * Get users with most API resources
   */
  async getUsersWithMostResources(limit: number = 10): Promise<UserWithStats[]> {
    return this.prisma.user.findMany({
      include: {
        _count: {
          select: {
            apiResources: {
              where: { deletedAt: null },
            },
            apiKeys: {
              where: { isActive: true },
            },
            subscriptions: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: {
        apiResources: {
          _count: 'desc',
        },
      },
      take: limit,
    }) as Promise<UserWithStats[]>;
  }

  /**
   * Bulk update users (for admin operations)
   */
  async bulkUpdate(
    userIds: string[],
    data: Partial<UpdateUserData>,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }
}