import { Module } from '@nestjs/common';
import { SearchAnalyticsService } from '../services/search-analytics.service';
import { PrismaService } from '../../../config/prisma.service';

@Module({
  providers: [
    SearchAnalyticsService,
    PrismaService,
  ],
  exports: [
    SearchAnalyticsService,
  ],
})
export class SearchAnalyticsModule {}