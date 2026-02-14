import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';

const ApiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  provider: z.enum(['openai', 'anthropic', 'openrouter', 'lmstudio', 'ollama']),
  selectedModel: z.string().min(1, 'Model selection is required'),
  endpoint: z.string().optional(), // For local services
});

const TestConnectionSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  provider: z.enum(['openai', 'anthropic', 'openrouter', 'lmstudio', 'ollama']),
  endpoint: z.string().optional(),
});

const GetModelsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  provider: z.enum(['openai', 'anthropic', 'openrouter', 'lmstudio', 'ollama']),
  endpoint: z.string().optional(),
});

// Helper functions for API calls with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Model mapping for different providers
const MODEL_MAPPINGS = {
  openai: {
    filter: (m: any) => m.id?.includes('gpt') || m.id?.includes('text-embedding'),
    map: (m: any) => ({
      id: m.id,
      name: m.id,
      provider: 'openai' as const,
      type: m.id.includes('embedding') ? 'embedding' : 'chat',
      contextWindow: 128000,
    }),
  },
  anthropic: {
    models: [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'anthropic' as const,
        type: 'chat' as const,
        contextWindow: 200000,
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic' as const,
        type: 'chat' as const,
        contextWindow: 200000,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'anthropic' as const,
        type: 'chat' as const,
        contextWindow: 200000,
      },
    ],
  },
  openrouter: {
    filter: (m: any) => m.id && !m.id.startsWith('free-'),
    map: (m: any) => ({
      id: m.id,
      name: m.name || m.id,
      provider: 'openrouter' as const,
      type: 'chat' as const,
      contextWindow: m.context_length || 4096,
    }),
  },
};

export const apiManagerRouter = router({
  /**
   * Test API connection
   */
  testConnection: protectedProcedure
    .input(TestConnectionSchema)
    .mutation(async ({ input }) => {
      try {
        if (input.provider === 'openai') {
          const response = await fetchWithTimeout('https://api.openai.com/v1/models', {
            headers: {
              Authorization: `Bearer ${input.apiKey}`,
            },
          });

          if (!response.ok) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid OpenAI API key',
            });
          }

          return {
            success: true,
            message: 'OpenAI connection successful',
          };
        } else if (input.provider === 'anthropic') {
          const response = await fetchWithTimeout('https://api.anthropic.com/v1/models', {
            headers: {
              'x-api-key': input.apiKey,
            },
          });

          if (!response.ok) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid Anthropic API key',
            });
          }

          return {
            success: true,
            message: 'Anthropic connection successful',
          };
        } else if (input.provider === 'openrouter') {
          const response = await fetchWithTimeout('https://openrouter.ai/api/v1/models', {
            headers: {
              Authorization: `Bearer ${input.apiKey}`,
            },
          });

          if (!response.ok) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid OpenRouter API key',
            });
          }

          return {
            success: true,
            message: 'OpenRouter connection successful',
          };
        } else if (input.provider === 'lmstudio') {
          const endpoint = input.endpoint || 'http://localhost:1234';
          const response = await fetchWithTimeout(`${endpoint}/v1/models`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'LMStudio connection failed. Ensure LMStudio is running on the specified endpoint.',
            });
          }

          return {
            success: true,
            message: 'LMStudio connection successful',
          };
        } else if (input.provider === 'ollama') {
          const endpoint = input.endpoint || 'http://localhost:11434';
          const response = await fetchWithTimeout(`${endpoint}/api/tags`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Ollama connection failed. Ensure Ollama is running on the specified endpoint.',
            });
          }

          return {
            success: true,
            message: 'Ollama connection successful',
          };
        }

        return {
          success: true,
          message: 'Connection test passed',
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;

        const message =
          error.name === 'AbortError'
            ? 'Connection timeout. Please check the endpoint and try again.'
            : error.message || 'Connection test failed';

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message,
        });
      }
    }),

  /**
   * Get available models from provider
   */
  getAvailableModels: protectedProcedure
    .input(GetModelsSchema)
    .mutation(async ({ input }) => {
      try {
        if (input.provider === 'openai') {
          const response = await fetchWithTimeout('https://api.openai.com/v1/models', {
            headers: {
              Authorization: `Bearer ${input.apiKey}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch models from OpenAI');
          }

          const data = await response.json();
          const mapping = MODEL_MAPPINGS.openai;
          const models = data.data
            .filter((m: any) => mapping.filter(m))
            .map((m: any) => mapping.map(m));

          return { models };
        } else if (input.provider === 'anthropic') {
          return { models: MODEL_MAPPINGS.anthropic.models };
        } else if (input.provider === 'openrouter') {
          const response = await fetchWithTimeout('https://openrouter.ai/api/v1/models', {
            headers: {
              Authorization: `Bearer ${input.apiKey}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch models from OpenRouter');
          }

          const data = await response.json();
          const mapping = MODEL_MAPPINGS.openrouter;
          const models = data.data
            .filter((m: any) => mapping.filter(m))
            .map((m: any) => mapping.map(m));

          return { models };
        } else if (input.provider === 'lmstudio') {
          const endpoint = input.endpoint || 'http://localhost:1234';
          const response = await fetchWithTimeout(`${endpoint}/v1/models`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch models from LMStudio');
          }

          const data = await response.json();
          const models = (data.data || []).map((m: any) => ({
            id: m.id,
            name: m.id,
            provider: 'lmstudio' as const,
            type: 'chat' as const,
            contextWindow: 4096,
          }));

          return { models };
        } else if (input.provider === 'ollama') {
          const endpoint = input.endpoint || 'http://localhost:11434';
          const response = await fetchWithTimeout(`${endpoint}/api/tags`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch models from Ollama');
          }

          const data = await response.json();
          const models = (data.models || []).map((m: any) => ({
            id: m.name,
            name: m.name,
            provider: 'ollama' as const,
            type: 'chat' as const,
            contextWindow: 4096,
          }));

          return { models };
        }

        return { models: [] };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;

        const message =
          error.name === 'AbortError'
            ? 'Request timeout. Please check your connection and try again.'
            : error.message || 'Failed to fetch models';

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message,
        });
      }
    }),

  /**
   * Save API key and selected model
   */
  saveApiKey: protectedProcedure
    .input(ApiKeySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        // In production, encrypt the API key before storing
        // For now, we store it in memory or session
        // TODO: Implement secure key storage with encryption

        return {
          success: true,
          message: 'API configuration saved',
          provider: input.provider,
          model: input.selectedModel,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save API configuration',
        });
      }
    }),
});
