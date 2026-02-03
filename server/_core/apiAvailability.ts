import { invokeLLM } from './llm';

export interface APIStatus {
  available: boolean;
  provider: string;
  lastChecked: Date;
  responseTime: number;
  error?: string;
}

export interface AvailabilityCheckResult {
  whisper: APIStatus;
  llm: APIStatus;
  localModels: {
    ollama: APIStatus;
    lmstudio: APIStatus;
  };
  isOnline: boolean;
  fallbackAvailable: boolean;
}

class APIAvailabilityChecker {
  private checkCache: Map<string, { result: APIStatus; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds
  private checkTimeout = 5000; // 5 seconds for each check

  async checkWhisperAvailability(): Promise<APIStatus> {
    const cacheKey = 'whisper';
    const cached = this.checkCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    const startTime = Date.now();
    try {
      // Try a simple test call with minimal data
      const response = await Promise.race([
        fetch(`${process.env.BUILT_IN_FORGE_API_URL}/v1/audio/transcriptions`, {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.checkTimeout)
        )
      ]);

      const responseTime = Date.now() - startTime;
      const status: APIStatus = {
        available: true,
        provider: 'Whisper API',
        lastChecked: new Date(),
        responseTime
      };

      this.checkCache.set(cacheKey, { result: status, timestamp: Date.now() });
      return status;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const status: APIStatus = {
        available: false,
        provider: 'Whisper API',
        lastChecked: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.checkCache.set(cacheKey, { result: status, timestamp: Date.now() });
      return status;
    }
  }

  async checkLLMAvailability(): Promise<APIStatus> {
    const cacheKey = 'llm';
    const cached = this.checkCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    const startTime = Date.now();
    try {
      // Try a simple LLM test call
      await Promise.race([
        invokeLLM({
          messages: [
            { role: 'user', content: 'ping' }
          ]
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.checkTimeout)
        )
      ]);

      const responseTime = Date.now() - startTime;
      const status: APIStatus = {
        available: true,
        provider: 'LLM API',
        lastChecked: new Date(),
        responseTime
      };

      this.checkCache.set(cacheKey, { result: status, timestamp: Date.now() });
      return status;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const status: APIStatus = {
        available: false,
        provider: 'LLM API',
        lastChecked: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.checkCache.set(cacheKey, { result: status, timestamp: Date.now() });
      return status;
    }
  }

  async checkOllamaAvailability(endpoint: string): Promise<APIStatus> {
    const cacheKey = `ollama-${endpoint}`;
    const cached = this.checkCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    const startTime = Date.now();
    try {
      const response = await Promise.race([
        fetch(`${endpoint}/api/tags`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.checkTimeout)
        )
      ]) as Response;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const responseTime = Date.now() - startTime;
      const status: APIStatus = {
        available: true,
        provider: 'Ollama',
        lastChecked: new Date(),
        responseTime
      };

      this.checkCache.set(cacheKey, { result: status, timestamp: Date.now() });
      return status;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const status: APIStatus = {
        available: false,
        provider: 'Ollama',
        lastChecked: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.checkCache.set(cacheKey, { result: status, timestamp: Date.now() });
      return status;
    }
  }

  async checkLMStudioAvailability(endpoint: string): Promise<APIStatus> {
    const cacheKey = `lmstudio-${endpoint}`;
    const cached = this.checkCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    const startTime = Date.now();
    try {
      const response = await Promise.race([
        fetch(`${endpoint}/v1/models`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.checkTimeout)
        )
      ]) as Response;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const responseTime = Date.now() - startTime;
      const status: APIStatus = {
        available: true,
        provider: 'LM Studio',
        lastChecked: new Date(),
        responseTime
      };

      this.checkCache.set(cacheKey, { result: status, timestamp: Date.now() });
      return status;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const status: APIStatus = {
        available: false,
        provider: 'LM Studio',
        lastChecked: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.checkCache.set(cacheKey, { result: status, timestamp: Date.now() });
      return status;
    }
  }

  async checkAllAvailability(ollamaEndpoint?: string, lmstudioEndpoint?: string): Promise<AvailabilityCheckResult> {
    const [whisper, llm, ollama, lmstudio] = await Promise.all([
      this.checkWhisperAvailability(),
      this.checkLLMAvailability(),
      ollamaEndpoint ? this.checkOllamaAvailability(ollamaEndpoint) : Promise.resolve({
        available: false,
        provider: 'Ollama',
        lastChecked: new Date(),
        responseTime: 0,
        error: 'Not configured'
      }),
      lmstudioEndpoint ? this.checkLMStudioAvailability(lmstudioEndpoint) : Promise.resolve({
        available: false,
        provider: 'LM Studio',
        lastChecked: new Date(),
        responseTime: 0,
        error: 'Not configured'
      })
    ]);

    const isOnline = whisper.available || llm.available;
    const fallbackAvailable = ollama.available || lmstudio.available;

    return {
      whisper,
      llm,
      localModels: { ollama, lmstudio },
      isOnline,
      fallbackAvailable
    };
  }

  clearCache() {
    this.checkCache.clear();
  }
}

export const apiAvailabilityChecker = new APIAvailabilityChecker();
