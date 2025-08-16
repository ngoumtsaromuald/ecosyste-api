import { CategoryRepository } from '../repositories/category.repository';
import { CacheService } from '../config/cache.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryTreeResponseDto } from '../dto/category-tree-response.dto';
export declare class CategoryService {
    private readonly categoryRepository;
    private readonly cacheService;
    constructor(categoryRepository: CategoryRepository, cacheService: CacheService);
    findAll(): Promise<CategoryResponseDto[]>;
    getCategoryTree(): Promise<CategoryTreeResponseDto[]>;
    getRootCategories(includeChildren?: boolean): Promise<CategoryTreeResponseDto[]>;
    findById(id: string): Promise<CategoryResponseDto>;
    findBySlug(slug: string): Promise<CategoryResponseDto>;
    getChildren(parentId: string, includeGrandchildren?: boolean): Promise<CategoryTreeResponseDto[]>;
    create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto>;
    delete(id: string): Promise<void>;
    getCategoryPath(categoryId: string): Promise<CategoryResponseDto[]>;
    search(query: string, limit?: number): Promise<CategoryResponseDto[]>;
    getStatistics(): Promise<{
        total: number;
        rootCategories: number;
        maxDepth: number;
        avgResourcesPerCategory: number;
    }>;
    private generateSlug;
    private toCategoryResponseDto;
    private toCategoryTreeResponseDto;
    private invalidateCache;
}
