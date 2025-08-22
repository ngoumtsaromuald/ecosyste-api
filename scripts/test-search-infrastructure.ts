#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

class SearchInfrastructureTest {
  async runTests(): Promise<void> {
    console.log('🧪 Testing Search Infrastructure Configuration...');
    console.log('===============================================');

    try {
      // Test 1: Configuration Loading
      await this.testConfigurationLoading();

      // Test 2: Module Structure
      await this.testModuleStructure();

      // Test 3: Service Dependencies
      await this.testServiceDependencies();

      // Test 4: Queue Configuration
      await this.testQueueConfiguration();

      // Test 5: Index Mappings
      await this.testIndexMappings();

      console.log('\n✅ All infrastructure tests passed!');
      console.log('\n📋 Infrastructure is ready for deployment.');
      console.log('\nTo start the services:');
      console.log('1. docker-compose -f docker-compose.dev.yml up -d');
      console.log('2. npm run search:setup');

    } catch (error) {
      console.error('\n❌ Infrastructure test failed:', error.message);
      process.exit(1);
    }
  }

  private async testConfigurationLoading(): Promise<void> {
    console.log('\n1️⃣  Testing configuration loading...');

    // Test Elasticsearch config
    const esConfigPath = 'src/config/elasticsearch.config.ts';
    const esConfig = fs.readFileSync(esConfigPath, 'utf8');
    
    if (!esConfig.includes('registerAs') || !esConfig.includes('elasticsearch')) {
      throw new Error('Elasticsearch configuration not properly structured');
    }
    console.log('✅ Elasticsearch configuration structure valid');

    // Test Queue config
    const queueConfigPath = 'src/config/queue.config.ts';
    const queueConfig = fs.readFileSync(queueConfigPath, 'utf8');
    
    if (!queueConfig.includes('registerAs') || !queueConfig.includes('queue')) {
      throw new Error('Queue configuration not properly structured');
    }
    console.log('✅ Queue configuration structure valid');

    // Test environment variables structure
    const envPath = '.env.development';
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const requiredVars = [
      'ELASTICSEARCH_HOST',
      'ELASTICSEARCH_PORT',
      'REDIS_HOST',
      'REDIS_PORT',
      'QUEUE_REDIS_DB'
    ];

    for (const varName of requiredVars) {
      if (!envContent.includes(`${varName}=`)) {
        throw new Error(`Required environment variable missing: ${varName}`);
      }
    }
    console.log('✅ Environment variables configured');
  }

  private async testModuleStructure(): Promise<void> {
    console.log('\n2️⃣  Testing module structure...');

    // Test SearchModule
    const searchModulePath = 'src/modules/search/search.module.ts';
    const searchModule = fs.readFileSync(searchModulePath, 'utf8');
    
    const requiredImports = [
      'BullModule',
      'ConfigModule',
      'ElasticsearchService',
      'IndexingService',
      'SearchCacheService',
      'IndexingProcessor'
    ];

    for (const importName of requiredImports) {
      if (!searchModule.includes(importName)) {
        throw new Error(`Required import missing in SearchModule: ${importName}`);
      }
    }
    console.log('✅ SearchModule structure valid');

    // Test service files exist and have proper decorators
    const services = [
      { path: 'src/modules/search/services/elasticsearch.service.ts', decorator: '@Injectable' },
      { path: 'src/modules/search/services/indexing.service.ts', decorator: '@Injectable' },
      { path: 'src/modules/search/services/search-cache.service.ts', decorator: '@Injectable' },
      { path: 'src/modules/search/processors/indexing.processor.ts', decorator: '@Processor' },
    ];

    for (const service of services) {
      const content = fs.readFileSync(service.path, 'utf8');
      if (!content.includes(service.decorator)) {
        throw new Error(`Service missing decorator ${service.decorator}: ${service.path}`);
      }
    }
    console.log('✅ Service decorators valid');
  }

