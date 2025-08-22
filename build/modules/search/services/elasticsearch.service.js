"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ElasticsearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const elasticsearch_1 = require("@elastic/elasticsearch");
const fs = require("fs");
const path = require("path");
let ElasticsearchService = ElasticsearchService_1 = class ElasticsearchService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ElasticsearchService_1.name);
        this.client = new elasticsearch_1.Client({
            node: `http://${this.configService.get('elasticsearch.host')}:${this.configService.get('elasticsearch.port')}`,
            requestTimeout: this.configService.get('elasticsearch.requestTimeout'),
            maxRetries: this.configService.get('elasticsearch.maxRetries'),
        });
    }
    async onModuleInit() {
        await this.checkConnection();
        await this.ensureIndicesExist();
    }
    getClient() {
        return this.client;
    }
    async checkConnection() {
        try {
            const health = await this.client.cluster.health();
            this.logger.log(`Connected to Elasticsearch cluster: ${health.cluster_name} (${health.status})`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to connect to Elasticsearch:', error.message);
            return false;
        }
    }
    async ensureIndicesExist() {
        const indices = [
            this.configService.get('elasticsearch.indices.resources'),
            this.configService.get('elasticsearch.indices.suggestions'),
        ];
        for (const indexName of indices) {
            await this.ensureIndexExists(indexName);
        }
    }
    async ensureIndexExists(indexName) {
        try {
            const exists = await this.client.indices.exists({ index: indexName });
            if (!exists) {
                this.logger.log(`Creating index: ${indexName}`);
                await this.createIndex(indexName);
            }
            else {
                this.logger.log(`Index ${indexName} already exists`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to ensure index ${indexName} exists:`, error);
            throw error;
        }
    }
    async createIndex(indexName) {
        try {
            const mappings = await this.loadIndexMappings();
            await this.client.indices.create({
                index: indexName,
                body: mappings,
            });
            this.logger.log(`Successfully created index: ${indexName}`);
        }
        catch (error) {
            this.logger.error(`Failed to create index ${indexName}:`, error);
            throw error;
        }
    }
    async deleteIndex(indexName) {
        try {
            const exists = await this.client.indices.exists({ index: indexName });
            if (exists) {
                await this.client.indices.delete({ index: indexName });
                this.logger.log(`Successfully deleted index: ${indexName}`);
            }
            else {
                this.logger.warn(`Index ${indexName} does not exist, skipping deletion`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to delete index ${indexName}:`, error);
            throw error;
        }
    }
    async getIndexHealth(indexName) {
        try {
            const stats = await this.client.indices.stats({ index: indexName });
            const health = await this.client.cluster.health({ index: indexName });
            return {
                name: indexName,
                status: health.status,
                docsCount: stats.indices[indexName]?.total?.docs?.count || 0,
                storeSize: stats.indices[indexName]?.total?.store?.size_in_bytes || 0,
                shards: {
                    total: health.active_shards,
                    primary: health.active_primary_shards,
                    relocating: health.relocating_shards,
                    initializing: health.initializing_shards,
                    unassigned: health.unassigned_shards,
                },
            };
        }
        catch (error) {
            this.logger.error(`Failed to get health for index ${indexName}:`, error);
            throw error;
        }
    }
    async getClusterHealth() {
        try {
            const health = await this.client.cluster.health();
            const stats = await this.client.cluster.stats();
            return {
                cluster: {
                    name: health.cluster_name,
                    status: health.status,
                    nodes: {
                        total: health.number_of_nodes,
                        data: health.number_of_data_nodes,
                    },
                    shards: {
                        active: health.active_shards,
                        primary: health.active_primary_shards,
                        relocating: health.relocating_shards,
                        initializing: health.initializing_shards,
                        unassigned: health.unassigned_shards,
                    },
                },
                indices: {
                    count: stats.indices.count,
                    docs: stats.indices.docs.count,
                    size: stats.indices.store.size_in_bytes,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get cluster health:', error);
            throw error;
        }
    }
    async refreshIndex(indexName) {
        try {
            await this.client.indices.refresh({ index: indexName });
            this.logger.log(`Refreshed index: ${indexName}`);
        }
        catch (error) {
            this.logger.error(`Failed to refresh index ${indexName}:`, error);
            throw error;
        }
    }
    async bulkIndex(indexName, documents) {
        if (documents.length === 0) {
            return { errors: false, items: [] };
        }
        const body = documents.flatMap(doc => [
            { index: { _index: indexName, _id: doc.id } },
            doc,
        ]);
        try {
            const response = await this.client.bulk({ body });
            if (response.errors) {
                const errorItems = response.items.filter(item => item.index?.error);
                this.logger.error(`Bulk indexing errors:`, errorItems);
            }
            this.logger.log(`Bulk indexed ${documents.length} documents to ${indexName}`);
            return response;
        }
        catch (error) {
            this.logger.error(`Bulk indexing failed:`, error);
            throw error;
        }
    }
    async search(indexName, query) {
        try {
            const response = await this.client.search({
                index: indexName,
                body: query,
            });
            return response;
        }
        catch (error) {
            this.logger.error(`Search failed in index ${indexName}:`, error);
            throw error;
        }
    }
    async loadIndexMappings() {
        const mappingsPath = path.join(process.cwd(), 'config', 'elasticsearch', 'index-mappings.json');
        if (!fs.existsSync(mappingsPath)) {
            throw new Error(`Index mappings file not found: ${mappingsPath}`);
        }
        const mappingsContent = fs.readFileSync(mappingsPath, 'utf8');
        return JSON.parse(mappingsContent);
    }
};
exports.ElasticsearchService = ElasticsearchService;
exports.ElasticsearchService = ElasticsearchService = ElasticsearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ElasticsearchService);
//# sourceMappingURL=elasticsearch.service.js.map