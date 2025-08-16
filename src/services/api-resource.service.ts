import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomLoggerService } from '../config/logger.service';
import { ApiResourceRepository, SearchFilters } from '../repositories/api-resource.repository';
import { PaginationOptions } from '../repositories/types';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../config/cache.service';
import { ValidationService } from './validation.service';
import { EnrichmentService } from './enrichment.service';
import { CreateApiResourceDto } from '../dto/create-api-resource.dto';
import { UpdateApiResourceDto } from '../dto/update-api-resource.dto';
import { FindApiResourcesDto } from '../dto/find-api-resources.dto';
import { ApiResourceResponseDto } from '../dto/api-resource-response.dto';
import { IngestApiResourcesDto, IngestResultDto, IngestItemResultDto } from '../dto/ingest-api-resources.dto';
import { ResourceStatus } from '../domain/enums';
import { ApiResourceMapper } from '../mappers/api-resource.mapper';

export interface FindAllResult {
  resources: ApiResourceResponseDto[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Injectable()
export class ApiResourceService {
  constructor(
    private readonly repository: ApiResourceRepository,
    private readonly cacheService: CacheService,
    private readonly validationService: ValidationService,
    private readonly enrichmentService: EnrichmentService,
    private readonly logger: CustomLoggerService,
  ) { }

  /**
   * Find all API resources with filters, pagination, and caching
   */
  async findAll(query: FindApiResourcesDto): Promise<FindAllResult> {
    this.logger.debug(`Finding API resources with query:`, query);

    // Build cache key based on query parameters
    const cacheKey = this.buildCacheKey('list', query);

    // Try cache first
    const cached = await this.cacheService.get<FindAllResult>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for findAll: ${cacheKey}`);
      return cached;
    }

    // Cache miss - query database
    this.logger.debug(`Cache miss for findAll: ${cacheKey}`);

    // Build search filters
    const filters: SearchFilters = {
      name: query.search,
      categoryId: query.categoryId,
      status: query.status,
      plan: query.plan,
      resourceType: query.resourceType,
      verified: query.verified,
      city: query.city,
      region: query.region,
      country: query.country,
    };

    // Build pagination options
    const pagination: PaginationOptions = {
      limit: query.limit || 20,
      offset: query.offset || 0,
    };

    let result: { resources: any[]; total: number };

    // Handle location-based search
    if (query.latitude && query.longitude) {
      const radius = query.radius || 10;
      result = await this.repository.findNearLocation(
        query.latitude,
        query.longitude,
        radius,
        pagination,
      );
    } else {
      result = await this.repository.search(filters, pagination);
    }

    // Transform to response DTOs
    const resources = result.resources.map((resource: any) =>
      ApiResourceMapper.toResponseDtoFromPrisma(resource)
    );

    // Calculate pagination metadata
    const page = Math.floor((pagination.offset || 0) / (pagination.limit || 20)) + 1;
    const totalPages = Math.ceil(result.total / (pagination.limit || 20));

    const response: FindAllResult = {
      resources,
      total: result.total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, response, CACHE_TTL.SEARCH);

    this.logger.debug(`Found ${result.total} resources, returning page ${page}/${totalPages}`);
    return response;
  }

  /**
   * Find API resource by ID with caching
   */
  async findById(id: string): Promise<ApiResourceResponseDto> {
    this.logger.debug(`Finding API resource by ID: ${id}`);

    const cacheKey = CACHE_KEYS.API_RESOURCE.BY_ID(id);

    // Try cache first
    const cached = await this.cacheService.get<ApiResourceResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for findById: ${id}`);
      return cached;
    }

    // Cache miss - query database
    const resource = await this.repository.findById(id, {
      category: true,
      images: { orderBy: { orderIndex: 'asc' } },
      hours: { orderBy: { dayOfWeek: 'asc' } },
    });

    if (!resource) {
      throw new NotFoundException(`API Resource with ID ${id} not found`);
    }

    const responseDto = ApiResourceMapper.toResponseDtoFromPrisma(resource as any);

    // Cache the result
    await this.cacheService.set(cacheKey, responseDto, CACHE_TTL.API_RESOURCE);

    this.logger.debug(`Found API resource: ${resource.name}`);
    return responseDto;
  }

