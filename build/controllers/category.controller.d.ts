import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryTreeResponseDto } from '../dto/category-tree-response.dto';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    findAll(tree?: boolean, rootsOnly?: boolean, includeChildren?: boolean): Promise<CategoryResponseDto[] | CategoryTreeResponseDto[]>;
    search(query: string, limit?: number): Promise<CategoryResponseDto[]>;
    getStatistics(): Promise<{
        total: number;
        rootCategories: number;
        maxDepth: number;
        avgResourcesPerCategory: number;
    }>;
    findById(id: string): Promise<CategoryResponseDto>;
    findBySlug(slug: string): Promise<CategoryResponseDto>;
    getChildren(id: string, includeGrandchildren?: boolean): Promise<CategoryTreeResponseDto[]>;
    getCategoryPath(id: string): Promise<CategoryResponseDto[]>;
    create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto>;
    remove(id: string): Promise<void>;
}
