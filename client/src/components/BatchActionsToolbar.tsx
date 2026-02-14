import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Copy } from 'lucide-react';

interface BatchActionsToolbarProps {
  selectedCount: number;
  isExporting: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExport: (format: 'markdown' | 'json') => void;
  onDelete: () => void;
  totalCount: number;
}

export function BatchActionsToolbar({
  selectedCount,
  isExporting,
  onSelectAll,
  onDeselectAll,
  onExport,
  onDelete,
  totalCount
}: BatchActionsToolbarProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 shadow-lg z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="text-sm text-slate-300">
          {selectedCount} von {totalCount} ausgewählt
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={selectedCount === totalCount}
          >
            Alle wählen
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDeselectAll}
          >
            Abwählen
          </Button>

          <div className="w-px h-6 bg-slate-700" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('markdown')}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Markdown
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('json')}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isExporting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Löschen
          </Button>
        </div>
      </div>
    </div>
  );
}
