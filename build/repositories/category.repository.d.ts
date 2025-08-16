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
export declare class CategoryRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMany(params: CategoryFindManyParams): Promise<Category[]>;
    findById(id: string, include?: Prisma.CategoryInclude): Promise<Category | null>;
    findBySlug(slug: string, include?: Prisma.CategoryInclude): Promise<Category | null>;
    create(data: CreateCategoryData): Promise<Category>;
    update(id: string, data: UpdateCategoryData): Promise<Category>;
    delete(id: string): Promise<Category>;
    findRootCategories(includeChildren?: boolean): Promise<CategoryWithChildren[]>;
    getCategoryTree(): Promise<CategoryWithChildren[]>;
    getChildren(parentId: string, includeGrandchildren?: boolean): Promise<CategoryWithChildren[]>;
    getCategoryPath(categoryId: string): Promise<Category[]>;
    getDescendants(categoryId: string): Promise<Category[]>;
    moveCategory(categoryId: string, newParentId: string | null): Promise<Category>;
    isSlugUnique(slug: string, excludeId?: string): Promise<boolean>;
    getCategoriesWithResourceCounts(): Promise<CategoryWithChildren[]>;
    searchByName(query: string, limit?: number): Promise<Category[]>;
    getStatistics(): Promise<{
        total: number;
        rootCategories: number;
        maxDepth: number;
        avgResourcesPerCategory: number;
    }>;
}
