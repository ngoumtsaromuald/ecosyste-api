import { Injectable, Logger } from '@nestjs/common';
import { SearchParams, SearchResults } from '../interfaces/search.interfaces.simple';

@Injectable()
export class SearchServiceSimple {
  private readonly logger = new Logger(SearchServiceSimple.name);

  async search(params: SearchParams): Promise<SearchResults> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Performing search with params: ${JSON.stringify(params)}`);
      
      // Simulation d'une recherche basique
      const results: SearchResults = {
        query: params.query || '',
        results: [
          {
            id: '1',
            name: 'API Example 1',
            description: 'This is a test API result',
            category: 'Test',
            type: 'API'
          },
          {
            id: '2',
            name: 'Service Example 2',
            description: 'This is a test service result',
            category: 'Test',
            type: 'Service'
          }
        ],
        total: 2,
        limit: params.limit || 20,
        offset: params.offset || 0,
        took: Date.now() - startTime
      };

      this.logger.log(`Search completed in ${results.took}ms`);
      return results;
      
    } catch (error) {
      this.logger.error('Search error:', error);
      throw error;
    }
  }

  async health(): Promise<any> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        search: 'operational'
      }
    };
  }
}