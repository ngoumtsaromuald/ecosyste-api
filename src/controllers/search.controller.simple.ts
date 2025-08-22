import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchServiceSimple } from '../modules/search/services/search.service.simple';

@ApiTags('Search')
@Controller('api/v1/search')
export class SearchControllerSimple {
  private readonly logger = new Logger(SearchControllerSimple.name);

  constructor(
    private readonly searchService: SearchServiceSimple,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Recherche de base' })
  @ApiResponse({ status: 200, description: 'Résultats de recherche' })
  async search(
    @Query('q') query?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      this.logger.log(`Search request: query="${query}", limit=${limit}, offset=${offset}`);
      
      const results = await this.searchService.search({
        query,
        limit,
        offset
      });

      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Search error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Vérification de santé du système de recherche' })
  @ApiResponse({ status: 200, description: 'Statut de santé' })
  async health() {
    try {
      const healthStatus = await this.searchService.health();
      return {
        success: true,
        data: healthStatus,
        message: 'All search services are operational! ✅'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Search service health check failed'
      };
    }
  }
}