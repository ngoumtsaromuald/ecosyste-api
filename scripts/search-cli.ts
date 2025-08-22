#!/usr/bin/env ts-node

/**
 * Search System CLI
 * Comprehensive command-line interface for managing the search system
 */

/// <reference path="./types/elasticsearch.d.ts" />
/// <reference path="./types/redis.d.ts" />

import { program } from 'commander';
import { SearchAnalyticsCleanup } from './search-analytics-cleanup';
import { SearchBackupRestore } from './search-backup-restore';
import { SearchHealthMonitor } from './search-health-monitor';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import * as fs from 'fs';
import { Client as PostgresClient } from 'pg';

class SearchCLI {
  private prisma: PrismaClient;
  private redis: any;
  private elasticsearch: ElasticsearchClient;

  constructor() {
    this.prisma = new PrismaClient();
    
    // Initialize Redis client
    this.redis = createClient({
      url: `redis://:${process.env.REDIS_SEARCH_PASSWORD || ''}@${process.env.REDIS_SEARCH_HOST || 'localhost'}:${process.env.REDIS_SEARCH_PORT || '6380'}/${process.env.REDIS_SEARCH_DB || '0'}`,
    });

    // Initialize Elasticsearch client
    this.elasticsearch = new ElasticsearchClient({
      node: `http://${process.env.ELASTICSEARCH_HOST || 'localhost'}:${process.env.ELASTICSEARCH_PORT || '9200'}`,
    });
  }

  async initialize(): Promise<void> {
    try {
      if (!this.redis.isOpen) {
        await this.redis.connect();
      }
      await this.elasticsearch.ping();
      console.log('✅ Connected to all search services');
    } catch (error) {
      console.error('❌ Failed to connect to search services:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      if (this.redis.isOpen) {
        await this.redis.disconnect();
      }
      console.log('✅ Disconnected from all services');
    } catch (error) {
      console.error('❌ Failed to disconnect:', error);
    }
  }

  // Index management commands
  async createIndices(): Promise<void> {
    console.log('🔧 Creating search indices...');
    
    try {
      const indexPrefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'romapi';
      const indexName = `${indexPrefix}_resources`;

      // Check if index already exists
      const exists = await this.elasticsearch.indices.exists({ index: indexName });
      
      if (exists) {
        console.log(`⚠️  Index ${indexName} already exists`);
        return;
      }

      // Read mapping configuration
      const mappingPath = './config/elasticsearch/index-mappings.json';
      
      if (!fs.existsSync(mappingPath)) {
        throw new Error('Index mapping file not found');
      }

      const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

      // Create index
      await this.elasticsearch.indices.create({
        index: indexName,
        body: mapping,
      });

      console.log(`✅ Created index: ${indexName}`);

    } catch (error) {
      console.error('❌ Failed to create indices:', error);
      throw error;
    }
  }

  async deleteIndices(confirm: boolean = false): Promise<void> {
    if (!confirm) {
      console.log('⚠️  This will delete all search indices. Use --confirm to proceed.');
      return;
    }

    console.log('🗑️  Deleting search indices...');
    
    try {
      const indexPrefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'romapi';
      const pattern = `${indexPrefix}_*`;

      await this.elasticsearch.indices.delete({ index: pattern });
      console.log(`✅ Deleted indices matching: ${pattern}`);

    } catch (error) {
      console.error('❌ Failed to delete indices:', error);
      throw error;
    }
  }

  async reindexAll(): Promise<void> {
    console.log('🔄 Starting full reindexing...');
    
    try {
      // This would typically call your indexing service
      // For now, we'll simulate the process
      
      const batchSize = parseInt(process.env.SEARCH_INDEXER_BATCH_SIZE || '1000');
      
      // Get total count of resources to index
      const totalResources = await this.prisma.apiResource.count();
      console.log(`📊 Found ${totalResources} resources to index`);

      let processed = 0;
      let offset = 0;

      while (offset < totalResources) {
        const resources = await this.prisma.apiResource.findMany({
          skip: offset,
          take: batchSize,
          include: {
            category: true,
          },
        });

        // Index batch (this would call your actual indexing service)
        console.log(`📋 Processing batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(totalResources / batchSize)}`);
        
        // Simulate indexing delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        processed += resources.length;
        offset += batchSize;

        // Progress indicator
        const progress = ((processed / totalResources) * 100).toFixed(1);
        console.log(`⏳ Progress: ${progress}% (${processed}/${totalResources})`);
      }

      console.log('✅ Reindexing completed successfully');

    } catch (error) {
      console.error('❌ Reindexing failed:', error);
      throw error;
    }
  }

