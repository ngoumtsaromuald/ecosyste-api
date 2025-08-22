/**
 * Custom Elasticsearch types for compatibility
 */

declare module '@elastic/elasticsearch' {
  interface ClientOptions {
    node?: string;
    requestTimeout?: number;
    maxRetries?: number;
  }

  interface Client {
    cluster: {
      health(): Promise<any>;
      stats(): Promise<any>;
    };
    indices: {
      exists(params: { index: string }): Promise<boolean>;
      create(params: { index: string; body?: any }): Promise<any>;
      delete(params: { index: string }): Promise<any>;
      get(params: { index: string }): Promise<any>;
      stats(params?: { index?: string }): Promise<any>;
      getMapping(params: { index: string }): Promise<any>;
      getSettings(params: { index: string }): Promise<any>;
    };
    nodes: {
      stats(): Promise<any>;
    };
    cat: {
      indices(params: { format: string; h: string }): Promise<any>;
    };
    search(params: any): Promise<any>;
    scroll(params: any): Promise<any>;
    clearScroll(params: any): Promise<any>;
    bulk(params: any): Promise<any>;
    index(params: any): Promise<any>;
    ping(): Promise<any>;
  }

  class Client {
    constructor(options: ClientOptions);
  }
}