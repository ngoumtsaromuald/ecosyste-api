import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
export declare class ElasticsearchService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly client;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    getClient(): Client;
    checkConnection(): Promise<boolean>;
    ensureIndicesExist(): Promise<void>;
    ensureIndexExists(indexName: string): Promise<void>;
    createIndex(indexName: string): Promise<void>;
    deleteIndex(indexName: string): Promise<void>;
    getIndexHealth(indexName: string): Promise<any>;
    getClusterHealth(): Promise<any>;
    refreshIndex(indexName: string): Promise<void>;
    bulkIndex(indexName: string, documents: any[]): Promise<any>;
    search(indexName: string, query: any): Promise<any>;
    private loadIndexMappings;
}
