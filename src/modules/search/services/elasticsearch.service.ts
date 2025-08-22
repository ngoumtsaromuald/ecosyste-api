import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly client: Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({
      node: `http://${this.configService.get('elasticsearch.host')}:${this.configService.get('elasticsearch.port')}`,
      requestTimeout: this.configService.get('elasticsearch.requestTimeout'),
      maxRetries: this.configService.get('elasticsearch.maxRetries'),
    });
  }

  async onModuleInit() {
    try {
      const isConnected = await this.checkConnection();
      if (isConnected) {
        await this.ensureIndicesExist();
      } else {
        this.logger.warn('Elasticsearch not available, continuing without search functionality');
      }
    } catch (error) {
      this.logger.error('Elasticsearch initialization failed, continuing without search functionality:', error.message);
    }
  }

  /**
   * Get Elasticsearch client
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Check Elasticsearch connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      const health = await this.client.cluster.health();
      this.logger.log(`Connected to Elasticsearch cluster: ${health.cluster_name} (${health.status})`);
      return true;
    } catch (error) {
      this.logger.error('Failed to connect to Elasticsearch:', error.message);
      return false;
    }
  }

  /**
   * Ensure all required indices exist
   */
  async ensureIndicesExist(): Promise<void> {
    const indices = [
      this.configService.get('elasticsearch.indices.resources'),
      this.configService.get('elasticsearch.indices.suggestions'),
    ];

    for (const indexName of indices) {
      await this.ensureIndexExists(indexName);
    }
  }

  /**
   * Ensure a specific index exists
   */
  async ensureIndexExists(indexName: string): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: indexName });
      
      if (!exists) {
        this.logger.log(`Creating index: ${indexName}`);
        await this.createIndex(indexName);
      } else {
        this.logger.log(`Index ${indexName} already exists`);
      }
    } catch (error) {
      this.logger.error(`Failed to ensure index ${indexName} exists:`, error);
      throw error;
    }
  }

  /**
   * Create an index with mappings
   */
  async createIndex(indexName: string): Promise<void> {
    try {
      const mappings = await this.loadIndexMappings();
      
      await this.client.indices.create({
        index: indexName,
        body: mappings,
      });

      this.logger.log(`Successfully created index: ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to create index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(indexName: string): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: indexName });
      
      if (exists) {
        await this.client.indices.delete({ index: indexName });
        this.logger.log(`Successfully deleted index: ${indexName}`);
      } else {
        this.logger.warn(`Index ${indexName} does not exist, skipping deletion`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Get index health
   */
  async getIndexHealth(indexName: string): Promise<any> {
    try {
      const stats = await this.client.indices.stats({ index: indexName });
      const health = await this.client.cluster.health({ index: indexName });
      
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
      };
    } catch (error) {
      this.logger.error(`Failed to get health for index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Get cluster health
   */
  async getClusterHealth(): Promise<any> {
    try {
      const health = await this.client.cluster.health();
      const stats = await this.client.cluster.stats();
      
      return {
        cluster: {
          name: health.cluster_name,
          status: health.status,
          nodes: {
            total: health.number_of_nodes,
            data: health.number_of_data_nodes,
          },
          shards: {
            active: health.active_shards,
            primary: health.active_primary_shards,
            relocating: health.relocating_shards,
            initializing: health.initializing_shards,
            unassigned: health.unassigned_shards,
          },
        },
        indices: {
          count: stats.indices.count,
          docs: stats.indices.docs.count,
          size: stats.indices.store.size_in_bytes,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get cluster health:', error);
      throw error;
    }
  }

  /**
   * Refresh an index
   */
  async refreshIndex(indexName: string): Promise<void> {
    try {
      await this.client.indices.refresh({ index: indexName });
      this.logger.log(`Refreshed index: ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to refresh index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Bulk index documents
   */
  async bulkIndex(indexName: string, documents: any[]): Promise<any> {
    if (documents.length === 0) {
      return { errors: false, items: [] };
    }

    const body = documents.flatMap(doc => [
      { index: { _index: indexName, _id: doc.id } },
      doc,
    ]);

    try {
      const response = await this.client.bulk({ body });
      
      if (response.errors) {
        const errorItems = response.items.filter(item => item.index?.error);
        this.logger.error(`Bulk indexing errors:`, errorItems);
      }

      this.logger.log(`Bulk indexed ${documents.length} documents to ${indexName}`);
      return response;
    } catch (error) {
      this.logger.error(`Bulk indexing failed:`, error);
      throw error;
    }
  }

  /**
   * Search documents
   */
  async search(indexName: string, query: any): Promise<any> {
    try {
      const response = await this.client.search({
        index: indexName,
        body: query,
      });

      return response;
    } catch (error) {
      this.logger.error(`Search failed in index ${indexName}:`, error);
      throw error;
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
}