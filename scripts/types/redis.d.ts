/**
 * Custom Redis types for compatibility
 */

declare module 'redis' {
  interface RedisClientType {
    isOpen: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    ping(): Promise<string>;
    keys(pattern: string): Promise<string[]>;
    del(...keys: string[]): Promise<number>;
    info(section?: string): Promise<string>;
    dbsize(): Promise<number>;
  }

  function createClient(options?: any): RedisClientType;
}