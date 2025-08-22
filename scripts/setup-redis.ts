#!/usr/bin/env ts-node

import Redis from 'ioredis';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  cacheDb: number;
  queueDb: number;
}

class RedisSetup {
  private config: RedisConfig;

  constructor(config: RedisConfig) {
    this.config = config;
  }

  async setup(): Promise<void> {
    console.log('🔴 Setting up Redis configuration...');

    try {
      // Test cache database connection
      await this.testConnection(this.config.cacheDb, 'Cache');

      // Test queue database connection
      await this.testConnection(this.config.queueDb, 'Queue');

      // Configure Redis for search caching
      await this.configureCache();

      // Configure Redis for queue management
      await this.configureQueue();

      console.log('✅ Redis setup completed successfully!');
    } catch (error) {
      console.error('❌ Redis setup failed:', error);
      process.exit(1);
    }
  }

  private async testConnection(db: number, name: string): Promise<void> {
    console.log(`🔗 Testing ${name} Redis connection (DB ${db})...`);

    const redis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: db,
      maxRetriesPerRequest: 3,
    });

    try {
      const pong = await redis.ping();
      if (pong === 'PONG') {
        console.log(`✅ ${name} Redis connection successful (DB ${db})`);
      } else {
        throw new Error(`Unexpected ping response: ${pong}`);
      }

      // Get Redis info
      const info = await redis.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
      console.log(`📊 Redis version: ${version}`);

    } catch (error) {
      throw new Error(`Failed to connect to ${name} Redis (DB ${db}): ${error.message}`);
    } finally {
      await redis.quit();
    }
  }

  private async configureCache(): Promise<void> {
    console.log('⚙️  Configuring Redis for search caching...');

    const redis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.cacheDb,
    });

    try {
      // Set cache-specific configuration
      await redis.config('SET', 'maxmemory-policy', 'allkeys-lru');
      
      // Test cache operations
      const testKey = 'test:cache:setup';
      await redis.setex(testKey, 10, JSON.stringify({ test: true, timestamp: Date.now() }));
      
      const cached = await redis.get(testKey);
      if (!cached) {
        throw new Error('Cache test failed');
      }

      await redis.del(testKey);
      console.log('✅ Cache configuration successful');

    } catch (error) {
      throw new Error(`Cache configuration failed: ${error.message}`);
    } finally {
      await redis.quit();
    }
  }

  private async configureQueue(): Promise<void> {
    console.log('⚙️  Configuring Redis for queue management...');

    const redis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.queueDb,
    });

    try {
      // Test queue operations
      const testQueue = 'test:queue:setup';
      await redis.lpush(testQueue, JSON.stringify({ test: true, timestamp: Date.now() }));
      
      const queued = await redis.rpop(testQueue);
      if (!queued) {
        throw new Error('Queue test failed');
      }

      console.log('✅ Queue configuration successful');

    } catch (error) {
      throw new Error(`Queue configuration failed: ${error.message}`);
    } finally {
      await redis.quit();
    }
  }

  async checkHealth(): Promise<void> {
    console.log('🏥 Checking Redis health...');

    const cacheRedis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.cacheDb,
    });

    const queueRedis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.queueDb,
    });

    try {
      // Cache DB health
      const cacheInfo = await cacheRedis.info('memory');
      const cacheMemory = cacheInfo.match(/used_memory_human:([^\r\n]+)/)?.[1];
      console.log(`📊 Cache DB (${this.config.cacheDb}) Memory Usage: ${cacheMemory}`);

      // Queue DB health
      const queueInfo = await queueRedis.info('memory');
      const queueMemory = queueInfo.match(/used_memory_human:([^\r\n]+)/)?.[1];
      console.log(`📊 Queue DB (${this.config.queueDb}) Memory Usage: ${queueMemory}`);

      // Connection stats
      const serverInfo = await cacheRedis.info('clients');
      const connectedClients = serverInfo.match(/connected_clients:([^\r\n]+)/)?.[1];
      console.log(`🔗 Connected Clients: ${connectedClients}`);

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
    } finally {
      await cacheRedis.quit();
      await queueRedis.quit();
    }
  }

  async flushDatabases(): Promise<void> {
    console.log('🗑️  Flushing Redis databases...');

    const cacheRedis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.cacheDb,
    });

    const queueRedis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.queueDb,
    });

    try {
      await cacheRedis.flushdb();
      console.log(`✅ Flushed Cache DB (${this.config.cacheDb})`);

      await queueRedis.flushdb();
      console.log(`✅ Flushed Queue DB (${this.config.queueDb})`);

    } catch (error) {
      console.error('❌ Flush failed:', error.message);
    } finally {
      await cacheRedis.quit();
      await queueRedis.quit();
    }
  }
}

// CLI interface
async function main() {
  const config: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    cacheDb: parseInt(process.env.REDIS_DB, 10) || 0,
    queueDb: parseInt(process.env.QUEUE_REDIS_DB, 10) || 1,
  };

  const setup = new RedisSetup(config);
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      await setup.setup();
      break;
    case 'health':
      await setup.checkHealth();
      break;
    case 'flush':
      await setup.flushDatabases();
      break;
    default:
      console.log('Usage: ts-node scripts/setup-redis.ts [setup|health|flush]');
      console.log('');
      console.log('Commands:');
      console.log('  setup  - Test and configure Redis connections');
      console.log('  health - Check Redis health and memory usage');
      console.log('  flush  - Flush all Redis databases (WARNING: destructive)');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { RedisSetup };