import { useEffect } from 'react';

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Hook for Desktop Notifications
 * Uses Tauri notification API when available, falls back to browser Notification API
 */
export function useDesktopNotification() {
  // Check if Tauri is available
  const isTauriAvailable = () => {
    return typeof (window as any).__TAURI__ !== 'undefined';
  };

  /**
   * Send a desktop notification
   */
  const notify = async (options: NotificationOptions): Promise<void> => {
    try {
      if (isTauriAvailable()) {
        // Use Tauri notification API
        const tauriApi = (window as any).__TAURI__;
        if (tauriApi?.notification) {
          await tauriApi.notification.sendNotification({
            title: options.title,
            body: options.body,
            icon: options.icon,
          });
          console.log('[Notification] Sent via Tauri:', options.title);
          return;
        }
      }

      // Fallback to browser Notification API
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(options.title, {
            body: options.body,
            icon: options.icon,
            tag: options.tag,
            requireInteraction: options.requireInteraction,
          });
          console.log('[Notification] Sent via Browser API:', options.title);
        } else if (Notification.permission !== 'denied') {
          // Request permission if not denied
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification(options.title, {
              body: options.body,
              icon: options.icon,
              tag: options.tag,
              requireInteraction: options.requireInteraction,
            });
            console.log('[Notification] Sent via Browser API (after permission):', options.title);
          }
        }
      }
    } catch (error) {
      console.error('[Notification] Error sending notification:', error);
    }
  };

  /**
   * Request notification permission
   */
  const requestPermission = async (): Promise<boolean> => {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    } catch (error) {
      console.error('[Notification] Error requesting permission:', error);
      return false;
    }
  };

  /**
   * Check if notifications are enabled
   */
  const isEnabled = (): boolean => {
    if (isTauriAvailable()) {
      return true; // Tauri notifications always available
    }
    return 'Notification' in window && Notification.permission === 'granted';
  };

  // Request permission on mount
  useEffect(() => {
    requestPermission().catch(console.error);
  }, []);

  return {
    notify,
    requestPermission,
    isEnabled,
  };
}
