declare const _default: (() => {
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
    };
    indexing: {
        name: string;
        concurrency: number;
        attempts: number;
        backoffDelay: number;
        removeOnComplete: number;
        removeOnFail: number;
    };
    jobs: {
        indexResource: string;
        updateResource: string;
        deleteResource: string;
        reindexAll: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
    };
    indexing: {
        name: string;
        concurrency: number;
        attempts: number;
        backoffDelay: number;
        removeOnComplete: number;
        removeOnFail: number;
    };
    jobs: {
        indexResource: string;
        updateResource: string;
        deleteResource: string;
        reindexAll: string;
    };
}>;
export default _default;
