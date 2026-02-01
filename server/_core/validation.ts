import { z } from 'zod';
import { TRPCError } from '@trpc/server';

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 10000); // Limit length
};

/**
 * Validate and sanitize email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320;
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): boolean => {
  try {
    if (!url || typeof url !== 'string') return false;
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate API key format (basic check)
 */
export const validateApiKey = (apiKey: string): boolean => {
  return apiKey.length >= 10 && apiKey.length <= 500;
};

/**
 * Safe JSON parse with error handling
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Validate audio file size (max 25MB)
 */
export const validateAudioSize = (sizeInBytes: number): boolean => {
  const maxSizeBytes = 25 * 1024 * 1024; // 25MB
  return sizeInBytes > 0 && sizeInBytes <= maxSizeBytes;
};

/**
 * Validate audio duration (max 30 minutes)
 */
export const validateAudioDuration = (durationInSeconds: number): boolean => {
  const maxDurationSeconds = 30 * 60; // 30 minutes
  return durationInSeconds > 0 && durationInSeconds <= maxDurationSeconds;
};

/**
 * Validate transcription text
 */
export const validateTranscriptionText = (text: string): boolean => {
  return !!(text && text.trim().length > 0 && text.length <= 50000);
};

/**
 * Validate model ID format
 */
export const validateModelId = (modelId: string): boolean => {
  return /^[a-zA-Z0-9\-_.]+$/.test(modelId) && modelId.length <= 100;
};

/**
 * Common Zod schemas for reuse
 */
export const CommonSchemas = {
  apiKey: z.string().min(10).max(500),
  email: z.string().email().max(320),
  url: z.string().url().catch(''),
  modelId: z.string().regex(/^[a-zA-Z0-9\-_.]+$/).max(100),
  text: z.string().min(1).max(50000),
  audioSize: z.number().min(1).max(25 * 1024 * 1024),
  duration: z.number().min(0).max(30 * 60),
  language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).max(10),
};

/**
 * Safe error response builder
 */
export const createErrorResponse = (
  code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR',
  message: string,
  details?: Record<string, unknown>
) => {
  return {
    code,
    message,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Wrap async functions with error handling
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (error instanceof TRPCError) throw error;

    console.error('[Error]', errorMessage, error);

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: errorMessage,
    });
  }
};

/**
 * Validate procedure input with better error messages
 */
export const validateInput = <T>(schema: z.ZodSchema, input: unknown): T => {
  try {
    return schema.parse(input) as T;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues
        .map((e: any) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');

      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Validation failed: ${fieldErrors}`,
      });
    }

    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Input validation failed',
    });
  }
};
