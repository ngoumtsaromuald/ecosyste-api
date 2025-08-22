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
var IndexingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const elasticsearch_1 = require("@elastic/elasticsearch");
const prisma_service_1 = require("../../../config/prisma.service");
let IndexingService = IndexingService_1 = class IndexingService {
    constructor(indexingQueue, configService, prisma) {
        this.indexingQueue = indexingQueue;
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(IndexingService_1.name);
        this.elasticsearch = new elasticsearch_1.Client({
            node: `http://${this.configService.get('elasticsearch.host')}:${this.configService.get('elasticsearch.port')}`,
            requestTimeout: this.configService.get('elasticsearch.requestTimeout'),
            maxRetries: this.configService.get('elasticsearch.maxRetries'),
        });
    }
    async queueIndexResource(resourceId, resourceType, data) {
        const jobData = {
            resourceId,
            resourceType: resourceType,
            action: 'index',
            data,
        };
        await this.indexingQueue.add(this.configService.get('queue.jobs.indexResource'), jobData, {
            priority: this.getJobPriority('index'),
            delay: 0,
        });
        this.logger.log(`Queued indexing job for resource ${resourceId} (${resourceType})`);
    }
    async queueUpdateResource(resourceId, resourceType, data) {
        const jobData = {
            resourceId,
            resourceType: resourceType,
            action: 'update',
            data,
        };
        await this.indexingQueue.add(this.configService.get('queue.jobs.updateResource'), jobData, {
            priority: this.getJobPriority('update'),
            delay: 0,
        });
        this.logger.log(`Queued update job for resource ${resourceId} (${resourceType})`);
    }
    async queueDeleteResource(resourceId, resourceType) {
        const jobData = {
            resourceId,
            resourceType: resourceType,
            action: 'delete',
        };
        await this.indexingQueue.add(this.configService.get('queue.jobs.deleteResource'), jobData, {
            priority: this.getJobPriority('delete'),
            delay: 0,
        });
        this.logger.log(`Queued deletion job for resource ${resourceId} (${resourceType})`);
    }
    async queueReindexAll() {
        await this.indexingQueue.add(this.configService.get('queue.jobs.reindexAll'), { action: 'reindex-all' }, {
            priority: this.getJobPriority('reindex'),
            delay: 0,
        });
        this.logger.log('Queued full reindexing job');
    }
    async indexResource(resourceId, resourceType, data) {
        try {
            const indexName = this.getIndexName(resourceType);
            await this.elasticsearch.index({
                index: indexName,
                id: resourceId,
                body: this.transformResourceForIndex(data, resourceType),
            });
            this.logger.log(`Successfully indexed resource ${resourceId} in ${indexName}`);
        }
        catch (error) {
            this.logger.error(`Failed to index resource ${resourceId}:`, error);
            throw error;
        }
    }
    async updateResource(resourceId, resourceType, data) {
        try {
            const indexName = this.getIndexName(resourceType);
            await this.elasticsearch.update({
                index: indexName,
                id: resourceId,
                body: {
                    doc: this.transformResourceForIndex(data, resourceType),
                    doc_as_upsert: true,
                },
            });
            this.logger.log(`Successfully updated resource ${resourceId} in ${indexName}`);
        }
        catch (error) {
            this.logger.error(`Failed to update resource ${resourceId}:`, error);
            throw error;
        }
    }
    async deleteResource(resourceId, resourceType) {
        try {
            const indexName = this.getIndexName(resourceType);
            await this.elasticsearch.delete({
                index: indexName,
                id: resourceId,
            });
            this.logger.log(`Successfully deleted resource ${resourceId} from ${indexName}`);
        }
        catch (error) {
            if (error.statusCode === 404) {
                this.logger.warn(`Resource ${resourceId} not found in index, skipping deletion`);
                return;
            }
            this.logger.error(`Failed to delete resource ${resourceId}:`, error);
            throw error;
        }
    }
    async checkConnection() {
        try {
            await this.elasticsearch.ping();
            return true;
        }
        catch (error) {
            this.logger.error('Elasticsearch connection failed:', error);
            return false;
        }
    }
    async getClusterInfo() {
        try {
            return await this.elasticsearch.info();
        }
        catch (error) {
            this.logger.error('Failed to get cluster info:', error);
            throw error;
        }
    }
    async processIndexJob(job) {
        const { resourceId, resourceType, data } = job.data;
        try {
            const indexName = this.getIndexName(resourceType);
            await this.elasticsearch.index({
                index: indexName,
                id: resourceId,
                body: this.transformResourceForIndex(data, resourceType),
            });
            this.logger.log(`Successfully indexed resource ${resourceId} in ${indexName}`);
        }
        catch (error) {
            this.logger.error(`Failed to index resource ${resourceId}:`, error);
            throw error;
        }
    }
    async processUpdateJob(job) {
        const { resourceId, resourceType, data } = job.data;
        try {
            const indexName = this.getIndexName(resourceType);
            await this.elasticsearch.update({
                index: indexName,
                id: resourceId,
                body: {
                    doc: this.transformResourceForIndex(data, resourceType),
                    doc_as_upsert: true,
                },
            });
            this.logger.log(`Successfully updated resource ${resourceId} in ${indexName}`);
        }
        catch (error) {
            this.logger.error(`Failed to update resource ${resourceId}:`, error);
            throw error;
        }
    }
    async processDeleteJob(job) {
        const { resourceId, resourceType } = job.data;
        try {
            const indexName = this.getIndexName(resourceType);
            await this.elasticsearch.delete({
                index: indexName,
                id: resourceId,
            });
            this.logger.log(`Successfully deleted resource ${resourceId} from ${indexName}`);
        }
        catch (error) {
            if (error.statusCode === 404) {
                this.logger.warn(`Resource ${resourceId} not found in index, skipping deletion`);
                return;
            }
            this.logger.error(`Failed to delete resource ${resourceId}:`, error);
            throw error;
        }
    }
    async processReindexJob(job) {
        this.logger.log('Starting full reindexing process...');
        try {
            await this.reindexAll();
            this.logger.log('Full reindexing completed successfully');
        }
        catch (error) {
            this.logger.error('Full reindexing failed:', error);
            throw error;
        }
    }
    async reindexAll() {
        this.logger.log('Starting full reindexing from database...');
        const startTime = Date.now();
        const batchSize = this.configService.get('elasticsearch.reindexBatchSize', 100);
        let totalProcessed = 0;
        let totalErrors = 0;
        try {
            const totalCount = await this.prisma.apiResource.count({
                where: {
                    deletedAt: null,
                    status: 'ACTIVE'
                }
            });
            this.logger.log(`Found ${totalCount} resources to reindex`);
            let skip = 0;
            let hasMore = true;
            while (hasMore) {
                const batch = await this.prisma.apiResource.findMany({
                    where: {
                        deletedAt: null,
                        status: 'ACTIVE'
                    },
                    include: {
                        category: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    take: batchSize,
                    skip: skip,
                    orderBy: {
                        createdAt: 'asc'
                    }
                });
                if (batch.length === 0) {
                    hasMore = false;
                    break;
                }
                this.logger.debug(`Processing batch ${Math.floor(skip / batchSize) + 1}: ${batch.length} resources`);
                const batchResults = await Promise.allSettled(batch.map(async (resource) => {
                    try {
                        await this.indexResource(resource.id, this.mapResourceTypeToString(resource.resourceType), this.transformResourceForReindexing(resource));
                        return { success: true, resourceId: resource.id };
                    }
                    catch (error) {
                        this.logger.error(`Failed to reindex resource ${resource.id}:`, error);
                        return { success: false, resourceId: resource.id, error: error.message };
                    }
                }));
                const batchSuccesses = batchResults.filter(result => result.status === 'fulfilled' && result.value.success).length;
                const batchErrors = batchResults.length - batchSuccesses;
                totalProcessed += batchSuccesses;
                totalErrors += batchErrors;
                this.logger.debug(`Batch completed: ${batchSuccesses} successful, ${batchErrors} errors`);
                skip += batchSize;
                if (skip % (batchSize * 10) === 0) {
                    const progress = Math.round((skip / totalCount) * 100);
                    this.logger.log(`Reindexing progress: ${progress}% (${totalProcessed}/${totalCount})`);
                }
            }
            const duration = Date.now() - startTime;
            this.logger.log(`Reindexing completed: ${totalProcessed} resources indexed, ${totalErrors} errors in ${duration}ms`);
            if (totalErrors > 0) {
                this.logger.warn(`Reindexing completed with ${totalErrors} errors. Check logs for details.`);
            }
        }
        catch (error) {
            this.logger.error('Fatal error during reindexing:', error);
            throw error;
        }
    }
    async checkIndexHealth() {
        this.logger.debug('Checking index health...');
        try {
            const indexName = this.getIndexName('api');
            const indexExists = await this.elasticsearch.indices.exists({
                index: indexName
            });
            if (!indexExists) {
                return {
                    status: 'red',
                    totalDocs: 0,
                    indexSize: '0b',
                    lastUpdate: new Date(),
                    errors: ['Index does not exist'],
                    shards: {
                        total: 0,
                        successful: 0,
                        failed: 0
                    }
                };
            }
            const stats = await this.elasticsearch.indices.stats({
                index: indexName
            });
            const health = await this.elasticsearch.cluster.health({
                index: indexName
            });
            const [settings, mappings] = await Promise.all([
                this.elasticsearch.indices.getSettings({ index: indexName }),
                this.elasticsearch.indices.getMapping({ index: indexName })
            ]);
            const indexStats = stats.indices[indexName];
            const totalDocs = indexStats?.total?.docs?.count || 0;
            const indexSizeBytes = indexStats?.total?.store?.size_in_bytes || 0;
            const indexSize = this.formatBytes(indexSizeBytes);
            let status = health.status;
            const errors = [];
            if (health.number_of_data_nodes === 0) {
                status = 'red';
                errors.push('No data nodes available');
            }
            if (health.unassigned_shards > 0) {
                if (status === 'green')
                    status = 'yellow';
                errors.push(`${health.unassigned_shards} unassigned shards`);
            }
            if (health.initializing_shards > 0) {
                if (status === 'green')
                    status = 'yellow';
                errors.push(`${health.initializing_shards} initializing shards`);
            }
            try {
                const dbCount = await this.prisma.apiResource.count({
                    where: {
                        deletedAt: null,
                        status: 'ACTIVE'
                    }
                });
                const indexCount = totalDocs;
                const countDifference = Math.abs(dbCount - indexCount);
                const percentageDifference = dbCount > 0 ? (countDifference / dbCount) * 100 : 0;
                if (percentageDifference > 10) {
                    if (status === 'green')
                        status = 'yellow';
                    errors.push(`Index count (${indexCount}) differs significantly from database count (${dbCount})`);
                }
            }
            catch (dbError) {
                this.logger.warn('Could not compare index count with database:', dbError);
                errors.push('Could not verify index synchronization with database');
            }
            const result = {
                status,
                totalDocs,
                indexSize,
                lastUpdate: new Date(),
                errors: errors.length > 0 ? errors : undefined,
                shards: {
                    total: health.active_shards + health.unassigned_shards + health.initializing_shards,
                    successful: health.active_shards,
                    failed: health.unassigned_shards
                }
            };
            this.logger.debug(`Index health check completed: ${status} status, ${totalDocs} docs, ${indexSize}`);
            return result;
        }
        catch (error) {
            this.logger.error('Index health check failed:', error);
            return {
                status: 'red',
                totalDocs: 0,
                indexSize: '0b',
                lastUpdate: new Date(),
                errors: [`Health check failed: ${error.message}`],
                shards: {
                    total: 0,
                    successful: 0,
                    failed: 0
                }
            };
        }
    }
    async getQueueStats() {
        const waiting = await this.indexingQueue.getWaiting();
        const active = await this.indexingQueue.getActive();
        const completed = await this.indexingQueue.getCompleted();
        const failed = await this.indexingQueue.getFailed();
        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            total: waiting.length + active.length + completed.length + failed.length,
        };
    }
    async clearQueue() {
        await this.indexingQueue.clean(0, 'completed');
        await this.indexingQueue.clean(0, 'failed');
        await this.indexingQueue.clean(0, 'active');
        await this.indexingQueue.clean(0, 'delayed');
        this.logger.log('Cleared all jobs from indexing queue');
    }
    getJobPriority(action) {
        const priorities = {
            delete: 10,
            update: 5,
            index: 1,
            reindex: -10,
        };
        return priorities[action] || 1;
    }
    getIndexName(resourceType) {
        const prefix = this.configService.get('elasticsearch.indexPrefix');
        return `${prefix}_resources`;
    }
    transformResourceForIndex(data, resourceType) {
        const transformed = {
            ...data,
            resourceType,
            indexedAt: new Date().toISOString(),
        };
        if (data.name) {
            transformed.suggest = {
                input: [data.name],
                weight: data.popularity || 1,
            };
            if (data.tags && Array.isArray(data.tags)) {
                transformed.suggest.input.push(...data.tags);
            }
            if (data.category && data.category.name) {
                transformed.suggest.input.push(data.category.name);
            }
        }
        switch (resourceType) {
            case 'api':
                return this.transformApiResource(transformed);
            case 'enterprise':
                return this.transformEnterpriseResource(transformed);
            case 'service':
                return this.transformServiceResource(transformed);
            default:
                return transformed;
        }
    }
    transformApiResource(data) {
        return {
            ...data,
            endpoints: data.endpoints || [],
            methods: data.methods || [],
            authentication: data.authentication || 'none',
        };
    }
    transformEnterpriseResource(data) {
        return {
            ...data,
            industry: data.industry || 'other',
            size: data.size || 'unknown',
            founded: data.founded || null,
        };
    }
    transformServiceResource(data) {
        return {
            ...data,
            serviceType: data.serviceType || 'other',
            availability: data.availability || '24/7',
        };
    }
    transformResourceForReindexing(resource) {
        return {
            id: resource.id,
            name: resource.name,
            slug: resource.slug,
            description: resource.description,
            resourceType: resource.resourceType,
            category: resource.category ? {
                id: resource.category.id,
                name: resource.category.name,
                slug: resource.category.slug
            } : null,
            plan: resource.plan,
            verified: resource.verified,
            status: resource.status,
            location: resource.latitude && resource.longitude ? {
                lat: parseFloat(resource.latitude.toString()),
                lon: parseFloat(resource.longitude.toString())
            } : null,
            address: {
                addressLine1: resource.addressLine1,
                addressLine2: resource.addressLine2,
                city: resource.city,
                region: resource.region,
                postalCode: resource.postalCode,
                country: resource.country
            },
            contact: {
                phone: resource.phone,
                email: resource.email,
                website: resource.website
            },
            user: resource.user ? {
                id: resource.user.id,
                name: resource.user.name,
                email: resource.user.email
            } : null,
            createdAt: resource.createdAt,
            updatedAt: resource.updatedAt,
            publishedAt: resource.publishedAt,
            popularity: 1,
            rating: 0,
            tags: [],
        };
    }
    mapResourceTypeToString(resourceType) {
        switch (resourceType) {
            case 'API':
                return 'api';
            case 'BUSINESS':
                return 'enterprise';
            case 'SERVICE':
                return 'service';
            case 'DATA':
                return 'data';
            default:
                return 'api';
        }
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0b';
        const k = 1024;
        const sizes = ['b', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
    }
};
exports.IndexingService = IndexingService;
exports.IndexingService = IndexingService = IndexingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('indexing-queue')),
    __metadata("design:paramtypes", [Object, config_1.ConfigService,
        prisma_service_1.PrismaService])
], IndexingService);
//# sourceMappingURL=indexing.service.js.map