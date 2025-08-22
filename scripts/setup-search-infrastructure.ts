#!/usr/bin/env ts-node

import { ElasticsearchSetup } from './setup-elasticsearch';
import { RedisSetup } from './setup-redis';

interface SearchInfrastructureConfig {
  elasticsearch: {
    host: string;
    port: number;
    indexPrefix: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    cacheDb: number;
    queueDb: number;
  };
}

class SearchInfrastructureSetup {
  private config: SearchInfrastructureConfig;
  private elasticsearchSetup: ElasticsearchSetup;
  private redisSetup: RedisSetup;

  constructor(config: SearchInfrastructureConfig) {
    this.config = config;
    this.elasticsearchSetup = new ElasticsearchSetup(config.elasticsearch);
    this.redisSetup = new RedisSetup(config.redis);
  }

  async setup(): Promise<void> {
    console.log('🚀 Setting up Search Infrastructure...');
    console.log('=====================================');

    try {
      // Setup Redis first (required for caching and queues)
      console.log('\n1️⃣  Setting up Redis...');
      await this.redisSetup.setup();

      // Setup Elasticsearch
      console.log('\n2️⃣  Setting up Elasticsearch...');
      await this.elasticsearchSetup.setup();

      // Test queue configuration
      console.log('\n3️⃣  Testing queue configuration...');
      await this.testQueueConfiguration();

      // Verify complete setup
      console.log('\n4️⃣  Verifying setup...');
      await this.verifySetup();

      console.log('\n✅ Search Infrastructure setup completed successfully!');
      console.log('=====================================');
      this.printUsageInstructions();

    } catch (error) {
      console.error('\n❌ Search Infrastructure setup failed:', error);
      process.exit(1);
    }
  }

  async testQueueConfiguration(): Promise<void> {
    console.log('🔄 Testing queue configuration...');

    try {
      // Test queue Redis connection (different DB)
      const Redis = require('ioredis');
      const queueRedis = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.queueDb,
      });

      // Test queue operations
      const testJob = {
        id: 'test-job-' + Date.now(),
        type: 'test',
        data: { test: true },
        timestamp: new Date().toISOString(),
      };

      await queueRedis.lpush('test:indexing-queue', JSON.stringify(testJob));
      const retrieved = await queueRedis.rpop('test:indexing-queue');
      
      if (!retrieved) {
        throw new Error('Queue test failed - could not retrieve test job');
      }

      const parsedJob = JSON.parse(retrieved);
      if (parsedJob.id !== testJob.id) {
        throw new Error('Queue test failed - job data mismatch');
      }

