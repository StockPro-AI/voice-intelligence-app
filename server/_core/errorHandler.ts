/**
 * Centralized error handling and logging utilities
 */

export enum ErrorCode {
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',
  ENRICHMENT_FAILED = 'ENRICHMENT_FAILED',
  AUDIO_UPLOAD_FAILED = 'AUDIO_UPLOAD_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ErrorContext {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp?: Date;
  userId?: number;
  requestId?: string;
}

export class AppError extends Error {
  code: ErrorCode;
  details?: Record<string, any>;
  timestamp: Date;

  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(message);
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Log error with context
 */
export function logError(context: ErrorContext): void {
  const timestamp = context.timestamp || new Date();
  const logMessage = `[${timestamp.toISOString()}] [${context.code}] ${context.message}`;

  console.error(logMessage);

  if (context.details) {
    console.error('Details:', context.details);
  }

  if (context.userId) {
    console.error('User ID:', context.userId);
  }

  if (context.requestId) {
    console.error('Request ID:', context.requestId);
  }
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);

  if (context) {
    console.log('Context:', context);
  }
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] [WARN] ${message}`);

  if (context) {
    console.warn('Context:', context);
  }
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, context?: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] [DEBUG] ${message}`);

    if (context) {
      console.debug('Context:', context);
    }
  }
}

/**
 * Handle and format error response
 */
export function formatErrorResponse(error: unknown): {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
} {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message,
    };
  }

  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
  };
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