  private async testServiceDependencies(): Promise<void> {
    console.log('\n3️⃣  Testing service dependencies...');

    // Test ElasticsearchService
    const esServicePath = 'src/modules/search/services/elasticsearch.service.ts';
    const esService = fs.readFileSync(esServicePath, 'utf8');
    
    if (!esService.includes('Client') || !esService.includes('@elastic/elasticsearch')) {
      throw new Error('ElasticsearchService missing Elasticsearch client import');
    }
    console.log('✅ ElasticsearchService dependencies valid');

    // Test IndexingService
    const indexingServicePath = 'src/modules/search/services/indexing.service.ts';
    const indexingService = fs.readFileSync(indexingServicePath, 'utf8');
    
    if (!indexingService.includes('@InjectQueue') || !indexingService.includes('Queue')) {
      throw new Error('IndexingService missing queue dependencies');
    }
    console.log('✅ IndexingService dependencies valid');

    // Test SearchCacheService
    const cacheServicePath = 'src/modules/search/services/search-cache.service.ts';
    const cacheService = fs.readFileSync(cacheServicePath, 'utf8');
    
    if (!cacheService.includes('Redis') || !cacheService.includes('ioredis')) {
      throw new Error('SearchCacheService missing Redis dependencies');
    }
    console.log('✅ SearchCacheService dependencies valid');

    // Test IndexingProcessor
    const processorPath = 'src/modules/search/processors/indexing.processor.ts';
    const processor = fs.readFileSync(processorPath, 'utf8');
    
    if (!processor.includes('@Process') || !processor.includes('Job')) {
      throw new Error('IndexingProcessor missing Bull processor dependencies');
    }
    console.log('✅ IndexingProcessor dependencies valid');
  }

  private async testQueueConfiguration(): Promise<void> {
    console.log('\n4️⃣  Testing queue configuration...');

    // Test queue job types
    const queueConfigPath = 'src/config/queue.config.ts';
    const queueConfig = fs.readFileSync(queueConfigPath, 'utf8');
    
    const requiredJobTypes = [
      'indexResource',
      'updateResource',
      'deleteResource',
      'reindexAll'
    ];

    for (const jobType of requiredJobTypes) {
      if (!queueConfig.includes(jobType)) {
        throw new Error(`Queue job type missing: ${jobType}`);
      }
    }
    console.log('✅ Queue job types configured');

    // Test processor handlers
    const processorPath = 'src/modules/search/processors/indexing.processor.ts';
    const processor = fs.readFileSync(processorPath, 'utf8');
    
    const requiredHandlers = [
      'handleIndexResource',
      'handleUpdateResource',
      'handleDeleteResource',
      'handleReindexAll'
    ];

    for (const handler of requiredHandlers) {
      if (!processor.includes(handler)) {
        throw new Error(`Queue handler missing: ${handler}`);
      }
    }
    console.log('✅ Queue handlers configured');

    // Test IndexingService queue methods
    const indexingServicePath = 'src/modules/search/services/indexing.service.ts';
    const indexingService = fs.readFileSync(indexingServicePath, 'utf8');
    
    const requiredMethods = [
      'queueIndexResource',
      'queueUpdateResource',
      'queueDeleteResource',
      'queueReindexAll'
    ];

    for (const method of requiredMethods) {
      if (!indexingService.includes(method)) {
        throw new Error(`IndexingService method missing: ${method}`);
      }
    }
    console.log('✅ IndexingService queue methods configured');
  }

  private async testIndexMappings(): Promise<void> {
    console.log('\n5️⃣  Testing index mappings...');

    const mappingsPath = 'config/elasticsearch/index-mappings.json';
    const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));

    // Test French analyzer configuration
    const analyzer = mappings.settings?.analysis?.analyzer?.french_analyzer;
    if (!analyzer) {
      throw new Error('French analyzer not configured');
    }

    const requiredFilters = ['lowercase', 'asciifolding', 'french_stemmer'];
    for (const filter of requiredFilters) {
      if (!analyzer.filter.includes(filter)) {
        throw new Error(`French analyzer missing filter: ${filter}`);
      }
    }
    console.log('✅ French analyzer configured');

    // Test autocomplete configuration
    const autocompleteAnalyzer = mappings.settings?.analysis?.analyzer?.autocomplete_analyzer;
    if (!autocompleteAnalyzer) {
      throw new Error('Autocomplete analyzer not configured');
    }
    console.log('✅ Autocomplete analyzer configured');

    // Test field mappings
    const properties = mappings.mappings?.properties;
    if (!properties) {
      throw new Error('Field mappings not configured');
    }

    const requiredFields = [
      'name',
      'description',
      'category',
      'location',
      'resourceType'
    ];

    for (const field of requiredFields) {
      if (!properties[field]) {
        throw new Error(`Required field mapping missing: ${field}`);
      }
    }
    console.log('✅ Field mappings configured');

    // Test suggestion field configuration
    if (!properties.name?.fields?.suggest) {
      throw new Error('Suggestion field not configured for name');
    }
    console.log('✅ Suggestion fields configured');

    // Test geo-point configuration
    if (properties.location?.type !== 'geo_point') {
      throw new Error('Location field not configured as geo_point');
    }
    console.log('✅ Geo-point mapping configured');
  }
}

// CLI interface
async function main() {
  const tester = new SearchInfrastructureTest();
  await tester.runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { SearchInfrastructureTest };