import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { offlineStorageService } from '@/lib/offlineStorage';
import { trpc } from '@/lib/trpc';

export function OfflineSync() {
  const { t } = useTranslation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const createRecording = trpc.history.create.useMutation();

  const checkUnsyncedRecordings = useCallback(async () => {
    try {
      const unsynced = await offlineStorageService.getUnsyncedRecordings();
      setUnsyncedCount(unsynced.length);
    } catch (error) {
      console.error('[OfflineSync] Failed to check unsynced recordings:', error);
    }
  }, []);

  useEffect(() => {
    // Check for unsynced recordings on mount
    checkUnsyncedRecordings();

    // Set up interval to check periodically
    const interval = setInterval(() => checkUnsyncedRecordings(), 30000);
    return () => clearInterval(interval);
  }, [checkUnsyncedRecordings]);

  const syncRecordings = useCallback(async () => {
    if (unsyncedCount === 0) {
      toast.info(t('offline.recordingsSaved'));
      return;
    }

    setIsSyncing(true);
    try {
      const unsynced = await offlineStorageService.getUnsyncedRecordings();

      for (const recording of unsynced) {
        try {
          await createRecording.mutateAsync({
            audioUrl: '',
            transcription: recording.transcript,
            transcriptionLanguage: recording.language,
            enrichedResult: recording.enrichedResult,
            enrichmentMode: recording.enrichmentMode as 'summary' | 'structure' | 'format' | 'context',
            duration: recording.duration
          });

          // Mark as synced after successful upload
          await offlineStorageService.markAsSynced(recording.id);
        } catch (error) {
          console.error('[OfflineSync] Failed to sync recording:', error);
          toast.error(`Failed to sync recording: ${recording.id}`);
        }
      }

      await checkUnsyncedRecordings();
      toast.success(`Synced ${unsynced.length} recordings`);
    } catch (error) {
      console.error('[OfflineSync] Sync failed:', error);
      toast.error('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [unsyncedCount, createRecording, checkUnsyncedRecordings, t]);

  if (unsyncedCount === 0 || !navigator.onLine) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 shadow-lg">
      <CloudOff className="h-5 w-5 text-blue-500" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
          {unsyncedCount} recording{unsyncedCount !== 1 ? 's' : ''} {t('offline.syncPending')}
        </p>
      </div>
      <Button
        onClick={() => syncRecordings()}
        disabled={isSyncing}
        size="sm"
        variant="outline"
        className="gap-2"
      >
        {isSyncing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <Cloud className="h-4 w-4" />
            Sync Now
          </>
        )}
      </Button>
    </div>
  );
}
