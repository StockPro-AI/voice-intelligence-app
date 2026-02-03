import { useEffect, useState, useCallback } from 'react';
import { offlineStorageService } from '@/lib/offlineStorage';

export interface APIStatus {
  whisper: boolean;
  ollama: boolean;
  lmstudio: boolean;
  anthropic: boolean;
  openai: boolean;
}

export interface OfflineState {
  isOnline: boolean;
  lastOnline: Date | null;
  apiStatus: APIStatus;
  unsyncedCount: number;
  storageSize: number;
}

const DEFAULT_API_STATUS: APIStatus = {
  whisper: false,
  ollama: false,
  lmstudio: false,
  anthropic: false,
  openai: false
};

export function useOfflineMode() {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    lastOnline: navigator.onLine ? new Date() : null,
    apiStatus: DEFAULT_API_STATUS,
    unsyncedCount: 0,
    storageSize: 0
  });

  const checkAPIStatus = useCallback(async () => {
    const newStatus: APIStatus = { ...DEFAULT_API_STATUS };

    try {
      // Check Whisper API
      const whisperResponse = await fetch('/api/health/whisper', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      newStatus.whisper = whisperResponse.ok;
    } catch {
      newStatus.whisper = false;
    }

    try {
      // Check Ollama
      const ollamaResponse = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(5000)
      });
      newStatus.ollama = ollamaResponse.ok;
    } catch {
      newStatus.ollama = false;
    }

    try {
      // Check LMStudio
      const lmstudioResponse = await fetch('http://localhost:1234/v1/models', {
        signal: AbortSignal.timeout(5000)
      });
      newStatus.lmstudio = lmstudioResponse.ok;
    } catch {
      newStatus.lmstudio = false;
    }

    try {
      // Check OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: 'Bearer test' },
        signal: AbortSignal.timeout(5000)
      });
      newStatus.openai = openaiResponse.status !== 401;
    } catch {
      newStatus.openai = false;
    }

    try {
      // Check Anthropic
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/models', {
        signal: AbortSignal.timeout(5000)
      });
      newStatus.anthropic = anthropicResponse.status !== 401;
    } catch {
      newStatus.anthropic = false;
    }

    return newStatus;
  }, []);

  const updateOfflineState = useCallback(async () => {
    const apiStatus = await checkAPIStatus();
    const unsyncedRecordings = await offlineStorageService.getUnsyncedRecordings();
    const storageSize = await offlineStorageService.getStorageSize();

    setState(prev => ({
      isOnline: navigator.onLine,
      lastOnline: navigator.onLine ? new Date() : prev.lastOnline,
      apiStatus,
      unsyncedCount: unsyncedRecordings.length,
      storageSize
    }));
  }, [checkAPIStatus]);

  useEffect(() => {
    // Initialize offline storage
    offlineStorageService.init().catch(console.error);

    // Initial state update
    updateOfflineState();

    // Set up event listeners
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        isOnline: true,
        lastOnline: new Date()
      }));
      updateOfflineState();
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOnline: false
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic health check (every 30 seconds)
    const healthCheckInterval = setInterval(() => {
      updateOfflineState();
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, [updateOfflineState]);

  return {
    ...state,
    updateOfflineState,
    hasLocalModels: state.apiStatus.ollama || state.apiStatus.lmstudio,
    hasCloudAPIs: state.apiStatus.whisper || state.apiStatus.openai || state.apiStatus.anthropic
  };
}
