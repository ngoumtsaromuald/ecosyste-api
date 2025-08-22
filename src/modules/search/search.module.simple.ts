import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Service simplifié
import { SearchServiceSimple } from './services/search.service.simple';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    SearchServiceSimple,
  ],
  exports: [
    SearchServiceSimple,
  ],
})
export class SearchModuleSimple {}