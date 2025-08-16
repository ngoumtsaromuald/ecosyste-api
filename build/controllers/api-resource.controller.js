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
exports.ApiResourceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const api_resource_service_1 = require("../services/api-resource.service");
const create_api_resource_dto_1 = require("../dto/create-api-resource.dto");
const update_api_resource_dto_1 = require("../dto/update-api-resource.dto");
const find_api_resources_dto_1 = require("../dto/find-api-resources.dto");
const api_resource_response_dto_1 = require("../dto/api-resource-response.dto");
const ingest_api_resources_dto_1 = require("../dto/ingest-api-resources.dto");
let ApiResourceController = class ApiResourceController {
    constructor(apiResourceService) {
        this.apiResourceService = apiResourceService;
    }
    async findAll(query) {
        return this.apiResourceService.findAll(query);
    }
    async search(query) {
        return this.apiResourceService.search(query);
    }
    async findById(id) {
        return this.apiResourceService.findById(id);
    }
    async create(createApiResourceDto, req) {
        const userId = req.user?.id || 'mock-user-id';
        return this.apiResourceService.create(createApiResourceDto, userId);
    }
    async update(id, updateApiResourceDto, req) {
        const userId = req.user?.id || 'mock-user-id';
        return this.apiResourceService.update(id, updateApiResourceDto, userId);
    }
    async remove(id, req) {
        const userId = req.user?.id || 'mock-user-id';
        return this.apiResourceService.softDelete(id, userId);
    }
    async ingest(ingestDto, req) {
        const userId = req.user?.id || 'mock-user-id';
        return this.apiResourceService.ingest(ingestDto, userId);
    }
    async getStatistics() {
        return this.apiResourceService.getStatistics();
    }
    async findByUserId(userId, limit, offset) {
        return this.apiResourceService.findByUserId(userId, { limit, offset });
    }
    async findByCategory(categoryId, limit, offset) {
        return this.apiResourceService.findByCategory(categoryId, { limit, offset });
    }
    async findBySlug(slug) {
        return this.apiResourceService.findBySlug(slug);
    }
};
exports.ApiResourceController = ApiResourceController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List API resources with pagination and filtering',
        description: 'Retrieve a paginated list of API resources with optional filtering by various criteria'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid query parameters' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_api_resources_dto_1.FindApiResourcesDto]),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({
        summary: 'Search API resources',
        description: 'Advanced search functionality for API resources with full-text search and filtering'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid search parameters' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_api_resources_dto_1.FindApiResourcesDto]),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get API resource by ID',
        description: 'Retrieve a specific API resource by its ID with caching for optimal performance'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'API Resource ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully retrieved API resource',
        type: api_resource_response_dto_1.ApiResourceResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'API Resource not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid UUID format' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new API resource',
        description: 'Create a new API resource with validation, enrichment, and automatic slug generation'
    }),
    (0, swagger_1.ApiBody)({
        type: create_api_resource_dto_1.CreateApiResourceDto,
        description: 'API Resource data to create'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Successfully created API resource',
        type: api_resource_response_dto_1.ApiResourceResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed or invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - authentication required' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Resource with similar name already exists' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_api_resource_dto_1.CreateApiResourceDto, Object]),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update an existing API resource',
        description: 'Update an API resource with validation and history preservation'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'API Resource ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiBody)({
        type: update_api_resource_dto_1.UpdateApiResourceDto,
        description: 'API Resource data to update'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully updated API resource',
        type: api_resource_response_dto_1.ApiResourceResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed or invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - authentication required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - can only update own resources' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'API Resource not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_api_resource_dto_1.UpdateApiResourceDto, Object]),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete an API resource',
        description: 'Soft delete an API resource (marks as deleted without removing from database)'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'API Resource ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'Successfully deleted API resource'
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - authentication required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - can only delete own resources' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'API Resource not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('ingest'),
    (0, swagger_1.ApiOperation)({
        summary: 'Bulk ingest API resources',
        description: 'Bulk import multiple API resources with validation, deduplication, and detailed error reporting'
    }),
    (0, swagger_1.ApiBody)({
        type: ingest_api_resources_dto_1.IngestApiResourcesDto,
        description: 'Bulk API Resource data to ingest'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully processed bulk ingest',
        type: ingest_api_resources_dto_1.IngestResultDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed or invalid batch data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - authentication required' }),
    (0, swagger_1.ApiResponse)({ status: 413, description: 'Payload too large - reduce batch size' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ingest_api_resources_dto_1.IngestApiResourcesDto, Object]),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "ingest", null);
__decorate([
    (0, common_1.Get)('statistics/overview'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get API resources statistics',
        description: 'Retrieve statistical overview of API resources for dashboard purposes'
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
    }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get API resources by user ID',
        description: 'Retrieve all API resources belonging to a specific user'
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'User ID',
        example: '456e7890-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of items per page',
        example: 20
    }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        required: false,
        type: Number,
        description: 'Number of items to skip',
        example: 0
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid user ID format' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "findByUserId", null);
__decorate([
    (0, common_1.Get)('category/:categoryId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get API resources by category ID',
        description: 'Retrieve all API resources belonging to a specific category'
    }),
    (0, swagger_1.ApiParam)({
        name: 'categoryId',
        description: 'Category ID',
        example: '789e0123-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of items per page',
        example: 20
    }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        required: false,
        type: Number,
        description: 'Number of items to skip',
        example: 0
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid category ID format' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Param)('categoryId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "findByCategory", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get API resource by slug',
        description: 'Retrieve a specific API resource by its slug with caching for optimal performance'
    }),
    (0, swagger_1.ApiParam)({
        name: 'slug',
        description: 'API Resource slug',
        example: 'restaurant-le-palais'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully retrieved API resource',
        type: api_resource_response_dto_1.ApiResourceResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'API Resource not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApiResourceController.prototype, "findBySlug", null);
exports.ApiResourceController = ApiResourceController = __decorate([
    (0, swagger_1.ApiTags)('API Resources'),
    (0, common_1.Controller)('api-resources'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    __metadata("design:paramtypes", [api_resource_service_1.ApiResourceService])
], ApiResourceController);
//# sourceMappingURL=api-resource.controller.js.map