'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SearchResult, SearchFilters } from '../services/searchApi';

// Cache configuration
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface SearchCache {
  results: Map<string, CacheEntry<{ results: SearchResult[]; totalResults: number }>>;
  suggestions: Map<string, CacheEntry<string[]>>;
}

interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  totalRequests: number;
  cacheSize: number;
  memoryUsage: number;
}

interface UsePerformanceOptimizationOptions {
  cacheConfig?: Partial<CacheConfig>;
  enableMetrics?: boolean;
  enablePrefetch?: boolean;
  debounceDelay?: number;
  maxConcurrentRequests?: number;
}

interface UsePerformanceOptimizationReturn {
  // Cache methods
  getCachedResults: (key: string) => { results: SearchResult[]; totalResults: number } | null;
  setCachedResults: (key: string, results: SearchResult[], totalResults: number) => void;
  getCachedSuggestions: (key: string) => string[] | null;
  setCachedSuggestions: (key: string, suggestions: string[]) => void;
  clearCache: () => void;
  
  // Performance methods
  debounce: <T extends (...args: any[]) => any>(func: T, delay?: number) => T;
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => T;
  memoize: <T extends (...args: any[]) => any>(func: T) => T;
  
  // Request management
  executeWithConcurrencyLimit: <T>(request: () => Promise<T>) => Promise<T>;
  prefetchResults: (queries: string[], filters?: SearchFilters) => void;
  
  // Metrics
  metrics: PerformanceMetrics;
  resetMetrics: () => void;
  
  // Memory management
  getMemoryUsage: () => number;
  optimizeMemory: () => void;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000 // 1 minute
};

