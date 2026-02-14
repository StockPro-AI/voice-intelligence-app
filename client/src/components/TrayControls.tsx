import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Minimize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTauriTray } from '@/hooks/useTauriTray';
import { toast } from 'sonner';

export function TrayControls() {
  const { t } = useTranslation();
  const { minimizeToTray } = useTauriTray({
    onStartRecording: () => {
      toast.info(t('tray.recordingStarted'));
    },
  });

  const handleMinimizeToTray = async () => {
    try {
      await minimizeToTray();
      toast.success(t('tray.minimizedToTray'));
    } catch (error) {
      console.error('Error minimizing to tray:', error);
      toast.error(t('tray.minimizeError'));
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleMinimizeToTray}
        variant="ghost"
        size="sm"
        title={t('tray.minimizeToTray')}
        className="hover:bg-slate-200 dark:hover:bg-slate-700"
      >
        <Minimize2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
