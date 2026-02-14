import { useEffect } from 'react';

// Tauri API imports - nur wenn in Tauri-Kontext verfügbar
let invoke: any = () => Promise.resolve();
let listen: any = () => Promise.resolve(() => {});

try {
  const tauriApi = (window as any).__TAURI__;
  if (tauriApi) {
    invoke = tauriApi.invoke;
    listen = tauriApi.event.listen;
  }
} catch (error) {
  console.warn('[Tray] Tauri API not available');
}

export interface TrayHookOptions {
  onStartRecording?: () => void;
  onWindowToggle?: (isVisible: boolean) => void;
}

/**
 * Hook for Tauri System-Tray integration
 * Handles tray events and window management
 */
export function useTauriTray(options: TrayHookOptions = {}) {
  useEffect(() => {
    let unlistenStartRecording: (() => void) | null = null;

    const setupTrayListeners = async () => {
      try {
        // Listen for tray start-recording event
        unlistenStartRecording = await listen('tray:start-recording', () => {
          console.log('[Tray] Start recording event received');
          options.onStartRecording?.();
        });

        console.log('[Tray] Listeners setup complete');
      } catch (error) {
        console.warn('[Tray] Error setting up listeners:', error);
      }
    };

    setupTrayListeners();

    return () => {
      if (unlistenStartRecording) {
        unlistenStartRecording();
      }
    };
  }, [options]);

  /**
   * Toggle window visibility
   */
  const toggleWindow = async (): Promise<void> => {
    try {
      await invoke('toggle_window');
      console.log('[Tray] Window toggled');
    } catch (error) {
      console.error('[Tray] Error toggling window:', error);
    }
  };

  /**
   * Minimize window to tray
   */
  const minimizeToTray = async (): Promise<void> => {
    try {
      await invoke('minimize_window');
      console.log('[Tray] Window minimized to tray');
    } catch (error) {
      console.error('[Tray] Error minimizing window:', error);
    }
  };

  /**
   * Show window
   */
  const showWindow = async (): Promise<void> => {
    try {
      await invoke('show_window');
      console.log('[Tray] Window shown');
    } catch (error) {
      console.error('[Tray] Error showing window:', error);
    }
  };

  return {
    toggleWindow,
    minimizeToTray,
    showWindow,
  };
}
