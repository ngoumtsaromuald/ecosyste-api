import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
export interface IndexConfig {
    name: string;
    alias?: string;
    settings?: any;
    mappings?: any;
}
export declare class IndexManagerService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly client;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    initializeIndices(): Promise<void>;
    checkElasticsearchHealth(): Promise<boolean>;
    retryInitialization(maxRetries?: number): Promise<void>;
    private getRequiredIndices;
    ensureIndexExists(indexConfig: IndexConfig): Promise<void>;
    createIndexWithMappings(indexConfig: IndexConfig): Promise<void>;
    createAlias(indexName: string, aliasName: string): Promise<void>;
    updateMappingsIfNeeded(indexConfig: IndexConfig): Promise<void>;
    private loadIndexMappings;
    recreateIndex(indexName: string): Promise<void>;
    getIndexHealth(indexName: string): Promise<any>;
    testIndex(indexName: string): Promise<boolean>;
    getClient(): Client;
}
