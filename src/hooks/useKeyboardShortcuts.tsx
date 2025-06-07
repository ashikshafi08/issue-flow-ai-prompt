import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;

      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
};

// Common shortcuts for the chat interface
export const createChatShortcuts = (actions: {
  toggleContextPanel?: () => void;
  focusInput?: () => void;
  openFileSearch?: () => void;
  openIssuesPane?: () => void;
  newChat?: () => void;
  clearContext?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.toggleContextPanel) {
    shortcuts.push({
      key: 'b',
      ctrlKey: true,
      action: actions.toggleContextPanel,
      description: 'Toggle context panel'
    });
  }

  if (actions.focusInput) {
    shortcuts.push({
      key: '/',
      action: actions.focusInput,
      description: 'Focus chat input'
    });
  }

  if (actions.openFileSearch) {
    shortcuts.push({
      key: 'p',
      ctrlKey: true,
      action: actions.openFileSearch,
      description: 'Open file search'
    });
  }

  if (actions.openIssuesPane) {
    shortcuts.push({
      key: 'i',
      ctrlKey: true,
      action: actions.openIssuesPane,
      description: 'Open issues pane'
    });
  }

  if (actions.newChat) {
    shortcuts.push({
      key: 'n',
      ctrlKey: true,
      action: actions.newChat,
      description: 'Start new chat'
    });
  }

  if (actions.clearContext) {
    shortcuts.push({
      key: 'k',
      ctrlKey: true,
      action: actions.clearContext,
      description: 'Clear context'
    });
  }

  return shortcuts;
};

export default useKeyboardShortcuts; 