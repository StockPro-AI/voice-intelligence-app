import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { invokeLLM } from '../_core/llm';
import { TRPCError } from '@trpc/server';

const ApiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  provider: z.enum(['openai', 'anthropic', 'custom']),
  selectedModel: z.string().min(1, 'Model selection is required'),
});

const TestConnectionSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  provider: z.enum(['openai', 'anthropic', 'custom']),
});

const GetModelsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  provider: z.enum(['openai', 'anthropic', 'custom']),
});

export const apiManagerRouter = router({
  /**
   * Test API connection
   */
  testConnection: protectedProcedure
    .input(TestConnectionSchema)
    .mutation(async ({ input }) => {
      try {
        if (input.provider === 'openai') {
          // Test OpenAI connection
          const response = await fetch('https://api.openai.com/v1/models', {
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
          // Test Anthropic connection
          const response = await fetch('https://api.anthropic.com/v1/models', {
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
        }

        return {
          success: true,
          message: 'Connection test passed',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message || 'Connection test failed',
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
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              Authorization: `Bearer ${input.apiKey}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch models');
          }

          const data = await response.json();
          const models = data.data
            .filter((m: any) => m.id.includes('gpt') || m.id.includes('text-embedding'))
            .map((m: any) => ({
              id: m.id,
              name: m.id,
              provider: 'openai',
              type: m.id.includes('embedding') ? 'embedding' : 'chat',
            }));

          return { models };
        } else if (input.provider === 'anthropic') {
          // For Anthropic, return known models
          const models = [
            {
              id: 'claude-3-opus-20240229',
              name: 'Claude 3 Opus',
              provider: 'anthropic',
              type: 'chat' as const,
              contextWindow: 200000,
            },
            {
              id: 'claude-3-sonnet-20240229',
              name: 'Claude 3 Sonnet',
              provider: 'anthropic',
              type: 'chat' as const,
              contextWindow: 200000,
            },
            {
              id: 'claude-3-haiku-20240307',
              name: 'Claude 3 Haiku',
              provider: 'anthropic',
              type: 'chat' as const,
              contextWindow: 200000,
            },
          ];

          return { models };
        }

        return { models: [] };
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to fetch models',
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
        // In a real implementation, you would:
        // 1. Encrypt the API key
        // 2. Store it in the database
        // 3. Associate it with the user

        console.log('[API Manager] Saving API configuration for user:', ctx.user.id);

        // For now, just return success
        return {
          success: true,
          message: 'API configuration saved',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to save API configuration',
        });
      }
    }),
});
