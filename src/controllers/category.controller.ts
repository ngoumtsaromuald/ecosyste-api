import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  ParseBoolPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryTreeResponseDto } from '../dto/category-tree-response.dto';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(ThrottlerGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ 
    summary: 'List all categories',
    description: 'Retrieve all categories in a flat list with optional hierarchical structure'
  })
  @ApiQuery({
    name: 'tree',
    required: false,
    type: Boolean,
    description: 'Return categories in hierarchical tree structure',
    example: false
  })
  @ApiQuery({
    name: 'rootsOnly',
    required: false,
    type: Boolean,
    description: 'Return only root categories (no parent)',
    example: false
  })
  @ApiQuery({
    name: 'includeChildren',
    required: false,
    type: Boolean,
    description: 'Include children when rootsOnly=true',
    example: false
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree?: boolean,
    @Query('rootsOnly', new DefaultValuePipe(false), ParseBoolPipe) rootsOnly?: boolean,
    @Query('includeChildren', new DefaultValuePipe(false), ParseBoolPipe) includeChildren?: boolean
  ): Promise<CategoryResponseDto[] | CategoryTreeResponseDto[]> {
    if (tree) {
      return this.categoryService.getCategoryTree();
    } else if (rootsOnly) {
      return this.categoryService.getRootCategories(includeChildren);
    } else {
      return this.categoryService.findAll();
    }
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Search categories',
    description: 'Search categories by name or description'
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query',
    example: 'restaurant'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results',
    example: 10
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 400, description: 'Missing or invalid search query' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async search(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number
  ): Promise<CategoryResponseDto[]> {
    return this.categoryService.search(query, limit);
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get category statistics',
    description: 'Retrieve statistical overview of categories'
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStatistics() {
    return this.categoryService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get category by ID',
    description: 'Retrieve a specific category by its ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved category',
    type: CategoryResponseDto
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<CategoryResponseDto> {
    return this.categoryService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ 
    summary: 'Get category by slug',
    description: 'Retrieve a specific category by its slug'
  })
  @ApiParam({ 
    name: 'slug', 
    description: 'Category slug',
    example: 'restaurants'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved category',
    type: CategoryResponseDto
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findBySlug(
    @Param('slug') slug: string
  ): Promise<CategoryResponseDto> {
    return this.categoryService.findBySlug(slug);
  }

  @Get(':id/children')
  @ApiOperation({ 
    summary: 'Get category children',
    description: 'Retrieve all direct children of a category'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Parent category ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'includeGrandchildren',
    required: false,
    type: Boolean,
    description: 'Include grandchildren in the response',
    example: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved category children',
    type: [CategoryTreeResponseDto]
  })
  @ApiResponse({ status: 404, description: 'Parent category not found' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getChildren(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeGrandchildren', new DefaultValuePipe(false), ParseBoolPipe) includeGrandchildren?: boolean
  ): Promise<CategoryTreeResponseDto[]> {
    return this.categoryService.getChildren(id, includeGrandchildren);
  }

  @Get(':id/path')
  @ApiOperation({ 
    summary: 'Get category path',
    description: 'Retrieve the full path (breadcrumb) from root to the specified category'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCategoryPath(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<CategoryResponseDto[]> {
    return this.categoryService.getCategoryPath(id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create a new category',
    description: 'Create a new category with hierarchical support (admin only)'
  })
  @ApiBody({ 
    type: CreateCategoryDto,
    description: 'Category data to create'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Successfully created category',
    type: CategoryResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 409, description: 'Category with similar name already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  async create(
    @Body() createCategoryDto: CreateCategoryDto
  ): Promise<CategoryResponseDto> {
    // TODO: Add admin role check when authentication is implemented
    // For now, we'll allow creation without authentication
    return this.categoryService.create(createCategoryDto);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update an existing category',
    description: 'Update a category with validation and hierarchy management (admin only)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ 
    type: UpdateCategoryDto,
    description: 'Category data to update'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully updated category',
    type: CategoryResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category with similar name already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBearerAuth('JWT-auth')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ): Promise<CategoryResponseDto> {
    // TODO: Add admin role check when authentication is implemented
    // For now, we'll allow updates without authentication
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete a category',
    description: 'Delete a category (only if it has no children or associated resources) (admin only)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Successfully deleted category'
  })
  @ApiResponse({ status: 400, description: 'Cannot delete category with children or resources' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  async remove(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    // TODO: Add admin role check when authentication is implemented
    // For now, we'll allow deletion without authentication
    return this.categoryService.delete(id);
  }
}