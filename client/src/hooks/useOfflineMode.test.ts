import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOfflineMode } from './useOfflineMode';

describe('useOfflineMode Hook', () => {
  beforeEach(() => {
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Mock fetch
    global.fetch = vi.fn();
  });

  it('should initialize with online status', () => {
    const { result } = renderHook(() => useOfflineMode());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.lastOnline).not.toBeNull();
  });

  it('should detect offline status', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const { result } = renderHook(() => useOfflineMode());

    window.dispatchEvent(new Event('offline'));

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });
  });

  it('should detect online status', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const { result } = renderHook(() => useOfflineMode());

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    window.dispatchEvent(new Event('online'));

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it('should check API availability', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useOfflineMode());

    await waitFor(() => {
      expect(result.current.apiStatus).toBeDefined();
    });
  });

  it('should detect local models availability', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: false }) // Whisper
      .mockResolvedValueOnce({ ok: true })  // Ollama
      .mockResolvedValueOnce({ ok: false }) // LMStudio
      .mockResolvedValueOnce({ ok: false }) // OpenAI
      .mockResolvedValueOnce({ ok: false }); // Anthropic

    const { result } = renderHook(() => useOfflineMode());

    await waitFor(() => {
      expect(result.current.hasLocalModels).toBe(true);
    });
  });

  it('should detect cloud APIs availability', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true })  // Whisper
      .mockResolvedValueOnce({ ok: false }) // Ollama
      .mockResolvedValueOnce({ ok: false }) // LMStudio
      .mockResolvedValueOnce({ ok: false }) // OpenAI
      .mockResolvedValueOnce({ ok: false }); // Anthropic

    const { result } = renderHook(() => useOfflineMode());

    await waitFor(() => {
      expect(result.current.hasCloudAPIs).toBe(true);
    });
  });

  it('should handle fetch timeouts gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Timeout'));

    const { result } = renderHook(() => useOfflineMode());

    await waitFor(() => {
      expect(result.current.apiStatus.whisper).toBe(false);
      expect(result.current.apiStatus.ollama).toBe(false);
    });
  });

  it('should track unsynced recordings count', async () => {
    const { result } = renderHook(() => useOfflineMode());

    await waitFor(() => {
      expect(result.current.unsyncedCount).toBeGreaterThanOrEqual(0);
    });
  });

  it('should calculate storage size', async () => {
    const { result } = renderHook(() => useOfflineMode());

    await waitFor(() => {
      expect(typeof result.current.storageSize).toBe('number');
      expect(result.current.storageSize).toBeGreaterThanOrEqual(0);
    });
  });
});
