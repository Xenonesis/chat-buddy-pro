import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input elements
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        if (event.key === 'Escape') {
          // Allow Escape key even in input fields
        } else {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        if (
          event.key === shortcut.key &&
          (shortcut.altKey === undefined || event.altKey === shortcut.altKey) &&
          (shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey) &&
          (shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey) &&
          (shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey)
        ) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

export const createShortcut = (
  key: string,
  handler: () => void,
  modifiers?: { alt?: boolean; ctrl?: boolean; meta?: boolean; shift?: boolean }
): KeyboardShortcut => {
  return {
    key,
    altKey: modifiers?.alt,
    ctrlKey: modifiers?.ctrl,
    metaKey: modifiers?.meta,
    shiftKey: modifiers?.shift,
    handler,
  };
};
