/**
 * Frontend Input Validation Utilities
 */

export const ValidationRules = {
  /**
   * Validate API key
   */
  apiKey: (value: string): { valid: boolean; error?: string } => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'API key is required' };
    }
    if (value.length < 10) {
      return { valid: false, error: 'API key is too short' };
    }
    if (value.length > 500) {
      return { valid: false, error: 'API key is too long' };
    }
    return { valid: true };
  },

  /**
   * Validate endpoint URL
   */
  endpoint: (value: string): { valid: boolean; error?: string } => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'Endpoint is required' };
    }
    try {
      new URL(value);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid endpoint URL' };
    }
  },

  /**
   * Validate model selection
   */
  model: (value: string): { valid: boolean; error?: string } => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'Model selection is required' };
    }
    if (value.length > 100) {
      return { valid: false, error: 'Model ID is too long' };
    }
    return { valid: true };
  },

  /**
   * Validate transcription text
   */
  transcription: (value: string): { valid: boolean; error?: string } => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'Transcription cannot be empty' };
    }
    if (value.length > 50000) {
      return { valid: false, error: 'Transcription is too long' };
    }
    return { valid: true };
  },

  /**
   * Validate hotkey format
   */
  hotkey: (value: string): { valid: boolean; error?: string } => {
    const hotkeyRegex = /^(Alt|Ctrl|Shift|Cmd)\+[A-Z]$/;
    if (!value || !hotkeyRegex.test(value)) {
      return { valid: false, error: 'Invalid hotkey format (e.g., Alt+V)' };
    }
    return { valid: true };
  },

  /**
   * Validate language code
   */
  language: (value: string): { valid: boolean; error?: string } => {
    const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    if (!value || !languageRegex.test(value)) {
      return { valid: false, error: 'Invalid language code' };
    }
    return { valid: true };
  },

  /**
   * Validate audio duration
   */
  duration: (seconds: number): { valid: boolean; error?: string } => {
    if (seconds < 0) {
      return { valid: false, error: 'Duration cannot be negative' };
    }
    if (seconds > 30 * 60) {
      return { valid: false, error: 'Recording is too long (max 30 minutes)' };
    }
    if (seconds < 1) {
      return { valid: false, error: 'Recording is too short' };
    }
    return { valid: true };
  },
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 10000);
};

/**
 * Format error messages for display
 */
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.code) return `Error: ${error.code}`;
  return 'An unexpected error occurred';
};

/**
 * Validate form data before submission
 */
export const validateFormData = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => { valid: boolean; error?: string }>
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const result = rule(data[field]);
    if (!result.valid && result.error) {
      errors[field] = result.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
