import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { generateMarkdown } from '@/lib/exportUtils';

export interface BatchExportOptions {
  format: 'markdown' | 'json';
  includeMetadata: boolean;
}

export function useBatchExport() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: number[]) => {
    setSelectedIds(ids);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const exportSelected = useCallback(async (
    recordings: any[],
    options: BatchExportOptions
  ) => {
    if (selectedIds.length === 0) {
      toast.error('Keine Aufnahmen ausgewählt');
      return;
    }

    setIsExporting(true);
    try {
      const selected = recordings.filter(r => selectedIds.includes(r.id));

      if (options.format === 'markdown') {
        // Exportiere als einzelne Markdown-Dateien
        selected.forEach((recording) => {
          const markdown = generateMarkdown({
            transcription: recording.transcript || '',
            enrichedResult: recording.enrichedResult || '',
            metadata: {
              timestamp: new Date(recording.createdAt).toISOString(),
              language: recording.language,
              enrichmentMode: recording.enrichmentMode,
              duration: recording.duration
            }
          });

          const blob = new Blob([markdown], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${recording.id}-${new Date(recording.createdAt).toISOString().split('T')[0]}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });

        toast.success(`${selected.length} Aufnahmen als Markdown exportiert`);
      } else if (options.format === 'json') {
        // JSON-Export mit allen Metadaten
        const jsonData = selected.map(r => ({
          id: r.id,
          transcript: r.transcript,
          enrichedResult: r.enrichedResult,
          language: r.language,
          enrichmentMode: r.enrichmentMode,
          duration: r.duration,
          createdAt: r.createdAt,
          ...(options.includeMetadata && {
            metadata: {
              audioUrl: r.audioUrl,
              userId: r.userId,
              isFavorite: r.isFavorite
            }
          })
        }));

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice-intelligence-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`${selected.length} Aufnahmen als JSON exportiert`);
      }
    } catch (error) {
      console.error('Batch export error:', error);
      toast.error('Fehler beim Exportieren');
    } finally {
      setIsExporting(false);
    }
  }, [selectedIds]);

  const deleteSelected = useCallback(async (
    onDelete: (ids: number[]) => Promise<void>
  ) => {
    if (selectedIds.length === 0) {
      toast.error('Keine Aufnahmen ausgewählt');
      return;
    }

    // Bestätigung anfordern
    const confirmed = window.confirm(
      `${selectedIds.length} Aufnahmen wirklich löschen?`
    );

    if (!confirmed) return;

    setIsExporting(true);
    try {
      await onDelete(selectedIds);
      setSelectedIds([]);
      toast.success(`${selectedIds.length} Aufnahmen gelöscht`);
    } catch (error) {
      console.error('Batch delete error:', error);
      toast.error('Fehler beim Löschen');
    } finally {
      setIsExporting(false);
    }
  }, [selectedIds]);

  return {
    selectedIds,
    isExporting,
    toggleSelection,
    selectAll,
    deselectAll,
    exportSelected,
    deleteSelected,
    hasSelection: selectedIds.length > 0,
    selectionCount: selectedIds.length
  };
}
