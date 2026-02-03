import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export function useDynamicHotkey(hotkey: string, onActivated: () => void) {
  const updateHotkey = useCallback(async (oldHotkey: string | null, newHotkey: string) => {
    if (!isTauri) {
      console.log('[Dynamic Hotkey] Not running in Tauri environment');
      return;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      
      if (oldHotkey) {
        await invoke('update_hotkey', {
          oldHotkey,
          newHotkey
        });
      } else {
        await invoke('register_hotkey', {
          hotkey: newHotkey
        });
      }

      console.log(`[Dynamic Hotkey] Updated hotkey to: ${newHotkey}`);
      toast.success(`Hotkey updated to: ${newHotkey}`);
    } catch (error) {
      console.error('[Dynamic Hotkey] Failed to update hotkey:', error);
      toast.error('Failed to update hotkey');
    }
  }, []);

  useEffect(() => {
    let unlistenHotkey: (() => void) | null = null;

    const setupHotkey = async () => {
      if (!isTauri) {
        console.log('[Dynamic Hotkey] Not running in Tauri environment');
        return;
      }

      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { listen } = await import('@tauri-apps/api/event');

        await invoke('register_hotkey', { hotkey });

        unlistenHotkey = await listen('hotkey:activated', () => {
          onActivated();
        });

        console.log(`[Dynamic Hotkey] Registered hotkey: ${hotkey}`);
      } catch (error) {
        console.error('[Dynamic Hotkey] Failed to register hotkey:', error);
        toast.error('Failed to register hotkey');
      }
    };

    setupHotkey();

    return () => {
      if (unlistenHotkey) {
        unlistenHotkey();
      }
    };
  }, [hotkey, onActivated]);

  return { updateHotkey };
}
