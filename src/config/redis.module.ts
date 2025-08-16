import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        
        const redisConfig = {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
          db: configService.get<number>('redis.db'),
          retryDelayOnFailover: 100,
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          connectTimeout: 10000,
          commandTimeout: 5000,
        };

        // Remove undefined password to avoid Redis connection issues
        if (!redisConfig.password) {
          delete redisConfig.password;
        }

        const redis = new Redis(redisConfig);

        // Connection event handlers
        redis.on('connect', () => {
          logger.log(`Redis connected to ${redisConfig.host}:${redisConfig.port}`);
        });

        redis.on('ready', () => {
          logger.log('Redis connection is ready');
        });

        redis.on('error', (error) => {
          logger.error('Redis connection error:', error);
        });

        redis.on('close', () => {
          logger.warn('Redis connection closed');
        });

        redis.on('reconnecting', (delay) => {
          logger.log(`Redis reconnecting in ${delay}ms`);
        });

        redis.on('end', () => {
          logger.warn('Redis connection ended');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
          logger.log('Closing Redis connection...');
          await redis.quit();
        });

        process.on('SIGTERM', async () => {
          logger.log('Closing Redis connection...');
          await redis.quit();
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}