      await queueRedis.quit();
      console.log('✅ Queue configuration test successful');

    } catch (error) {
      throw new Error(`Queue configuration test failed: ${error.message}`);
    }
  }

  async verifySetup(): Promise<void> {
    console.log('🔍 Verifying search infrastructure...');

    try {
      // Check Redis health
      await this.redisSetup.checkHealth();

      // Check Elasticsearch health
      await this.elasticsearchSetup.checkHealth();

      // Verify index mappings
      await this.verifyIndexMappings();

      console.log('✅ All components are healthy');

    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  async verifyIndexMappings(): Promise<void> {
    console.log('🗺️  Verifying index mappings...');

    try {
      const { Client } = require('@elastic/elasticsearch');
      const client = new Client({
        node: `http://${this.config.elasticsearch.host}:${this.config.elasticsearch.port}`,
      });

      const indexName = `${this.config.elasticsearch.indexPrefix}_resources`;
      const mapping = await client.indices.getMapping({ index: indexName });
      
      const properties = mapping[indexName]?.mappings?.properties;
      if (!properties) {
        throw new Error('Index mappings not found');
      }

      // Verify key fields exist
      const requiredFields = ['name', 'description', 'category', 'location', 'resourceType'];
      for (const field of requiredFields) {
        if (!properties[field]) {
          throw new Error(`Required field '${field}' not found in mappings`);
        }
      }

      // Verify French analyzer is configured
      const settings = await client.indices.getSettings({ index: indexName });
      const analyzers = settings[indexName]?.settings?.index?.analysis?.analyzer;
      
      if (!analyzers?.french_analyzer) {
        throw new Error('French analyzer not configured');
      }

      console.log('✅ Index mappings verified successfully');

    } catch (error) {
      throw new Error(`Index mappings verification failed: ${error.message}`);
    }
  }

  async reset(): Promise<void> {
    console.log('🔄 Resetting Search Infrastructure...');
    console.log('=====================================');

    try {
      // Reset Elasticsearch indices
      console.log('\n1️⃣  Resetting Elasticsearch indices...');
      await this.elasticsearchSetup.deleteIndices();
      await this.elasticsearchSetup.setup();

      // Flush Redis databases
      console.log('\n2️⃣  Flushing Redis databases...');
      await this.redisSetup.flushDatabases();

      console.log('\n✅ Search Infrastructure reset completed!');

    } catch (error) {
      console.error('\n❌ Reset failed:', error);
      process.exit(1);
    }
  }

  async healthCheck(): Promise<void> {
    console.log('🏥 Search Infrastructure Health Check');
    console.log('=====================================');

    try {
      console.log('\n📊 Redis Health:');
      await this.redisSetup.checkHealth();

      console.log('\n📊 Elasticsearch Health:');
      await this.elasticsearchSetup.checkHealth();

      console.log('\n🔄 Queue Health:');
      await this.checkQueueHealth();

      console.log('\n✅ Health check completed');

    } catch (error) {
      console.error('\n❌ Health check failed:', error);
      process.exit(1);
    }
  }

  async checkQueueHealth(): Promise<void> {
    try {
      const Redis = require('ioredis');
      const queueRedis = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.queueDb,
      });

      const info = await queueRedis.info('memory');
      const queueMemory = info.match(/used_memory_human:([^\r\n]+)/)?.[1];
      
      // Check for any existing queue keys
      const queueKeys = await queueRedis.keys('bull:indexing-queue:*');
      
      console.log(`📊 Queue DB (${this.config.redis.queueDb}) Memory Usage: ${queueMemory}`);
      console.log(`🔑 Active Queue Keys: ${queueKeys.length}`);

      await queueRedis.quit();

    } catch (error) {
      throw new Error(`Queue health check failed: ${error.message}`);
    }
  }

  private printUsageInstructions(): void {
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Start your NestJS application:');
    console.log('   npm run start:dev');
    console.log('');
    console.log('2. Test the search endpoints:');
    console.log('   curl http://localhost:3000/api/v1/search?q=test');
    console.log('');
    console.log('3. Monitor the infrastructure:');
    console.log('   - Elasticsearch: http://localhost:9200/_cluster/health');
    console.log('   - Redis Cache: redis-cli -p 6379 -n 0 info');
    console.log('   - Redis Queue: redis-cli -p 6379 -n 1 info');
    console.log('');
    console.log('4. Available management commands:');
    console.log('   - npm run search:setup     # Setup infrastructure');
    console.log('   - npm run search:health    # Health check');
    console.log('   - npm run search:reset     # Reset all data');
    console.log('   - npm run es:setup         # Elasticsearch only');
    console.log('   - npm run redis:setup      # Redis only');
    console.log('');
    console.log('5. Queue Management:');
    console.log('   - Queue jobs are processed automatically when the app starts');
    console.log('   - Monitor queue status via the health endpoint');
    console.log('   - Failed jobs are automatically retried with exponential backoff');
  }
}

// CLI interface
async function main() {
  const config: SearchInfrastructureConfig = {
    elasticsearch: {
      host: process.env.ELASTICSEARCH_HOST || 'localhost',
      port: parseInt(process.env.ELASTICSEARCH_PORT, 10) || 9200,
      indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'romapi',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      cacheDb: parseInt(process.env.REDIS_DB, 10) || 0,
      queueDb: parseInt(process.env.QUEUE_REDIS_DB, 10) || 1,
    },
  };

  const setup = new SearchInfrastructureSetup(config);
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      await setup.setup();
      break;
    case 'reset':
      await setup.reset();
      break;
    case 'health':
      await setup.healthCheck();
      break;
    case 'verify':
      await setup.verifySetup();
      break;
    default:
      console.log('Usage: ts-node scripts/setup-search-infrastructure.ts [setup|reset|health|verify]');
      console.log('');
      console.log('Commands:');
      console.log('  setup  - Setup complete search infrastructure');
      console.log('  reset  - Reset all search data and indices');
      console.log('  health - Check health of all components');
      console.log('  verify - Verify setup without making changes');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { SearchInfrastructureSetup };