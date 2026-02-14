import { describe, expect, it, beforeEach } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };

  return { ctx };
}

describe('Transcription Pipeline Integration Tests', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const { ctx } = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it('should enrich transcription with cache', async () => {
    const text = 'This is a test transcription about machine learning and AI.';
    const mode = 'summary';

    // First call - should hit LLM
    const result1 = await caller.transcription.enrichTranscription({
      text,
      mode: mode as any,
      useCache: true,
    });

    expect(result1.success).toBe(true);
    expect(result1.enrichedText).toBeTruthy();
    expect(result1.fromCache).toBe(false);

    // Second call - should hit cache
    const result2 = await caller.transcription.enrichTranscription({
      text,
      mode: mode as any,
      useCache: true,
    });

    expect(result2.success).toBe(true);
    expect(result2.enrichedText).toBe(result1.enrichedText);
    expect(result2.fromCache).toBe(true);
  });

  it('should handle different enrichment modes', async () => {
    const text = 'This is a test transcription.';
    const modes = ['summary', 'structure', 'format', 'context'];

    for (const mode of modes) {
      const result = await caller.transcription.enrichTranscription({
        text,
        mode: mode as any,
        useCache: false, // Skip cache for this test
      });

      expect(result.success).toBe(true);
      expect(result.enrichedText).toBeTruthy();
      expect(result.mode).toBe(mode);
    }
  });

  it('should bypass cache when useCache is false', async () => {
    const text = 'Test transcription for cache bypass.';
    const mode = 'summary';

    // First call with cache enabled
    const result1 = await caller.transcription.enrichTranscription({
      text,
      mode: mode as any,
      useCache: true,
    });

    // Second call with cache disabled
    const result2 = await caller.transcription.enrichTranscription({
      text,
      mode: mode as any,
      useCache: false,
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result2.fromCache).toBe(false);
  });

  it('should handle context parameter in enrichment', async () => {
    const text = 'Test transcription';
    const mode = 'context';
    const context = 'Business meeting context';

    const result = await caller.transcription.enrichTranscription({
      text,
      mode: mode as any,
      context,
      useCache: true,
    });

    expect(result.success).toBe(true);
    expect(result.enrichedText).toBeTruthy();
  });

  it('should handle empty transcription gracefully', async () => {
    try {
      await caller.transcription.enrichTranscription({
        text: '',
        mode: 'summary' as any,
      });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle very long transcriptions', async () => {
    const longText = 'This is a test transcription. '.repeat(100);
    const mode = 'summary';

    const result = await caller.transcription.enrichTranscription({
      text: longText,
      mode: mode as any,
      useCache: true,
    });

    expect(result.success).toBe(true);
    expect(result.enrichedText).toBeTruthy();
  });
});
