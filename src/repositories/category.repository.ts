import { Injectable } from '@nestjs/common';
import { Prisma, Category } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';

export interface CategoryFindManyParams {
  where?: Prisma.CategoryWhereInput;
  include?: Prisma.CategoryInclude;
  orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  parentId?: string | null;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  parentId?: string | null;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  parent?: Category | null;
  _count?: {
    children: number;
    apiResources: number;
  };
}

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find multiple categories with optional filters
   */
  async findMany(params: CategoryFindManyParams): Promise<Category[]> {
    return this.prisma.category.findMany(params);
  }

  /**
   * Find category by ID
   */
  async findById(id: string, include?: Prisma.CategoryInclude): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string, include?: Prisma.CategoryInclude): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { slug },
      include,
    });
  }

  /**
   * Create a new category
   */
  async create(data: CreateCategoryData): Promise<Category> {
    return this.prisma.category.create({
      data,
    });
  }

  /**
   * Update an existing category
   */
  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a category (only if it has no children or resources)
   */
  async delete(id: string): Promise<Category> {
    // Check if category has children or resources
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

  /**
   * Get all root categories (categories without parent)
   */
  async findRootCategories(includeChildren: boolean = false): Promise<CategoryWithChildren[]> {
    const include: Prisma.CategoryInclude = {
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
    }) as Promise<CategoryWithChildren[]>;
  }

  /**
   * Get category hierarchy (tree structure)
   */
  async getCategoryTree(): Promise<CategoryWithChildren[]> {
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

    // Build tree structure
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build tree structure
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }

  /**
   * Get children of a specific category
   */
  async getChildren(parentId: string, includeGrandchildren: boolean = false): Promise<CategoryWithChildren[]> {
    const include: Prisma.CategoryInclude = {
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
    }) as Promise<CategoryWithChildren[]>;
  }

  /**
   * Get category path (breadcrumb) from root to specified category
   */
  async getCategoryPath(categoryId: string): Promise<Category[]> {
    const path: Category[] = [];
    let currentId: string | null = categoryId;

    while (currentId) {
      const category = await this.prisma.category.findUnique({
        where: { id: currentId },
      });

      if (!category) {
        break;
      }

      path.unshift(category); // Add to beginning of array
      currentId = category.parentId;
    }

    return path;
  }

  /**
   * Get all descendants of a category (recursive)
   */
  async getDescendants(categoryId: string): Promise<Category[]> {
    const descendants: Category[] = [];
    
    const getChildrenRecursive = async (parentId: string) => {
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

  /**
   * Move category to a new parent
   */
  async moveCategory(categoryId: string, newParentId: string | null): Promise<Category> {
    // Validate that we're not creating a circular reference
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

  /**
   * Check if slug is unique (excluding a specific category ID)
   */
  async isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.CategoryWhereInput = { slug };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.category.count({ where });
    return count === 0;
  }

  /**
   * Get categories with resource counts
   */
  async getCategoriesWithResourceCounts(): Promise<CategoryWithChildren[]> {
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
    }) as Promise<CategoryWithChildren[]>;
  }

  /**
   * Search categories by name
   */
  async searchByName(query: string, limit: number = 10): Promise<Category[]> {
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

  /**
   * Get category statistics
   */
  async getStatistics(): Promise<{
    total: number;
    rootCategories: number;
    maxDepth: number;
    avgResourcesPerCategory: number;
  }> {
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

    // Calculate max depth
    let maxDepth = 0;
    for (const category of allCategories) {
      const path = await this.getCategoryPath(category.id);
      maxDepth = Math.max(maxDepth, path.length);
    }

    // Calculate average resources per category
    const totalResources = allCategories.reduce(
      (sum, cat) => sum + cat._count.apiResources,
      0,
    );
    const avgResourcesPerCategory = total > 0 ? totalResources / total : 0;

    return {
      total,
      rootCategories: rootCount,
      maxDepth,
      avgResourcesPerCategory: Math.round(avgResourcesPerCategory * 100) / 100,
    };
  }
}