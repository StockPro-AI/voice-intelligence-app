import { useCallback } from 'react';
import { toast } from 'sonner';
import { formatErrorMessage } from '@/lib/validation';

/**
 * Custom hook for centralized error handling
 */
export const useErrorHandler = () => {
  const handleError = useCallback((error: any, context?: string) => {
    const message = formatErrorMessage(error);
    const title = context ? `${context}: ${message}` : message;

    console.error('[Error Handler]', title, error);

    toast.error(title, {
      duration: 5000,
      description: process.env.NODE_ENV === 'development' ? error?.code : undefined,
    });
  }, []);

  const handleSuccess = useCallback((message: string) => {
    toast.success(message, {
      duration: 3000,
    });
  }, []);

  const handleWarning = useCallback((message: string) => {
    toast.warning(message, {
      duration: 4000,
    });
  }, []);

  const handleInfo = useCallback((message: string) => {
    toast.info(message, {
      duration: 3000,
    });
  }, []);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
  };
};