export function usePerformanceOptimization({
  cacheConfig = {},
  enableMetrics = true,
  enablePrefetch = true,
  debounceDelay = 300,
  maxConcurrentRequests = 3
}: UsePerformanceOptimizationOptions = {}): UsePerformanceOptimizationReturn {
  const config = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };
  
  // Cache state
  const [cache] = useState<SearchCache>(() => ({
    results: new Map(),
    suggestions: new Map()
  }));
  
  // Performance metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: 0,
    averageResponseTime: 0,
    totalRequests: 0,
    cacheSize: 0,
    memoryUsage: 0
  });
  
  // Request management
  const activeRequests = useRef<Set<Promise<any>>>(new Set());
  const requestQueue = useRef<Array<() => Promise<any>>>([]);
  
  // Debounce and throttle refs
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const throttleTimers = useRef<Map<string, { lastCall: number; timeout?: NodeJS.Timeout }>>(new Map());
  const memoCache = useRef<Map<string, any>>(new Map());
  
  // Cache cleanup interval
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupCache();
      updateMetrics();
    }, config.cleanupInterval);
    
    return () => clearInterval(interval);
  }, [config.cleanupInterval]);
  
  // Cache management functions
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    
    // Clean results cache
    for (const [key, entry] of cache.results.entries()) {
      if (now - entry.timestamp > config.ttl) {
        cache.results.delete(key);
      }
    }
    
    // Clean suggestions cache
    for (const [key, entry] of cache.suggestions.entries()) {
      if (now - entry.timestamp > config.ttl) {
        cache.suggestions.delete(key);
      }
    }
    
    // Implement LRU eviction if cache is too large
    if (cache.results.size > config.maxSize) {
      const sortedEntries = Array.from(cache.results.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const toRemove = sortedEntries.slice(0, sortedEntries.length - config.maxSize);
      toRemove.forEach(([key]) => cache.results.delete(key));
    }
    
    if (cache.suggestions.size > config.maxSize) {
      const sortedEntries = Array.from(cache.suggestions.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const toRemove = sortedEntries.slice(0, sortedEntries.length - config.maxSize);
      toRemove.forEach(([key]) => cache.suggestions.delete(key));
    }
  }, [cache, config]);
  
  const updateMetrics = useCallback(() => {
    if (!enableMetrics) return;
    
    const cacheSize = cache.results.size + cache.suggestions.size;
    const memoryUsage = getMemoryUsage();
    
    setMetrics(prev => ({
      ...prev,
      cacheSize,
      memoryUsage
    }));
  }, [cache, enableMetrics]);
  
  // Cache methods
  const getCachedResults = useCallback((key: string) => {
    const entry = cache.results.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > config.ttl) {
      cache.results.delete(key);
      return null;
    }
    
    // Update access info
    entry.accessCount++;
    entry.lastAccessed = now;
    
    if (enableMetrics) {
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: (prev.cacheHitRate * prev.totalRequests + 1) / (prev.totalRequests + 1)
      }));
    }
    
    return entry.data;
  }, [cache, config.ttl, enableMetrics]);
  
  const setCachedResults = useCallback((key: string, results: SearchResult[], totalResults: number) => {
    const now = Date.now();
    cache.results.set(key, {
      data: { results, totalResults },
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    });
  }, [cache]);
  
  const getCachedSuggestions = useCallback((key: string) => {
    const entry = cache.suggestions.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > config.ttl) {
      cache.suggestions.delete(key);
      return null;
    }
    
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.data;
  }, [cache, config.ttl]);
  
  const setCachedSuggestions = useCallback((key: string, suggestions: string[]) => {
    const now = Date.now();
    cache.suggestions.set(key, {
      data: suggestions,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    });
  }, [cache]);
  
  const clearCache = useCallback(() => {
    cache.results.clear();
    cache.suggestions.clear();
    memoCache.current.clear();
  }, [cache]);
  
  // Performance optimization functions
  const debounce = useCallback(<T extends (...args: any[]) => any>(func: T, delay = debounceDelay): T => {
    const funcKey = func.toString();
    
    return ((...args: Parameters<T>) => {
      const existingTimer = debounceTimers.current.get(funcKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      const timer = setTimeout(() => {
        func(...args);
        debounceTimers.current.delete(funcKey);
      }, delay);
      
      debounceTimers.current.set(funcKey, timer);
    }) as T;
  }, [debounceDelay]);
  
  const throttle = useCallback(<T extends (...args: any[]) => any>(func: T, limit: number): T => {
    const funcKey = func.toString();
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      const throttleInfo = throttleTimers.current.get(funcKey);
      
      if (!throttleInfo || now - throttleInfo.lastCall >= limit) {
        func(...args);
        throttleTimers.current.set(funcKey, { lastCall: now });
      } else {
        if (throttleInfo.timeout) {
          clearTimeout(throttleInfo.timeout);
        }
        
        throttleInfo.timeout = setTimeout(() => {
          func(...args);
          throttleTimers.current.set(funcKey, { lastCall: Date.now() });
        }, limit - (now - throttleInfo.lastCall));
      }
    }) as T;
  }, []);
  
  const memoize = useCallback(<T extends (...args: any[]) => any>(func: T): T => {
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      
      if (memoCache.current.has(key)) {
        return memoCache.current.get(key);
      }
      
      const result = func(...args);
      memoCache.current.set(key, result);
      
      // Limit memoization cache size
      if (memoCache.current.size > 50) {
        const firstKey = memoCache.current.keys().next().value;
        memoCache.current.delete(firstKey);
      }
      
      return result;
    }) as T;
  }, []);
  
  // Request management
  const executeWithConcurrencyLimit = useCallback(async <T>(request: () => Promise<T>): Promise<T> => {
    // Wait if we've reached the concurrency limit
    while (activeRequests.current.size >= maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const requestPromise = request();
    activeRequests.current.add(requestPromise);
    
    if (enableMetrics) {
      const startTime = Date.now();
      
      requestPromise.finally(() => {
        const responseTime = Date.now() - startTime;
        setMetrics(prev => ({
          ...prev,
          totalRequests: prev.totalRequests + 1,
          averageResponseTime: (prev.averageResponseTime * prev.totalRequests + responseTime) / (prev.totalRequests + 1)
        }));
      });
    }
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      activeRequests.current.delete(requestPromise);
    }
  }, [maxConcurrentRequests, enableMetrics]);
  
  const prefetchResults = useCallback((queries: string[], filters?: SearchFilters) => {
    if (!enablePrefetch) return;
    
    queries.forEach(query => {
      const cacheKey = JSON.stringify({ query, filters });
      if (!getCachedResults(cacheKey)) {
        // Add to prefetch queue (implementation would depend on your search API)
        requestQueue.current.push(() => {
          // This would be your actual search API call
          return Promise.resolve();
        });
      }
    });
  }, [enablePrefetch, getCachedResults]);
  
  // Memory management
  const getMemoryUsage = useCallback(() => {
    // Estimate memory usage (rough calculation)
    let size = 0;
    
    cache.results.forEach(entry => {
      size += JSON.stringify(entry.data).length * 2; // Rough estimate
    });
    
    cache.suggestions.forEach(entry => {
      size += JSON.stringify(entry.data).length * 2;
    });
    
    return size;
  }, [cache]);
  
  const optimizeMemory = useCallback(() => {
    // Force cleanup
    cleanupCache();
    
    // Clear memoization cache
    memoCache.current.clear();
    
    // Clear timers
    debounceTimers.current.forEach(timer => clearTimeout(timer));
    debounceTimers.current.clear();
    
    throttleTimers.current.forEach(info => {
      if (info.timeout) clearTimeout(info.timeout);
    });
    throttleTimers.current.clear();
    
    // Force garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  }, [cleanupCache]);
  
  const resetMetrics = useCallback(() => {
    setMetrics({
      cacheHitRate: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      cacheSize: cache.results.size + cache.suggestions.size,
      memoryUsage: getMemoryUsage()
    });
  }, [cache, getMemoryUsage]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      optimizeMemory();
    };
  }, [optimizeMemory]);
  
  return {
    getCachedResults,
    setCachedResults,
    getCachedSuggestions,
    setCachedSuggestions,
    clearCache,
    debounce,
    throttle,
    memoize,
    executeWithConcurrencyLimit,
    prefetchResults,
    metrics,
    resetMetrics,
    getMemoryUsage,
    optimizeMemory
  };
}

// Export types
export type {
  CacheConfig,
  CacheEntry,
  SearchCache,
  PerformanceMetrics,
  UsePerformanceOptimizationOptions,
  UsePerformanceOptimizationReturn
};