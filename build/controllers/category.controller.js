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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const category_service_1 = require("../services/category.service");
const create_category_dto_1 = require("../dto/create-category.dto");
const update_category_dto_1 = require("../dto/update-category.dto");
const category_response_dto_1 = require("../dto/category-response.dto");
const category_tree_response_dto_1 = require("../dto/category-tree-response.dto");
let CategoryController = class CategoryController {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    async findAll(tree, rootsOnly, includeChildren) {
        if (tree) {
            return this.categoryService.getCategoryTree();
        }
        else if (rootsOnly) {
            return this.categoryService.getRootCategories(includeChildren);
        }
        else {
            return this.categoryService.findAll();
        }
    }
    async search(query, limit) {
        return this.categoryService.search(query, limit);
    }
    async getStatistics() {
        return this.categoryService.getStatistics();
    }
    async findById(id) {
        return this.categoryService.findById(id);
    }
    async findBySlug(slug) {
        return this.categoryService.findBySlug(slug);
    }
    async getChildren(id, includeGrandchildren) {
        return this.categoryService.getChildren(id, includeGrandchildren);
    }
    async getCategoryPath(id) {
        return this.categoryService.getCategoryPath(id);
    }
    async create(createCategoryDto) {
        return this.categoryService.create(createCategoryDto);
    }
    async update(id, updateCategoryDto) {
        return this.categoryService.update(id, updateCategoryDto);
    }
    async remove(id) {
        return this.categoryService.delete(id);
    }
};
exports.CategoryController = CategoryController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all categories',
        description: 'Retrieve all categories in a flat list with optional hierarchical structure'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'tree',
        required: false,
        type: Boolean,
        description: 'Return categories in hierarchical tree structure',
        example: false
    }),
    (0, swagger_1.ApiQuery)({
        name: 'rootsOnly',
        required: false,
        type: Boolean,
        description: 'Return only root categories (no parent)',
        example: false
    }),
    (0, swagger_1.ApiQuery)({
        name: 'includeChildren',
        required: false,
        type: Boolean,
        description: 'Include children when rootsOnly=true',
        example: false
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully retrieved categories',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CategoryResponseDto' }
                },
                timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Query)('tree', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __param(1, (0, common_1.Query)('rootsOnly', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __param(2, (0, common_1.Query)('includeChildren', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean, Boolean, Boolean]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({
        summary: 'Search categories',
        description: 'Search categories by name or description'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'q',
        required: true,
        type: String,
        description: 'Search query',
        example: 'restaurant'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Maximum number of results',
        example: 10
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully retrieved search results',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CategoryResponseDto' }
                },
                timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing or invalid search query' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get category statistics',
        description: 'Retrieve statistical overview of categories'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully retrieved statistics',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 45 },
                        rootCategories: { type: 'number', example: 8 },
                        maxDepth: { type: 'number', example: 3 },
                        avgResourcesPerCategory: { type: 'number', example: 12.5 }
                    }
                },
                timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get category by ID',
        description: 'Retrieve a specific category by its ID'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully retrieved category',
        type: category_response_dto_1.CategoryResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid UUID format' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get category by slug',
        description: 'Retrieve a specific category by its slug'
    }),
    (0, swagger_1.ApiParam)({
        name: 'slug',
        description: 'Category slug',
        example: 'restaurants'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully retrieved category',
        type: category_response_dto_1.CategoryResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Get)(':id/children'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get category children',
        description: 'Retrieve all direct children of a category'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Parent category ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'includeGrandchildren',
        required: false,
        type: Boolean,
        description: 'Include grandchildren in the response',
        example: false
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully retrieved category children',
        type: [category_tree_response_dto_1.CategoryTreeResponseDto]
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Parent category not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid UUID format' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('includeGrandchildren', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "getChildren", null);
__decorate([
    (0, common_1.Get)(':id/path'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get category path',
        description: 'Retrieve the full path (breadcrumb) from root to the specified category'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully retrieved category path',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CategoryResponseDto' }
                },
                timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid UUID format' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "getCategoryPath", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new category',
        description: 'Create a new category with hierarchical support (admin only)'
    }),
    (0, swagger_1.ApiBody)({
        type: create_category_dto_1.CreateCategoryDto,
        description: 'Category data to create'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Successfully created category',
        type: category_response_dto_1.CategoryResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed or invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - authentication required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - admin access required' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Category with similar name already exists' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_category_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update an existing category',
        description: 'Update a category with validation and hierarchy management (admin only)'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiBody)({
        type: update_category_dto_1.UpdateCategoryDto,
        description: 'Category data to update'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully updated category',
        type: category_response_dto_1.CategoryResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed or invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - authentication required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - admin access required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Category with similar name already exists' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_category_dto_1.UpdateCategoryDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a category',
        description: 'Delete a category (only if it has no children or associated resources) (admin only)'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'Successfully deleted category'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot delete category with children or resources' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - authentication required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - admin access required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "remove", null);
exports.CategoryController = CategoryController = __decorate([
    (0, swagger_1.ApiTags)('Categories'),
    (0, common_1.Controller)('categories'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    __metadata("design:paramtypes", [category_service_1.CategoryService])
], CategoryController);
//# sourceMappingURL=category.controller.js.map