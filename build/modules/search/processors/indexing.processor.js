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
var IndexingProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const indexing_service_1 = require("../services/indexing.service");
let IndexingProcessor = IndexingProcessor_1 = class IndexingProcessor {
    constructor(indexingService) {
        this.indexingService = indexingService;
        this.logger = new common_1.Logger(IndexingProcessor_1.name);
    }
    async handleIndexResource(job) {
        this.logger.log(`Processing index job ${job.id} for resource ${job.data.resourceId}`);
        try {
            await this.indexingService.processIndexJob(job);
            this.logger.log(`Completed index job ${job.id}`);
        }
        catch (error) {
            this.logger.error(`Failed index job ${job.id}:`, error);
            throw error;
        }
    }
    async handleUpdateResource(job) {
        this.logger.log(`Processing update job ${job.id} for resource ${job.data.resourceId}`);
        try {
            await this.indexingService.processUpdateJob(job);
            this.logger.log(`Completed update job ${job.id}`);
        }
        catch (error) {
            this.logger.error(`Failed update job ${job.id}:`, error);
            throw error;
        }
    }
    async handleDeleteResource(job) {
        this.logger.log(`Processing delete job ${job.id} for resource ${job.data.resourceId}`);
        try {
            await this.indexingService.processDeleteJob(job);
            this.logger.log(`Completed delete job ${job.id}`);
        }
        catch (error) {
            this.logger.error(`Failed delete job ${job.id}:`, error);
            throw error;
        }
    }
    async handleReindexAll(job) {
        this.logger.log(`Processing reindex-all job ${job.id}`);
        try {
            await this.indexingService.processReindexJob(job);
            this.logger.log(`Completed reindex-all job ${job.id}`);
        }
        catch (error) {
            this.logger.error(`Failed reindex-all job ${job.id}:`, error);
            throw error;
        }
    }
};
exports.IndexingProcessor = IndexingProcessor;
__decorate([
    (0, bull_1.Process)('index-resource'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingProcessor.prototype, "handleIndexResource", null);
__decorate([
    (0, bull_1.Process)('update-resource'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingProcessor.prototype, "handleUpdateResource", null);
__decorate([
    (0, bull_1.Process)('delete-resource'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingProcessor.prototype, "handleDeleteResource", null);
__decorate([
    (0, bull_1.Process)('reindex-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingProcessor.prototype, "handleReindexAll", null);
exports.IndexingProcessor = IndexingProcessor = IndexingProcessor_1 = __decorate([
    (0, bull_1.Processor)('indexing-queue'),
    __metadata("design:paramtypes", [indexing_service_1.IndexingService])
], IndexingProcessor);
//# sourceMappingURL=indexing.processor.js.map