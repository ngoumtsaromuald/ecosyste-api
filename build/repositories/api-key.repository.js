"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../config/prisma.service");
let ApiKeyRepository = class ApiKeyRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMany(params) {
        return this.prisma.apiKey.findMany(params);
    }
    async findById(id, include) {
        return this.prisma.apiKey.findUnique({
            where: { id },
            include,
        });
    }
    async findByPrefix(keyPrefix, include) {
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
        });
    }
    async findByIdAndUserId(id, userId, include) {
        return this.prisma.apiKey.findFirst({
            where: {
                id,
                userId,
            },
            include,
        });
    }
    async findByUserId(userId, pagination = {}, includeInactive = false) {
        const { limit = 20, offset = 0 } = pagination;
        const where = {
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
    async create(data) {
        return this.prisma.apiKey.create({
            data: {
                ...data,
                permissions: data.permissions || [],
                rateLimit: data.rateLimit || 1000,
            },
        });
    }
    async update(id, data) {
        return this.prisma.apiKey.update({
            where: { id },
            data,
        });
    }
    async updateLastUsed(id) {
        return this.prisma.apiKey.update({
            where: { id },
            data: {
                lastUsedAt: new Date(),
            },
        });
    }
    async deactivate(id) {
        return this.prisma.apiKey.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
    }
    async reactivate(id) {
        return this.prisma.apiKey.update({
            where: { id },
            data: {
                isActive: true,
            },
        });
    }
    async delete(id) {
        return this.prisma.apiKey.delete({
            where: { id },
        });
    }
    async search(filters, pagination = {}) {
        const { limit = 20, offset = 0 } = pagination;
        const where = {};
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
            }
            else {
                where.OR = [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ];
            }
        }
        if (filters.permissions && filters.permissions.length > 0) {
            where.permissions = {
                path: filters.permissions,
            };
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
    async getExpiredKeys() {
        return this.prisma.apiKey.findMany({
            where: {
                isActive: true,
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }
    async getKeysExpiringSoon(daysAhead = 7) {
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
    async bulkDeactivate(keyIds) {
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
    async deactivateExpiredKeys() {
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
    async getStatistics() {
        const now = new Date();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [total, active, inactive, expired, recentCount, avgRateLimit,] = await Promise.all([
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
        const topUsersRaw = await this.prisma.$queryRaw `
      SELECT "userId", COUNT(*) as count
      FROM "api_keys"
      GROUP BY "userId"
      ORDER BY count DESC
      LIMIT 10
    `;
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
    async getMostUsedKeys(limit = 10) {
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
    async getUnusedKeys(daysThreshold = 30) {
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
    async updatePermissions(id, permissions) {
        return this.prisma.apiKey.update({
            where: { id },
            data: { permissions },
        });
    }
    async updateRateLimit(id, rateLimit) {
        return this.prisma.apiKey.update({
            where: { id },
            data: { rateLimit },
        });
    }
    async isNameUniqueForUser(userId, name, excludeId) {
        const where = {
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
};
exports.ApiKeyRepository = ApiKeyRepository;
exports.ApiKeyRepository = ApiKeyRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApiKeyRepository);
//# sourceMappingURL=api-key.repository.js.map