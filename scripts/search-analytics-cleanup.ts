#!/usr/bin/env ts-node

/**
 * Search Analytics Cleanup Script
 * Cleans up old search logs and analytics data based on retention policies
 */

/// <reference path="./types/elasticsearch.d.ts" />
/// <reference path="./types/redis.d.ts" />

import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Client as PostgresClient } from 'pg';

interface CleanupConfig {
  searchLogRetentionDays: number;
  searchClickRetentionDays: number;
  cacheCleanupEnabled: boolean;
  elasticsearchCleanupEnabled: boolean;
  dryRun: boolean;
}

class SearchAnalyticsCleanup {
  private prisma: PrismaClient;
  private redis: any;
  private elasticsearch: ElasticsearchClient;
  private config: CleanupConfig;

  constructor(config: CleanupConfig) {
    this.config = config;
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
      console.log('✅ Connected to Redis');
      
      await this.elasticsearch.ping();
      console.log('✅ Connected to Elasticsearch');
    } catch (error) {
      console.error('❌ Failed to initialize connections:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Starting search analytics cleanup...');
    console.log(`📊 Configuration:`, this.config);

    const results = {
      searchLogsDeleted: 0,
      searchClicksDeleted: 0,
      cacheKeysDeleted: 0,
      elasticsearchIndicesDeleted: 0,
    };

    try {
      // Cleanup search logs
      results.searchLogsDeleted = await this.cleanupSearchLogs();
      
      // Cleanup search clicks
      results.searchClicksDeleted = await this.cleanupSearchClicks();
      
      // Cleanup cache if enabled
      if (this.config.cacheCleanupEnabled) {
        results.cacheKeysDeleted = await this.cleanupCache();
      }
      
      // Cleanup Elasticsearch indices if enabled
      if (this.config.elasticsearchCleanupEnabled) {
        results.elasticsearchIndicesDeleted = await this.cleanupElasticsearchIndices();
      }

      console.log('✅ Cleanup completed successfully');
      console.log('📊 Results:', results);

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  private async cleanupSearchLogs(): Promise<number> {
    console.log('🗑️  Cleaning up search logs...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.searchLogRetentionDays);

    if (this.config.dryRun) {
      const count = await this.prisma.searchLog.count({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
      console.log(`🔍 Would delete ${count} search logs (dry run)`);
      return count;
    }

    const result = await this.prisma.searchLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`✅ Deleted ${result.count} search logs older than ${this.config.searchLogRetentionDays} days`);
    return result.count;
  }

  private async cleanupSearchClicks(): Promise<number> {
    console.log('🗑️  Cleaning up search clicks...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.searchClickRetentionDays);

    if (this.config.dryRun) {
      const count = await this.prisma.searchClick.count({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
      console.log(`🔍 Would delete ${count} search clicks (dry run)`);
      return count;
    }

    const result = await this.prisma.searchClick.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`✅ Deleted ${result.count} search clicks older than ${this.config.searchClickRetentionDays} days`);
    return result.count;
  }

  private async cleanupCache(): Promise<number> {
    console.log('🗑️  Cleaning up search cache...');
    
    const keyPattern = `${process.env.REDIS_SEARCH_KEY_PREFIX || 'search:'}*`;
    
    if (this.config.dryRun) {
      const keys = await this.redis.keys(keyPattern);
      console.log(`🔍 Would delete ${keys.length} cache keys (dry run)`);
      return keys.length;
    }

    // Get all search-related keys
    const keys = await this.redis.keys(keyPattern);
    
    if (keys.length === 0) {
      console.log('ℹ️  No cache keys to delete');
      return 0;
    }

    // Delete expired or old cache keys
    let deletedCount = 0;
    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      
      // Delete keys that are expired or very old
      if (ttl === -1 || ttl > 86400) { // Keys without TTL or TTL > 24h
        await this.redis.del(key);
        deletedCount++;
      }
    }

    console.log(`✅ Deleted ${deletedCount} cache keys`);
    return deletedCount;
  }

  private async cleanupElasticsearchIndices(): Promise<number> {
    console.log('🗑️  Cleaning up Elasticsearch indices...');
    
    try {
      // Get all indices
      const indices = await this.elasticsearch.cat.indices({
        format: 'json',
        h: 'index,creation.date.string',
      });

      const indexPrefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'romapi';
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep indices for 30 days

      let deletedCount = 0;

      for (const index of indices as any[]) {
        const indexName = index.index;
        
        // Only process our search indices
        if (!indexName.startsWith(indexPrefix)) {
          continue;
        }

        // Skip main indices, only clean up temporary or old indices
        if (indexName.includes('_temp_') || indexName.includes('_old_')) {
          const creationDate = new Date(index['creation.date.string']);
          
          if (creationDate < cutoffDate) {
            if (this.config.dryRun) {
              console.log(`🔍 Would delete index: ${indexName} (dry run)`);
              deletedCount++;
            } else {
              await this.elasticsearch.indices.delete({ index: indexName });
              console.log(`✅ Deleted index: ${indexName}`);
              deletedCount++;
            }
          }
        }
      }

      console.log(`✅ Processed ${deletedCount} Elasticsearch indices`);
      return deletedCount;

    } catch (error) {
      console.error('❌ Failed to cleanup Elasticsearch indices:', error);
      return 0;
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
}

// Main execution
async function main() {
  const config: CleanupConfig = {
    searchLogRetentionDays: parseInt(process.env.SEARCH_ANALYTICS_RETENTION_DAYS || '90'),
    searchClickRetentionDays: parseInt(process.env.SEARCH_ANALYTICS_RETENTION_DAYS || '90'),
    cacheCleanupEnabled: process.env.SEARCH_CACHE_CLEANUP_ENABLED !== 'false',
    elasticsearchCleanupEnabled: process.env.SEARCH_ELASTICSEARCH_CLEANUP_ENABLED !== 'false',
    dryRun: process.argv.includes('--dry-run'),
  };

  const cleanup = new SearchAnalyticsCleanup(config);

  try {
    await cleanup.initialize();
    await cleanup.cleanup();
  } catch (error) {
    console.error('❌ Cleanup process failed:', error);
    process.exit(1);
  } finally {
    await cleanup.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { SearchAnalyticsCleanup };