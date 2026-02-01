import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Keyboard, Volume2, Zap, Moon, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SettingsPanelProps {
  onClose?: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isRecordingHotkey, setIsRecordingHotkey] = useState(false);
  const [recordedHotkey, setRecordedHotkey] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  // Queries
  const { data: settingsData, isLoading: isLoadingSettings } = trpc.settings.getSettings.useQuery();
  const { data: languagesData } = trpc.settings.getAvailableLanguages.useQuery();

  // Mutations
  const updateHotkey = trpc.settings.updateHotkey.useMutation();
  const updateLanguage = trpc.settings.updateTranscriptionLanguage.useMutation();
  const updateEnrichmentMode = trpc.settings.updateEnrichmentMode.useMutation();
  const updateAutoEnrich = trpc.settings.updateAutoEnrich.useMutation();
  const updateDarkMode = trpc.settings.updateDarkMode.useMutation();

  // Local state
  const [localSettings, setLocalSettings] = useState<{
    globalHotkey: string;
    transcriptionLanguage: string;
    enrichmentMode: 'summary' | 'structure' | 'format' | 'context';
    autoEnrich: boolean;
    darkMode: boolean;
  }>({
    globalHotkey: 'Alt+Shift+V',
    transcriptionLanguage: 'en',
    enrichmentMode: 'summary',
    autoEnrich: false,
    darkMode: true,
  });

  useEffect(() => {
    if (settingsData?.settings) {
      setLocalSettings(settingsData.settings);
    }
  }, [settingsData]);

  // Hotkey recording logic
  useEffect(() => {
    if (!isRecordingHotkey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();

      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');
      if (e.metaKey) keys.push('Meta');

      const key = e.key.toUpperCase();
      if (!/^[A-Z0-9]$/.test(key)) return;

      keys.push(key);
      const hotkey = keys.join('+');
      setRecordedHotkey(hotkey);
      setIsRecordingHotkey(false);
      setLocalSettings({ ...localSettings, globalHotkey: hotkey });
      setHasChanges(true);
      toast.success(`${t('settings.hotkeyRecorded')}: ${hotkey}`);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecordingHotkey, localSettings, t]);

  const handleSaveHotkey = async () => {
    try {
      await updateHotkey.mutateAsync({ hotkey: localSettings.globalHotkey });
      toast.success(t('settings.hotkeyUpdated'));
      setHasChanges(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    }
  };

  const handleLanguageChange = async (language: string) => {
    try {
      setLocalSettings({ ...localSettings, transcriptionLanguage: language });
      await updateLanguage.mutateAsync({ language: language as any });
      toast.success(t('settings.messages.languageUpdated'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    }
  };

  const handleEnrichmentModeChange = async (mode: string) => {
    try {
      setLocalSettings({ ...localSettings, enrichmentMode: mode as 'summary' | 'structure' | 'format' | 'context' });
      await updateEnrichmentMode.mutateAsync({ mode: mode as 'summary' | 'structure' | 'format' | 'context' });
      toast.success(t('settings.messages.modeUpdated'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    }
  };

  const handleAutoEnrichChange = async (checked: boolean) => {
    try {
      setLocalSettings({ ...localSettings, autoEnrich: checked });
      await updateAutoEnrich.mutateAsync({ autoEnrich: checked });
      toast.success(t('settings.messages.autoEnrichUpdated'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    }
  };

  const handleDarkModeChange = async (checked: boolean) => {
    try {
      setLocalSettings({ ...localSettings, darkMode: checked });
      toggleTheme();
      await updateDarkMode.mutateAsync({ darkMode: checked });
      toast.success(t('settings.messages.themeUpdated'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      toast.error(message);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('settings.title')}</h2>
        {onClose && (
          <Button onClick={onClose} variant="outline" className="text-sm">
            {t('common.close')}
          </Button>
        )}
      </div>

      {/* Global Hotkey Section */}
      <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t('settings.globalHotkey')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('settings.hotkeyDescription')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              {t('settings.currentHotkey')}
            </Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={localSettings.globalHotkey}
                readOnly
                className="font-mono bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600"
              />
              <Button
                onClick={() => setIsRecordingHotkey(!isRecordingHotkey)}
                variant={isRecordingHotkey ? 'default' : 'outline'}
                className={isRecordingHotkey ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                {isRecordingHotkey ? t('settings.recording') : t('settings.record')}
              </Button>
            </div>
          </div>

          {hasChanges && (
            <Button
              onClick={handleSaveHotkey}
              disabled={updateHotkey.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition-all"
            >
              {updateHotkey.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('settings.saveHotkey')}
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Transcription Language Section */}
      <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Volume2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t('settings.transcriptionLanguage')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('settings.languageDescription')}
            </p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            {t('settings.language')}
          </Label>
          <Select value={localSettings.transcriptionLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
              {languagesData?.languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Enrichment Mode Section */}
      <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t('settings.enrichmentMode')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('settings.modeDescription')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              {t('settings.mode')}
            </Label>
            <Select value={localSettings.enrichmentMode} onValueChange={handleEnrichmentModeChange}>
              <SelectTrigger className="w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                <SelectItem value="summary">{t('settings.summaryMode')}</SelectItem>
                <SelectItem value="structure">{t('settings.structureMode')}</SelectItem>
                <SelectItem value="format">{t('settings.formatMode')}</SelectItem>
                <SelectItem value="context">{t('settings.contextMode')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('settings.autoEnrich')}
              </Label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {t('settings.autoEnrichDesc')}
              </p>
            </div>
            <Switch
              checked={localSettings.autoEnrich}
              onCheckedChange={handleAutoEnrichChange}
            />
          </div>
        </div>
      </Card>

      {/* Interface Language Section */}
      <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Globe className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t('settings.interfaceLanguage')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('settings.interfaceLanguageDesc')}
            </p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            {t('settings.language')}
          </Label>
          <LanguageSwitcher />
        </div>
      </Card>

      {/* Theme Section */}
      <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Moon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t('settings.appearance')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('settings.appearanceDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('settings.darkMode')}
            </Label>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {t('settings.darkModeDesc')}
            </p>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={() => handleDarkModeChange(theme === 'light')}
          />
        </div>
      </Card>

      {/* Info Section */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>{t('common.warning')}:</strong> {t('settings.hotkeyNote')}
        </p>
      </Card>
    </div>
  );
}
