import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Copy, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  copyToClipboard,
  downloadMarkdown,
  generateMarkdown,
  generateFilename,
  ExportData,
} from '@/lib/exportUtils';

interface ExportPanelProps {
  transcription: string;
  enrichedResult: string;
  language: string;
  enrichmentMode: string;
  duration?: number;
  onClose?: () => void;
}

export function ExportPanel({
  transcription,
  enrichedResult,
  language,
  enrichmentMode,
  duration,
  onClose,
}: ExportPanelProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const exportData: ExportData = {
    transcription,
    enrichedResult,
    metadata: {
      timestamp: new Date().toLocaleString(),
      language,
      enrichmentMode,
      duration,
    },
  };

  const handleCopyToClipboard = async () => {
    setIsLoading(true);
    try {
      const markdown = generateMarkdown(exportData);
      const success = await copyToClipboard(markdown);

      if (success) {
        toast.success(t('recorder.messages.copiedToClipboard'));
      } else {
        toast.error(t('recorder.errors.nothingToCopy'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMarkdown = async () => {
    setIsLoading(true);
    try {
      const markdown = generateMarkdown(exportData);
      const filename = generateFilename('voice-note');
      downloadMarkdown(markdown, filename);
      toast.success(`${t('common.save')}: ${filename}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEnrichedOnly = async () => {
    setIsLoading(true);
    try {
      const success = await copyToClipboard(enrichedResult);

      if (success) {
        toast.success(t('recorder.messages.copiedToClipboard'));
      } else {
        toast.error(t('recorder.errors.nothingToCopy'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {t('recorder.enrichedResult')}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Export or share your enriched notes
          </p>
        </div>

        {/* Enriched Result Preview */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600 max-h-64 overflow-y-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-slate-900 dark:text-white whitespace-pre-wrap break-words">
              {enrichedResult}
            </p>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Copy Enriched Only */}
          <Button
            onClick={handleCopyEnrichedOnly}
            disabled={isLoading}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            Copy Result
          </Button>

          {/* Copy Full Markdown */}
          <Button
            onClick={handleCopyToClipboard}
            disabled={isLoading}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            Copy Full
          </Button>

          {/* Download Markdown */}
          <Button
            onClick={handleDownloadMarkdown}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download
          </Button>
        </div>

        {/* Metadata Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
            <p className="text-slate-600 dark:text-slate-400">Language</p>
            <p className="font-semibold text-slate-900 dark:text-white">{language}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
            <p className="text-slate-600 dark:text-slate-400">Mode</p>
            <p className="font-semibold text-slate-900 dark:text-white capitalize">{enrichmentMode}</p>
          </div>
          {duration && (
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
              <p className="text-slate-600 dark:text-slate-400">Duration</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        {onClose && (
          <Button onClick={onClose} variant="ghost" className="w-full">
            {t('common.close')}
          </Button>
        )}
      </div>
    </Card>
  );
}
