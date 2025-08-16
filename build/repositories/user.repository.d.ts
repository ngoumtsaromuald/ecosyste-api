import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';
import { UserType, Plan, PricingTier } from '../domain/enums';
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
    passwordHash: string;
    name: string;
    userType?: UserType;
    plan?: Plan;
    apiQuota?: number;
    pricingTier?: PricingTier;
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
export declare class UserRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMany(params: UserFindManyParams): Promise<User[]>;
    findById(id: string, include?: Prisma.UserInclude): Promise<User | null>;
    findByEmail(email: string, include?: Prisma.UserInclude): Promise<User | null>;
    create(data: CreateUserData): Promise<User>;
    update(id: string, data: UpdateUserData): Promise<User>;
    delete(id: string): Promise<User>;
    findByType(userType: UserType, pagination?: PaginationOptions): Promise<{
        users: UserWithStats[];
        total: number;
    }>;
    findIndividualUsers(pagination?: PaginationOptions): Promise<{
        users: UserWithStats[];
        total: number;
    }>;
    findBusinessUsers(pagination?: PaginationOptions): Promise<{
        users: UserWithStats[];
        total: number;
    }>;
    findAdminUsers(pagination?: PaginationOptions): Promise<{
        users: UserWithStats[];
        total: number;
    }>;
    findByPlan(plan: Plan, pagination?: PaginationOptions): Promise<{
        users: UserWithStats[];
        total: number;
    }>;
    search(filters: UserFilters, pagination?: PaginationOptions): Promise<{
        users: UserWithStats[];
        total: number;
    }>;
    updateApiUsage(userId: string, usage: number): Promise<User>;
    incrementApiUsage(userId: string, increment?: number): Promise<User>;
    resetApiUsage(): Promise<Prisma.BatchPayload>;
    getUsersNearQuotaLimit(thresholdPercentage?: number): Promise<User[]>;
    getUsersOverQuota(): Promise<User[]>;
    upgradePlan(userId: string, newPlan: Plan, newQuota?: number, newPricingTier?: PricingTier): Promise<User>;
    isEmailUnique(email: string, excludeId?: string): Promise<boolean>;
    getStatistics(): Promise<{
        total: number;
        byType: Record<UserType, number>;
        byPlan: Record<Plan, number>;
        byPricingTier: Record<PricingTier, number>;
        recentCount: number;
        activeUsersCount: number;
        avgApiUsage: number;
    }>;
    getTopUsersByApiUsage(limit?: number): Promise<UserWithStats[]>;
    getUsersWithMostResources(limit?: number): Promise<UserWithStats[]>;
    bulkUpdate(userIds: string[], data: Partial<UpdateUserData>): Promise<Prisma.BatchPayload>;
}
