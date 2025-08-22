import { IndexHealth } from './search.interfaces';
export interface IIndexingService {
    indexResource(resourceId: string, resourceType: string, data: any): Promise<void>;
    updateResource(resourceId: string, resourceType: string, data: any): Promise<void>;
    deleteResource(resourceId: string, resourceType: string): Promise<void>;
    queueIndexResource(resourceId: string, resourceType: string, data: any): Promise<void>;
    queueUpdateResource(resourceId: string, resourceType: string, data: any): Promise<void>;
    queueDeleteResource(resourceId: string, resourceType: string): Promise<void>;
    queueReindexAll(): Promise<void>;
    reindexAll(): Promise<void>;
    checkIndexHealth(): Promise<IndexHealth>;
    checkConnection(): Promise<boolean>;
    getClusterInfo(): Promise<any>;
    getQueueStats(): Promise<QueueStats>;
    clearQueue(): Promise<void>;
}
export interface QueueStats {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    total: number;
}
export interface IndexingJobData {
    resourceId: string;
    resourceType: 'api' | 'enterprise' | 'service';
    action: 'index' | 'update' | 'delete';
    data?: any;
}
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
export interface TransformedResource {
    [key: string]: any;
    resourceType: string;
    indexedAt: string;
    suggest?: {
        input: string[];
        weight: number;
    };
}
