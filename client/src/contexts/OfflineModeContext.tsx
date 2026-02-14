import React, { createContext, useContext, useEffect, useState } from 'react';

export interface OfflineModeContextType {
  isOffline: boolean;
  hasLocalFallback: boolean;
  lastOnlineTime: Date | null;
  checkConnectivity: () => Promise<void>;
}

const OfflineModeContext = createContext<OfflineModeContextType | undefined>(undefined);

export function OfflineModeProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [hasLocalFallback, setHasLocalFallback] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);

  const checkConnectivity = async () => {
    try {
      // Check if browser is online
      if (!navigator.onLine) {
        setIsOffline(true);
        return;
      }

      // Try to fetch a small resource to verify actual connectivity
      const response = await Promise.race([
        fetch('/api/health', { method: 'HEAD' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      if ((response as Response).ok) {
        setIsOffline(false);
        setLastOnlineTime(new Date());
      } else {
        setIsOffline(true);
      }
    } catch (error) {
      setIsOffline(true);
    }
  };

  useEffect(() => {
    // Check connectivity on mount
    checkConnectivity();

    // Listen to online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      setLastOnlineTime(new Date());
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check
    const interval = setInterval(checkConnectivity, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <OfflineModeContext.Provider
      value={{
        isOffline,
        hasLocalFallback,
        lastOnlineTime,
        checkConnectivity
      }}
    >
      {children}
    </OfflineModeContext.Provider>
  );
}

export function useOfflineMode() {
  const context = useContext(OfflineModeContext);
  if (context === undefined) {
    throw new Error('useOfflineMode must be used within OfflineModeProvider');
  }
  return context;
}
