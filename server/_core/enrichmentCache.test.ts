import { describe, expect, it, beforeEach } from 'vitest';
import { enrichmentCache } from './enrichmentCache';

describe('EnrichmentCache', () => {
  beforeEach(() => {
    enrichmentCache.clear();
  });

  it('should cache and retrieve enrichment results', () => {
    const text = 'Test transcription';
    const mode = 'summary' as const;
    const result = 'Test summary result';

    enrichmentCache.set(text, mode, result);
    const cached = enrichmentCache.get(text, mode);

    expect(cached).toBe(result);
  });

  it('should return null for non-existent entries', () => {
    const cached = enrichmentCache.get('non-existent', 'summary');
    expect(cached).toBeNull();
  });

  it('should handle different enrichment modes', () => {
    const text = 'Test text';
    const modes = ['summary', 'structure', 'format', 'context'] as const;
    const results = ['Summary', 'Structure', 'Format', 'Context'];

    modes.forEach((mode, index) => {
      enrichmentCache.set(text, mode, results[index]);
    });

    modes.forEach((mode, index) => {
      const cached = enrichmentCache.get(text, mode);
      expect(cached).toBe(results[index]);
    });
  });

  it('should handle context parameter', () => {
    const text = 'Test text';
    const mode = 'context' as const;
    const context = 'Business context';
    const result = 'Context-aware result';

    enrichmentCache.set(text, mode, result, context);
    const cached = enrichmentCache.get(text, mode, context);

    expect(cached).toBe(result);
  });

  it('should delete cache entries', () => {
    const text = 'Test text';
    const mode = 'summary' as const;
    const result = 'Test result';

    enrichmentCache.set(text, mode, result);
    expect(enrichmentCache.get(text, mode)).toBe(result);

    const deleted = enrichmentCache.delete(text, mode);
    expect(deleted).toBe(true);
    expect(enrichmentCache.get(text, mode)).toBeNull();
  });

  it('should clear all cache entries', () => {
    enrichmentCache.set('text1', 'summary', 'result1');
    enrichmentCache.set('text2', 'structure', 'result2');

    enrichmentCache.clear();

    expect(enrichmentCache.get('text1', 'summary')).toBeNull();
    expect(enrichmentCache.get('text2', 'structure')).toBeNull();
  });

  it('should return cache statistics', () => {
    enrichmentCache.set('text1', 'summary', 'result1');
    enrichmentCache.set('text2', 'structure', 'result2');

    const stats = enrichmentCache.getStats();

    expect(stats.size).toBe(2);
    expect(stats.entries).toBe(2);
    expect(stats.maxSize).toBeGreaterThan(0);
  });

  it('should handle object results', () => {
    const text = 'Test text';
    const mode = 'summary' as const;
    const result = { summary: 'Test', details: 'Details' };

    enrichmentCache.set(text, mode, result);
    const cached = enrichmentCache.get(text, mode);

    expect(cached).toBeTruthy();
    expect(typeof cached).toBe('string');
  });
});
