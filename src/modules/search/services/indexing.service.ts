import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { PrismaService } from '../../../config/prisma.service';
import { IIndexingService, IndexingJobData, QueueStats, TransformedResource } from '../interfaces/indexing.interface';
import { IndexHealth } from '../interfaces/search.interfaces';

@Injectable()
export class IndexingService implements IIndexingService {
  private readonly logger = new Logger(IndexingService.name);
  private readonly elasticsearch: Client;

  constructor(
    @InjectQueue('indexing-queue') private readonly indexingQueue: Queue,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.elasticsearch = new Client({
      node: `http://${this.configService.get('elasticsearch.host')}:${this.configService.get('elasticsearch.port')}`,
      requestTimeout: this.configService.get('elasticsearch.requestTimeout'),
      maxRetries: this.configService.get('elasticsearch.maxRetries'),
    });
  }

  /**
   * Queue a resource for indexing
   */
  async queueIndexResource(resourceId: string, resourceType: string, data: any): Promise<void> {
    const jobData: IndexingJobData = {
      resourceId,
      resourceType: resourceType as any,
      action: 'index',
      data,
    };

    await this.indexingQueue.add(
      this.configService.get('queue.jobs.indexResource'),
      jobData,
      {
        priority: this.getJobPriority('index'),
        delay: 0,
      },
    );

    this.logger.log(`Queued indexing job for resource ${resourceId} (${resourceType})`);
  }

  /**
   * Queue a resource for update
   */
  async queueUpdateResource(resourceId: string, resourceType: string, data: any): Promise<void> {
    const jobData: IndexingJobData = {
      resourceId,
      resourceType: resourceType as any,
      action: 'update',
      data,
    };

    await this.indexingQueue.add(
      this.configService.get('queue.jobs.updateResource'),
      jobData,
      {
        priority: this.getJobPriority('update'),
        delay: 0,
      },
    );

    this.logger.log(`Queued update job for resource ${resourceId} (${resourceType})`);
  }

  /**
   * Queue a resource for deletion
   */
  async queueDeleteResource(resourceId: string, resourceType: string): Promise<void> {
    const jobData: IndexingJobData = {
      resourceId,
      resourceType: resourceType as any,
      action: 'delete',
    };

    await this.indexingQueue.add(
      this.configService.get('queue.jobs.deleteResource'),
      jobData,
      {
        priority: this.getJobPriority('delete'),
        delay: 0,
      },
    );

    this.logger.log(`Queued deletion job for resource ${resourceId} (${resourceType})`);
  }

  /**
   * Queue a full reindexing job
   */
  async queueReindexAll(): Promise<void> {
    await this.indexingQueue.add(
      this.configService.get('queue.jobs.reindexAll'),
      { action: 'reindex-all' },
      {
        priority: this.getJobPriority('reindex'),
        delay: 0,
      },
    );

    this.logger.log('Queued full reindexing job');
  }

  /**
   * Direct indexing methods (synchronous) - Task 3.1 Implementation
   */

