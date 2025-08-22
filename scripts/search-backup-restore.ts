#!/usr/bin/env ts-node

/**
 * Search Backup and Restore Script
 * Handles backup and restoration of search data including Elasticsearch indices and Redis cache
 */

/// <reference path="./types/elasticsearch.d.ts" />
/// <reference path="./types/redis.d.ts" />

import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Client as PostgresClient } from 'pg';

interface BackupConfig {
  backupDir: string;
  includeElasticsearch: boolean;
  includeRedis: boolean;
  includeDatabase: boolean;
  compressionEnabled: boolean;
  retentionDays: number;
}

class SearchBackupRestore {
  private prisma: PrismaClient;
  private redis: any;
  private elasticsearch: ElasticsearchClient;
  private config: BackupConfig;

  constructor(config: BackupConfig) {
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

      // Ensure backup directory exists
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true });
      }
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      throw error;
    }
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `search-backup-${timestamp}`;
    const backupPath = path.join(this.config.backupDir, backupName);

    console.log(`📦 Creating search backup: ${backupName}`);

    // Create backup directory
    fs.mkdirSync(backupPath, { recursive: true });

    const backupManifest = {
      timestamp,
      backupName,
      components: [],
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };

    try {
      // Backup Elasticsearch indices
      if (this.config.includeElasticsearch) {
        await this.backupElasticsearch(backupPath);
        backupManifest.components.push('elasticsearch');
      }

      // Backup Redis data
      if (this.config.includeRedis) {
        await this.backupRedis(backupPath);
        backupManifest.components.push('redis');
      }

      // Backup database search-related tables
      if (this.config.includeDatabase) {
        await this.backupDatabase(backupPath);
        backupManifest.components.push('database');
      }

      // Create backup manifest
      fs.writeFileSync(
        path.join(backupPath, 'manifest.json'),
        JSON.stringify(backupManifest, null, 2)
      );

      // Compress backup if enabled
      if (this.config.compressionEnabled) {
        await this.compressBackup(backupPath);
      }

      console.log(`✅ Backup created successfully: ${backupPath}`);
      return backupPath;

    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  private async backupElasticsearch(backupPath: string): Promise<void> {
    console.log('📊 Backing up Elasticsearch indices...');

    const esBackupPath = path.join(backupPath, 'elasticsearch');
    fs.mkdirSync(esBackupPath, { recursive: true });

    try {
      // Get all indices
      const indices = await this.elasticsearch.cat.indices({
        format: 'json',
        h: 'index',
      });

      const indexPrefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'romapi';
      const searchIndices = (indices as any[])
        .map((index: any) => index.index)
        .filter((indexName: string) => indexName.startsWith(indexPrefix));

      // Create snapshots for each index
      for (const indexName of searchIndices) {
        console.log(`📋 Backing up index: ${indexName}`);

        // Export index mapping
        const mapping = await this.elasticsearch.indices.getMapping({
          index: indexName,
        });
        fs.writeFileSync(
          path.join(esBackupPath, `${indexName}-mapping.json`),
          JSON.stringify(mapping.body, null, 2)
        );

        // Export index settings
        const settings = await this.elasticsearch.indices.getSettings({
          index: indexName,
        });
        fs.writeFileSync(
          path.join(esBackupPath, `${indexName}-settings.json`),
          JSON.stringify(settings.body, null, 2)
        );

        // Export index data using scroll API
        await this.exportIndexData(indexName, esBackupPath);
      }

      console.log(`✅ Elasticsearch backup completed`);

    } catch (error) {
      console.error('❌ Elasticsearch backup failed:', error);
      throw error;
    }
  }

  private async exportIndexData(indexName: string, backupPath: string): Promise<void> {
    const dataFile = path.join(backupPath, `${indexName}-data.ndjson`);
    const writeStream = fs.createWriteStream(dataFile);

    try {
      // Initialize scroll
      const scrollResponse = await this.elasticsearch.search({
        index: indexName,
        scroll: '5m',
        size: 1000,
        body: {
          query: { match_all: {} },
        },
      });

      let scrollId = scrollResponse._scroll_id;
      let hits = scrollResponse.hits.hits;

      // Write initial batch
      for (const hit of hits) {
        writeStream.write(JSON.stringify(hit) + '\n');
      }

      // Continue scrolling
      while (hits.length > 0) {
        const scrollResult = await this.elasticsearch.scroll({
          scroll_id: scrollId,
          scroll: '5m',
        });

        scrollId = scrollResult._scroll_id;
        hits = scrollResult.hits.hits;

        for (const hit of hits) {
          writeStream.write(JSON.stringify(hit) + '\n');
        }
      }

      // Clear scroll
      await this.elasticsearch.clearScroll({ scroll_id: scrollId });

    } finally {
      writeStream.end();
    }
  }

  private async backupRedis(backupPath: string): Promise<void> {
    console.log('🔴 Backing up Redis data...');

    const redisBackupPath = path.join(backupPath, 'redis');
    fs.mkdirSync(redisBackupPath, { recursive: true });

    try {
      // Get all search-related keys
      const keyPattern = `${process.env.REDIS_SEARCH_KEY_PREFIX || 'search:'}*`;
      const keys = await this.redis.keys(keyPattern);

      console.log(`📋 Found ${keys.length} Redis keys to backup`);

      const redisData = {};
      for (const key of keys) {
        const type = await this.redis.type(key);
        const ttl = await this.redis.ttl(key);

        switch (type) {
          case 'string':
            redisData[key] = {
              type,
              value: await this.redis.get(key),
              ttl: ttl > 0 ? ttl : null,
            };
            break;
          case 'hash':
            redisData[key] = {
              type,
              value: await this.redis.hgetall(key),
              ttl: ttl > 0 ? ttl : null,
            };
            break;
          case 'list':
            redisData[key] = {
              type,
              value: await this.redis.lrange(key, 0, -1),
              ttl: ttl > 0 ? ttl : null,
            };
            break;
          case 'set':
            redisData[key] = {
              type,
              value: await this.redis.smembers(key),
              ttl: ttl > 0 ? ttl : null,
            };
            break;
          case 'zset':
            redisData[key] = {
              type,
              value: await this.redis.zrange(key, 0, -1, 'WITHSCORES'),
              ttl: ttl > 0 ? ttl : null,
            };
            break;
        }
      }

      fs.writeFileSync(
        path.join(redisBackupPath, 'redis-data.json'),
        JSON.stringify(redisData, null, 2)
      );

      console.log(`✅ Redis backup completed`);

    } catch (error) {
      console.error('❌ Redis backup failed:', error);
      throw error;
    }
  }

  private async backupDatabase(backupPath: string): Promise<void> {
    console.log('🗄️  Backing up database search tables...');

    const dbBackupPath = path.join(backupPath, 'database');
    fs.mkdirSync(dbBackupPath, { recursive: true });

    try {
      // Export search logs
      const searchLogs = await this.prisma.searchLog.findMany();
      fs.writeFileSync(
        path.join(dbBackupPath, 'search_logs.json'),
        JSON.stringify(searchLogs, null, 2)
      );

      // Export search clicks
      const searchClicks = await this.prisma.searchClick.findMany();
      fs.writeFileSync(
        path.join(dbBackupPath, 'search_clicks.json'),
        JSON.stringify(searchClicks, null, 2)
      );

      // Export saved searches
      const savedSearches = await this.prisma.savedSearch.findMany();
      fs.writeFileSync(
        path.join(dbBackupPath, 'saved_searches.json'),
        JSON.stringify(savedSearches, null, 2)
      );

      console.log(`✅ Database backup completed`);

    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  private async compressBackup(backupPath: string): Promise<void> {
    console.log('🗜️  Compressing backup...');

    try {
      const tarFile = `${backupPath}.tar.gz`;
      execSync(`tar -czf "${tarFile}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`);
      
      // Remove uncompressed directory
      execSync(`rm -rf "${backupPath}"`);
      
      console.log(`✅ Backup compressed: ${tarFile}`);
    } catch (error) {
      console.error('❌ Compression failed:', error);
      throw error;
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    console.log(`🔄 Restoring search backup from: ${backupPath}`);

    try {
      // Read backup manifest
      const manifestPath = path.join(backupPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Backup manifest not found');
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`📋 Restoring backup: ${manifest.backupName}`);

      // Restore components based on manifest
      for (const component of manifest.components) {
        switch (component) {
          case 'elasticsearch':
            await this.restoreElasticsearch(backupPath);
            break;
          case 'redis':
            await this.restoreRedis(backupPath);
            break;
          case 'database':
            await this.restoreDatabase(backupPath);
            break;
        }
      }

      console.log(`✅ Backup restored successfully`);

    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }

  private async restoreElasticsearch(backupPath: string): Promise<void> {
    console.log('📊 Restoring Elasticsearch indices...');

    const esBackupPath = path.join(backupPath, 'elasticsearch');
    
    try {
      const files = fs.readdirSync(esBackupPath);
      const indices = new Set();

      // Identify indices from backup files
      files.forEach(file => {
        if (file.endsWith('-mapping.json')) {
          indices.add(file.replace('-mapping.json', ''));
        }
      });

      for (const indexName of Array.from(indices)) {
        console.log(`📋 Restoring index: ${indexName}`);

        // Delete existing index if it exists
        try {
          await this.elasticsearch.indices.delete({ index: indexName as string });
        } catch (error) {
          // Index might not exist, continue
        }

        // Restore mapping and settings
        const mapping = JSON.parse(fs.readFileSync(
          path.join(esBackupPath, `${indexName as string}-mapping.json`), 'utf8'
        ));
        const settings = JSON.parse(fs.readFileSync(
          path.join(esBackupPath, `${indexName as string}-settings.json`), 'utf8'
        ));

        // Create index with settings and mapping
        await this.elasticsearch.indices.create({
          index: indexName as string,
          body: {
            settings: settings[indexName as string].settings,
            mappings: mapping[indexName as string].mappings,
          },
        });

        // Restore data
        await this.restoreIndexData(indexName as string, esBackupPath);
      }

      console.log(`✅ Elasticsearch restore completed`);

    } catch (error) {
      console.error('❌ Elasticsearch restore failed:', error);
      throw error;
    }
  }

  private async restoreIndexData(indexName: string, backupPath: string): Promise<void> {
    const dataFile = path.join(backupPath, `${indexName}-data.ndjson`);
    
    if (!fs.existsSync(dataFile)) {
      console.log(`⚠️  No data file found for index: ${indexName}`);
      return;
    }

    const data = fs.readFileSync(dataFile, 'utf8');
    const lines = data.trim().split('\n');

    // Bulk index data
    const bulkBody = [];
    for (const line of lines) {
      const doc = JSON.parse(line);
      bulkBody.push({ index: { _index: indexName, _id: doc._id } });
      bulkBody.push(doc._source);
    }

    if (bulkBody.length > 0) {
      await this.elasticsearch.bulk({ body: bulkBody });
    }
  }

  private async restoreRedis(backupPath: string): Promise<void> {
    console.log('🔴 Restoring Redis data...');

    const redisBackupPath = path.join(backupPath, 'redis');
    const dataFile = path.join(redisBackupPath, 'redis-data.json');

    if (!fs.existsSync(dataFile)) {
      console.log(`⚠️  No Redis data file found`);
      return;
    }

    try {
      const redisData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

      for (const [key, data] of Object.entries(redisData)) {
        const { type, value, ttl } = data as any;

        switch (type) {
          case 'string':
            await this.redis.set(key, value);
            break;
          case 'hash':
            await this.redis.hset(key, value);
            break;
          case 'list':
            await this.redis.lpush(key, ...value.reverse());
            break;
          case 'set':
            await this.redis.sadd(key, ...value);
            break;
          case 'zset':
            const zsetArgs = [];
            for (let i = 0; i < value.length; i += 2) {
              zsetArgs.push(value[i + 1], value[i]); // score, member
            }
            await this.redis.zadd(key, ...zsetArgs);
            break;
        }

        // Set TTL if it existed
        if (ttl) {
          await this.redis.expire(key, ttl);
        }
      }

      console.log(`✅ Redis restore completed`);

    } catch (error) {
      console.error('❌ Redis restore failed:', error);
      throw error;
    }
  }

  private async restoreDatabase(backupPath: string): Promise<void> {
    console.log('🗄️  Restoring database search tables...');

    const dbBackupPath = path.join(backupPath, 'database');

    try {
      // Restore search logs
      const searchLogsFile = path.join(dbBackupPath, 'search_logs.json');
      if (fs.existsSync(searchLogsFile)) {
        const searchLogs = JSON.parse(fs.readFileSync(searchLogsFile, 'utf8'));
        await this.prisma.searchLog.createMany({ data: searchLogs, skipDuplicates: true });
      }

      // Restore search clicks
      const searchClicksFile = path.join(dbBackupPath, 'search_clicks.json');
      if (fs.existsSync(searchClicksFile)) {
        const searchClicks = JSON.parse(fs.readFileSync(searchClicksFile, 'utf8'));
        await this.prisma.searchClick.createMany({ data: searchClicks, skipDuplicates: true });
      }

      // Restore saved searches
      const savedSearchesFile = path.join(dbBackupPath, 'saved_searches.json');
      if (fs.existsSync(savedSearchesFile)) {
        const savedSearches = JSON.parse(fs.readFileSync(savedSearchesFile, 'utf8'));
        await this.prisma.savedSearch.createMany({ data: savedSearches, skipDuplicates: true });
      }

      console.log(`✅ Database restore completed`);

    } catch (error) {
      console.error('❌ Database restore failed:', error);
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<void> {
    console.log('🧹 Cleaning up old backups...');

    try {
      const files = fs.readdirSync(this.config.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.config.backupDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          if (fs.lstatSync(filePath).isDirectory()) {
            execSync(`rm -rf "${filePath}"`);
          } else {
            fs.unlinkSync(filePath);
          }
          deletedCount++;
          console.log(`🗑️  Deleted old backup: ${file}`);
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} old backups`);

    } catch (error) {
      console.error('❌ Backup cleanup failed:', error);
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
}

// Main execution
async function main() {
  const command = process.argv[2];
  const backupPath = process.argv[3];

  const config: BackupConfig = {
    backupDir: process.env.SEARCH_BACKUPS_PATH || './backups/search',
    includeElasticsearch: process.env.BACKUP_INCLUDE_ELASTICSEARCH !== 'false',
    includeRedis: process.env.BACKUP_INCLUDE_REDIS !== 'false',
    includeDatabase: process.env.BACKUP_INCLUDE_DATABASE !== 'false',
    compressionEnabled: process.env.BACKUP_COMPRESSION_ENABLED !== 'false',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  };

  const backupRestore = new SearchBackupRestore(config);

  try {
    await backupRestore.initialize();

    switch (command) {
      case 'backup':
        await backupRestore.createBackup();
        break;
      case 'restore':
        if (!backupPath) {
          throw new Error('Backup path is required for restore operation');
        }
        await backupRestore.restoreBackup(backupPath);
        break;
      case 'cleanup':
        await backupRestore.cleanupOldBackups();
        break;
      default:
        console.log('Usage: search-backup-restore.ts <backup|restore|cleanup> [backup-path]');
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  } finally {
    await backupRestore.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { SearchBackupRestore };