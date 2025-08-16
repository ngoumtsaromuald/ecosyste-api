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
exports.ApiResourceRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../config/prisma.service");
const api_resource_domain_1 = require("../domain/models/api-resource-domain");
const enums_1 = require("../domain/enums");
const value_objects_1 = require("../domain/value-objects");
let ApiResourceRepository = class ApiResourceRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMany(params) {
        return this.prisma.apiResource.findMany({
            ...params,
            where: {
                ...params.where,
                deletedAt: null,
            },
        });
    }
    async findById(id, include) {
        return this.prisma.apiResource.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include,
        });
    }
    async findBySlug(slug, include) {
        return this.prisma.apiResource.findFirst({
            where: {
                slug,
                deletedAt: null,
            },
            include,
        });
    }
    async create(data) {
        return this.prisma.apiResource.create({
            data: {
                ...data,
                status: data.status || enums_1.ResourceStatus.PENDING,
                plan: data.plan || enums_1.ResourcePlan.FREE,
                verified: data.verified || false,
                country: data.country || 'CM',
            },
        });
    }
    async update(id, data) {
        return this.prisma.apiResource.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    }
    async softDelete(id) {
        return this.prisma.apiResource.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
    async hardDelete(id) {
        return this.prisma.apiResource.delete({
            where: { id },
        });
    }
    async count(where) {
        return this.prisma.apiResource.count({
            where: {
                ...where,
                deletedAt: null,
            },
        });
    }
    async search(filters, pagination = {}) {
        const { limit = 20, offset = 0 } = pagination;
        const where = {
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
    async findByUserId(userId, pagination = {}) {
        const { limit = 20, offset = 0 } = pagination;
        const where = {
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
    async findByCategory(categoryId, pagination = {}) {
        const { limit = 20, offset = 0 } = pagination;
        const where = {
            categoryId,
            deletedAt: null,
            status: enums_1.ResourceStatus.ACTIVE,
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
    async findNearLocation(latitude, longitude, radiusKm = 10, pagination = {}) {
        const { limit = 20, offset = 0 } = pagination;
        const latDelta = radiusKm / 111;
        const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));
        const where = {
            deletedAt: null,
            status: enums_1.ResourceStatus.ACTIVE,
            latitude: {
                gte: latitude - latDelta,
                lte: latitude + latDelta,
            },
            longitude: {
                gte: longitude - lonDelta,
                lte: longitude + lonDelta,
            },
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
                ],
                take: limit,
                skip: offset,
            }),
            this.prisma.apiResource.count({ where }),
        ]);
        return { resources, total };
    }
    async isSlugUnique(slug, excludeId) {
        const where = {
            slug,
            deletedAt: null,
        };
        if (excludeId) {
            where.id = { not: excludeId };
        }
        const count = await this.prisma.apiResource.count({ where });
        return count === 0;
    }
    async bulkCreate(data) {
        return this.prisma.apiResource.createMany({
            data: data.map(item => ({
                ...item,
                status: item.status || enums_1.ResourceStatus.PENDING,
                plan: item.plan || enums_1.ResourcePlan.FREE,
                verified: item.verified || false,
                country: item.country || 'CM',
            })),
            skipDuplicates: true,
        });
    }
    async getStatistics() {
        const [total, statusStats, planStats, typeStats, recentCount,] = await Promise.all([
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
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            total,
            byStatus: statusStats.reduce((acc, stat) => {
                acc[stat.status] = stat._count;
                return acc;
            }, {}),
            byPlan: planStats.reduce((acc, stat) => {
                acc[stat.plan] = stat._count;
                return acc;
            }, {}),
            byType: typeStats.reduce((acc, stat) => {
                acc[stat.resourceType] = stat._count;
                return acc;
            }, {}),
            recentCount,
        };
    }
    toDomain(resource) {
        const address = resource.addressLine1 || resource.city || resource.region
            ? new value_objects_1.Address(resource.addressLine1 || null, resource.addressLine2 || null, resource.city || null, resource.region || null, resource.postalCode || null, resource.country || 'CM', resource.latitude || null, resource.longitude || null)
            : null;
        const contact = resource.phone || resource.email || resource.website
            ? new value_objects_1.Contact(resource.phone || null, resource.email || null, resource.website || null)
            : null;
        const seo = resource.metaTitle || resource.metaDescription
            ? new value_objects_1.SeoData(resource.metaTitle || null, resource.metaDescription || null)
            : null;
        return new api_resource_domain_1.ApiResourceDomain(resource.id, resource.userId, resource.name, resource.slug, resource.description, resource.resourceType, resource.categoryId, address, contact, resource.status, resource.plan, resource.verified, seo, resource.createdAt, resource.updatedAt, resource.publishedAt, resource.deletedAt);
    }
    fromDomain(domain) {
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
};
exports.ApiResourceRepository = ApiResourceRepository;
exports.ApiResourceRepository = ApiResourceRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApiResourceRepository);
//# sourceMappingURL=api-resource.repository.js.map