import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Home, History, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen: initialOpen = true, onToggle }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const { t } = useTranslation();
  const [location] = useLocation();

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  const navItems = [
    {
      href: '/',
      label: t('common.appName'),
      icon: Home,
      active: location === '/',
    },
    {
      href: '/history',
      label: t('history.title'),
      icon: History,
      active: location === '/history',
    },
    {
      href: '/api-manager',
      label: 'API Manager',
      icon: Zap,
      active: location === '/api-manager',
    },
    {
      href: '/settings',
      label: t('common.settings'),
      icon: Settings,
      active: location === '/settings',
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border-r border-slate-700 transition-all duration-300 ease-in-out z-40',
          isOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">VI</span>
              </div>
              <span className="text-white font-semibold text-sm truncate">Voice</span>
            </div>
          )}
          <Button
            onClick={handleToggle}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 block',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                )}
                title={isOpen ? undefined : item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 p-2">
          <div className="text-xs text-slate-500 text-center py-2">
            {isOpen && <span>v0.1.0</span>}
          </div>
        </div>
      </div>

      {/* Main Content Spacer */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          isOpen ? 'ml-64' : 'ml-20'
        )}
      >
        {/* Content will be rendered here */}
      </div>
    </>
  );
}
