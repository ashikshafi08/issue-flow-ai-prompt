import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Shortcut {
  keys: string[];
  description: string;
  category?: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'B'], description: 'Toggle context panel', category: 'Navigation' },
  { keys: ['/'], description: 'Focus chat input', category: 'Navigation' },
  { keys: ['Ctrl', 'P'], description: 'Open file search', category: 'Files' },
  { keys: ['Ctrl', 'N'], description: 'Start new chat', category: 'Chat' },
  { keys: ['Ctrl', 'K'], description: 'Clear context/Reset memory', category: 'Chat' },
  { keys: ['@'], description: 'Reference files', category: 'Files' },
  { keys: ['@folder/'], description: 'Reference folders', category: 'Files' },
  { keys: ['Enter'], description: 'Send message', category: 'Chat' },
  { keys: ['Shift', 'Enter'], description: 'New line in input', category: 'Chat' },
  { keys: ['Esc'], description: 'Close modals/panels', category: 'Navigation' },
];

const KeyboardShortcutsIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const renderKey = (key: string) => (
    <kbd
      key={key}
      className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-800 text-gray-300 border border-gray-600 rounded-md shadow-sm"
    >
      {key}
    </kbd>
  );

  const renderShortcut = (shortcut: Shortcut) => (
    <div key={shortcut.description} className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-300">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, index) => (
          <React.Fragment key={key}>
            {index > 0 && <span className="text-gray-500 mx-1">+</span>}
            {renderKey(key)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-gray-200 hover:bg-gray-800 p-2"
        title="Keyboard shortcuts"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900/95 border border-gray-700 rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto animate-message-enter">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-blue-400" />
                Keyboard Shortcuts
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-200 p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-blue-400 mb-3 border-b border-gray-700 pb-2">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {categoryShortcuts.map(renderShortcut)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                Press <kbd className="px-1 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">Esc</kbd> to close this dialog
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcutsIndicator; 