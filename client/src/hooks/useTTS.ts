import { useEffect, useState, useCallback, useRef } from "react";
import { getTTSService, TTSConfig, TTSVoice } from "@/services/ttsService";

export function useTTS(initialConfig?: TTSConfig) {
  const ttsService = useRef(getTTSService(initialConfig));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [config, setConfig] = useState<TTSConfig>(
    initialConfig || { voiceIndex: 0, rate: 1, pitch: 1, volume: 1 }
  );

  // Initialize voices
  useEffect(() => {
    const availableVoices = ttsService.current.getVoices();
    setVoices(availableVoices);

    // Fallback: try again after a delay if no voices loaded
    if (availableVoices.length === 0) {
      const timeout = setTimeout(() => {
        const retryVoices = ttsService.current.getVoices();
        if (retryVoices.length > 0) {
          setVoices(retryVoices);
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, []);

  // Speak text
  const speak = useCallback((text: string) => {
    ttsService.current.speak(text, () => {
      setIsPlaying(false);
      setIsPaused(false);
    });
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  // Pause speech
  const pause = useCallback(() => {
    ttsService.current.pause();
    setIsPaused(true);
  }, []);

  // Resume speech
  const resume = useCallback(() => {
    ttsService.current.resume();
    setIsPaused(false);
  }, []);

  // Stop speech
  const stop = useCallback(() => {
    ttsService.current.stop();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<TTSConfig>) => {
    const updated = { ...config, ...newConfig };
    ttsService.current.updateConfig(updated);
    setConfig(updated);
  }, [config]);

  // Get voices by language
  const getVoicesByLanguage = useCallback((lang: string) => {
    return ttsService.current.getVoicesByLanguage(lang);
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isPaused,
    voices,
    config,
    updateConfig,
    getVoicesByLanguage,
  };
}
