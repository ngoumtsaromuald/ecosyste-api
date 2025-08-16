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
  Request,
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
import { ApiResourceService, FindAllResult } from '../services/api-resource.service';
import { CreateApiResourceDto } from '../dto/create-api-resource.dto';
import { UpdateApiResourceDto } from '../dto/update-api-resource.dto';
import { FindApiResourcesDto } from '../dto/find-api-resources.dto';
import { ApiResourceResponseDto } from '../dto/api-resource-response.dto';
import { IngestApiResourcesDto, IngestResultDto } from '../dto/ingest-api-resources.dto';

@ApiTags('API Resources')
@Controller('api-resources')
@UseGuards(ThrottlerGuard)
export class ApiResourceController {
  constructor(private readonly apiResourceService: ApiResourceService) {}

  @Get()
  @ApiOperation({ 
    summary: 'List API resources with pagination and filtering',
    description: 'Retrieve a paginated list of API resources with optional filtering by various criteria'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved API resources',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            resources: {
              type: 'array',
              items: { $ref: '#/components/schemas/ApiResourceResponseDto' }
            },
            total: { type: 'number', example: 150 },
            page: { type: 'number', example: 1 },
            totalPages: { type: 'number', example: 8 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false }
          }
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(@Query() query: FindApiResourcesDto): Promise<FindAllResult> {
    return this.apiResourceService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Search API resources',
    description: 'Advanced search functionality for API resources with full-text search and filtering'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved search results',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            resources: {
              type: 'array',
              items: { $ref: '#/components/schemas/ApiResourceResponseDto' }
            },
            total: { type: 'number', example: 25 },
            page: { type: 'number', example: 1 },
            totalPages: { type: 'number', example: 2 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false }
          }
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid search parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async search(@Query() query: FindApiResourcesDto): Promise<FindAllResult> {
    return this.apiResourceService.search(query);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get API resource by ID',
    description: 'Retrieve a specific API resource by its ID with caching for optimal performance'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'API Resource ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved API resource',
    type: ApiResourceResponseDto
  })
  @ApiResponse({ status: 404, description: 'API Resource not found' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiResourceResponseDto> {
    return this.apiResourceService.findById(id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create a new API resource',
    description: 'Create a new API resource with validation, enrichment, and automatic slug generation'
  })
  @ApiBody({ 
    type: CreateApiResourceDto,
    description: 'API Resource data to create'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Successfully created API resource',
    type: ApiResourceResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 409, description: 'Resource with similar name already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  async create(
    @Body() createApiResourceDto: CreateApiResourceDto,
    @Request() req: any
  ): Promise<ApiResourceResponseDto> {
    // For now, we'll use a mock user ID since authentication is not implemented yet
    // In a real implementation, this would come from the JWT token
    const userId = req.user?.id || 'mock-user-id';
    
    return this.apiResourceService.create(createApiResourceDto, userId);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update an existing API resource',
    description: 'Update an API resource with validation and history preservation'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'API Resource ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ 
    type: UpdateApiResourceDto,
    description: 'API Resource data to update'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully updated API resource',
    type: ApiResourceResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own resources' })
  @ApiResponse({ status: 404, description: 'API Resource not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBearerAuth('JWT-auth')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateApiResourceDto: UpdateApiResourceDto,
    @Request() req: any
  ): Promise<ApiResourceResponseDto> {
    // For now, we'll use a mock user ID since authentication is not implemented yet
    const userId = req.user?.id || 'mock-user-id';
    
    return this.apiResourceService.update(id, updateApiResourceDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete an API resource',
    description: 'Soft delete an API resource (marks as deleted without removing from database)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'API Resource ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Successfully deleted API resource'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own resources' })
  @ApiResponse({ status: 404, description: 'API Resource not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ): Promise<void> {
    // For now, we'll use a mock user ID since authentication is not implemented yet
    const userId = req.user?.id || 'mock-user-id';
    
    return this.apiResourceService.softDelete(id, userId);
  }

  @Post('ingest')
  @ApiOperation({ 
    summary: 'Bulk ingest API resources',
    description: 'Bulk import multiple API resources with validation, deduplication, and detailed error reporting'
  })
  @ApiBody({ 
    type: IngestApiResourcesDto,
    description: 'Bulk API Resource data to ingest'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully processed bulk ingest',
    type: IngestResultDto
  })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid batch data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 413, description: 'Payload too large - reduce batch size' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBearerAuth('JWT-auth')
  async ingest(
    @Body() ingestDto: IngestApiResourcesDto,
    @Request() req: any
  ): Promise<IngestResultDto> {
    // For now, we'll use a mock user ID since authentication is not implemented yet
    const userId = req.user?.id || 'mock-user-id';
    
    return this.apiResourceService.ingest(ingestDto, userId);
  }

  @Get('statistics/overview')
  @ApiOperation({ 
    summary: 'Get API resources statistics',
    description: 'Retrieve statistical overview of API resources for dashboard purposes'
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
            total: { type: 'number', example: 1250 },
            byStatus: {
              type: 'object',
              properties: {
                ACTIVE: { type: 'number', example: 980 },
                PENDING: { type: 'number', example: 200 },
                SUSPENDED: { type: 'number', example: 70 }
              }
            },
            byPlan: {
              type: 'object',
              properties: {
                FREE: { type: 'number', example: 800 },
                PREMIUM: { type: 'number', example: 350 },
                FEATURED: { type: 'number', example: 100 }
              }
            },
            byType: {
              type: 'object',
              properties: {
                BUSINESS: { type: 'number', example: 900 },
                SERVICE: { type: 'number', example: 250 },
                DATA: { type: 'number', example: 80 },
                API: { type: 'number', example: 20 }
              }
            },
            recentCount: { type: 'number', example: 45 }
          }
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStatistics() {
    return this.apiResourceService.getStatistics();
  }

  @Get('user/:userId')
  @ApiOperation({ 
    summary: 'Get API resources by user ID',
    description: 'Retrieve all API resources belonging to a specific user'
  })
  @ApiParam({ 
    name: 'userId', 
    description: 'User ID',
    example: '456e7890-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of items per page',
    example: 20 
  })
  @ApiQuery({ 
    name: 'offset', 
    required: false, 
    type: Number, 
    description: 'Number of items to skip',
    example: 0 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved user API resources',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            resources: {
              type: 'array',
              items: { $ref: '#/components/schemas/ApiResourceResponseDto' }
            },
            total: { type: 'number', example: 15 },
            page: { type: 'number', example: 1 },
            totalPages: { type: 'number', example: 1 },
            hasNext: { type: 'boolean', example: false },
            hasPrev: { type: 'boolean', example: false }
          }
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid user ID format' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<FindAllResult> {
    return this.apiResourceService.findByUserId(userId, { limit, offset });
  }

  @Get('category/:categoryId')
  @ApiOperation({ 
    summary: 'Get API resources by category ID',
    description: 'Retrieve all API resources belonging to a specific category'
  })
  @ApiParam({ 
    name: 'categoryId', 
    description: 'Category ID',
    example: '789e0123-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of items per page',
    example: 20 
  })
  @ApiQuery({ 
    name: 'offset', 
    required: false, 
    type: Number, 
    description: 'Number of items to skip',
    example: 0 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved category API resources',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            resources: {
              type: 'array',
              items: { $ref: '#/components/schemas/ApiResourceResponseDto' }
            },
            total: { type: 'number', example: 85 },
            page: { type: 'number', example: 1 },
            totalPages: { type: 'number', example: 5 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false }
          }
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid category ID format' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<FindAllResult> {
    return this.apiResourceService.findByCategory(categoryId, { limit, offset });
  }

  @Get('slug/:slug')
  @ApiOperation({ 
    summary: 'Get API resource by slug',
    description: 'Retrieve a specific API resource by its slug with caching for optimal performance'
  })
  @ApiParam({ 
    name: 'slug', 
    description: 'API Resource slug',
    example: 'restaurant-le-palais'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved API resource',
    type: ApiResourceResponseDto
  })
  @ApiResponse({ status: 404, description: 'API Resource not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findBySlug(
    @Param('slug') slug: string
  ): Promise<ApiResourceResponseDto> {
    return this.apiResourceService.findBySlug(slug);
  }
}