import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis.module';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule, RedisModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}