  /**
   * Find API resource by slug with caching
   */
  async findBySlug(slug: string): Promise<ApiResourceResponseDto> {
    this.logger.debug(`Finding API resource by slug: ${slug}`);

    const cacheKey = CACHE_KEYS.API_RESOURCE.BY_SLUG(slug);

    // Try cache first
    const cached = await this.cacheService.get<ApiResourceResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for findBySlug: ${slug}`);
      return cached;
    }

    // Cache miss - query database
    const resource = await this.repository.findBySlug(slug, {
      category: true,
      images: { orderBy: { orderIndex: 'asc' } },
      hours: { orderBy: { dayOfWeek: 'asc' } },
    });

    if (!resource) {
      throw new NotFoundException(`API Resource with slug '${slug}' not found`);
    }

    const responseDto = ApiResourceMapper.toResponseDtoFromPrisma(resource as any);

    // Cache the result
    await this.cacheService.set(cacheKey, responseDto, CACHE_TTL.API_RESOURCE);

    this.logger.debug(`Found API resource: ${resource.name}`);
    return responseDto;
  }

  /**
   * Create a new API resource with validation and enrichment
   */
  async create(createDto: CreateApiResourceDto, userId: string): Promise<ApiResourceResponseDto> {
    this.logger.debug(`Creating API resource: ${createDto.name} for user: ${userId}`);

    // Validate the DTO
    await this.validationService.validateCreateApiResourceDtoOrThrow(createDto, userId);

    // Enrich the data
    const enrichedData = await this.enrichmentService.enrich(createDto);

    // Validate enriched data
    const enrichmentErrors = this.enrichmentService.validateEnrichedData(enrichedData);
    if (enrichmentErrors.length > 0) {
      throw new BadRequestException(`Enrichment validation failed: ${enrichmentErrors.join(', ')}`);
    }

    // Check slug uniqueness
    const isSlugUnique = await this.repository.isSlugUnique(enrichedData.slug);
    if (!isSlugUnique) {
      // Generate a unique slug by appending a number
      let counter = 1;
      let uniqueSlug = `${enrichedData.slug}-${counter}`;

      while (!(await this.repository.isSlugUnique(uniqueSlug))) {
        counter++;
        uniqueSlug = `${enrichedData.slug}-${counter}`;
      }

      enrichedData.slug = uniqueSlug;
      this.logger.debug(`Slug was not unique, using: ${uniqueSlug}`);
    }

    // Convert to repository data format
    const createData = {
      userId,
      name: enrichedData.name,
      slug: enrichedData.slug,
      description: enrichedData.description,
      resourceType: enrichedData.resourceType,
      categoryId: enrichedData.categoryId,
      addressLine1: enrichedData.address?.addressLine1,
      addressLine2: enrichedData.address?.addressLine2,
      city: enrichedData.address?.city,
      region: enrichedData.address?.region,
      postalCode: enrichedData.address?.postalCode,
      country: enrichedData.address?.country || 'CM',
      latitude: enrichedData.address?.latitude,
      longitude: enrichedData.address?.longitude,
      phone: enrichedData.contact?.phone,
      email: enrichedData.contact?.email,
      website: enrichedData.contact?.website,
      metaTitle: enrichedData.seo?.metaTitle,
      metaDescription: enrichedData.seo?.metaDescription,
    };

    // Create the resource
    const createdResource = await this.repository.create(createData);

    // Log audit event for resource creation
    this.logger.logAudit({
      action: 'CREATE_API_RESOURCE',
      resource: 'api_resource',
      userId,
      newValues: {
        id: createdResource.id,
        name: createdResource.name,
        slug: createdResource.slug,
        resourceType: createdResource.resourceType,
        status: createdResource.status,
      },
    });

    // Log business event
    this.logger.logBusiness('API_RESOURCE_CREATED', {
      resourceId: createdResource.id,
      resourceName: createdResource.name,
      resourceType: createdResource.resourceType,
      userId,
    });

    // Invalidate related caches
    await this.invalidateResourceCaches();

    // Fetch the created resource with relations for response
    const resourceWithRelations = await this.repository.findById(createdResource.id, {
      category: true,
      images: { orderBy: { orderIndex: 'asc' } },
      hours: { orderBy: { dayOfWeek: 'asc' } },
    });

    const responseDto = ApiResourceMapper.toResponseDtoFromPrisma(resourceWithRelations as any);

    this.logger.log(`Created API resource: ${createdResource.name} with ID: ${createdResource.id}`, {
      context: 'ApiResourceService',
      userId,
      resourceId: createdResource.id,
      action: 'create',
    });
    
    return responseDto;
  }

  /**
   * Update an existing API resource with validation and history preservation
   */
  async update(id: string, updateDto: UpdateApiResourceDto, userId: string): Promise<ApiResourceResponseDto> {
    this.logger.debug(`Updating API resource: ${id} for user: ${userId}`);

    // Find existing resource
    const existingResource = await this.repository.findById(id);
    if (!existingResource) {
      throw new NotFoundException(`API Resource with ID ${id} not found`);
    }

    // Check ownership
    if (existingResource.userId !== userId) {
      throw new BadRequestException('You can only update your own resources');
    }

    // Validate the update DTO
    await this.validationService.validateUpdateApiResourceDtoOrThrow(updateDto, id, userId);

    // Handle slug changes
    let finalUpdateData = { ...updateDto };
    if (updateDto.name && updateDto.name !== existingResource.name) {
      // Generate new slug if name changed
      const newSlug = this.enrichmentService.generateSlug(updateDto.name);
      const isSlugUnique = await this.repository.isSlugUnique(newSlug, id);

      if (!isSlugUnique) {
        let counter = 1;
        let uniqueSlug = `${newSlug}-${counter}`;

        while (!(await this.repository.isSlugUnique(uniqueSlug, id))) {
          counter++;
          uniqueSlug = `${newSlug}-${counter}`;
        }

        finalUpdateData.slug = uniqueSlug;
      } else {
        finalUpdateData.slug = newSlug;
      }
    }

    // Convert DTO to repository update format
    const updateData = this.convertUpdateDtoToRepositoryData(finalUpdateData);

    // Handle status changes
    if (updateDto.status === ResourceStatus.ACTIVE && existingResource.status !== ResourceStatus.ACTIVE) {
      // Resource is being published
      updateData.publishedAt = new Date();
    }

    // Update the resource
    const updatedResource = await this.repository.update(id, updateData);

    // Log audit event for resource update
    const changes = this.getChanges(existingResource, finalUpdateData);
    if (Object.keys(changes).length > 0) {
      this.logger.logAudit({
        action: 'UPDATE_API_RESOURCE',
        resource: 'api_resource',
        userId,
        changes,
        previousValues: this.extractAuditableFields(existingResource),
        newValues: this.extractAuditableFields(updatedResource),
      });

      // Log business event for significant changes
      if (changes.status || changes.name || changes.resourceType) {
        this.logger.logBusiness('API_RESOURCE_UPDATED', {
          resourceId: id,
          resourceName: updatedResource.name,
          changes: Object.keys(changes),
          userId,
        });
      }
    }

    // Fetch the updated resource with relations for response
    const resourceWithRelations = await this.repository.findById(id, {
      category: true,
      images: { orderBy: { orderIndex: 'asc' } },
      hours: { orderBy: { dayOfWeek: 'asc' } },
    });

    // Invalidate caches
    await this.invalidateResourceCaches(id, existingResource.slug);

    const responseDto = ApiResourceMapper.toResponseDtoFromPrisma(resourceWithRelations as any);

    this.logger.log(`Updated API resource: ${updatedResource.name}`, {
      context: 'ApiResourceService',
      userId,
      resourceId: id,
      action: 'update',
      changesCount: Object.keys(changes).length,
    });
    
    return responseDto;
  }

  /**
   * Soft delete an API resource
   */
  async softDelete(id: string, userId: string): Promise<void> {
    this.logger.debug(`Soft deleting API resource: ${id} for user: ${userId}`);

    // Find existing resource
    const existingResource = await this.repository.findById(id);
    if (!existingResource) {
      throw new NotFoundException(`API Resource with ID ${id} not found`);
    }

    // Check ownership
    if (existingResource.userId !== userId) {
      throw new BadRequestException('You can only delete your own resources');
    }

    // Soft delete the resource
    await this.repository.softDelete(id);

    // Invalidate caches
    await this.invalidateResourceCaches(id, existingResource.slug);

    this.logger.debug(`Soft deleted API resource: ${existingResource.name}`);
  }

  /**
   * Search API resources with advanced filtering
   */
  async search(query: FindApiResourcesDto): Promise<FindAllResult> {
    // For now, search is the same as findAll
    // In the future, this could implement more advanced search features like:
    // - Full-text search with Elasticsearch
    // - Fuzzy matching
    // - Search suggestions
    // - Search analytics
    return this.findAll(query);
  }

  /**
   * Get API resources by user ID
   */
  async findByUserId(userId: string, pagination: PaginationOptions = {}): Promise<FindAllResult> {
    this.logger.debug(`Finding API resources for user: ${userId}`);

    const result = await this.repository.findByUserId(userId, pagination);

    const resources = result.resources.map((resource: any) =>
      ApiResourceMapper.toResponseDtoFromPrisma(resource)
    );

    const page = Math.floor((pagination.offset || 0) / (pagination.limit || 20)) + 1;
    const totalPages = Math.ceil(result.total / (pagination.limit || 20));

    return {
      resources,
      total: result.total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Get API resources by category
   */
  async findByCategory(categoryId: string, pagination: PaginationOptions = {}): Promise<FindAllResult> {
    this.logger.debug(`Finding API resources for category: ${categoryId}`);

    const result = await this.repository.findByCategory(categoryId, pagination);

    const resources = result.resources.map((resource: any) =>
      ApiResourceMapper.toResponseDtoFromPrisma(resource)
    );

    const page = Math.floor((pagination.offset || 0) / (pagination.limit || 20)) + 1;
    const totalPages = Math.ceil(result.total / (pagination.limit || 20));

    return {
      resources,
      total: result.total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Bulk ingest API resources with validation and error handling
   */
  async ingest(ingestDto: IngestApiResourcesDto, userId: string): Promise<IngestResultDto> {
    const startTime = Date.now();
    this.logger.debug(`Starting bulk ingest of ${ingestDto.resources.length} resources for user: ${userId}`);

    const results: IngestItemResultDto[] = [];
    const errorSummary: Record<string, number> = {};
    let processed = 0;
    let failed = 0;
    let skipped = 0;

    // Validate batch size
    const batchSize = Math.min(ingestDto.batchSize || 50, 100);
    const resources = ingestDto.resources.slice(0, 1000); // Max 1000 resources per request

    // Process resources in batches
    for (let i = 0; i < resources.length; i += batchSize) {
      const batch = resources.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch, i, userId, ingestDto);

      results.push(...batchResults);

      // Update counters
      for (const result of batchResults) {
        switch (result.status) {
          case 'success':
            processed++;
            break;
          case 'failed':
            failed++;
            if (result.errorType) {
              errorSummary[result.errorType] = (errorSummary[result.errorType] || 0) + 1;
            }
            break;
          case 'skipped':
            skipped++;
            break;
        }
      }

      // Log progress
      this.logger.debug(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(resources.length / batchSize)}`);
    }

    // Invalidate caches after bulk operation
    await this.invalidateResourceCaches();

    const processingTimeMs = Date.now() - startTime;

    const result: IngestResultDto = {
      total: resources.length,
      processed,
      failed,
      skipped,
      processingTimeMs,
      results,
      errorSummary,
    };

    this.logger.debug(`Bulk ingest completed: ${processed} processed, ${failed} failed, ${skipped} skipped in ${processingTimeMs}ms`);
    return result;
  }

  /**
   * Process a batch of resources
   */
  private async processBatch(
    batch: CreateApiResourceDto[],
    startIndex: number,
    userId: string,
    options: IngestApiResourcesDto,
  ): Promise<IngestItemResultDto[]> {
    const results: IngestItemResultDto[] = [];

    for (let i = 0; i < batch.length; i++) {
      const resource = batch[i];
      const index = startIndex + i;
      const itemStartTime = Date.now();

      try {
        const result = await this.processIngestItem(resource, index, userId, options);
        result.processingTimeMs = Date.now() - itemStartTime;
        results.push(result);
      } catch (error) {
        const result: IngestItemResultDto = {
          index,
          name: resource.name || `Resource ${index}`,
          status: 'failed',
          error: error.message || 'Unknown error occurred',
          errorType: 'processing_error',
          processingTimeMs: Date.now() - itemStartTime,
        };
        results.push(result);

        if (!options.skipErrors) {
          throw error; // Stop processing if skipErrors is false
        }
      }
    }

    return results;
  }

  /**
   * Process a single resource item for ingestion
   */
  private async processIngestItem(
    resource: CreateApiResourceDto,
    index: number,
    userId: string,
    options: IngestApiResourcesDto,
  ): Promise<IngestItemResultDto> {
    const name = resource.name || `Resource ${index}`;

    try {
      // 1. Check for duplicates if enabled
      if (options.skipDuplicates) {
        const duplicateCheck = await this.checkForDuplicate(resource);
        if (duplicateCheck.isDuplicate) {
          return {
            index,
            name,
            status: 'skipped',
            skipReason: duplicateCheck.reason,
            processingTimeMs: 0,
          };
        }
      }

      // 2. Validate the resource
      try {
        await this.validationService.validateCreateApiResourceDtoOrThrow(resource, userId);
      } catch (validationError) {
        return {
          index,
          name,
          status: 'failed',
          error: validationError.message,
          errorType: 'validation_error',
          processingTimeMs: 0,
        };
      }

      // 3. Enrich the data
      let enrichedData: any;
      try {
        enrichedData = await this.enrichmentService.enrich(resource);
      } catch (enrichmentError) {
        return {
          index,
          name,
          status: 'failed',
          error: `Enrichment failed: ${enrichmentError.message}`,
          errorType: 'enrichment_error',
          processingTimeMs: 0,
        };
      }

      // 4. Validate enriched data
      const enrichmentErrors = this.enrichmentService.validateEnrichedData(enrichedData);
      if (enrichmentErrors.length > 0) {
        return {
          index,
          name,
          status: 'failed',
          error: `Enrichment validation failed: ${enrichmentErrors.join(', ')}`,
          errorType: 'enrichment_validation_error',
          processingTimeMs: 0,
        };
      }

      // 5. Handle slug conflicts
      let finalSlug = enrichedData.slug;
      const isSlugUnique = await this.repository.isSlugUnique(finalSlug);
      if (!isSlugUnique) {
        let counter = 1;
        let uniqueSlug = `${finalSlug}-${counter}`;

        while (!(await this.repository.isSlugUnique(uniqueSlug))) {
          counter++;
          uniqueSlug = `${finalSlug}-${counter}`;

          // Prevent infinite loop
          if (counter > 1000) {
            return {
              index,
              name,
              status: 'failed',
              error: 'Could not generate unique slug after 1000 attempts',
              errorType: 'slug_generation_error',
              processingTimeMs: 0,
            };
          }
        }

        finalSlug = uniqueSlug;
      }

      // 6. Create the resource
      const createData = {
        userId,
        name: enrichedData.name,
        slug: finalSlug,
        description: enrichedData.description,
        resourceType: enrichedData.resourceType,
        categoryId: enrichedData.categoryId,
        addressLine1: enrichedData.address?.addressLine1,
        addressLine2: enrichedData.address?.addressLine2,
        city: enrichedData.address?.city,
        region: enrichedData.address?.region,
        postalCode: enrichedData.address?.postalCode,
        country: enrichedData.address?.country || 'CM',
        latitude: enrichedData.address?.latitude,
        longitude: enrichedData.address?.longitude,
        phone: enrichedData.contact?.phone,
        email: enrichedData.contact?.email,
        website: enrichedData.contact?.website,
        metaTitle: enrichedData.seo?.metaTitle,
        metaDescription: enrichedData.seo?.metaDescription,
      };

      const createdResource = await this.repository.create(createData);

      return {
        index,
        name,
        status: 'success',
        resourceId: createdResource.id,
        slug: finalSlug,
        processingTimeMs: 0,
      };

    } catch (error) {
      return {
        index,
        name,
        status: 'failed',
        error: error.message || 'Unknown error occurred',
        errorType: 'creation_error',
        processingTimeMs: 0,
      };
    }
  }

  /**
   * Check if a resource is a duplicate
   */
  private async checkForDuplicate(resource: CreateApiResourceDto): Promise<{
    isDuplicate: boolean;
    reason?: string;
  }> {
    if (!resource.name) {
      return { isDuplicate: false };
    }

    // Check for exact name match (case-insensitive)
    const exactMatch = await this.repository.findMany({
      where: {
        name: {
          equals: resource.name,
          mode: 'insensitive',
        },
      },
      take: 1,
    });

    if (exactMatch.length > 0) {
      return {
        isDuplicate: true,
        reason: `Exact name match found: "${resource.name}"`,
      };
    }

    // Check for slug similarity
    const slug = this.enrichmentService.generateSlug(resource.name);
    const slugMatch = await this.repository.findBySlug(slug);

    if (slugMatch) {
      return {
        isDuplicate: true,
        reason: `Similar resource found with slug: "${slug}"`,
      };
    }

    // Check for similar names (fuzzy matching)
    if (resource.name.length > 3) {
      const similarResources = await this.repository.findMany({
        where: {
          name: {
            contains: resource.name.substring(0, Math.min(resource.name.length - 1, 10)),
            mode: 'insensitive',
          },
        },
        take: 5,
      });

      for (const similar of similarResources) {
        const similarity = this.calculateStringSimilarity(resource.name.toLowerCase(), similar.name.toLowerCase());
        if (similarity > 0.8) { // 80% similarity threshold
          return {
            isDuplicate: true,
            reason: `Similar resource found: "${similar.name}" (${Math.round(similarity * 100)}% similarity)`,
          };
        }
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Initialize matrix
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * Get statistics for dashboard
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPlan: Record<string, number>;
    byType: Record<string, number>;
    recentCount: number;
  }> {
    this.logger.debug('Getting API resource statistics');

    const cacheKey = 'api-resources:statistics';

    // Try cache first
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get statistics from repository
    const stats = await this.repository.getStatistics();

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, stats, 300);

    return stats;
  }

  /**
   * Build cache key for list queries
   */
  private buildCacheKey(operation: string, query: FindApiResourcesDto): string {
    const keyParts = [
      operation,
      query.search || '',
      query.resourceType || '',
      query.status || '',
      query.plan || '',
      query.categoryId || '',
      query.city || '',
      query.region || '',
      query.country || '',
      query.verified?.toString() || '',
      query.latitude?.toString() || '',
      query.longitude?.toString() || '',
      query.radius?.toString() || '',
      query.limit?.toString() || '20',
      query.offset?.toString() || '0',
      query.sortBy || '',
      query.sortOrder || 'desc',
    ];

    const keyString = keyParts.join(':');
    return CACHE_KEYS.API_RESOURCE.LIST(keyString);
  }

  /**
   * Convert UpdateApiResourceDto to repository update data format
   */
  private convertUpdateDtoToRepositoryData(dto: UpdateApiResourceDto): any {
    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.resourceType !== undefined) updateData.resourceType = dto.resourceType;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.plan !== undefined) updateData.plan = dto.plan;
    if (dto.verified !== undefined) updateData.verified = dto.verified;

    // Handle address
    if (dto.address !== undefined) {
      if (dto.address) {
        updateData.addressLine1 = dto.address.addressLine1;
        updateData.addressLine2 = dto.address.addressLine2;
        updateData.city = dto.address.city;
        updateData.region = dto.address.region;
        updateData.postalCode = dto.address.postalCode;
        updateData.country = dto.address.country || 'CM';
        updateData.latitude = dto.address.latitude;
        updateData.longitude = dto.address.longitude;
      } else {
        // Clear address
        updateData.addressLine1 = null;
        updateData.addressLine2 = null;
        updateData.city = null;
        updateData.region = null;
        updateData.postalCode = null;
        updateData.country = 'CM';
        updateData.latitude = null;
        updateData.longitude = null;
      }
    }

    // Handle contact
    if (dto.contact !== undefined) {
      if (dto.contact) {
        updateData.phone = dto.contact.phone;
        updateData.email = dto.contact.email;
        updateData.website = dto.contact.website;
      } else {
        // Clear contact
        updateData.phone = null;
        updateData.email = null;
        updateData.website = null;
      }
    }

    // Handle SEO
    if (dto.seo !== undefined) {
      if (dto.seo) {
        updateData.metaTitle = dto.seo.metaTitle;
        updateData.metaDescription = dto.seo.metaDescription;
      } else {
        // Clear SEO
        updateData.metaTitle = null;
        updateData.metaDescription = null;
      }
    }

    return updateData;
  }

  /**
   * Invalidate all caches related to API resources
   */
  private async invalidateResourceCaches(resourceId?: string, slug?: string): Promise<void> {
    const promises: Promise<void>[] = [
      // Invalidate list caches
      this.cacheService.invalidatePattern('api-resources:list:*'),
      this.cacheService.invalidatePattern('api-resources:search:*'),
      // Invalidate statistics cache
      this.cacheService.del('api-resources:statistics'),
    ];

    // Invalidate specific resource caches if provided
    if (resourceId) {
      promises.push(this.cacheService.del(CACHE_KEYS.API_RESOURCE.BY_ID(resourceId)));
    }

    if (slug) {
      promises.push(this.cacheService.del(CACHE_KEYS.API_RESOURCE.BY_SLUG(slug)));
    }

    await Promise.all(promises);
    this.logger.debug('Invalidated API resource caches');
  }

  /**
   * Extract auditable fields from a resource for logging
   */
  private extractAuditableFields(resource: any): Record<string, any> {
    return {
      id: resource.id,
      name: resource.name,
      slug: resource.slug,
      resourceType: resource.resourceType,
      status: resource.status,
      plan: resource.plan,
      verified: resource.verified,
      categoryId: resource.categoryId,
      city: resource.city,
      region: resource.region,
      country: resource.country,
    };
  }

  /**
   * Get changes between existing resource and update data
   */
  private getChanges(existingResource: any, updateData: any): Record<string, any> {
    const changes: Record<string, any> = {};
    
    const fieldsToCheck = [
      'name', 'slug', 'description', 'resourceType', 'status', 'plan', 
      'verified', 'categoryId', 'city', 'region', 'country', 'phone', 
      'email', 'website'
    ];

    for (const field of fieldsToCheck) {
      if (updateData[field] !== undefined && updateData[field] !== existingResource[field]) {
        changes[field] = {
          from: existingResource[field],
          to: updateData[field],
        };
      }
    }

    return changes;
  }
}