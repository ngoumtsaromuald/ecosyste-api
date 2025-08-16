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
exports.CategoryRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../config/prisma.service");
let CategoryRepository = class CategoryRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMany(params) {
        return this.prisma.category.findMany(params);
    }
    async findById(id, include) {
        return this.prisma.category.findUnique({
            where: { id },
            include,
        });
    }
    async findBySlug(slug, include) {
        return this.prisma.category.findUnique({
            where: { slug },
            include,
        });
    }
    async create(data) {
        return this.prisma.category.create({
            data,
        });
    }
    async update(id, data) {
        return this.prisma.category.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                children: true,
                apiResources: true,
            },
        });
        if (!category) {
            throw new Error('Category not found');
        }
        if (category.children.length > 0) {
            throw new Error('Cannot delete category with child categories');
        }
        if (category.apiResources.length > 0) {
            throw new Error('Cannot delete category with associated resources');
        }
        return this.prisma.category.delete({
            where: { id },
        });
    }
    async findRootCategories(includeChildren = false) {
        const include = {
            _count: {
                select: {
                    children: true,
                    apiResources: true,
                },
            },
        };
        if (includeChildren) {
            include.children = {
                include: {
                    _count: {
                        select: {
                            children: true,
                            apiResources: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            };
        }
        return this.prisma.category.findMany({
            where: {
                parentId: null,
            },
            include,
            orderBy: { name: 'asc' },
        });
    }
    async getCategoryTree() {
        const categories = await this.prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        children: true,
                        apiResources: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const categoryMap = new Map();
        const rootCategories = [];
        categories.forEach(category => {
            categoryMap.set(category.id, { ...category, children: [] });
        });
        categories.forEach(category => {
            const categoryWithChildren = categoryMap.get(category.id);
            if (category.parentId) {
                const parent = categoryMap.get(category.parentId);
                if (parent) {
                    parent.children.push(categoryWithChildren);
                }
            }
            else {
                rootCategories.push(categoryWithChildren);
            }
        });
        return rootCategories;
    }
    async getChildren(parentId, includeGrandchildren = false) {
        const include = {
            _count: {
                select: {
                    children: true,
                    apiResources: true,
                },
            },
        };
        if (includeGrandchildren) {
            include.children = {
                include: {
                    _count: {
                        select: {
                            children: true,
                            apiResources: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            };
        }
        return this.prisma.category.findMany({
            where: {
                parentId,
            },
            include,
            orderBy: { name: 'asc' },
        });
    }
    async getCategoryPath(categoryId) {
        const path = [];
        let currentId = categoryId;
        while (currentId) {
            const category = await this.prisma.category.findUnique({
                where: { id: currentId },
            });
            if (!category) {
                break;
            }
            path.unshift(category);
            currentId = category.parentId;
        }
        return path;
    }
    async getDescendants(categoryId) {
        const descendants = [];
        const getChildrenRecursive = async (parentId) => {
            const children = await this.prisma.category.findMany({
                where: { parentId },
            });
            for (const child of children) {
                descendants.push(child);
                await getChildrenRecursive(child.id);
            }
        };
        await getChildrenRecursive(categoryId);
        return descendants;
    }
    async moveCategory(categoryId, newParentId) {
        if (newParentId) {
            const descendants = await this.getDescendants(categoryId);
            const descendantIds = descendants.map(d => d.id);
            if (descendantIds.includes(newParentId)) {
                throw new Error('Cannot move category to its own descendant');
            }
        }
        return this.prisma.category.update({
            where: { id: categoryId },
            data: { parentId: newParentId },
        });
    }
    async isSlugUnique(slug, excludeId) {
        const where = { slug };
        if (excludeId) {
            where.id = { not: excludeId };
        }
        const count = await this.prisma.category.count({ where });
        return count === 0;
    }
    async getCategoriesWithResourceCounts() {
        return this.prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        apiResources: {
                            where: {
                                deletedAt: null,
                                status: 'ACTIVE',
                            },
                        },
                        children: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async searchByName(query, limit = 10) {
        return this.prisma.category.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { name: 'asc' },
            take: limit,
        });
    }
    async getStatistics() {
        const [total, rootCount, allCategories] = await Promise.all([
            this.prisma.category.count(),
            this.prisma.category.count({ where: { parentId: null } }),
            this.prisma.category.findMany({
                include: {
                    _count: {
                        select: {
                            apiResources: {
                                where: {
                                    deletedAt: null,
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        let maxDepth = 0;
        for (const category of allCategories) {
            const path = await this.getCategoryPath(category.id);
            maxDepth = Math.max(maxDepth, path.length);
        }
        const totalResources = allCategories.reduce((sum, cat) => sum + cat._count.apiResources, 0);
        const avgResourcesPerCategory = total > 0 ? totalResources / total : 0;
        return {
            total,
            rootCategories: rootCount,
            maxDepth,
            avgResourcesPerCategory: Math.round(avgResourcesPerCategory * 100) / 100,
        };
    }
};
exports.CategoryRepository = CategoryRepository;
exports.CategoryRepository = CategoryRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoryRepository);
//# sourceMappingURL=category.repository.js.map