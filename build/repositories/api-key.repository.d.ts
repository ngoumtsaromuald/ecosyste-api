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
export declare class ApiKeyRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMany(params: ApiKeyFindManyParams): Promise<ApiKey[]>;
    findById(id: string, include?: Prisma.ApiKeyInclude): Promise<ApiKey | null>;
    findByPrefix(keyPrefix: string, include?: Prisma.ApiKeyInclude): Promise<ApiKeyWithUser | null>;
    findByIdAndUserId(id: string, userId: string, include?: Prisma.ApiKeyInclude): Promise<ApiKey | null>;
    findByUserId(userId: string, pagination?: PaginationOptions, includeInactive?: boolean): Promise<{
        apiKeys: ApiKey[];
        total: number;
    }>;
    create(data: CreateApiKeyData): Promise<ApiKey>;
    update(id: string, data: UpdateApiKeyData): Promise<ApiKey>;
    updateLastUsed(id: string): Promise<ApiKey>;
    deactivate(id: string): Promise<ApiKey>;
    reactivate(id: string): Promise<ApiKey>;
    delete(id: string): Promise<ApiKey>;
    search(filters: ApiKeyFilters, pagination?: PaginationOptions): Promise<{
        apiKeys: ApiKey[];
        total: number;
    }>;
    getExpiredKeys(): Promise<ApiKey[]>;
    getKeysExpiringSoon(daysAhead?: number): Promise<ApiKey[]>;
    bulkDeactivate(keyIds: string[]): Promise<Prisma.BatchPayload>;
    deactivateExpiredKeys(): Promise<Prisma.BatchPayload>;
    getStatistics(): Promise<{
        total: number;
        active: number;
        inactive: number;
        expired: number;
        recentCount: number;
        avgRateLimit: number;
        topUsers: Array<{
            userId: string;
            count: number;
            userName: string;
        }>;
    }>;
    getMostUsedKeys(limit?: number): Promise<ApiKey[]>;
    getUnusedKeys(daysThreshold?: number): Promise<ApiKey[]>;
    updatePermissions(id: string, permissions: string[]): Promise<ApiKey>;
    updateRateLimit(id: string, rateLimit: number): Promise<ApiKey>;
    isNameUniqueForUser(userId: string, name: string, excludeId?: string): Promise<boolean>;
}
