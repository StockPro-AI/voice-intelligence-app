import { useOfflineMode } from '@/contexts/OfflineModeContext';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OfflineStatusBar() {
  const { isOffline, lastOnlineTime } = useOfflineMode();
  const { t } = useTranslation();

  if (!isOffline) return null;

  const lastOnlineText = lastOnlineTime
    ? new Date(lastOnlineTime).toLocaleTimeString()
    : t('common.unknown');

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-900 text-white px-4 py-3 flex items-center gap-3 z-50 shadow-lg">
      <WifiOff className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-sm">
          {t('offline.title')}
        </p>
        <p className="text-xs text-red-100">
          {t('offline.lastOnline')}: {lastOnlineText}
        </p>
      </div>
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
    </div>
  );
}

export function OnlineStatusIndicator() {
  const { isOffline } = useOfflineMode();

  return (
    <div className="flex items-center gap-2">
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-500">Offline</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-xs text-green-500">Online</span>
        </>
      )}
    </div>
  );
}
