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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResourceService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../config/logger.service");
const api_resource_repository_1 = require("../repositories/api-resource.repository");
const cache_service_1 = require("../config/cache.service");
const validation_service_1 = require("./validation.service");
const enrichment_service_1 = require("./enrichment.service");
const enums_1 = require("../domain/enums");
const api_resource_mapper_1 = require("../mappers/api-resource.mapper");
let ApiResourceService = class ApiResourceService {
    constructor(repository, cacheService, validationService, enrichmentService, logger) {
        this.repository = repository;
        this.cacheService = cacheService;
        this.validationService = validationService;
        this.enrichmentService = enrichmentService;
        this.logger = logger;
    }
    async findAll(query) {
        this.logger.debug(`Finding API resources with query:`, query);
        const cacheKey = this.buildCacheKey('list', query);
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache hit for findAll: ${cacheKey}`);
            return cached;
        }
        this.logger.debug(`Cache miss for findAll: ${cacheKey}`);
        const filters = {
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
        const pagination = {
            limit: query.limit || 20,
            offset: query.offset || 0,
        };
        let result;
        if (query.latitude && query.longitude) {
            const radius = query.radius || 10;
            result = await this.repository.findNearLocation(query.latitude, query.longitude, radius, pagination);
        }
        else {
            result = await this.repository.search(filters, pagination);
        }
        const resources = result.resources.map((resource) => api_resource_mapper_1.ApiResourceMapper.toResponseDtoFromPrisma(resource));
        const page = Math.floor((pagination.offset || 0) / (pagination.limit || 20)) + 1;
        const totalPages = Math.ceil(result.total / (pagination.limit || 20));
        const response = {
            resources,
            total: result.total,
            page,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
        await this.cacheService.set(cacheKey, response, cache_service_1.CACHE_TTL.SEARCH);
        this.logger.debug(`Found ${result.total} resources, returning page ${page}/${totalPages}`);
        return response;
    }
    async findById(id) {
        this.logger.debug(`Finding API resource by ID: ${id}`);
        const cacheKey = cache_service_1.CACHE_KEYS.API_RESOURCE.BY_ID(id);
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache hit for findById: ${id}`);
            return cached;
        }
        const resource = await this.repository.findById(id, {
            category: true,
            images: { orderBy: { orderIndex: 'asc' } },
            hours: { orderBy: { dayOfWeek: 'asc' } },
        });
        if (!resource) {
            throw new common_1.NotFoundException(`API Resource with ID ${id} not found`);
        }
        const responseDto = api_resource_mapper_1.ApiResourceMapper.toResponseDtoFromPrisma(resource);
        await this.cacheService.set(cacheKey, responseDto, cache_service_1.CACHE_TTL.API_RESOURCE);
        this.logger.debug(`Found API resource: ${resource.name}`);
        return responseDto;
    }
    async findBySlug(slug) {
        this.logger.debug(`Finding API resource by slug: ${slug}`);
        const cacheKey = cache_service_1.CACHE_KEYS.API_RESOURCE.BY_SLUG(slug);
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache hit for findBySlug: ${slug}`);
            return cached;
        }
        const resource = await this.repository.findBySlug(slug, {
            category: true,
            images: { orderBy: { orderIndex: 'asc' } },
            hours: { orderBy: { dayOfWeek: 'asc' } },
        });
        if (!resource) {
            throw new common_1.NotFoundException(`API Resource with slug '${slug}' not found`);
        }
        const responseDto = api_resource_mapper_1.ApiResourceMapper.toResponseDtoFromPrisma(resource);
        await this.cacheService.set(cacheKey, responseDto, cache_service_1.CACHE_TTL.API_RESOURCE);
        this.logger.debug(`Found API resource: ${resource.name}`);
        return responseDto;
    }
    async create(createDto, userId) {
        this.logger.debug(`Creating API resource: ${createDto.name} for user: ${userId}`);
        await this.validationService.validateCreateApiResourceDtoOrThrow(createDto, userId);
        const enrichedData = await this.enrichmentService.enrich(createDto);
        const enrichmentErrors = this.enrichmentService.validateEnrichedData(enrichedData);
        if (enrichmentErrors.length > 0) {
            throw new common_1.BadRequestException(`Enrichment validation failed: ${enrichmentErrors.join(', ')}`);
        }
        const isSlugUnique = await this.repository.isSlugUnique(enrichedData.slug);
        if (!isSlugUnique) {
            let counter = 1;
            let uniqueSlug = `${enrichedData.slug}-${counter}`;
            while (!(await this.repository.isSlugUnique(uniqueSlug))) {
                counter++;
                uniqueSlug = `${enrichedData.slug}-${counter}`;
            }
            enrichedData.slug = uniqueSlug;
            this.logger.debug(`Slug was not unique, using: ${uniqueSlug}`);
        }
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
        const createdResource = await this.repository.create(createData);
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
        this.logger.logBusiness('API_RESOURCE_CREATED', {
            resourceId: createdResource.id,
            resourceName: createdResource.name,
            resourceType: createdResource.resourceType,
            userId,
        });
        await this.invalidateResourceCaches();
        const resourceWithRelations = await this.repository.findById(createdResource.id, {
            category: true,
            images: { orderBy: { orderIndex: 'asc' } },
            hours: { orderBy: { dayOfWeek: 'asc' } },
        });
        const responseDto = api_resource_mapper_1.ApiResourceMapper.toResponseDtoFromPrisma(resourceWithRelations);
        this.logger.log(`Created API resource: ${createdResource.name} with ID: ${createdResource.id}`, {
            context: 'ApiResourceService',
            userId,
            resourceId: createdResource.id,
            action: 'create',
        });
        return responseDto;
    }
    async update(id, updateDto, userId) {
        this.logger.debug(`Updating API resource: ${id} for user: ${userId}`);
        const existingResource = await this.repository.findById(id);
        if (!existingResource) {
            throw new common_1.NotFoundException(`API Resource with ID ${id} not found`);
        }
        if (existingResource.userId !== userId) {
            throw new common_1.BadRequestException('You can only update your own resources');
        }
        await this.validationService.validateUpdateApiResourceDtoOrThrow(updateDto, id, userId);
        let finalUpdateData = { ...updateDto };
        if (updateDto.name && updateDto.name !== existingResource.name) {
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
            }
            else {
                finalUpdateData.slug = newSlug;
            }
        }
        const updateData = this.convertUpdateDtoToRepositoryData(finalUpdateData);
        if (updateDto.status === enums_1.ResourceStatus.ACTIVE && existingResource.status !== enums_1.ResourceStatus.ACTIVE) {
            updateData.publishedAt = new Date();
        }
        const updatedResource = await this.repository.update(id, updateData);
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
            if (changes.status || changes.name || changes.resourceType) {
                this.logger.logBusiness('API_RESOURCE_UPDATED', {
                    resourceId: id,
                    resourceName: updatedResource.name,
                    changes: Object.keys(changes),
                    userId,
                });
            }
        }
        const resourceWithRelations = await this.repository.findById(id, {
            category: true,
            images: { orderBy: { orderIndex: 'asc' } },
            hours: { orderBy: { dayOfWeek: 'asc' } },
        });
        await this.invalidateResourceCaches(id, existingResource.slug);
        const responseDto = api_resource_mapper_1.ApiResourceMapper.toResponseDtoFromPrisma(resourceWithRelations);
        this.logger.log(`Updated API resource: ${updatedResource.name}`, {
            context: 'ApiResourceService',
            userId,
            resourceId: id,
            action: 'update',
            changesCount: Object.keys(changes).length,
        });
        return responseDto;
    }
    async softDelete(id, userId) {
        this.logger.debug(`Soft deleting API resource: ${id} for user: ${userId}`);
        const existingResource = await this.repository.findById(id);
        if (!existingResource) {
            throw new common_1.NotFoundException(`API Resource with ID ${id} not found`);
        }
        if (existingResource.userId !== userId) {
            throw new common_1.BadRequestException('You can only delete your own resources');
        }
        await this.repository.softDelete(id);
        await this.invalidateResourceCaches(id, existingResource.slug);
        this.logger.debug(`Soft deleted API resource: ${existingResource.name}`);
    }
    async search(query) {
        return this.findAll(query);
    }
    async findByUserId(userId, pagination = {}) {
        this.logger.debug(`Finding API resources for user: ${userId}`);
        const result = await this.repository.findByUserId(userId, pagination);
        const resources = result.resources.map((resource) => api_resource_mapper_1.ApiResourceMapper.toResponseDtoFromPrisma(resource));
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
    async findByCategory(categoryId, pagination = {}) {
        this.logger.debug(`Finding API resources for category: ${categoryId}`);
        const result = await this.repository.findByCategory(categoryId, pagination);
        const resources = result.resources.map((resource) => api_resource_mapper_1.ApiResourceMapper.toResponseDtoFromPrisma(resource));
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
    async ingest(ingestDto, userId) {
        const startTime = Date.now();
        this.logger.debug(`Starting bulk ingest of ${ingestDto.resources.length} resources for user: ${userId}`);
        const results = [];
        const errorSummary = {};
        let processed = 0;
        let failed = 0;
        let skipped = 0;
        const batchSize = Math.min(ingestDto.batchSize || 50, 100);
        const resources = ingestDto.resources.slice(0, 1000);
        for (let i = 0; i < resources.length; i += batchSize) {
            const batch = resources.slice(i, i + batchSize);
            const batchResults = await this.processBatch(batch, i, userId, ingestDto);
            results.push(...batchResults);
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
            this.logger.debug(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(resources.length / batchSize)}`);
        }
        await this.invalidateResourceCaches();
        const processingTimeMs = Date.now() - startTime;
        const result = {
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
    async processBatch(batch, startIndex, userId, options) {
        const results = [];
        for (let i = 0; i < batch.length; i++) {
            const resource = batch[i];
            const index = startIndex + i;
            const itemStartTime = Date.now();
            try {
                const result = await this.processIngestItem(resource, index, userId, options);
                result.processingTimeMs = Date.now() - itemStartTime;
                results.push(result);
            }
            catch (error) {
                const result = {
                    index,
                    name: resource.name || `Resource ${index}`,
                    status: 'failed',
                    error: error.message || 'Unknown error occurred',
                    errorType: 'processing_error',
                    processingTimeMs: Date.now() - itemStartTime,
                };
                results.push(result);
                if (!options.skipErrors) {
                    throw error;
                }
            }
        }
        return results;
    }
    async processIngestItem(resource, index, userId, options) {
        const name = resource.name || `Resource ${index}`;
        try {
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
            try {
                await this.validationService.validateCreateApiResourceDtoOrThrow(resource, userId);
            }
            catch (validationError) {
                return {
                    index,
                    name,
                    status: 'failed',
                    error: validationError.message,
                    errorType: 'validation_error',
                    processingTimeMs: 0,
                };
            }
            let enrichedData;
            try {
                enrichedData = await this.enrichmentService.enrich(resource);
            }
            catch (enrichmentError) {
                return {
                    index,
                    name,
                    status: 'failed',
                    error: `Enrichment failed: ${enrichmentError.message}`,
                    errorType: 'enrichment_error',
                    processingTimeMs: 0,
                };
            }
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
            let finalSlug = enrichedData.slug;
            const isSlugUnique = await this.repository.isSlugUnique(finalSlug);
            if (!isSlugUnique) {
                let counter = 1;
                let uniqueSlug = `${finalSlug}-${counter}`;
                while (!(await this.repository.isSlugUnique(uniqueSlug))) {
                    counter++;
                    uniqueSlug = `${finalSlug}-${counter}`;
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
        }
        catch (error) {
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
    async checkForDuplicate(resource) {
        if (!resource.name) {
            return { isDuplicate: false };
        }
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
        const slug = this.enrichmentService.generateSlug(resource.name);
        const slugMatch = await this.repository.findBySlug(slug);
        if (slugMatch) {
            return {
                isDuplicate: true,
                reason: `Similar resource found with slug: "${slug}"`,
            };
        }
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
                if (similarity > 0.8) {
                    return {
                        isDuplicate: true,
                        reason: `Similar resource found: "${similar.name}" (${Math.round(similarity * 100)}% similarity)`,
                    };
                }
            }
        }
        return { isDuplicate: false };
    }
    calculateStringSimilarity(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;
        if (len1 === 0)
            return len2 === 0 ? 1 : 0;
        if (len2 === 0)
            return 0;
        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        const maxLen = Math.max(len1, len2);
        return (maxLen - matrix[len2][len1]) / maxLen;
    }
    async getStatistics() {
        this.logger.debug('Getting API resource statistics');
        const cacheKey = 'api-resources:statistics';
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const stats = await this.repository.getStatistics();
        await this.cacheService.set(cacheKey, stats, 300);
        return stats;
    }
    buildCacheKey(operation, query) {
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
        return cache_service_1.CACHE_KEYS.API_RESOURCE.LIST(keyString);
    }
    convertUpdateDtoToRepositoryData(dto) {
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.slug !== undefined)
            updateData.slug = dto.slug;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.resourceType !== undefined)
            updateData.resourceType = dto.resourceType;
        if (dto.categoryId !== undefined)
            updateData.categoryId = dto.categoryId;
        if (dto.status !== undefined)
            updateData.status = dto.status;
        if (dto.plan !== undefined)
            updateData.plan = dto.plan;
        if (dto.verified !== undefined)
            updateData.verified = dto.verified;
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
            }
            else {
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
        if (dto.contact !== undefined) {
            if (dto.contact) {
                updateData.phone = dto.contact.phone;
                updateData.email = dto.contact.email;
                updateData.website = dto.contact.website;
            }
            else {
                updateData.phone = null;
                updateData.email = null;
                updateData.website = null;
            }
        }
        if (dto.seo !== undefined) {
            if (dto.seo) {
                updateData.metaTitle = dto.seo.metaTitle;
                updateData.metaDescription = dto.seo.metaDescription;
            }
            else {
                updateData.metaTitle = null;
                updateData.metaDescription = null;
            }
        }
        return updateData;
    }
    async invalidateResourceCaches(resourceId, slug) {
        const promises = [
            this.cacheService.invalidatePattern('api-resources:list:*'),
            this.cacheService.invalidatePattern('api-resources:search:*'),
            this.cacheService.del('api-resources:statistics'),
        ];
        if (resourceId) {
            promises.push(this.cacheService.del(cache_service_1.CACHE_KEYS.API_RESOURCE.BY_ID(resourceId)));
        }
        if (slug) {
            promises.push(this.cacheService.del(cache_service_1.CACHE_KEYS.API_RESOURCE.BY_SLUG(slug)));
        }
        await Promise.all(promises);
        this.logger.debug('Invalidated API resource caches');
    }
    extractAuditableFields(resource) {
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
    getChanges(existingResource, updateData) {
        const changes = {};
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
};
exports.ApiResourceService = ApiResourceService;
exports.ApiResourceService = ApiResourceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_resource_repository_1.ApiResourceRepository,
        cache_service_1.CacheService,
        validation_service_1.ValidationService,
        enrichment_service_1.EnrichmentService,
        logger_service_1.CustomLoggerService])
], ApiResourceService);
//# sourceMappingURL=api-resource.service.js.map