/**
 * Text-to-Speech Service using Web Speech API
 * Provides voice synthesis with configurable voices, rate, pitch, and volume
 */

export interface TTSConfig {
  voiceIndex: number;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
}

export interface TTSVoice {
  name: string;
  lang: string;
  voiceURI: string;
}

export class TTSService {
  private synth: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isPlaying = false;
  private isPaused = false;
  private voices: TTSVoice[] = [];
  private config: TTSConfig;

  constructor(config: TTSConfig = { voiceIndex: 0, rate: 1, pitch: 1, volume: 1 }) {
    this.synth = window.speechSynthesis;
    this.config = config;
    this.loadVoices();
  }

  /**
   * Load available voices from the system
   */
  private loadVoices(): void {
    const systemVoices = this.synth.getVoices();
    this.voices = systemVoices.map((voice) => ({
      name: voice.name,
      lang: voice.lang,
      voiceURI: voice.voiceURI,
    }));

    // Fallback: listen for voices loaded event
    if (this.voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        const systemVoices = this.synth.getVoices();
        this.voices = systemVoices.map((voice) => ({
          name: voice.name,
          lang: voice.lang,
          voiceURI: voice.voiceURI,
        }));
      };
    }
  }

  /**
   * Get all available voices
   */
  getVoices(): TTSVoice[] {
    return this.voices;
  }

  /**
   * Get voices filtered by language
   */
  getVoicesByLanguage(lang: string): TTSVoice[] {
    return this.voices.filter((voice) => voice.lang.startsWith(lang));
  }

  /**
   * Update TTS configuration
   */
  updateConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Speak text with current configuration
   */
  speak(text: string, onEnd?: () => void): void {
    // Cancel any ongoing speech
    this.stop();

    this.utterance = new SpeechSynthesisUtterance(text);

    // Set voice
    if (this.voices.length > 0 && this.config.voiceIndex < this.voices.length) {
      const selectedVoice = this.synth.getVoices()[this.config.voiceIndex];
      if (selectedVoice) {
        this.utterance.voice = selectedVoice;
      }
    }

    // Set properties
    this.utterance.rate = this.config.rate;
    this.utterance.pitch = this.config.pitch;
    this.utterance.volume = this.config.volume;

    // Set event handlers
    this.utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
    };

    this.utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      if (onEnd) onEnd();
    };

    this.utterance.onerror = (event) => {
      console.error("TTS Error:", event.error);
      this.isPlaying = false;
      this.isPaused = false;
    };

    // Start speaking
    this.synth.speak(this.utterance);
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  /**
   * Stop speech
   */
  stop(): void {
    this.synth.cancel();
    this.isPlaying = false;
    this.isPaused = false;
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Check if currently paused
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Get current configuration
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }
}

// Create singleton instance
let ttsServiceInstance: TTSService | null = null;

export function getTTSService(config?: TTSConfig): TTSService {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TTSService(config);
  }
  return ttsServiceInstance;
}
