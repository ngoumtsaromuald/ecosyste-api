import { IndexHealth } from './search.interfaces';

/**
 * Interface for the Indexing Service
 * Defines the contract for resource indexing operations
 */
export interface IIndexingService {
  // Direct indexing methods (synchronous)
  indexResource(resourceId: string, resourceType: string, data: any): Promise<void>;
  updateResource(resourceId: string, resourceType: string, data: any): Promise<void>;
  deleteResource(resourceId: string, resourceType: string): Promise<void>;

  // Queue-based methods (asynchronous)
  queueIndexResource(resourceId: string, resourceType: string, data: any): Promise<void>;
  queueUpdateResource(resourceId: string, resourceType: string, data: any): Promise<void>;
  queueDeleteResource(resourceId: string, resourceType: string): Promise<void>;
  queueReindexAll(): Promise<void>;

  // Reindexing and health - Task 3.3
  reindexAll(): Promise<void>;
  checkIndexHealth(): Promise<IndexHealth>;

  // Health and monitoring
  checkConnection(): Promise<boolean>;
  getClusterInfo(): Promise<any>;
  getQueueStats(): Promise<QueueStats>;
  clearQueue(): Promise<void>;
}

/**
 * Queue statistics interface
 */
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

/**
 * Indexing job data interface
 */
export interface IndexingJobData {
  resourceId: string;
  resourceType: 'api' | 'enterprise' | 'service';
  action: 'index' | 'update' | 'delete';
  data?: any;
}

/**
 * Indexing configuration interface
 */
export interface IndexingConfig {
  elasticsearch: {
    host: string;
    port: number;
    requestTimeout: number;
    maxRetries: number;
    indexPrefix: string;
  };
  queue: {
    jobs: {
      indexResource: string;
      updateResource: string;
      deleteResource: string;
      reindexAll: string;
    };
  };
}

/**
 * Resource transformation result
 */
export interface TransformedResource {
  [key: string]: any;
  resourceType: string;
  indexedAt: string;
  suggest?: {
    input: string[];
    weight: number;
  };
}