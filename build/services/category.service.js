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
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const category_repository_1 = require("../repositories/category.repository");
const cache_service_1 = require("../config/cache.service");
const CACHE_KEYS = {
    CATEGORY_BY_ID: (id) => `category:${id}`,
    CATEGORY_BY_SLUG: (slug) => `category:slug:${slug}`,
    CATEGORY_TREE: 'categories:tree',
    CATEGORY_LIST: 'categories:list',
    CATEGORY_ROOTS: 'categories:roots',
    CATEGORY_CHILDREN: (parentId) => `categories:children:${parentId}`,
    CATEGORY_PATH: (id) => `category:path:${id}`,
};
const CACHE_TTL = {
    CATEGORY: 3600,
    CATEGORY_TREE: 7200,
    CATEGORY_LIST: 1800,
};
let CategoryService = class CategoryService {
    constructor(categoryRepository, cacheService) {
        this.categoryRepository = categoryRepository;
        this.cacheService = cacheService;
    }
    async findAll() {
        const cacheKey = CACHE_KEYS.CATEGORY_LIST;
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const categories = await this.categoryRepository.findMany({
            include: {
                _count: {
                    select: {
                        children: true,
                        apiResources: {
                            where: {
                                deletedAt: null,
                                status: 'ACTIVE',
                            },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const result = categories.map(category => this.toCategoryResponseDto(category));
        await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY_LIST);
        return result;
    }
    async getCategoryTree() {
        const cacheKey = CACHE_KEYS.CATEGORY_TREE;
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const tree = await this.categoryRepository.getCategoryTree();
        const result = tree.map(category => this.toCategoryTreeResponseDto(category));
        await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY_TREE);
        return result;
    }
    async getRootCategories(includeChildren = false) {
        const cacheKey = includeChildren
            ? `${CACHE_KEYS.CATEGORY_ROOTS}:with-children`
            : CACHE_KEYS.CATEGORY_ROOTS;
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const rootCategories = await this.categoryRepository.findRootCategories(includeChildren);
        const result = rootCategories.map(category => this.toCategoryTreeResponseDto(category));
        await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY_TREE);
        return result;
    }
    async findById(id) {
        const cacheKey = CACHE_KEYS.CATEGORY_BY_ID(id);
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const category = await this.categoryRepository.findById(id, {
            _count: {
                select: {
                    children: true,
                    apiResources: {
                        where: {
                            deletedAt: null,
                            status: 'ACTIVE',
                        },
                    },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
        }
        const result = this.toCategoryResponseDto(category);
        await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY);
        return result;
    }
    async findBySlug(slug) {
        const cacheKey = CACHE_KEYS.CATEGORY_BY_SLUG(slug);
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const category = await this.categoryRepository.findBySlug(slug, {
            _count: {
                select: {
                    children: true,
                    apiResources: {
                        where: {
                            deletedAt: null,
                            status: 'ACTIVE',
                        },
                    },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with slug '${slug}' not found`);
        }
        const result = this.toCategoryResponseDto(category);
        await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY);
        return result;
    }
    async getChildren(parentId, includeGrandchildren = false) {
        const cacheKey = includeGrandchildren
            ? `${CACHE_KEYS.CATEGORY_CHILDREN(parentId)}:with-grandchildren`
            : CACHE_KEYS.CATEGORY_CHILDREN(parentId);
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const parent = await this.categoryRepository.findById(parentId);
        if (!parent) {
            throw new common_1.NotFoundException(`Parent category with ID ${parentId} not found`);
        }
        const children = await this.categoryRepository.getChildren(parentId, includeGrandchildren);
        const result = children.map(category => this.toCategoryTreeResponseDto(category));
        await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY_LIST);
        return result;
    }
    async create(createCategoryDto) {
        const slug = this.generateSlug(createCategoryDto.name);
        const isSlugUnique = await this.categoryRepository.isSlugUnique(slug);
        if (!isSlugUnique) {
            throw new common_1.ConflictException(`Category with slug '${slug}' already exists`);
        }
        if (createCategoryDto.parentId) {
            const parent = await this.categoryRepository.findById(createCategoryDto.parentId);
            if (!parent) {
                throw new common_1.BadRequestException(`Parent category with ID ${createCategoryDto.parentId} not found`);
            }
        }
        const category = await this.categoryRepository.create({
            name: createCategoryDto.name,
            slug,
            description: createCategoryDto.description || null,
            icon: createCategoryDto.icon || null,
            parentId: createCategoryDto.parentId || null,
        });
        await this.invalidateCache();
        return this.toCategoryResponseDto(category);
    }
    async update(id, updateCategoryDto) {
        const existingCategory = await this.categoryRepository.findById(id);
        if (!existingCategory) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
        }
        const updateData = {};
        if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
            const newSlug = this.generateSlug(updateCategoryDto.name);
            const isSlugUnique = await this.categoryRepository.isSlugUnique(newSlug, id);
            if (!isSlugUnique) {
                throw new common_1.ConflictException(`Category with slug '${newSlug}' already exists`);
            }
            updateData.name = updateCategoryDto.name;
            updateData.slug = newSlug;
        }
        if (updateCategoryDto.description !== undefined) {
            updateData.description = updateCategoryDto.description || null;
        }
        if (updateCategoryDto.icon !== undefined) {
            updateData.icon = updateCategoryDto.icon || null;
        }
        if (updateCategoryDto.parentId !== undefined) {
            if (updateCategoryDto.parentId) {
                const parent = await this.categoryRepository.findById(updateCategoryDto.parentId);
                if (!parent) {
                    throw new common_1.BadRequestException(`Parent category with ID ${updateCategoryDto.parentId} not found`);
                }
                const descendants = await this.categoryRepository.getDescendants(id);
                const descendantIds = descendants.map(d => d.id);
                if (descendantIds.includes(updateCategoryDto.parentId)) {
                    throw new common_1.BadRequestException('Cannot set parent to a descendant category');
                }
            }
            updateData.parentId = updateCategoryDto.parentId || null;
        }
        const updatedCategory = await this.categoryRepository.update(id, updateData);
        await this.invalidateCache();
        return this.toCategoryResponseDto(updatedCategory);
    }
    async delete(id) {
        try {
            await this.categoryRepository.delete(id);
            await this.invalidateCache();
        }
        catch (error) {
            if (error.message === 'Category not found') {
                throw new common_1.NotFoundException(`Category with ID ${id} not found`);
            }
            else if (error.message.includes('Cannot delete category')) {
                throw new common_1.BadRequestException(error.message);
            }
            throw error;
        }
    }
    async getCategoryPath(categoryId) {
        const cacheKey = CACHE_KEYS.CATEGORY_PATH(categoryId);
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const path = await this.categoryRepository.getCategoryPath(categoryId);
        if (path.length === 0) {
            throw new common_1.NotFoundException(`Category with ID ${categoryId} not found`);
        }
        const result = path.map(category => this.toCategoryResponseDto(category));
        await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY);
        return result;
    }
    async search(query, limit = 10) {
        const categories = await this.categoryRepository.searchByName(query, limit);
        return categories.map(category => this.toCategoryResponseDto(category));
    }
    async getStatistics() {
        return this.categoryRepository.getStatistics();
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    toCategoryResponseDto(category) {
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
            parentId: category.parentId,
            createdAt: category.createdAt,
        };
    }
    toCategoryTreeResponseDto(category) {
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
            parentId: category.parentId,
            createdAt: category.createdAt,
            children: category.children?.map(child => this.toCategoryTreeResponseDto(child)),
            parent: category.parent ? this.toCategoryResponseDto(category.parent) : undefined,
            _count: category._count,
        };
    }
    async invalidateCache() {
        await Promise.all([
            this.cacheService.invalidatePattern('category:*'),
            this.cacheService.invalidatePattern('categories:*'),
        ]);
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [category_repository_1.CategoryRepository,
        cache_service_1.CacheService])
], CategoryService);
//# sourceMappingURL=category.service.js.map