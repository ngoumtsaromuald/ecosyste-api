declare const _default: (() => {
    host: string;
    port: number;
    username: string;
    password: string;
    indexPrefix: string;
    maxRetries: number;
    requestTimeout: number;
    indices: {
        resources: string;
        suggestions: string;
    };
    search: {
        cacheTtl: number;
        suggestionsCacheTtl: number;
        facetsCacheTtl: number;
        maxResults: number;
        defaultSize: number;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    username: string;
    password: string;
    indexPrefix: string;
    maxRetries: number;
    requestTimeout: number;
    indices: {
        resources: string;
        suggestions: string;
    };
    search: {
        cacheTtl: number;
        suggestionsCacheTtl: number;
        facetsCacheTtl: number;
        maxResults: number;
        defaultSize: number;
    };
}>;
export default _default;
