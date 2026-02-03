import { describe, it, expect, beforeEach, vi } from 'vitest';
import { healthRouter } from './health';

describe('healthRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check Whisper API availability', async () => {
    const caller = healthRouter.createCaller({} as any);
    
    // Mock fetch for this test
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

    const result = await caller.checkWhisper();
    expect(result).toBeDefined();
    expect(typeof result.available).toBe('boolean');
  });

  it('should check Ollama availability with default endpoint', async () => {
    const caller = healthRouter.createCaller({} as any);
    
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

    const result = await caller.checkOllama();
    expect(result).toBeDefined();
    expect(result.endpoint).toBe('http://localhost:11434');
  });

  it('should check Ollama availability with custom endpoint', async () => {
    const caller = healthRouter.createCaller({} as any);
    
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

    const result = await caller.checkOllama({ endpoint: 'http://custom:11434' });
    expect(result).toBeDefined();
    expect(result.endpoint).toBe('http://custom:11434');
  });

  it('should check LMStudio availability with default endpoint', async () => {
    const caller = healthRouter.createCaller({} as any);
    
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

    const result = await caller.checkLMStudio();
    expect(result).toBeDefined();
    expect(result.endpoint).toBe('http://localhost:1234');
  });

  it('should handle fetch errors gracefully', async () => {
    const caller = healthRouter.createCaller({} as any);
    
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const result = await caller.checkWhisper();
    expect(result.available).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should get system health status', async () => {
    const caller = healthRouter.createCaller({} as any);
    
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 401 });

    const result = await caller.getSystemHealth();
    expect(result).toBeDefined();
    expect(result.apis).toBeDefined();
    expect(typeof result.hasLocalModels).toBe('boolean');
    expect(typeof result.hasCloudAPIs).toBe('boolean');
  });
});
