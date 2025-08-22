#!/usr/bin/env ts-node

import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import * as fs from 'fs';
import * as path from 'path';

interface ElasticsearchConfig {
  host: string;
  port: number;
  indexPrefix: string;
}

class ElasticsearchSetup {
  private client: ElasticsearchClient;
  private config: ElasticsearchConfig;

  constructor(config: ElasticsearchConfig) {
    this.config = config;
    this.client = new ElasticsearchClient({
      node: `http://${config.host}:${config.port}`,
      requestTimeout: 30000,
      maxRetries: 3,
    });
  }

  async setup(): Promise<void> {
    console.log('🔍 Setting up Elasticsearch indices...');

    try {
      // Check Elasticsearch connection
      await this.checkConnection();

      // Load index mappings
      const mappings = await this.loadIndexMappings();

      // Create indices
      await this.createIndices(mappings);

      console.log('✅ Elasticsearch setup completed successfully!');
    } catch (error) {
      console.error('❌ Elasticsearch setup failed:', error);
      process.exit(1);
    }
  }

  private async checkConnection(): Promise<void> {
    console.log('🔗 Checking Elasticsearch connection...');
    
    try {
      const health = await this.client.cluster.health();
      console.log(`✅ Connected to Elasticsearch cluster: ${health.cluster_name}`);
      console.log(`📊 Cluster status: ${health.status}`);
    } catch (error) {
      throw new Error(`Failed to connect to Elasticsearch: ${error.message}`);
    }
  }

  private async loadIndexMappings(): Promise<any> {
    console.log('📋 Loading index mappings...');
    
    const mappingsPath = path.join(__dirname, '..', 'config', 'elasticsearch', 'index-mappings.json');
    
    if (!fs.existsSync(mappingsPath)) {
      throw new Error(`Index mappings file not found: ${mappingsPath}`);
    }

    const mappingsContent = fs.readFileSync(mappingsPath, 'utf8');
    return JSON.parse(mappingsContent);
  }

  private async createIndices(mappings: any): Promise<void> {
    const indices = [
      `${this.config.indexPrefix}_resources`,
      `${this.config.indexPrefix}_suggestions`,
    ];

    for (const indexName of indices) {
      await this.createIndex(indexName, mappings);
    }
  }

  private async createIndex(indexName: string, mappings: any): Promise<void> {
    console.log(`🏗️  Creating index: ${indexName}`);

    try {
      // Check if index already exists
      const exists = await this.client.indices.exists({ index: indexName });

      if (exists) {
        console.log(`⚠️  Index ${indexName} already exists, skipping...`);
        return;
      }

      // Create index with mappings
      await this.client.indices.create({
        index: indexName,
        body: mappings,
      });

      console.log(`✅ Index ${indexName} created successfully`);

      // Verify index creation
      const indexInfo = await this.client.indices.get({ index: indexName });
      const settings = indexInfo[indexName].settings;
      const indexMappings = indexInfo[indexName].mappings;

      console.log(`📊 Index ${indexName} info:`);
      console.log(`   - Shards: ${settings.index.number_of_shards}`);
      console.log(`   - Replicas: ${settings.index.number_of_replicas}`);
      console.log(`   - Properties: ${Object.keys(indexMappings.properties || {}).length}`);

    } catch (error) {
      throw new Error(`Failed to create index ${indexName}: ${error.message}`);
    }
  }

  async deleteIndices(): Promise<void> {
    console.log('🗑️  Deleting existing indices...');

    const indices = [
      `${this.config.indexPrefix}_resources`,
      `${this.config.indexPrefix}_suggestions`,
    ];

    for (const indexName of indices) {
      try {
        const exists = await this.client.indices.exists({ index: indexName });
        
        if (exists) {
          await this.client.indices.delete({ index: indexName });
          console.log(`✅ Deleted index: ${indexName}`);
        } else {
          console.log(`⚠️  Index ${indexName} does not exist, skipping...`);
        }
      } catch (error) {
        console.error(`❌ Failed to delete index ${indexName}:`, error.message);
      }
    }
  }

  async checkHealth(): Promise<void> {
    console.log('🏥 Checking Elasticsearch health...');

    try {
      const health = await this.client.cluster.health();
      const stats = await this.client.cluster.stats();

      console.log('📊 Cluster Health:');
      console.log(`   - Status: ${health.status}`);
      console.log(`   - Nodes: ${health.number_of_nodes}`);
      console.log(`   - Data Nodes: ${health.number_of_data_nodes}`);
      console.log(`   - Active Shards: ${health.active_shards}`);
      console.log(`   - Relocating Shards: ${health.relocating_shards}`);
      console.log(`   - Initializing Shards: ${health.initializing_shards}`);
      console.log(`   - Unassigned Shards: ${health.unassigned_shards}`);

      console.log('💾 Cluster Stats:');
      console.log(`   - Total Indices: ${stats.indices.count}`);
      console.log(`   - Total Documents: ${stats.indices.docs.count}`);
      console.log(`   - Store Size: ${stats.indices.store.size_in_bytes} bytes`);

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const config: ElasticsearchConfig = {
    host: process.env.ELASTICSEARCH_HOST || 'localhost',
    port: parseInt(process.env.ELASTICSEARCH_PORT, 10) || 9200,
    indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'romapi',
  };

  const setup = new ElasticsearchSetup(config);
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      await setup.setup();
      break;
    case 'delete':
      await setup.deleteIndices();
      break;
    case 'health':
      await setup.checkHealth();
      break;
    case 'reset':
      await setup.deleteIndices();
      await setup.setup();
      break;
    default:
      console.log('Usage: ts-node scripts/setup-elasticsearch.ts [setup|delete|health|reset]');
      console.log('');
      console.log('Commands:');
      console.log('  setup  - Create Elasticsearch indices with mappings');
      console.log('  delete - Delete all Elasticsearch indices');
      console.log('  health - Check Elasticsearch cluster health');
      console.log('  reset  - Delete and recreate all indices');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { ElasticsearchSetup };