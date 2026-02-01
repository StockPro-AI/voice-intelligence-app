import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LANGUAGES = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  ru: 'Русский',
  ja: '日本語',
  zh: '中文',
};

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language-preference', lang);
  };

  if (compact) {
    return (
      <Button
        onClick={() => {
          const nextLang = i18n.language === 'de' ? 'en' : 'de';
          handleLanguageChange(nextLang);
        }}
        variant="ghost"
        size="sm"
        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        title={`Switch to ${i18n.language === 'de' ? 'English' : 'Deutsch'}`}
      >
        <Globe className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
        {Object.entries(LANGUAGES).map(([code, name]) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
