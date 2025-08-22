import { SearchHit } from '../components/search/SearchResults';

// Types pour l'API de recherche
export interface SearchQuery {
  query: string;
  filters?: Record<string, string[]>;
  page?: number;
  size?: number;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  }[];
}

export interface SearchResponse {
  hits: SearchHit[];
  total: number;
  took: number;
  aggregations?: Record<string, any>;
}

export interface ClusterHealth {
  cluster: {
    name: string;
    status: 'green' | 'yellow' | 'red';
    nodes: {
      total: number;
      data: number;
    };
    shards: {
      active: number;
      primary: number;
      relocating: number;
      initializing: number;
      unassigned: number;
    };
  };
  indices: {
    count: number;
    docs: number;
    size: number;
  };
}

export interface IndexHealth {
  name: string;
  status: 'green' | 'yellow' | 'red';
  docsCount: number;
  storeSize: number;
  shards: {
    total: number;
    primary: number;
    relocating: number;
    initializing: number;
    unassigned: number;
  };
}

class SearchApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Effectuer une recherche dans l'index spécifié
   */
  async search(indexName: string, searchQuery: SearchQuery): Promise<SearchResponse> {
    const { query, filters, page = 1, size = 10, sort } = searchQuery;
    
    // Construction de la requête Elasticsearch
    const elasticQuery: any = {
      query: {
        bool: {
          must: [],
          filter: []
        }
      },
      from: (page - 1) * size,
      size,
      highlight: {
        fields: {
          title: {},
          description: {},
          content: {}
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>']
      }
    };

    // Ajouter la requête de recherche textuelle
    if (query && query.trim()) {
      elasticQuery.query.bool.must.push({
        multi_match: {
          query: query.trim(),
          fields: ['title^3', 'description^2', 'content', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    } else {
      elasticQuery.query.bool.must.push({
        match_all: {}
      });
    }

    // Ajouter les filtres
    if (filters) {
      Object.entries(filters).forEach(([field, values]) => {
        if (values.length > 0) {
          elasticQuery.query.bool.filter.push({
            terms: {
              [field]: values
            }
          });
        }
      });
    }

    // Ajouter le tri
    if (sort && sort.length > 0) {
      elasticQuery.sort = sort.map(s => ({
        [s.field]: { order: s.order }
      }));
    } else {
      // Tri par défaut par score puis par date
      elasticQuery.sort = [
        { _score: { order: 'desc' } },
        { 'createdAt': { order: 'desc' } }
      ];
    }

    // Ajouter les agrégations pour les filtres
    elasticQuery.aggs = {
      categories: {
        terms: {
          field: 'category.keyword',
          size: 20
        }
      },
      tags: {
        terms: {
          field: 'tags.keyword',
          size: 50
        }
      },
      authors: {
        terms: {
          field: 'author.keyword',
          size: 20
        }
      }
    };

    return this.request<SearchResponse>(`/api/search/${indexName}`, {
      method: 'POST',
      body: JSON.stringify(elasticQuery)
    });
  }

  /**
   * Obtenir des suggestions de recherche
   */
  async getSuggestions(indexName: string, query: string): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const elasticQuery = {
      suggest: {
        text: query,
        suggestions: {
          completion: {
            field: 'suggest',
            size: 10
          }
        }
      }
    };

    try {
      const response = await this.request<any>(`/api/search/${indexName}/suggest`, {
        method: 'POST',
        body: JSON.stringify(elasticQuery)
      });

      return response.suggest?.suggestions?.[0]?.options?.map((option: any) => option.text) || [];
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Obtenir la santé du cluster Elasticsearch
   */
  async getClusterHealth(): Promise<ClusterHealth> {
    return this.request<ClusterHealth>('/api/elasticsearch/cluster/health');
  }

  /**
   * Obtenir la santé d'un index spécifique
   */
  async getIndexHealth(indexName: string): Promise<IndexHealth> {
    return this.request<IndexHealth>(`/api/elasticsearch/indices/${indexName}/health`);
  }

  /**
   * Lister tous les indices
   */
  async getIndices(): Promise<string[]> {
    return this.request<string[]>('/api/elasticsearch/indices');
  }

  /**
   * Créer un nouvel index
   */
  async createIndex(indexName: string): Promise<void> {
    return this.request<void>(`/api/elasticsearch/indices/${indexName}`, {
      method: 'POST'
    });
  }

  /**
   * Supprimer un index
   */
  async deleteIndex(indexName: string): Promise<void> {
    return this.request<void>(`/api/elasticsearch/indices/${indexName}`, {
      method: 'DELETE'
    });
  }

  /**
   * Rafraîchir un index
   */
  async refreshIndex(indexName: string): Promise<void> {
    return this.request<void>(`/api/elasticsearch/indices/${indexName}/refresh`, {
      method: 'POST'
    });
  }

  /**
   * Indexer des documents en lot
   */
  async bulkIndex(indexName: string, documents: any[]): Promise<any> {
    return this.request<any>(`/api/elasticsearch/indices/${indexName}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ documents })
    });
  }
}

// Instance singleton
export const searchApi = new SearchApiService();
export default searchApi;