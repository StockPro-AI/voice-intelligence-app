import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';

export const healthRouter = router({
  // Check Whisper API availability
  checkWhisper: publicProcedure.query(async () => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return { available: response.ok, status: response.status };
    } catch (error) {
      console.error('[Health Check] Whisper API check failed:', error);
      return { available: false, status: 0, error: String(error) };
    }
  }),

  // Check local Ollama availability
  checkOllama: publicProcedure
    .input(z.object({ endpoint: z.string().url().optional() }).optional())
    .query(async ({ input }) => {
      const endpoint = input?.endpoint || 'http://localhost:11434';
      try {
        const response = await fetch(`${endpoint}/api/tags`, {
          signal: AbortSignal.timeout(5000)
        });
        return { available: response.ok, status: response.status, endpoint };
      } catch (error) {
        console.error('[Health Check] Ollama check failed:', error);
        return { available: false, status: 0, endpoint, error: String(error) };
      }
    }),

  // Check local LMStudio availability
  checkLMStudio: publicProcedure
    .input(z.object({ endpoint: z.string().url().optional() }).optional())
    .query(async ({ input }) => {
      const endpoint = input?.endpoint || 'http://localhost:1234';
      try {
        const response = await fetch(`${endpoint}/v1/models`, {
          signal: AbortSignal.timeout(5000)
        });
        return { available: response.ok, status: response.status, endpoint };
      } catch (error) {
        console.error('[Health Check] LMStudio check failed:', error);
        return { available: false, status: 0, endpoint, error: String(error) };
      }
    }),

  // Check OpenAI API availability
  checkOpenAI: publicProcedure.query(async () => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': 'Bearer test'
        },
        signal: AbortSignal.timeout(5000)
      });
      // 401 means API is reachable but auth failed (which is expected with test token)
      return { available: response.status !== 404, status: response.status };
    } catch (error) {
      console.error('[Health Check] OpenAI check failed:', error);
      return { available: false, status: 0, error: String(error) };
    }
  }),

  // Check Anthropic API availability
  checkAnthropic: publicProcedure.query(async () => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/models', {
        signal: AbortSignal.timeout(5000)
      });
      // 401 means API is reachable but auth failed (which is expected)
      return { available: response.status !== 404, status: response.status };
    } catch (error) {
      console.error('[Health Check] Anthropic check failed:', error);
      return { available: false, status: 0, error: String(error) };
    }
  }),

  // Get overall system health
  getSystemHealth: publicProcedure.query(async () => {
    const [whisper, ollama, lmstudio, openai, anthropic] = await Promise.all([
      fetch('https://api.openai.com/v1/models', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      }).then(r => r.ok).catch(() => false),
      fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(5000)
      }).then(r => r.ok).catch(() => false),
      fetch('http://localhost:1234/v1/models', {
        signal: AbortSignal.timeout(5000)
      }).then(r => r.ok).catch(() => false),
      fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': 'Bearer test' },
        signal: AbortSignal.timeout(5000)
      }).then(r => r.status !== 404).catch(() => false),
      fetch('https://api.anthropic.com/v1/models', {
        signal: AbortSignal.timeout(5000)
      }).then(r => r.status !== 404).catch(() => false)
    ]);

    return {
      isOnline: navigator.onLine ?? true,
      apis: {
        whisper,
        ollama,
        lmstudio,
        openai,
        anthropic
      },
      hasLocalModels: ollama || lmstudio,
      hasCloudAPIs: whisper || openai || anthropic,
      timestamp: new Date()
    };
  })
});
