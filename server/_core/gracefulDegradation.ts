import { apiAvailabilityChecker, APIStatus } from './apiAvailability';
import { transcribeAudio } from './voiceTranscription';

export interface TranscriptionFallbackOptions {
  audioUrl?: string;
  audioBase64?: string;
  language?: string;
  ollamaEndpoint?: string;
  lmstudioEndpoint?: string;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  source: 'whisper' | 'ollama' | 'lmstudio' | 'fallback';
  confidence?: number;
  error?: string;
}

class GracefulDegradationService {
  async transcribeWithFallback(
    options: TranscriptionFallbackOptions
  ): Promise<TranscriptionResult> {
    // Check API availability
    const availability = await apiAvailabilityChecker.checkAllAvailability(
      options.ollamaEndpoint,
      options.lmstudioEndpoint
    );

    // Try primary Whisper API
    if (availability.whisper.available && options.audioUrl) {
      try {
        const result = await transcribeAudio({
          audioUrl: options.audioUrl,
          language: options.language
        });

        if ('text' in result) {
          return {
            text: result.text || '',
            language: result.language,
            source: 'whisper',
            confidence: 0.95
          };
        }
      } catch (error) {
        console.warn('[Graceful Degradation] Whisper failed, trying fallback:', error);
      }
    }

    // Try Ollama fallback
    if (availability.localModels.ollama.available && options.ollamaEndpoint) {
      try {
        return await this.transcribeWithOllama(
          options.audioBase64 || '',
          options.ollamaEndpoint,
          options.language
        );
      } catch (error) {
        console.warn('[Graceful Degradation] Ollama failed, trying LM Studio:', error);
      }
    }

    // Try LM Studio fallback
    if (availability.localModels.lmstudio.available && options.lmstudioEndpoint) {
      try {
        return await this.transcribeWithLMStudio(
          options.audioBase64 || '',
          options.lmstudioEndpoint,
          options.language
        );
      } catch (error) {
        console.warn('[Graceful Degradation] LM Studio failed, using fallback:', error);
      }
    }

    // Ultimate fallback: return error with guidance
    return {
      text: '',
      source: 'fallback',
      error: 'All transcription services unavailable. Please check your connection and try again.',
      confidence: 0
    };
  }

  private async transcribeWithOllama(
    audioBase64: string,
    endpoint: string,
    language?: string
  ): Promise<TranscriptionResult> {
    // Note: Ollama doesn't have native audio transcription
    // This is a placeholder for potential future support or custom models
    throw new Error('Ollama audio transcription not yet implemented');
  }

  private async transcribeWithLMStudio(
    audioBase64: string,
    endpoint: string,
    language?: string
  ): Promise<TranscriptionResult> {
    // Note: LM Studio doesn't have native audio transcription
    // This is a placeholder for potential future support or custom models
    throw new Error('LM Studio audio transcription not yet implemented');
  }

  async enrichWithFallback(
    text: string,
    mode: string,
    ollamaEndpoint?: string,
    lmstudioEndpoint?: string
  ): Promise<string> {
    const availability = await apiAvailabilityChecker.checkAllAvailability(
      ollamaEndpoint,
      lmstudioEndpoint
    );

    // Try primary LLM API
    if (availability.llm.available) {
      try {
        // This would use the main LLM enrichment
        // Return enriched text
        return text; // Placeholder
      } catch (error) {
        console.warn('[Graceful Degradation] LLM enrichment failed:', error);
      }
    }

    // Try Ollama fallback
    if (availability.localModels.ollama.available && ollamaEndpoint) {
      try {
        return await this.enrichWithOllama(text, mode, ollamaEndpoint);
      } catch (error) {
        console.warn('[Graceful Degradation] Ollama enrichment failed:', error);
      }
    }

    // Try LM Studio fallback
    if (availability.localModels.lmstudio.available && lmstudioEndpoint) {
      try {
        return await this.enrichWithLMStudio(text, mode, lmstudioEndpoint);
      } catch (error) {
        console.warn('[Graceful Degradation] LM Studio enrichment failed:', error);
      }
    }

    // Fallback: return original text
    console.warn('[Graceful Degradation] All enrichment services unavailable, returning original text');
    return text;
  }

  private async enrichWithOllama(
    text: string,
    mode: string,
    endpoint: string
  ): Promise<string> {
    const prompts: Record<string, string> = {
      summary: 'Summarize the following text concisely:',
      structure: 'Structure the following text with clear sections and bullet points:',
      format: 'Format the following text with proper markdown:',
      context: 'Add context and expand on the following text:'
    };

    const prompt = prompts[mode] || prompts.summary;

    try {
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral', // Default model, should be configurable
          prompt: `${prompt}\n\n${text}`,
          stream: false
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json() as { response: string };
      return data.response || text;
    } catch (error) {
      console.error('[Ollama Enrichment Error]', error);
      throw error;
    }
  }

  private async enrichWithLMStudio(
    text: string,
    mode: string,
    endpoint: string
  ): Promise<string> {
    const prompts: Record<string, string> = {
      summary: 'Summarize the following text concisely:',
      structure: 'Structure the following text with clear sections and bullet points:',
      format: 'Format the following text with proper markdown:',
      context: 'Add context and expand on the following text:'
    };

    const prompt = prompts[mode] || prompts.summary;

    try {
      const response = await fetch(`${endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: `${prompt}\n\n${text}` }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      return data.choices[0]?.message.content || text;
    } catch (error) {
      console.error('[LM Studio Enrichment Error]', error);
      throw error;
    }
  }
}

export const gracefulDegradationService = new GracefulDegradationService();
