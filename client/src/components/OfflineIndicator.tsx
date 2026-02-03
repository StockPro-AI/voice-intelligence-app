import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const { t } = useTranslation();
  const offlineMode = useOfflineMode();
  const [showDetails, setShowDetails] = useState(false);

  if (offlineMode.isOnline && offlineMode.hasCloudAPIs) {
    return null; // No indicator needed when fully online
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`rounded-lg border px-4 py-3 shadow-lg transition-all ${
          offlineMode.isOnline
            ? 'border-yellow-500/30 bg-yellow-500/10'
            : 'border-red-500/30 bg-red-500/10'
        }`}
      >
        <div className="flex items-center gap-3">
          {offlineMode.isOnline ? (
            <Wifi className="h-5 w-5 text-yellow-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}

          <div className="flex-1">
            <p className={`text-sm font-medium ${
              offlineMode.isOnline
                ? 'text-yellow-700 dark:text-yellow-400'
                : 'text-red-700 dark:text-red-400'
            }`}>
              {offlineMode.isOnline
                ? t('offline.title')
                : t('offline.title')}
            </p>

            {offlineMode.lastOnline && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('offline.lastOnline')}: {offlineMode.lastOnline.toLocaleTimeString()}
              </p>
            )}

            {offlineMode.hasLocalModels && (
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ {t('offline.localModelsAvailable')}
              </p>
            )}

            {offlineMode.unsyncedCount > 0 && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                ⚠ {offlineMode.unsyncedCount} {t('offline.syncPending')}
              </p>
            )}
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="ml-2 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <AlertCircle className="h-4 w-4" />
          </button>
        </div>

        {showDetails && (
          <div className="mt-3 border-t border-gray-300 dark:border-gray-600 pt-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Whisper API:</span>
                <span className={offlineMode.apiStatus.whisper ? 'text-green-600' : 'text-red-600'}>
                  {offlineMode.apiStatus.whisper ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>OpenAI:</span>
                <span className={offlineMode.apiStatus.openai ? 'text-green-600' : 'text-red-600'}>
                  {offlineMode.apiStatus.openai ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Anthropic:</span>
                <span className={offlineMode.apiStatus.anthropic ? 'text-green-600' : 'text-red-600'}>
                  {offlineMode.apiStatus.anthropic ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ollama:</span>
                <span className={offlineMode.apiStatus.ollama ? 'text-green-600' : 'text-red-600'}>
                  {offlineMode.apiStatus.ollama ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>LMStudio:</span>
                <span className={offlineMode.apiStatus.lmstudio ? 'text-green-600' : 'text-red-600'}>
                  {offlineMode.apiStatus.lmstudio ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