  /**
   * Index a resource directly (synchronous)
   */
  async indexResource(resourceId: string, resourceType: string, data: any): Promise<void> {
    try {
      const indexName = this.getIndexName(resourceType);
      
      await this.elasticsearch.index({
        index: indexName,
        id: resourceId,
        body: this.transformResourceForIndex(data, resourceType),
      });

      this.logger.log(`Successfully indexed resource ${resourceId} in ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to index resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Update a resource directly (synchronous)
   */
  async updateResource(resourceId: string, resourceType: string, data: any): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to update resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a resource directly (synchronous)
   */
  async deleteResource(resourceId: string, resourceType: string): Promise<void> {
    try {
      const indexName = this.getIndexName(resourceType);
      
      await this.elasticsearch.delete({
        index: indexName,
        id: resourceId,
      });

      this.logger.log(`Successfully deleted resource ${resourceId} from ${indexName}`);
    } catch (error) {
      if (error.statusCode === 404) {
        this.logger.warn(`Resource ${resourceId} not found in index, skipping deletion`);
        return;
      }
      
      this.logger.error(`Failed to delete resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Check if Elasticsearch connection is healthy
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.elasticsearch.ping();
      return true;
    } catch (error) {
      this.logger.error('Elasticsearch connection failed:', error);
      return false;
    }
  }

  /**
   * Get Elasticsearch cluster info
   */
  async getClusterInfo(): Promise<any> {
    try {
      return await this.elasticsearch.info();
    } catch (error) {
      this.logger.error('Failed to get cluster info:', error);
      throw error;
    }
  }

  /**
   * Process indexing job
   */
  async processIndexJob(job: any): Promise<void> {
    const { resourceId, resourceType, data } = job.data as IndexingJobData;
    
    try {
      const indexName = this.getIndexName(resourceType);
      
      await this.elasticsearch.index({
        index: indexName,
        id: resourceId,
        body: this.transformResourceForIndex(data, resourceType),
      });

      this.logger.log(`Successfully indexed resource ${resourceId} in ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to index resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Process update job
   */
  async processUpdateJob(job: any): Promise<void> {
    const { resourceId, resourceType, data } = job.data as IndexingJobData;
    
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
    } catch (error) {
      this.logger.error(`Failed to update resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Process deletion job
   */
  async processDeleteJob(job: any): Promise<void> {
    const { resourceId, resourceType } = job.data as IndexingJobData;
    
    try {
      const indexName = this.getIndexName(resourceType);
      
      await this.elasticsearch.delete({
        index: indexName,
        id: resourceId,
      });

      this.logger.log(`Successfully deleted resource ${resourceId} from ${indexName}`);
    } catch (error) {
      if (error.statusCode === 404) {
        this.logger.warn(`Resource ${resourceId} not found in index, skipping deletion`);
        return;
      }
      
      this.logger.error(`Failed to delete resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Process full reindexing job
   */
  async processReindexJob(job: any): Promise<void> {
    this.logger.log('Starting full reindexing process...');
    
    try {
      await this.reindexAll();
      this.logger.log('Full reindexing completed successfully');
    } catch (error) {
      this.logger.error('Full reindexing failed:', error);
      throw error;
    }
  }

  /**
   * Perform full reindexing with pagination from database
   * Task 3.3 Implementation - Requirements 2.6, 2.7
   */
  async reindexAll(): Promise<void> {
    this.logger.log('Starting full reindexing from database...');
    
    const startTime = Date.now();
    const batchSize = this.configService.get('elasticsearch.reindexBatchSize', 100);
    let totalProcessed = 0;
    let totalErrors = 0;
    
    try {
      // Get total count for progress tracking
      const totalCount = await this.prisma.apiResource.count({
        where: {
          deletedAt: null, // Only active resources
          status: 'ACTIVE'
        }
      });
      
      this.logger.log(`Found ${totalCount} resources to reindex`);
      
      // Process resources in batches with pagination
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
        
        // Process batch with error handling
        const batchResults = await Promise.allSettled(
          batch.map(async (resource) => {
            try {
              await this.indexResource(
                resource.id,
                this.mapResourceTypeToString(resource.resourceType),
                this.transformResourceForReindexing(resource)
              );
              return { success: true, resourceId: resource.id };
            } catch (error) {
              this.logger.error(`Failed to reindex resource ${resource.id}:`, error);
              return { success: false, resourceId: resource.id, error: error.message };
            }
          })
        );
        
        // Count results
        const batchSuccesses = batchResults.filter(result => 
          result.status === 'fulfilled' && result.value.success
        ).length;
        const batchErrors = batchResults.length - batchSuccesses;
        
        totalProcessed += batchSuccesses;
        totalErrors += batchErrors;
        
        this.logger.debug(`Batch completed: ${batchSuccesses} successful, ${batchErrors} errors`);
        
        skip += batchSize;
        
        // Progress logging
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
      
    } catch (error) {
      this.logger.error('Fatal error during reindexing:', error);
      throw error;
    }
  }

  /**
   * Check index health with detailed metrics
   * Task 3.3 Implementation - Requirements 2.6, 2.7
   */
  async checkIndexHealth(): Promise<IndexHealth> {
    this.logger.debug('Checking index health...');
    
    try {
      const indexName = this.getIndexName('api');
      
      // Check if index exists
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
      
      // Get index stats
      const stats = await this.elasticsearch.indices.stats({
        index: indexName
      });
      
      // Get index health
      const health = await this.elasticsearch.cluster.health({
        index: indexName
      });
      
      // Get index settings and mappings for additional info
      const [settings, mappings] = await Promise.all([
        this.elasticsearch.indices.getSettings({ index: indexName }),
        this.elasticsearch.indices.getMapping({ index: indexName })
      ]);
      
      const indexStats = stats.indices[indexName];
      const totalDocs = indexStats?.total?.docs?.count || 0;
      const indexSizeBytes = indexStats?.total?.store?.size_in_bytes || 0;
      
      // Format size
      const indexSize = this.formatBytes(indexSizeBytes);
      
      // Determine overall status
      let status: 'green' | 'yellow' | 'red' = health.status as any;
      const errors: string[] = [];
      
      // Additional health checks
      if (health.number_of_data_nodes === 0) {
        status = 'red';
        errors.push('No data nodes available');
      }
      
      if (health.unassigned_shards > 0) {
        if (status === 'green') status = 'yellow';
        errors.push(`${health.unassigned_shards} unassigned shards`);
      }
      
      if (health.initializing_shards > 0) {
        if (status === 'green') status = 'yellow';
        errors.push(`${health.initializing_shards} initializing shards`);
      }
      
      // Check if index is up to date by comparing with database count
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
        
        if (percentageDifference > 10) { // More than 10% difference
          if (status === 'green') status = 'yellow';
          errors.push(`Index count (${indexCount}) differs significantly from database count (${dbCount})`);
        }
      } catch (dbError) {
        this.logger.warn('Could not compare index count with database:', dbError);
        errors.push('Could not verify index synchronization with database');
      }
      
      const result: IndexHealth = {
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
      
    } catch (error) {
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

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
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

  /**
   * Clear all jobs from the queue
   */
  async clearQueue(): Promise<void> {
    await this.indexingQueue.clean(0, 'completed');
    await this.indexingQueue.clean(0, 'failed');
    await this.indexingQueue.clean(0, 'active');
    await this.indexingQueue.clean(0, 'delayed');
    
    this.logger.log('Cleared all jobs from indexing queue');
  }

  /**
   * Get job priority based on action type
   */
  private getJobPriority(action: string): number {
    const priorities = {
      delete: 10,    // Highest priority
      update: 5,     // Medium priority
      index: 1,      // Normal priority
      reindex: -10,  // Lowest priority (background task)
    };

    return priorities[action] || 1;
  }

  /**
   * Get index name for resource type
   */
  private getIndexName(resourceType: string): string {
    const prefix = this.configService.get('elasticsearch.indexPrefix');
    return `${prefix}_resources`;
  }

  /**
   * Transform resource data for indexing
   */
  private transformResourceForIndex(data: any, resourceType: string): TransformedResource {
    // Base transformation that applies to all resource types
    const transformed: TransformedResource = {
      ...data,
      resourceType,
      indexedAt: new Date().toISOString(),
    };

    // Add suggest field for autocomplete
    if (data.name) {
      transformed.suggest = {
        input: [data.name],
        weight: data.popularity || 1,
      };

      // Add additional suggest inputs based on resource type
      if (data.tags && Array.isArray(data.tags)) {
        transformed.suggest.input.push(...data.tags);
      }

      if (data.category && data.category.name) {
        transformed.suggest.input.push(data.category.name);
      }
    }

    // Resource type specific transformations
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

  /**
   * Transform API resource for indexing
   */
  private transformApiResource(data: any): any {
    return {
      ...data,
      // API-specific transformations
      endpoints: data.endpoints || [],
      methods: data.methods || [],
      authentication: data.authentication || 'none',
    };
  }

  /**
   * Transform Enterprise resource for indexing
   */
  private transformEnterpriseResource(data: any): any {
    return {
      ...data,
      // Enterprise-specific transformations
      industry: data.industry || 'other',
      size: data.size || 'unknown',
      founded: data.founded || null,
    };
  }

  /**
   * Transform Service resource for indexing
   */
  private transformServiceResource(data: any): any {
    return {
      ...data,
      // Service-specific transformations
      serviceType: data.serviceType || 'other',
      availability: data.availability || '24/7',
    };
  }

  /**
   * Transform resource from database for reindexing
   */
  private transformResourceForReindexing(resource: any): any {
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
      // Add search-specific fields
      popularity: 1, // Default popularity score
      rating: 0, // Default rating
      tags: [], // Could be populated from categories or other sources
    };
  }

  /**
   * Map Prisma ResourceType enum to string
   */
  private mapResourceTypeToString(resourceType: any): string {
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

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0b';
    
    const k = 1024;
    const sizes = ['b', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
  }
}