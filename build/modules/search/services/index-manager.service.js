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
var IndexManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexManagerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const elasticsearch_1 = require("@elastic/elasticsearch");
const fs = require("fs");
const path = require("path");
let IndexManagerService = IndexManagerService_1 = class IndexManagerService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(IndexManagerService_1.name);
        this.client = new elasticsearch_1.Client({
            node: `http://${this.configService.get('elasticsearch.host')}:${this.configService.get('elasticsearch.port')}`,
            requestTimeout: this.configService.get('elasticsearch.requestTimeout'),
            maxRetries: this.configService.get('elasticsearch.maxRetries'),
        });
    }
    async onModuleInit() {
        setTimeout(() => {
            this.retryInitialization(3).catch(error => {
                this.logger.warn('Elasticsearch indices initialization failed after all retries:', error.message);
            });
        }, 2000);
    }
    async initializeIndices() {
        try {
            const isAvailable = await this.checkElasticsearchHealth();
            if (!isAvailable) {
                throw new Error('Elasticsearch is not available');
            }
            this.logger.log('Initializing Elasticsearch indices...');
            const indices = this.getRequiredIndices();
            for (const indexConfig of indices) {
                await this.ensureIndexExists(indexConfig);
            }
            this.logger.log('All Elasticsearch indices initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Elasticsearch indices:', error);
        }
    }
    async checkElasticsearchHealth() {
        try {
            await this.client.ping();
            return true;
        }
        catch (error) {
            this.logger.warn('Elasticsearch health check failed:', error.message);
            return false;
        }
    }
    async retryInitialization(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.log(`Elasticsearch initialization attempt ${attempt}/${maxRetries}`);
                await this.initializeIndices();
                this.logger.log('Elasticsearch indices initialized successfully');
                return;
            }
            catch (error) {
                this.logger.warn(`Initialization attempt ${attempt} failed:`, error.message);
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    this.logger.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                else {
                    this.logger.error('All initialization attempts failed. Elasticsearch features will be disabled.');
                }
            }
        }
    }
    getRequiredIndices() {
        const indexPrefix = this.configService.get('elasticsearch.indexPrefix');
        return [
            {
                name: `${indexPrefix}_resources`,
                alias: `${indexPrefix}_resources_alias`,
            },
            {
                name: `${indexPrefix}_suggestions`,
                alias: `${indexPrefix}_suggestions_alias`,
            },
        ];
    }
    async ensureIndexExists(indexConfig) {
        try {
            const exists = await this.client.indices.exists({
                index: indexConfig.name
            });
            if (!exists) {
                this.logger.log(`Creating index: ${indexConfig.name}`);
                await this.createIndexWithMappings(indexConfig);
                if (indexConfig.alias) {
                    await this.createAlias(indexConfig.name, indexConfig.alias);
                }
            }
            else {
                this.logger.log(`Index ${indexConfig.name} already exists`);
                await this.updateMappingsIfNeeded(indexConfig);
            }
        }
        catch (error) {
            this.logger.error(`Failed to ensure index ${indexConfig.name} exists:`, error);
        }
    }
    async createIndexWithMappings(indexConfig) {
        try {
            const mappingsAndSettings = await this.loadIndexMappings();
            await this.client.indices.create({
                index: indexConfig.name,
                body: {
                    settings: mappingsAndSettings.settings,
                    mappings: mappingsAndSettings.mappings,
                },
            });
            this.logger.log(`Successfully created index: ${indexConfig.name}`);
        }
        catch (error) {
            this.logger.error(`Failed to create index ${indexConfig.name}:`, error);
            throw error;
        }
    }
    async createAlias(indexName, aliasName) {
        try {
            await this.client.indices.putAlias({
                index: indexName,
                name: aliasName,
            });
            this.logger.log(`Created alias ${aliasName} for index ${indexName}`);
        }
        catch (error) {
            this.logger.error(`Failed to create alias ${aliasName}:`, error);
            throw error;
        }
    }
    async updateMappingsIfNeeded(indexConfig) {
        try {
            const mappingsAndSettings = await this.loadIndexMappings();
            await this.client.indices.putMapping({
                index: indexConfig.name,
                body: mappingsAndSettings.mappings,
            });
            this.logger.log(`Updated mappings for index: ${indexConfig.name}`);
        }
        catch (error) {
            this.logger.debug(`Mappings update not needed for ${indexConfig.name}:`, error.message);
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
    async recreateIndex(indexName) {
        try {
            const exists = await this.client.indices.exists({ index: indexName });
            if (exists) {
                await this.client.indices.delete({ index: indexName });
                this.logger.log(`Deleted existing index: ${indexName}`);
            }
            const indexConfig = { name: indexName };
            await this.createIndexWithMappings(indexConfig);
            this.logger.log(`Recreated index: ${indexName}`);
        }
        catch (error) {
            this.logger.error(`Failed to recreate index ${indexName}:`, error);
            throw error;
        }
    }
    async getIndexHealth(indexName) {
        try {
            const stats = await this.client.indices.stats({ index: indexName });
            const health = await this.client.cluster.health({ index: indexName });
            const mappings = await this.client.indices.getMapping({ index: indexName });
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
                mappings: mappings[indexName]?.mappings || {},
            };
        }
        catch (error) {
            this.logger.error(`Failed to get health for index ${indexName}:`, error);
            throw error;
        }
    }
    async testIndex(indexName) {
        try {
            const testDoc = {
                id: 'test-doc',
                name: 'Test Document',
                description: 'Document de test pour vérifier l\'indexation',
                category: {
                    id: 'test-category',
                    name: 'Test Category',
                    slug: 'test-category',
                },
                resourceType: 'api',
                verified: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await this.client.index({
                index: indexName,
                id: testDoc.id,
                body: testDoc,
                refresh: true,
            });
            const searchResult = await this.client.search({
                index: indexName,
                body: {
                    query: {
                        match: {
                            name: 'Test Document',
                        },
                    },
                },
            });
            await this.client.delete({
                index: indexName,
                id: testDoc.id,
                refresh: true,
            });
            const totalHits = typeof searchResult.hits.total === 'number'
                ? searchResult.hits.total
                : searchResult.hits.total.value;
            const found = totalHits > 0;
            this.logger.log(`Index ${indexName} test ${found ? 'passed' : 'failed'}`);
            return found;
        }
        catch (error) {
            this.logger.error(`Index test failed for ${indexName}:`, error);
            return false;
        }
    }
    getClient() {
        return this.client;
    }
};
exports.IndexManagerService = IndexManagerService;
exports.IndexManagerService = IndexManagerService = IndexManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], IndexManagerService);
//# sourceMappingURL=index-manager.service.js.map