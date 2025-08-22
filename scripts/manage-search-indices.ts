#!/usr/bin/env ts-node

/**
 * CLI script for managing search indices
 * Task 3.3 Implementation - CLI commands for index management
 * 
 * Usage:
 *   npm run indices:reindex     - Full reindexing
 *   npm run indices:health      - Check index health
 *   npm run indices:status      - Get index status
 *   npm run indices:clear       - Clear all indices
 *   npm run indices:recreate    - Recreate indices with fresh mappings
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { IndexingService } from '../src/modules/search/services/indexing.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('SearchIndicesCLI');

async function main() {
  const command = process.argv[2];
  
  if (!command) {
    printUsage();
    process.exit(1);
  }

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const indexingService = app.get(IndexingService);

    switch (command) {
      case 'reindex':
        await handleReindex(indexingService);
        break;
      case 'health':
        await handleHealth(indexingService);
        break;
      case 'status':
        await handleStatus(indexingService);
        break;
      case 'clear':
        await handleClear(indexingService);
        break;
      case 'recreate':
        await handleRecreate(indexingService);
        break;
      case 'connection':
        await handleConnection(indexingService);
        break;
      case 'queue-stats':
        await handleQueueStats(indexingService);
        break;
      default:
        logger.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }

    await app.close();
    process.exit(0);

  } catch (error) {
    logger.error('CLI command failed:', error);
    process.exit(1);
  }
}

/**
 * Handle full reindexing command
 */
async function handleReindex(indexingService: IndexingService): Promise<void> {
  logger.log('🔄 Starting full reindexing...');
  
  const startTime = Date.now();
  
  try {
    await indexingService.reindexAll();
    
    const duration = Date.now() - startTime;
    logger.log(`✅ Reindexing completed successfully in ${duration}ms`);
    
    // Show health after reindexing
    logger.log('\n📊 Index health after reindexing:');
    await handleHealth(indexingService);
    
  } catch (error) {
    logger.error('❌ Reindexing failed:', error);
    throw error;
  }
}

/**
 * Handle index health check command
 */
async function handleHealth(indexingService: IndexingService): Promise<void> {
  logger.log('🏥 Checking index health...');
  
  try {
    const health = await indexingService.checkIndexHealth();
    
    // Format health status with colors
    const statusIcon = getStatusIcon(health.status);
    const statusColor = getStatusColor(health.status);
    
    console.log(`\n${statusIcon} Index Health Status: ${statusColor}${health.status.toUpperCase()}\x1b[0m`);
    console.log(`📄 Total Documents: ${health.totalDocs.toLocaleString()}`);
    console.log(`💾 Index Size: ${health.indexSize}`);
    console.log(`🕒 Last Update: ${health.lastUpdate.toISOString()}`);
    
    if (health.shards) {
      console.log(`🔧 Shards: ${health.shards.successful}/${health.shards.total} successful`);
      if (health.shards.failed > 0) {
        console.log(`⚠️  Failed Shards: ${health.shards.failed}`);
      }
    }
    
    if (health.errors && health.errors.length > 0) {
      console.log('\n❌ Errors:');
      health.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }
    
    if (health.status === 'green') {
      console.log('\n✅ Index is healthy and ready for searches');
    } else if (health.status === 'yellow') {
      console.log('\n⚠️  Index has some issues but is functional');
    } else {
      console.log('\n🚨 Index has critical issues and may not function properly');
    }
    
  } catch (error) {
    logger.error('❌ Health check failed:', error);
    throw error;
  }
}

/**
 * Handle index status command (detailed info)
 */
