import React from 'react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { getLoginUrl } from '@/const';
import { useLocation } from 'wouter';
import { Mic, Settings, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50 md:top-0">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
              <Mic className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
              {t('common.appName')}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <ThemeSwitcher />
            <LanguageSwitcher compact={true} />
            {isAuthenticated ? (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {user?.role === 'admin' ? 'Admin' : 'User'}
                  </p>
                </div>
                <Button
                  onClick={() => setLocation('/history')}
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2"
                >
                  <Clock className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setLocation('/settings')}
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => logout()}
                  variant="outline"
                  className="text-xs sm:text-sm px-2 sm:px-4"
                >
                  {t('common.logout')}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {t('common.login')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {!isAuthenticated ? (
          // Landing Section
          <div className="text-center space-y-6 sm:space-y-8 py-10 sm:py-20">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-white">
                {t('home.landingTitle')}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2">
                {t('home.landingDescription')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-6 sm:pt-8">
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 text-sm sm:text-base"
              >
                {t('home.getStarted')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="font-semibold px-6 sm:px-8 text-sm sm:text-base"
              >
                {t('home.learnMore')}
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 pt-10 sm:pt-16">
              {[
                {
                  title: t('home.features.recording'),
                  description: t('home.features.recordingDesc'),
                  icon: '🎤',
                },
                {
                  title: t('home.features.transcription'),
                  description: t('home.features.transcriptionDesc'),
                  icon: '📝',
                },
                {
                  title: t('home.features.enrichment'),
                  description: t('home.features.enrichmentDesc'),
                  icon: '✨',
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
                >
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 line-clamp-3">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // App Section
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center space-y-2 mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                {t('home.title')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 px-2">
                {t('home.subtitle')}
              </p>
            </div>

            <VoiceRecorder />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>{t('home.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
