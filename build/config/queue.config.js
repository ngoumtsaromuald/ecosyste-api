"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('queue', () => ({
    redis: {
        host: process.env.QUEUE_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.QUEUE_REDIS_PORT, 10) || parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.QUEUE_REDIS_DB, 10) || 1,
    },
    indexing: {
        name: 'indexing-queue',
        concurrency: parseInt(process.env.INDEXING_QUEUE_CONCURRENCY, 10) || 5,
        attempts: parseInt(process.env.INDEXING_QUEUE_ATTEMPTS, 10) || 3,
        backoffDelay: parseInt(process.env.INDEXING_QUEUE_BACKOFF_DELAY, 10) || 5000,
        removeOnComplete: 100,
        removeOnFail: 50,
    },
    jobs: {
        indexResource: 'index-resource',
        updateResource: 'update-resource',
        deleteResource: 'delete-resource',
        reindexAll: 'reindex-all',
    },
}));
//# sourceMappingURL=queue.config.js.map