async function handleStatus(indexingService: IndexingService): Promise<void> {
  logger.log('📊 Getting detailed index status...');
  
  try {
    // Check connection first
    const isConnected = await indexingService.checkConnection();
    console.log(`🔌 Elasticsearch Connection: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    
    if (!isConnected) {
      console.log('Cannot retrieve index status - Elasticsearch is not available');
      return;
    }
    
    // Get cluster info
    const clusterInfo = await indexingService.getClusterInfo();
    console.log(`🏢 Cluster Name: ${clusterInfo.cluster_name}`);
    console.log(`📦 Elasticsearch Version: ${clusterInfo.version.number}`);
    
    // Get queue stats
    const queueStats = await indexingService.getQueueStats();
    console.log('\n📋 Queue Statistics:');
    console.log(`   • Waiting: ${queueStats.waiting}`);
    console.log(`   • Active: ${queueStats.active}`);
    console.log(`   • Completed: ${queueStats.completed}`);
    console.log(`   • Failed: ${queueStats.failed}`);
    console.log(`   • Total: ${queueStats.total}`);
    
    // Get health
    await handleHealth(indexingService);
    
  } catch (error) {
    logger.error('❌ Status check failed:', error);
    throw error;
  }
}

/**
 * Handle clear indices command
 */
async function handleClear(indexingService: IndexingService): Promise<void> {
  logger.warn('⚠️  This will clear all search indices. This action cannot be undone.');
  
  // In a real implementation, you might want to add confirmation
  // For now, we'll just clear the queue
  logger.log('🧹 Clearing indexing queue...');
  
  try {
    await indexingService.clearQueue();
    logger.log('✅ Indexing queue cleared successfully');
    
    // Note: Actual index deletion would require additional Elasticsearch client methods
    logger.warn('Note: This command only clears the queue. To delete indices, use Elasticsearch directly.');
    
  } catch (error) {
    logger.error('❌ Clear operation failed:', error);
    throw error;
  }
}

/**
 * Handle recreate indices command
 */
async function handleRecreate(indexingService: IndexingService): Promise<void> {
  logger.warn('⚠️  This will recreate all indices with fresh mappings.');
  
  try {
    logger.log('🧹 Clearing existing queue...');
    await indexingService.clearQueue();
    
    logger.log('🔄 Starting full reindexing with fresh data...');
    await indexingService.reindexAll();
    
    logger.log('✅ Indices recreated successfully');
    
    // Show final health
    await handleHealth(indexingService);
    
  } catch (error) {
    logger.error('❌ Recreate operation failed:', error);
    throw error;
  }
}

/**
 * Handle connection test command
 */
async function handleConnection(indexingService: IndexingService): Promise<void> {
  logger.log('🔌 Testing Elasticsearch connection...');
  
  try {
    const isConnected = await indexingService.checkConnection();
    
    if (isConnected) {
      console.log('✅ Elasticsearch connection successful');
      
      const clusterInfo = await indexingService.getClusterInfo();
      console.log(`🏢 Connected to cluster: ${clusterInfo.cluster_name}`);
      console.log(`📦 Version: ${clusterInfo.version.number}`);
      console.log(`🌐 Node: ${clusterInfo.name}`);
    } else {
      console.log('❌ Elasticsearch connection failed');
      console.log('Please check your Elasticsearch configuration and ensure the service is running.');
    }
    
  } catch (error) {
    logger.error('❌ Connection test failed:', error);
    throw error;
  }
}

/**
 * Handle queue statistics command
 */
async function handleQueueStats(indexingService: IndexingService): Promise<void> {
  logger.log('📋 Getting queue statistics...');
  
  try {
    const stats = await indexingService.getQueueStats();
    
    console.log('\n📊 Indexing Queue Statistics:');
    console.log(`   📝 Waiting Jobs: ${stats.waiting}`);
    console.log(`   ⚡ Active Jobs: ${stats.active}`);
    console.log(`   ✅ Completed Jobs: ${stats.completed}`);
    console.log(`   ❌ Failed Jobs: ${stats.failed}`);
    console.log(`   📊 Total Jobs: ${stats.total}`);
    
    if (stats.failed > 0) {
      console.log('\n⚠️  There are failed jobs in the queue. Consider investigating and retrying them.');
    }
    
    if (stats.active > 0) {
      console.log('\n⚡ Jobs are currently being processed.');
    }
    
    if (stats.waiting > 0) {
      console.log('\n📝 Jobs are waiting to be processed.');
    }
    
  } catch (error) {
    logger.error('❌ Queue stats failed:', error);
    throw error;
  }
}

/**
 * Get status icon based on health status
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'green':
      return '✅';
    case 'yellow':
      return '⚠️';
    case 'red':
      return '🚨';
    default:
      return '❓';
  }
}

/**
 * Get ANSI color code for status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'green':
      return '\x1b[32m'; // Green
    case 'yellow':
      return '\x1b[33m'; // Yellow
    case 'red':
      return '\x1b[31m'; // Red
    default:
      return '\x1b[37m'; // White
  }
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log('\n🔍 Search Indices Management CLI');
  console.log('\nUsage: npm run indices:<command>');
  console.log('\nAvailable commands:');
  console.log('  reindex      - Perform full reindexing from database');
  console.log('  health       - Check index health status');
  console.log('  status       - Get detailed index and cluster status');
  console.log('  clear        - Clear indexing queue');
  console.log('  recreate     - Clear and recreate indices');
  console.log('  connection   - Test Elasticsearch connection');
  console.log('  queue-stats  - Show indexing queue statistics');
  console.log('\nExamples:');
  console.log('  npm run indices:reindex');
  console.log('  npm run indices:health');
  console.log('  npm run indices:status');
  console.log('');
}

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    logger.error('CLI execution failed:', error);
    process.exit(1);
  });
}

export { main };