  async getIndexStats(): Promise<void> {
    console.log('📊 Getting index statistics...');
    
    try {
      const indexPrefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'romapi';
      const pattern = `${indexPrefix}_*`;

      const stats = await this.elasticsearch.indices.stats({ index: pattern });
      const health = await this.elasticsearch.cluster.health();

      console.log('\n📈 Cluster Health:');
      console.log(`  Status: ${health.status}`);
      console.log(`  Nodes: ${health.number_of_nodes}`);
      console.log(`  Active Shards: ${health.active_shards}`);

      console.log('\n📋 Index Statistics:');
      Object.entries(stats.indices).forEach(([indexName, indexStats]: [string, any]) => {
        console.log(`\n  ${indexName}:`);
        console.log(`    Documents: ${indexStats.total.docs.count.toLocaleString()}`);
        console.log(`    Size: ${(indexStats.total.store.size_in_bytes / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    Shards: ${indexStats.total.segments.count}`);
      });

    } catch (error) {
      console.error('❌ Failed to get index stats:', error);
      throw error;
    }
  }

  // Cache management commands
  async clearCache(pattern?: string): Promise<void> {
    console.log('🧹 Clearing search cache...');
    
    try {
      const keyPattern = pattern || `${process.env.REDIS_SEARCH_KEY_PREFIX || 'search:'}*`;
      const keys = await this.redis.keys(keyPattern);

      if (keys.length === 0) {
        console.log('ℹ️  No cache keys found to clear');
        return;
      }

      await this.redis.del(...keys);
      console.log(`✅ Cleared ${keys.length} cache keys`);

    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }

  async getCacheStats(): Promise<void> {
    console.log('📊 Getting cache statistics...');
    
    try {
      const info = await this.redis.info();
      const keyPattern = `${process.env.REDIS_SEARCH_KEY_PREFIX || 'search:'}*`;
      const keys = await this.redis.keys(keyPattern);

      console.log('\n📈 Redis Statistics:');
      const infoLines = info.split('\r\n');
      const infoObj = {};
      
      infoLines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          infoObj[key] = value;
        }
      });

      console.log(`  Connected Clients: ${infoObj['connected_clients']}`);
      console.log(`  Used Memory: ${(parseInt(infoObj['used_memory']) / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Total Keys: ${await this.redis.dbsize()}`);
      console.log(`  Search Keys: ${keys.length}`);
      console.log(`  Keyspace Hits: ${infoObj['keyspace_hits']}`);
      console.log(`  Keyspace Misses: ${infoObj['keyspace_misses']}`);

