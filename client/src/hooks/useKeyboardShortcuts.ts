import { useEffect } from 'react';

export interface KeyboardShortcuts {
  onEscape?: () => void;
  onEnter?: () => void;
  onCopy?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

/**
 * Hook for handling keyboard shortcuts in the app
 * Supports: Escape, Enter, Ctrl+C, Ctrl+S, Delete, Arrow Up/Down
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Escape key
      if (event.key === 'Escape' && shortcuts.onEscape && !isInput) {
        event.preventDefault();
        shortcuts.onEscape();
      }

      // Enter key (Ctrl+Enter or just Enter)
      if ((event.key === 'Enter' || (event.ctrlKey && event.key === 'Enter')) && shortcuts.onEnter) {
        event.preventDefault();
        shortcuts.onEnter();
      }

      // Ctrl+C (Copy)
      if (event.ctrlKey && event.key === 'c' && shortcuts.onCopy && !isInput) {
        event.preventDefault();
        shortcuts.onCopy();
      }

      // Ctrl+S (Save)
      if (event.ctrlKey && event.key === 's' && shortcuts.onSave) {
        event.preventDefault();
        shortcuts.onSave();
      }

      // Delete key
      if (event.key === 'Delete' && shortcuts.onDelete && !isInput) {
        event.preventDefault();
        shortcuts.onDelete();
      }

      // Arrow Up
      if (event.key === 'ArrowUp' && shortcuts.onArrowUp && !isInput) {
        event.preventDefault();
        shortcuts.onArrowUp();
      }

      // Arrow Down
      if (event.key === 'ArrowDown' && shortcuts.onArrowDown && !isInput) {
        event.preventDefault();
        shortcuts.onArrowDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}
