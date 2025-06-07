import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, File, Bug, GitBranch, Lightbulb, Paperclip, Zap, Search, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';



interface SmartChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;  // Changed to match ChatSession's handleSend
  onFileSelect?: (filePath: string) => void;
  placeholder?: string;
  disabled?: boolean;
  currentContext?: {
    discussingFiles?: string[];
    relatedIssues?: number[];
    lastUserQuery?: string;
  };
  sessionId: string;
}

const SmartChatInput: React.FC<SmartChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  onFileSelect,
  placeholder = "Ask anything about your codebase...",
  disabled = false,
  currentContext,
  sessionId
}) => {
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // File autocomplete state
  const [showFileAutocomplete, setShowFileAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteItems, setAutocompleteItems] = useState<Array<{path: string, type: 'file' | 'folder'}>>([]);
  const [filteredAutocompleteItems, setFilteredAutocompleteItems] = useState<Array<{path: string, type: 'file' | 'folder'}>>([]);
  const [autocompleteHighlight, setAutocompleteHighlight] = useState(0);



  // Fetch file tree data on session change
  useEffect(() => {
    const fetchFileTree = async () => {
      if (!sessionId) return;
      
      try {
        const response = await fetch(`http://localhost:8000/api/tree?session_id=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          const flattenItems = (nodes: any[]): Array<{path: string, type: 'file' | 'folder'}> => {
            const items: Array<{path: string, type: 'file' | 'folder'}> = [];
            
            const traverse = (nodeList: any[]) => {
              nodeList.forEach(node => {
                items.push({
                  path: node.path,
                  type: node.type === 'directory' ? 'folder' : 'file'
                });
                if (node.children && node.children.length > 0) {
                  traverse(node.children);
                }
              });
            };
            
            traverse(nodes);
            return items;
          };
          
          const items = flattenItems(Array.isArray(data) ? data : []);
          setAutocompleteItems(items);
          setFilteredAutocompleteItems(items.slice(0, 20));
        }
      } catch (error) {
        console.error('Failed to fetch file tree:', error);
      }
    };
    
    fetchFileTree();
  }, [sessionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled && !isComposing) {
      onSubmit();  // ChatSession's handleSend will read the current value
    }
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = (item: {path: string, type: 'file' | 'folder'}) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = value.slice(0, start);
      const after = value.slice(end);
      
      // Find the last @ symbol to replace from there
      const lastAtIndex = before.lastIndexOf('@');
      const beforeAt = before.slice(0, lastAtIndex);
      
      const mention = item.type === 'folder' ? `@folder/${item.path}` : `@${item.path}`;
      const newValue = beforeAt + mention + after;
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = beforeAt.length + mention.length;
      }, 0);
    }
    setShowFileAutocomplete(false);
    setAutocompleteQuery('');
  };

  // Handle autocomplete key navigation
  const handleAutocompleteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocompleteHighlight(h => Math.min(h + 1, filteredAutocompleteItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocompleteHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && filteredAutocompleteItems[autocompleteHighlight]) {
      e.preventDefault();
      handleAutocompleteSelect(filteredAutocompleteItems[autocompleteHighlight]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowFileAutocomplete(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showFileAutocomplete && filteredAutocompleteItems.length > 0) {
      handleAutocompleteKeyDown(e);
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Check if user is typing @ to trigger autocomplete
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const queryAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      
      // Check if we should show autocomplete
      if (lastAtSymbol === cursorPos - 1) {
        // Just typed @, show all files
        setShowFileAutocomplete(true);
        setAutocompleteQuery('');
        setFilteredAutocompleteItems(autocompleteItems.slice(0, 20));
        setAutocompleteHighlight(0);
      } else if (!queryAfterAt.includes(' ') && !queryAfterAt.includes('\n')) {
        // Currently in a mention, filter based on what's typed after @
        setShowFileAutocomplete(true);
        setAutocompleteQuery(queryAfterAt);
        const filtered = autocompleteItems.filter(item =>
          item.path.toLowerCase().includes(queryAfterAt.toLowerCase()) ||
          item.path.split('/').pop()?.toLowerCase().includes(queryAfterAt.toLowerCase())
        ).slice(0, 20);
        setFilteredAutocompleteItems(filtered);
        setAutocompleteHighlight(0);
      } else {
        setShowFileAutocomplete(false);
      }
    } else {
      setShowFileAutocomplete(false);
    }
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };



  return (
    <div className="relative">
      {/* File Autocomplete */}
      {showFileAutocomplete && (
        <div className="absolute bottom-full left-0 right-0 mb-4 z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="border-b border-gray-700 p-4">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-200 mb-3">
                <File className="h-5 w-5 text-blue-400" />
                Reference Files & Folders
                <span className="ml-auto text-xs text-gray-500">ESC to close</span>
              </div>
            </div>
            
            <div className="relative">
              <ScrollArea className="max-h-80 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {filteredAutocompleteItems.length > 0 ? (
                    <>
                      <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700/30 mb-2">
                        {filteredAutocompleteItems.length} file{filteredAutocompleteItems.length !== 1 ? 's' : ''} found
                      </div>
                      
                      {filteredAutocompleteItems.map((item, idx) => (
                        <div
                          key={item.path}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all duration-200 ${
                            autocompleteHighlight === idx 
                              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 scale-[1.02]' 
                              : 'hover:bg-gray-700/40 text-gray-300 hover:scale-[1.01]'
                          }`}
                          onMouseEnter={() => setAutocompleteHighlight(idx)}
                          onClick={() => handleAutocompleteSelect(item)}
                        >
                          {item.type === 'folder' ? (
                            <FolderTree className="h-4 w-4 flex-shrink-0 text-yellow-400" />
                          ) : (
                            <File className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate font-mono block">{item.path}</span>
                            <span className="text-xs text-gray-500">
                              {item.type === 'folder' ? 'Folder - @folder/' : 'File - @'}
                            </span>
                          </div>
                          {autocompleteHighlight === idx && (
                            <span className="text-xs text-blue-400 font-medium px-2 py-1 bg-blue-500/20 rounded-md">
                              Enter ↵
                            </span>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No files found{autocompleteQuery ? ` matching "${autocompleteQuery}"` : ''}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}



      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-3 p-4 bg-gray-900/80 backdrop-blur-lg border border-gray-700/50 rounded-lg shadow-lg">
          {/* Context Indicators */}
          {currentContext?.discussingFiles?.length && (
            <div className="flex-shrink-0 mb-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300">
                <File className="h-3 w-3" />
                <span>{currentContext.discussingFiles.length} file{currentContext.discussingFiles.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Text Input */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="resize-none bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-500 text-sm leading-relaxed"
              style={{ minHeight: '24px', maxHeight: '120px' }}
            />
            
            {/* Input Actions */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-300"
                  title="Attach file"
                >
                  <Paperclip className="h-3 w-3" />
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-300"
                  title="Add context"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Shift + Enter for new line</span>
                <span>•</span>
                <span>Enter to send</span>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!value.trim() || disabled || isComposing}
            className="flex-shrink-0 h-10 w-10 p-0 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SmartChatInput; 