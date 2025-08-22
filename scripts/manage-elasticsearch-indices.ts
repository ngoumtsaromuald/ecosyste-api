#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { IndexManagerService } from '../src/modules/search/services/index-manager.service';
import { ElasticsearchService } from '../src/modules/search/services/elasticsearch.service';

async function main() {
  const command = process.argv[2];
  const indexName = process.argv[3];

  if (!command) {
    console.log(`
Usage: ts-node scripts/manage-elasticsearch-indices.ts <command> [index-name]

Commands:
  init                    - Initialize all indices
  health [index-name]     - Check index health (all indices if no name provided)
  test [index-name]       - Test index functionality
  recreate <index-name>   - Delete and recreate index
  cluster                 - Show cluster health
  mappings <index-name>   - Show index mappings

Examples:
  ts-node scripts/manage-elasticsearch-indices.ts init
  ts-node scripts/manage-elasticsearch-indices.ts health romapi_resources
  ts-node scripts/manage-elasticsearch-indices.ts test romapi_resources
  ts-node scripts/manage-elasticsearch-indices.ts recreate romapi_resources
    `);
    process.exit(1);
  }

  try {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const indexManager = app.get(IndexManagerService);
    const elasticsearchService = app.get(ElasticsearchService);

    switch (command) {
      case 'init':
        console.log('🚀 Initializing Elasticsearch indices...');
        await indexManager.initializeIndices();
        console.log('✅ All indices initialized successfully');
        break;

      case 'health':
        if (indexName) {
          console.log(`📊 Checking health for index: ${indexName}`);
          const health = await indexManager.getIndexHealth(indexName);
          console.log(JSON.stringify(health, null, 2));
        } else {
          console.log('📊 Checking health for all indices...');
          const indices = ['romapi_resources', 'romapi_suggestions'];
          for (const index of indices) {
            try {
              const health = await indexManager.getIndexHealth(index);
              console.log(`\n${index}:`);
              console.log(`  Status: ${health.status}`);
              console.log(`  Documents: ${health.docsCount}`);
              console.log(`  Size: ${(health.storeSize / 1024 / 1024).toFixed(2)} MB`);
              console.log(`  Shards: ${health.shards.total} (${health.shards.primary} primary)`);
            } catch (error) {
              console.log(`\n${index}: ❌ Error - ${error.message}`);
            }
          }
        }
        break;

      case 'test':
        if (!indexName) {
          console.error('❌ Index name is required for test command');
          process.exit(1);
        }
        console.log(`🧪 Testing index: ${indexName}`);
        const testResult = await indexManager.testIndex(indexName);
        console.log(testResult ? '✅ Index test passed' : '❌ Index test failed');
        break;

      case 'recreate':
        if (!indexName) {
          console.error('❌ Index name is required for recreate command');
          process.exit(1);
        }
        console.log(`🔄 Recreating index: ${indexName}`);
        await indexManager.recreateIndex(indexName);
        console.log('✅ Index recreated successfully');
        break;

      case 'cluster':
        console.log('🏥 Checking cluster health...');
        const clusterHealth = await elasticsearchService.getClusterHealth();
        console.log(JSON.stringify(clusterHealth, null, 2));
        break;

      case 'mappings':
        if (!indexName) {
          console.error('❌ Index name is required for mappings command');
          process.exit(1);
        }
        console.log(`🗺️  Showing mappings for index: ${indexName}`);
        const health = await indexManager.getIndexHealth(indexName);
        console.log(JSON.stringify(health.mappings, null, 2));
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }

    await app.close();
    console.log('✅ Operation completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();