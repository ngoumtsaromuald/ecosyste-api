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
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../config/prisma.service");
let UserRepository = class UserRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMany(params) {
        return this.prisma.user.findMany(params);
    }
    async findById(id, include) {
        return this.prisma.user.findUnique({
            where: { id },
            include,
        });
    }
    async findByEmail(email, include) {
        return this.prisma.user.findUnique({
            where: { email },
            include,
        });
    }
    async create(data) {
        return this.prisma.user.create({
            data: {
                ...data,
                userType: data.userType || client_1.UserType.INDIVIDUAL,
                plan: data.plan || client_1.Plan.FREE,
                apiQuota: data.apiQuota || 1000,
                pricingTier: data.pricingTier || client_1.PricingTier.STANDARD,
            },
        });
    }
    async update(id, data) {
        return this.prisma.user.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    }
    async delete(id) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
    async findByType(userType, pagination = {}) {
        const { limit = 20, offset = 0 } = pagination;
        const where = { userType };
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
        return { users: users, total };
    }
    async findIndividualUsers(pagination = {}) {
        return this.findByType(client_1.UserType.INDIVIDUAL, pagination);
    }
    async findBusinessUsers(pagination = {}) {
        return this.findByType(client_1.UserType.BUSINESS, pagination);
    }
    async findAdminUsers(pagination = {}) {
        return this.findByType(client_1.UserType.ADMIN, pagination);
    }
    async findByPlan(plan, pagination = {}) {
        const { limit = 20, offset = 0 } = pagination;
        const where = { plan };
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
        return { users: users, total };
    }
    async search(filters, pagination = {}) {
        const { limit = 20, offset = 0 } = pagination;
        const where = {};
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
            }
            else {
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
        return { users: users, total };
    }
    async updateApiUsage(userId, usage) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { apiUsage: usage },
        });
    }
    async incrementApiUsage(userId, increment = 1) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                apiUsage: {
                    increment,
                },
            },
        });
    }
    async resetApiUsage() {
        return this.prisma.user.updateMany({
            data: {
                apiUsage: 0,
            },
        });
    }
    async getUsersNearQuotaLimit(thresholdPercentage = 80) {
        return this.prisma.$queryRaw `
      SELECT * FROM users 
      WHERE api_usage >= (api_quota * ${thresholdPercentage / 100})
      ORDER BY api_usage DESC, api_quota ASC
    `;
    }
    async getUsersOverQuota() {
        return this.prisma.user.findMany({
            where: {
                apiUsage: {
                    gt: this.prisma.user.fields.apiQuota,
                },
            },
            orderBy: { apiUsage: 'desc' },
        });
    }
    async upgradePlan(userId, newPlan, newQuota, newPricingTier) {
        const updateData = {
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
    async isEmailUnique(email, excludeId) {
        const where = { email };
        if (excludeId) {
            where.id = { not: excludeId };
        }
        const count = await this.prisma.user.count({ where });
        return count === 0;
    }
    async getStatistics() {
        const [total, typeStats, planStats, tierStats, recentCount, activeUsersCount, avgApiUsage,] = await Promise.all([
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
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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
                acc[stat.userType] = stat._count;
                return acc;
            }, {}),
            byPlan: planStats.reduce((acc, stat) => {
                acc[stat.plan] = stat._count;
                return acc;
            }, {}),
            byPricingTier: tierStats.reduce((acc, stat) => {
                acc[stat.pricingTier] = stat._count;
                return acc;
            }, {}),
            recentCount,
            activeUsersCount,
            avgApiUsage: Math.round((avgApiUsage._avg.apiUsage || 0) * 100) / 100,
        };
    }
    async getTopUsersByApiUsage(limit = 10) {
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
        });
    }
    async getUsersWithMostResources(limit = 10) {
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
        });
    }
    async bulkUpdate(userIds, data) {
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
};
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserRepository);
//# sourceMappingURL=user.repository.js.map