import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import * as fs from 'fs';
import * as path from 'path';

export interface IndexConfig {
  name: string;
  alias?: string;
  settings?: any;
  mappings?: any;
}

@Injectable()
export class IndexManagerService implements OnModuleInit {
  private readonly logger = new Logger(IndexManagerService.name);
  private readonly client: Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({
      node: `http://${this.configService.get('elasticsearch.host')}:${this.configService.get('elasticsearch.port')}`,
      requestTimeout: this.configService.get('elasticsearch.requestTimeout'),
      maxRetries: this.configService.get('elasticsearch.maxRetries'),
    });
  }

  async onModuleInit() {
    // Initialize indices in background with retry logic, don't block application startup
    setTimeout(() => {
      this.retryInitialization(3).catch(error => {
        this.logger.warn('Elasticsearch indices initialization failed after all retries:', error.message);
      });
    }, 2000); // Wait 2 seconds before starting initialization
  }

  /**
   * Initialize all required indices with proper mappings
   */
  async initializeIndices(): Promise<void> {
    try {
      // First check if Elasticsearch is available
      const isAvailable = await this.checkElasticsearchHealth();
      if (!isAvailable) {
        throw new Error('Elasticsearch is not available');
      }

      this.logger.log('Initializing Elasticsearch indices...');
      
      const indices = this.getRequiredIndices();
      
      for (const indexConfig of indices) {
        await this.ensureIndexExists(indexConfig);
      }
      
      this.logger.log('All Elasticsearch indices initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch indices:', error);
      // Don't throw error to prevent application startup failure
      // The search functionality will gracefully degrade
    }
  }

  /**
   * Check if Elasticsearch is healthy and available
   */
  async checkElasticsearchHealth(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.warn('Elasticsearch health check failed:', error.message);
      return false;
    }
  }

  /**
   * Retry initialization with exponential backoff
   */
  async retryInitialization(maxRetries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Elasticsearch initialization attempt ${attempt}/${maxRetries}`);
        await this.initializeIndices();
        this.logger.log('Elasticsearch indices initialized successfully');
        return;
      } catch (error) {
        this.logger.warn(`Initialization attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          this.logger.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.logger.error('All initialization attempts failed. Elasticsearch features will be disabled.');
        }
      }
    }
  }

  /**
   * Get list of required indices with their configurations
   */
  private getRequiredIndices(): IndexConfig[] {
    const indexPrefix = this.configService.get('elasticsearch.indexPrefix');
    
    return [
      {
        name: `${indexPrefix}_resources`,
        alias: `${indexPrefix}_resources_alias`,
      },
      {
        name: `${indexPrefix}_suggestions`,
        alias: `${indexPrefix}_suggestions_alias`,
      },
    ];
  }

  /**
   * Ensure an index exists with proper mappings and settings
   */
  async ensureIndexExists(indexConfig: IndexConfig): Promise<void> {
    try {
      // Check if index exists
      const exists = await this.client.indices.exists({ 
        index: indexConfig.name
      });
      
      if (!exists) {
        this.logger.log(`Creating index: ${indexConfig.name}`);
        await this.createIndexWithMappings(indexConfig);
        
        if (indexConfig.alias) {
          await this.createAlias(indexConfig.name, indexConfig.alias);
        }
      } else {
        this.logger.log(`Index ${indexConfig.name} already exists`);
        await this.updateMappingsIfNeeded(indexConfig);
      }
    } catch (error) {
      this.logger.error(`Failed to ensure index ${indexConfig.name} exists:`, error);
      // Don't throw error to prevent application startup failure
      // Log the error and continue with other indices
    }
  }

  /**
   * Create index with mappings and settings
   */
  async createIndexWithMappings(indexConfig: IndexConfig): Promise<void> {
    try {
      const mappingsAndSettings = await this.loadIndexMappings();
      
      await this.client.indices.create({
        index: indexConfig.name,
        body: {
          settings: mappingsAndSettings.settings,
          mappings: mappingsAndSettings.mappings,
        },
      });

      this.logger.log(`Successfully created index: ${indexConfig.name}`);
    } catch (error) {
      this.logger.error(`Failed to create index ${indexConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Create alias for index
   */
  async createAlias(indexName: string, aliasName: string): Promise<void> {
    try {
      await this.client.indices.putAlias({
        index: indexName,
        name: aliasName,
      });
      
      this.logger.log(`Created alias ${aliasName} for index ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to create alias ${aliasName}:`, error);
      throw error;
    }
  }

  /**
   * Update mappings if needed (for existing indices)
   */
  async updateMappingsIfNeeded(indexConfig: IndexConfig): Promise<void> {
    try {
      const mappingsAndSettings = await this.loadIndexMappings();
      
      // Update mappings (only new fields can be added)
      await this.client.indices.putMapping({
        index: indexConfig.name,
        body: mappingsAndSettings.mappings,
      });
      
      this.logger.log(`Updated mappings for index: ${indexConfig.name}`);
    } catch (error) {
      // This is expected if mappings haven't changed
      this.logger.debug(`Mappings update not needed for ${indexConfig.name}:`, error.message);
    }
  }

  /**
   * Load index mappings from configuration file
   */
  private async loadIndexMappings(): Promise<any> {
    const mappingsPath = path.join(process.cwd(), 'config', 'elasticsearch', 'index-mappings.json');
    
    if (!fs.existsSync(mappingsPath)) {
      throw new Error(`Index mappings file not found: ${mappingsPath}`);
    }

    const mappingsContent = fs.readFileSync(mappingsPath, 'utf8');
    return JSON.parse(mappingsContent);
  }

  /**
   * Delete and recreate index (for development/testing)
   */
  async recreateIndex(indexName: string): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: indexName });
      
      if (exists) {
        await this.client.indices.delete({ index: indexName });
        this.logger.log(`Deleted existing index: ${indexName}`);
      }
      
      const indexConfig = { name: indexName };
      await this.createIndexWithMappings(indexConfig);
      
      this.logger.log(`Recreated index: ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to recreate index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Get index health and statistics
   */
  async getIndexHealth(indexName: string): Promise<any> {
    try {
      const stats = await this.client.indices.stats({ index: indexName });
      const health = await this.client.cluster.health({ index: indexName });
      const mappings = await this.client.indices.getMapping({ index: indexName });
      
      return {
        name: indexName,
        status: health.status,
        docsCount: stats.indices[indexName]?.total?.docs?.count || 0,
        storeSize: stats.indices[indexName]?.total?.store?.size_in_bytes || 0,
        shards: {
          total: health.active_shards,
          primary: health.active_primary_shards,
          relocating: health.relocating_shards,
          initializing: health.initializing_shards,
          unassigned: health.unassigned_shards,
        },
        mappings: mappings[indexName]?.mappings || {},
      };
    } catch (error) {
      this.logger.error(`Failed to get health for index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Test index with sample document
   */
  async testIndex(indexName: string): Promise<boolean> {
    try {
      const testDoc = {
        id: 'test-doc',
        name: 'Test Document',
        description: 'Document de test pour vérifier l\'indexation',
        category: {
          id: 'test-category',
          name: 'Test Category',
          slug: 'test-category',
        },
        resourceType: 'api',
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Index test document
      await this.client.index({
        index: indexName,
        id: testDoc.id,
        body: testDoc,
        refresh: true,
      });

      // Search for test document
      const searchResult = await this.client.search({
        index: indexName,
        body: {
          query: {
            match: {
              name: 'Test Document',
            },
          },
        },
      });

      // Clean up test document
      await this.client.delete({
        index: indexName,
        id: testDoc.id,
        refresh: true,
      });

      const totalHits = typeof searchResult.hits.total === 'number' 
        ? searchResult.hits.total 
        : searchResult.hits.total.value;
      const found = totalHits > 0;
      this.logger.log(`Index ${indexName} test ${found ? 'passed' : 'failed'}`);
      
      return found;
    } catch (error) {
      this.logger.error(`Index test failed for ${indexName}:`, error);
      return false;
    }
  }

  /**
   * Get Elasticsearch client
   */
  getClient(): Client {
    return this.client;
  }
}