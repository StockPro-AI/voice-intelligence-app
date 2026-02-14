/**
 * Enrichment Cache Service
 * Caches LLM enrichment results to avoid redundant API calls
 * Uses in-memory cache with optional database persistence
 */

import { createHash } from 'crypto';

export interface CacheEntry {
  key: string;
  text: string;
  mode: 'summary' | 'structure' | 'format' | 'context';
  result: string;
  context?: string;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class EnrichmentCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 1000; // Maximum cache entries
  private defaultTTL: number = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate cache key from text and enrichment parameters
   */
  private generateKey(text: string, mode: string, context?: string): string {
    const data = `${text}:${mode}:${context || ''}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get cached enrichment result
   */
  get(text: string, mode: 'summary' | 'structure' | 'format' | 'context', context?: string): string | null {
    const key = this.generateKey(text, mode, context);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Set enrichment result in cache
   */
  set(
    text: string,
    mode: 'summary' | 'structure' | 'format' | 'context',
    result: string,
    context?: string,
    ttl?: number
  ): void {
    const key = this.generateKey(text, mode, context);

    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]?.[0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      key,
      text,
      mode,
      result,
      context,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Clear specific cache entry
   */
  delete(text: string, mode: string, context?: string): boolean {
    const key = this.generateKey(text, mode, context);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    entries: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: this.cache.size,
    };
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      removed++;
    });

    return removed;
  }
}

// Singleton instance
export const enrichmentCache = new EnrichmentCache();

/**
 * Periodic cleanup task (runs every hour)
 */
export function startCacheCleanup(interval: number = 60 * 60 * 1000): NodeJS.Timer {
  return setInterval(() => {
    const removed = enrichmentCache.cleanup();
    if (removed > 0) {
      console.log(`[EnrichmentCache] Cleaned up ${removed} expired entries`);
    }
  }, interval);
}
