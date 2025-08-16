import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CategoryRepository, CategoryWithChildren } from '../repositories/category.repository';
import { CacheService } from '../config/cache.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryTreeResponseDto } from '../dto/category-tree-response.dto';

const CACHE_KEYS = {
  CATEGORY_BY_ID: (id: string) => `category:${id}`,
  CATEGORY_BY_SLUG: (slug: string) => `category:slug:${slug}`,
  CATEGORY_TREE: 'categories:tree',
  CATEGORY_LIST: 'categories:list',
  CATEGORY_ROOTS: 'categories:roots',
  CATEGORY_CHILDREN: (parentId: string) => `categories:children:${parentId}`,
  CATEGORY_PATH: (id: string) => `category:path:${id}`,
} as const;

const CACHE_TTL = {
  CATEGORY: 3600, // 1 hour
  CATEGORY_TREE: 7200, // 2 hours
  CATEGORY_LIST: 1800, // 30 minutes
} as const;

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Get all categories in a flat list
   */
  async findAll(): Promise<CategoryResponseDto[]> {
    const cacheKey = CACHE_KEYS.CATEGORY_LIST;
    
    // Try cache first
    const cached = await this.cacheService.get<CategoryResponseDto[]>(cacheKey);
    if (cached) return cached;

    // Query database
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
    
    // Cache result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY_LIST);
    
    return result;
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree(): Promise<CategoryTreeResponseDto[]> {
    const cacheKey = CACHE_KEYS.CATEGORY_TREE;
    
    // Try cache first
    const cached = await this.cacheService.get<CategoryTreeResponseDto[]>(cacheKey);
    if (cached) return cached;

    // Query database
    const tree = await this.categoryRepository.getCategoryTree();
    const result = tree.map(category => this.toCategoryTreeResponseDto(category));
    
    // Cache result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY_TREE);
    
    return result;
  }

  /**
   * Get root categories (categories without parent)
   */
  async getRootCategories(includeChildren: boolean = false): Promise<CategoryTreeResponseDto[]> {
    const cacheKey = includeChildren 
      ? `${CACHE_KEYS.CATEGORY_ROOTS}:with-children`
      : CACHE_KEYS.CATEGORY_ROOTS;
    
    // Try cache first
    const cached = await this.cacheService.get<CategoryTreeResponseDto[]>(cacheKey);
    if (cached) return cached;

    // Query database
    const rootCategories = await this.categoryRepository.findRootCategories(includeChildren);
    const result = rootCategories.map(category => this.toCategoryTreeResponseDto(category));
    
    // Cache result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY_TREE);
    
    return result;
  }

  /**
   * Get category by ID
   */
  async findById(id: string): Promise<CategoryResponseDto> {
    const cacheKey = CACHE_KEYS.CATEGORY_BY_ID(id);
    
    // Try cache first
    const cached = await this.cacheService.get<CategoryResponseDto>(cacheKey);
    if (cached) return cached;

    // Query database
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
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const result = this.toCategoryResponseDto(category);
    
    // Cache result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY);
    
    return result;
  }

  /**
   * Get category by slug
   */
  async findBySlug(slug: string): Promise<CategoryResponseDto> {
    const cacheKey = CACHE_KEYS.CATEGORY_BY_SLUG(slug);
    
    // Try cache first
    const cached = await this.cacheService.get<CategoryResponseDto>(cacheKey);
    if (cached) return cached;

    // Query database
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
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    const result = this.toCategoryResponseDto(category);
    
    // Cache result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY);
    
    return result;
  }

  /**
   * Get children of a category
   */
  async getChildren(parentId: string, includeGrandchildren: boolean = false): Promise<CategoryTreeResponseDto[]> {
    const cacheKey = includeGrandchildren
      ? `${CACHE_KEYS.CATEGORY_CHILDREN(parentId)}:with-grandchildren`
      : CACHE_KEYS.CATEGORY_CHILDREN(parentId);
    
    // Try cache first
    const cached = await this.cacheService.get<CategoryTreeResponseDto[]>(cacheKey);
    if (cached) return cached;

    // Verify parent exists
    const parent = await this.categoryRepository.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Parent category with ID ${parentId} not found`);
    }

    // Query database
    const children = await this.categoryRepository.getChildren(parentId, includeGrandchildren);
    const result = children.map(category => this.toCategoryTreeResponseDto(category));
    
    // Cache result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY_LIST);
    
    return result;
  }

  /**
   * Create a new category
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Generate slug from name
    const slug = this.generateSlug(createCategoryDto.name);

    // Check if slug is unique
    const isSlugUnique = await this.categoryRepository.isSlugUnique(slug);
    if (!isSlugUnique) {
      throw new ConflictException(`Category with slug '${slug}' already exists`);
    }

    // Validate parent exists if provided
    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findById(createCategoryDto.parentId);
      if (!parent) {
        throw new BadRequestException(`Parent category with ID ${createCategoryDto.parentId} not found`);
      }
    }

    // Create category
    const category = await this.categoryRepository.create({
      name: createCategoryDto.name,
      slug,
      description: createCategoryDto.description || null,
      icon: createCategoryDto.icon || null,
      parentId: createCategoryDto.parentId || null,
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.toCategoryResponseDto(category);
  }

  /**
   * Update an existing category
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    // Check if category exists
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const updateData: any = {};

    // Handle name and slug update
    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      const newSlug = this.generateSlug(updateCategoryDto.name);
      
      // Check if new slug is unique
      const isSlugUnique = await this.categoryRepository.isSlugUnique(newSlug, id);
      if (!isSlugUnique) {
        throw new ConflictException(`Category with slug '${newSlug}' already exists`);
      }
      
      updateData.name = updateCategoryDto.name;
      updateData.slug = newSlug;
    }

    // Handle other fields
    if (updateCategoryDto.description !== undefined) {
      updateData.description = updateCategoryDto.description || null;
    }
    if (updateCategoryDto.icon !== undefined) {
      updateData.icon = updateCategoryDto.icon || null;
    }

    // Handle parent change
    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId) {
        // Validate parent exists
        const parent = await this.categoryRepository.findById(updateCategoryDto.parentId);
        if (!parent) {
          throw new BadRequestException(`Parent category with ID ${updateCategoryDto.parentId} not found`);
        }

        // Check for circular reference
        const descendants = await this.categoryRepository.getDescendants(id);
        const descendantIds = descendants.map(d => d.id);
        if (descendantIds.includes(updateCategoryDto.parentId)) {
          throw new BadRequestException('Cannot set parent to a descendant category');
        }
      }
      
      updateData.parentId = updateCategoryDto.parentId || null;
    }

    // Update category
    const updatedCategory = await this.categoryRepository.update(id, updateData);

    // Invalidate cache
    await this.invalidateCache();

    return this.toCategoryResponseDto(updatedCategory);
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<void> {
    try {
      await this.categoryRepository.delete(id);
      
      // Invalidate cache
      await this.invalidateCache();
    } catch (error) {
      if (error.message === 'Category not found') {
        throw new NotFoundException(`Category with ID ${id} not found`);
      } else if (error.message.includes('Cannot delete category')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Get category path (breadcrumb)
   */
  async getCategoryPath(categoryId: string): Promise<CategoryResponseDto[]> {
    const cacheKey = CACHE_KEYS.CATEGORY_PATH(categoryId);
    
    // Try cache first
    const cached = await this.cacheService.get<CategoryResponseDto[]>(cacheKey);
    if (cached) return cached;

    // Query database
    const path = await this.categoryRepository.getCategoryPath(categoryId);
    
    if (path.length === 0) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const result = path.map(category => this.toCategoryResponseDto(category));
    
    // Cache result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.CATEGORY);
    
    return result;
  }

  /**
   * Search categories by name
   */
  async search(query: string, limit: number = 10): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.searchByName(query, limit);
    return categories.map(category => this.toCategoryResponseDto(category));
  }

  /**
   * Get category statistics
   */
  async getStatistics() {
    return this.categoryRepository.getStatistics();
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Convert Category to CategoryResponseDto
   */
  private toCategoryResponseDto(category: any): CategoryResponseDto {
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

  /**
   * Convert CategoryWithChildren to CategoryTreeResponseDto
   */
  private toCategoryTreeResponseDto(category: CategoryWithChildren): CategoryTreeResponseDto {
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

  /**
   * Invalidate all category-related cache
   */
  private async invalidateCache(): Promise<void> {
    await Promise.all([
      this.cacheService.invalidatePattern('category:*'),
      this.cacheService.invalidatePattern('categories:*'),
    ]);
  }
}