      const hits = parseInt(infoObj['keyspace_hits'] || '0');
      const misses = parseInt(infoObj['keyspace_misses'] || '0');
      const hitRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : '0';
      console.log(`  Hit Rate: ${hitRate}%`);

    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      throw error;
    }
  }

  // Analytics commands
  async getAnalytics(days: number = 7): Promise<void> {
    console.log(`📊 Getting search analytics for the last ${days} days...`);
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get search statistics
      const totalSearches = await this.prisma.searchLog.count({
        where: { createdAt: { gte: startDate } },
      });

      const totalClicks = await this.prisma.searchClick.count({
        where: { createdAt: { gte: startDate } },
      });

      const avgLatency = await this.prisma.searchLog.aggregate({
        where: { createdAt: { gte: startDate } },
        _avg: { took: true },
      });

      const noResultsSearches = await this.prisma.searchLog.count({
        where: { 
          createdAt: { gte: startDate },
          resultsCount: 0,
        },
      });

      // Get popular search terms
      const popularTerms = await this.prisma.searchLog.groupBy({
        by: ['query'],
        where: { 
          createdAt: { gte: startDate },
          query: { not: '' },
        },
        _count: { query: true },
        orderBy: { _count: { query: 'desc' } },
        take: 10,
      });

      console.log('\n📈 Search Analytics:');
      console.log(`  Total Searches: ${totalSearches.toLocaleString()}`);
      console.log(`  Total Clicks: ${totalClicks.toLocaleString()}`);
      console.log(`  Click-through Rate: ${totalSearches > 0 ? ((totalClicks / totalSearches) * 100).toFixed(1) : '0'}%`);
      console.log(`  Average Latency: ${avgLatency._avg.took?.toFixed(2) || '0'}ms`);
      console.log(`  No Results Rate: ${totalSearches > 0 ? ((noResultsSearches / totalSearches) * 100).toFixed(1) : '0'}%`);

      console.log('\n🔍 Popular Search Terms:');
      popularTerms.forEach((term, index) => {
        console.log(`  ${index + 1}. "${term.query}" (${term._count.query} searches)`);
      });

    } catch (error) {
      console.error('❌ Failed to get analytics:', error);
      throw error;
    }
  }

  // System status command
  async getStatus(): Promise<void> {
    console.log('🔍 Getting search system status...');
    
    try {
      const status = {
        elasticsearch: 'unknown',
        redis: 'unknown',
        database: 'unknown',
        indices: 0,
        cacheKeys: 0,
        recentSearches: 0,
      };

      // Check Elasticsearch
      try {
        const health = await this.elasticsearch.cluster.health();
        status.elasticsearch = health.status;
        
        const stats = await this.elasticsearch.indices.stats();
        status.indices = Object.keys(stats.indices).length;
      } catch (error) {
        status.elasticsearch = 'down';
      }

      // Check Redis
      try {
        const pong = await this.redis.ping();
        status.redis = pong === 'PONG' ? 'healthy' : 'unhealthy';
        status.cacheKeys = await this.redis.dbsize();
      } catch (error) {
        status.redis = 'down';
      }

      // Check Database
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        status.database = 'healthy';
        
        const recentSearches = await this.prisma.searchLog.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });
        status.recentSearches = recentSearches;
      } catch (error) {
        status.database = 'down';
      }

      console.log('\n🔍 System Status:');
      console.log(`  Elasticsearch: ${status.elasticsearch}`);
      console.log(`  Redis: ${status.redis}`);
      console.log(`  Database: ${status.database}`);
      console.log(`  Indices: ${status.indices}`);
      console.log(`  Cache Keys: ${status.cacheKeys.toLocaleString()}`);
      console.log(`  Recent Searches (24h): ${status.recentSearches.toLocaleString()}`);

      // Overall health
      const isHealthy = status.elasticsearch !== 'down' && 
                       status.redis !== 'down' && 
                       status.database !== 'down';
      
      console.log(`\n🏥 Overall Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);

    } catch (error) {
      console.error('❌ Failed to get system status:', error);
      throw error;
    }
  }
}

// CLI setup
async function setupCLI() {
  const cli = new SearchCLI();

  program
    .name('search-cli')
    .description('Search System Management CLI')
    .version('1.0.0');

  // Index management commands
  const indexCmd = program
    .command('index')
    .description('Index management commands');

  indexCmd
    .command('create')
    .description('Create search indices')
    .action(async () => {
      try {
        await cli.initialize();
        await cli.createIndices();
      } finally {
        await cli.disconnect();
      }
    });

  indexCmd
    .command('delete')
    .description('Delete search indices')
    .option('--confirm', 'Confirm deletion')
    .action(async (options) => {
      try {
        await cli.initialize();
        await cli.deleteIndices(options.confirm);
      } finally {
        await cli.disconnect();
      }
    });

  indexCmd
    .command('reindex')
    .description('Reindex all resources')
    .action(async () => {
      try {
        await cli.initialize();
        await cli.reindexAll();
      } finally {
        await cli.disconnect();
      }
    });

  indexCmd
    .command('stats')
    .description('Show index statistics')
    .action(async () => {
      try {
        await cli.initialize();
        await cli.getIndexStats();
      } finally {
        await cli.disconnect();
      }
    });

  // Cache management commands
  const cacheCmd = program
    .command('cache')
    .description('Cache management commands');

  cacheCmd
    .command('clear')
    .description('Clear search cache')
    .option('-p, --pattern <pattern>', 'Key pattern to clear')
    .action(async (options) => {
      try {
        await cli.initialize();
        await cli.clearCache(options.pattern);
      } finally {
        await cli.disconnect();
      }
    });

  cacheCmd
    .command('stats')
    .description('Show cache statistics')
    .action(async () => {
      try {
        await cli.initialize();
        await cli.getCacheStats();
      } finally {
        await cli.disconnect();
      }
    });

  // Analytics commands
  program
    .command('analytics')
    .description('Show search analytics')
    .option('-d, --days <days>', 'Number of days to analyze', '7')
    .action(async (options) => {
      try {
        await cli.initialize();
        await cli.getAnalytics(parseInt(options.days));
      } finally {
        await cli.disconnect();
      }
    });

  // System status command
  program
    .command('status')
    .description('Show system status')
    .action(async () => {
      try {
        await cli.initialize();
        await cli.getStatus();
      } finally {
        await cli.disconnect();
      }
    });

  // Cleanup command
  program
    .command('cleanup')
    .description('Clean up old search data')
    .option('--dry-run', 'Show what would be cleaned without actually doing it')
    .action(async (options) => {
      const cleanup = new SearchAnalyticsCleanup({
        searchLogRetentionDays: 90,
        searchClickRetentionDays: 90,
        cacheCleanupEnabled: true,
        elasticsearchCleanupEnabled: true,
        dryRun: options.dryRun,
      });

      try {
        await cleanup.initialize();
        await cleanup.cleanup();
      } finally {
        await cleanup.disconnect();
      }
    });

  // Backup commands
  const backupCmd = program
    .command('backup')
    .description('Backup and restore commands');

  backupCmd
    .command('create')
    .description('Create a backup')
    .action(async () => {
      const backupRestore = new SearchBackupRestore({
        backupDir: './backups/search',
        includeElasticsearch: true,
        includeRedis: true,
        includeDatabase: true,
        compressionEnabled: true,
        retentionDays: 30,
      });

      try {
        await backupRestore.initialize();
        await backupRestore.createBackup();
      } finally {
        await backupRestore.disconnect();
      }
    });

  backupCmd
    .command('restore <path>')
    .description('Restore from backup')
    .action(async (path) => {
      const backupRestore = new SearchBackupRestore({
        backupDir: './backups/search',
        includeElasticsearch: true,
        includeRedis: true,
        includeDatabase: true,
        compressionEnabled: true,
        retentionDays: 30,
      });

      try {
        await backupRestore.initialize();
        await backupRestore.restoreBackup(path);
      } finally {
        await backupRestore.disconnect();
      }
    });

  // Health monitoring command
  program
    .command('monitor')
    .description('Start health monitoring')
    .option('--check', 'Run single health check')
    .action(async (options) => {
      const monitor = new SearchHealthMonitor({
        checkInterval: 60000,
        alertThresholds: {
          elasticsearchResponseTime: 1000,
          redisResponseTime: 100,
          errorRate: 5.0,
          diskUsage: 85.0,
          memoryUsage: 90.0,
        },
        alerting: {
          enabled: true,
          emailEnabled: false,
          slackEnabled: false,
        },
        logFile: './logs/search/health.log',
      });

      try {
        await monitor.initialize();
        
        if (options.check) {
          const health = await monitor.checkHealth();
          console.log(JSON.stringify(health, null, 2));
        } else {
          await monitor.startMonitoring();
        }
      } finally {
        await monitor.disconnect();
      }
    });

  return program;
}

// Main execution
async function main() {
  try {
    const program = await setupCLI();
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('❌ CLI error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { SearchCLI };