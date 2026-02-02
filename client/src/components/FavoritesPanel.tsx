import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Favorite {
  id: number;
  name: string;
  enrichmentMode: 'summary' | 'structure' | 'format' | 'context';
  description?: string | null;
}

interface FavoritesPanelProps {
  onSelectFavorite?: (favorite: Favorite) => void;
}

/**
 * Favorites panel component for quick access to enrichment combinations
 */
export const FavoritesPanel = ({ onSelectFavorite }: FavoritesPanelProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFavoriteName, setNewFavoriteName] = useState('');
  const [newFavoriteMode, setNewFavoriteMode] = useState<'summary' | 'structure' | 'format' | 'context'>('summary');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Fetch favorites
  const { data: favorites = [], isLoading, refetch } = trpc.favorites.getAll.useQuery();

  // Mutations
  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      toast.success(t('favorites.added'));
      setNewFavoriteName('');
      setIsAddingNew(false);
      refetch();
    },
    onError: (error) => {
      toast.error(t('favorites.addError'));
      console.error('Failed to add favorite:', error);
    },
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success(t('favorites.removed'));
      refetch();
    },
    onError: () => {
      toast.error(t('favorites.removeError'));
    },
  });

  const updateFavoriteMutation = trpc.favorites.update.useMutation({
    onSuccess: () => {
      toast.success(t('favorites.updated'));
      setEditingId(null);
      setEditName('');
      refetch();
    },
    onError: () => {
      toast.error(t('favorites.updateError'));
    },
  });

  const handleAddFavorite = () => {
    if (!newFavoriteName.trim()) {
      toast.error(t('favorites.nameRequired'));
      return;
    }

    addFavoriteMutation.mutate({
      name: newFavoriteName,
      enrichmentMode: newFavoriteMode,
    });
  };

  const handleRemove = (id: number) => {
    removeFavoriteMutation.mutate({ id });
  };

  const handleUpdate = (id: number) => {
    if (!editName.trim()) {
      toast.error(t('favorites.nameRequired'));
      return;
    }

    updateFavoriteMutation.mutate({
      id,
      name: editName,
    });
  };

  const handleSelectFavorite = (favorite: Favorite) => {
    onSelectFavorite?.(favorite);
    toast.success(`${t('favorites.applied')}: ${favorite.name}`);
  };

  const enrichmentModeLabels = {
    summary: t('enrichment.summary'),
    structure: t('enrichment.structure'),
    format: t('enrichment.format'),
    context: t('enrichment.context'),
  };

  return (
    <div className="border-t border-slate-700/50 pt-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-700/30 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-slate-200">
            {t('favorites.title')}
          </span>
          {favorites.length > 0 && (
            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
              {favorites.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="mt-3 space-y-2 px-2">
          {/* Add New Favorite */}
          {!isAddingNew ? (
            <Button
              onClick={() => setIsAddingNew(true)}
              variant="outline"
              size="sm"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('favorites.add')}
            </Button>
          ) : (
            <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <Input
                placeholder={t('favorites.namePlaceholder')}
                value={newFavoriteName}
                onChange={(e) => setNewFavoriteName(e.target.value)}
                className="h-8 text-sm bg-slate-700/50 border-slate-600"
              />

              <Select value={newFavoriteMode} onValueChange={(value: any) => setNewFavoriteMode(value)}>
                <SelectTrigger className="h-8 text-sm bg-slate-700/50 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="summary">{enrichmentModeLabels.summary}</SelectItem>
                  <SelectItem value="structure">{enrichmentModeLabels.structure}</SelectItem>
                  <SelectItem value="format">{enrichmentModeLabels.format}</SelectItem>
                  <SelectItem value="context">{enrichmentModeLabels.context}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddFavorite}
                  size="sm"
                  className="flex-1 h-8 text-sm bg-blue-600 hover:bg-blue-700"
                  disabled={addFavoriteMutation.isPending}
                >
                  {t('common.save')}
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewFavoriteName('');
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-sm border-slate-600"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}

          {/* Favorites List */}
          {isLoading ? (
            <div className="text-xs text-slate-400 text-center py-2">
              {t('common.loading')}...
            </div>
          ) : favorites.length === 0 && !isAddingNew ? (
            <div className="text-xs text-slate-500 text-center py-3">
              {t('favorites.empty')}
            </div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="group p-2 bg-slate-800/30 hover:bg-slate-700/40 rounded-lg border border-slate-700/30 transition-colors"
                >
                  {editingId === favorite.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-xs bg-slate-700/50 border-slate-600"
                      />
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleUpdate(favorite.id)}
                          size="sm"
                          className="flex-1 h-6 text-xs bg-blue-600 hover:bg-blue-700"
                          disabled={updateFavoriteMutation.isPending}
                        >
                          {t('common.save')}
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          variant="outline"
                          size="sm"
                          className="flex-1 h-6 text-xs border-slate-600"
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSelectFavorite(favorite)}
                        className="w-full text-left mb-1"
                      >
                        <div className="text-xs font-medium text-slate-100 truncate">
                          {favorite.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {enrichmentModeLabels[favorite.enrichmentMode]}
                        </div>
                      </button>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => {
                            setEditingId(favorite.id);
                            setEditName(favorite.name);
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleRemove(favorite.id)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                          disabled={removeFavoriteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
