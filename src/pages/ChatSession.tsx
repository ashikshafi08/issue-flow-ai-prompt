import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, FileText, Search, Copy, Check, FolderTree, Menu, ChevronDown, ChevronRight } from 'lucide-react';
import CodebaseTree from '@/components/CodebaseTree';
import FileViewer from '@/components/FileViewer';
// @ts-ignore
import Fuse from 'fuse.js';

interface ChatMessage {
  role: string;
  content: string;
  timestamp?: number; // Added timestamp
}

// Helper functions for enhanced markdown rendering
const getHeaderEmoji = (text: string, level: number): string => {
  const lowerText = text.toLowerCase();
  
  // Context-aware emoji mapping
  if (lowerText.includes('bug') || lowerText.includes('issue') || lowerText.includes('problem')) return '🐛';
  if (lowerText.includes('fix') || lowerText.includes('solution') || lowerText.includes('resolve')) return '🔧';
  if (lowerText.includes('summary') || lowerText.includes('overview')) return '📋';
  if (lowerText.includes('analysis') || lowerText.includes('investigation')) return '🔍';
  if (lowerText.includes('code') || lowerText.includes('implementation')) return '💻';
  if (lowerText.includes('test') || lowerText.includes('testing')) return '🧪';
  if (lowerText.includes('step') || lowerText.includes('action')) return '⚡';
  if (lowerText.includes('result') || lowerText.includes('outcome')) return '✅';
  if (lowerText.includes('error') || lowerText.includes('failure')) return '❌';
  if (lowerText.includes('warning') || lowerText.includes('caution')) return '⚠️';
  if (lowerText.includes('recommendation') || lowerText.includes('suggestion')) return '💡';
  if (lowerText.includes('impact') || lowerText.includes('effect')) return '💥';
  if (lowerText.includes('root cause') || lowerText.includes('cause')) return '🎯';
  if (lowerText.includes('timeline') || lowerText.includes('schedule')) return '📅';
  if (lowerText.includes('priority') || lowerText.includes('urgent')) return '🚨';
  
  // Fallback based on header level
  const levelEmojis = ['🎯', '📌', '🔸', '▪️'];
  return levelEmojis[level - 1] || '•';
};

const getBulletIcon = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('error') || lowerText.includes('fail') || lowerText.includes('wrong')) return '❌';
  if (lowerText.includes('success') || lowerText.includes('work') || lowerText.includes('correct')) return '✅';
  if (lowerText.includes('warning') || lowerText.includes('careful') || lowerText.includes('note')) return '⚠️';
  if (lowerText.includes('important') || lowerText.includes('critical') || lowerText.includes('key')) return '🔥';
  if (lowerText.includes('idea') || lowerText.includes('suggestion') || lowerText.includes('tip')) return '💡';
  if (lowerText.includes('file') || lowerText.includes('code') || lowerText.includes('.py') || lowerText.includes('.js')) return '📄';
  if (lowerText.includes('link') || lowerText.includes('reference') || lowerText.includes('see')) return '🔗';
  if (lowerText.includes('example') || lowerText.includes('demo') || lowerText.includes('sample')) return '📝';
  
  return '▶️';
};

const enhanceTextWithLinks = (children: React.ReactNode): React.ReactNode => {
  if (typeof children === 'string') {
    // Enhanced file detection regex
    const fileRegex = /(\b[\w-]+\.(?:py|js|tsx?|json|yaml|yml|md|txt|config)\b)/g;
    const parts = children.split(fileRegex);
    
    return parts.map((part, index) => {
      if (fileRegex.test(part)) {
        return (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-xs border transition-all cursor-pointer bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30"
            title="File reference"
          >
            <span className="text-xs">📄</span>
            {part}
          </span>
        );
      }
      return part;
    });
  }
  
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      key: (children as React.ReactElement).key,
      children: enhanceTextWithLinks((children as React.ReactElement).props.children)
    });
  }
  
  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement, {
          key: child.key || index,
          children: enhanceTextWithLinks((child as React.ReactElement).props.children)
        });
      }
      return enhanceTextWithLinks(child);
    });
  }
  
  return children;
};

// Enhanced markdown components with better formatting
const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    const content = String(children).replace(/\n$/, '');

    if (!inline) {
      // Heuristic: if content is short, single-line, and language is 'text', treat as inline.
      const isEffectivelyInline = content.length < 50 && !content.includes('\n') && language === 'text';

      if (isEffectivelyInline) {
        // Render using the minimal inline style
        return (
          <code className="font-mono text-emerald-400 px-1" {...props}>
            {content}
          </code>
        );
      }

      // Otherwise, render as a full code block (conditionally calling hooks)
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [copied, setCopied] = useState(false);
      const copyToClipboard = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      return (
        <div className="my-4 rounded-lg overflow-hidden border border-gray-700/40 bg-gray-950/60 shadow-lg">
          <div className="flex items-center justify-between bg-gray-800/60 px-4 py-2.5 border-b border-gray-700/40">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="text-gray-400 font-mono text-sm ml-2">{language}</span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700/50 text-sm"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            showLineNumbers={true}
            wrapLines={true}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '0.875rem',
              lineHeight: '1.6',
            }}
            codeTagProps={{ 
              style: { 
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace"
              } 
            }}
            {...props}
          >
            {content}
          </SyntaxHighlighter>
        </div>
      );
    }
    
    // True inline code (`code`)
    return (
      <code className="font-mono text-emerald-400 px-1" {...props}>
        {content}
      </code>
    );
  },
  h1: ({ node, children, ...props }: any) => (
    <h1 className="text-xl font-bold text-white my-4 pb-2 border-b border-gray-700/50" {...props}>
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }: any) => (
    <h2 className="text-lg font-semibold text-white my-3 pb-1" {...props}>
      {children}
    </h2>
  ),
  h3: ({ node, children, ...props }: any) => (
    <h3 className="text-base font-semibold text-white my-3" {...props}>
      {children}
    </h3>
  ),
  h4: ({ node, children, ...props }: any) => (
    <h4 className="text-sm font-semibold text-white my-2" {...props}>
      {children}
    </h4>
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc list-inside my-3 space-y-1 text-gray-200 ml-4" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-inside my-3 space-y-1 text-gray-200 ml-4" {...props} />
  ),
  li: ({ node, children, ...props }: any) => (
    <li className="leading-relaxed text-gray-200" {...props}>
      {children}
    </li>
  ),
  p: ({ node, children, ...props }: any) => (
    <p className="my-3 leading-relaxed text-gray-200" {...props}>
      {children}
    </p>
  ),
  blockquote: ({ node, children, ...props }: any) => (
    <blockquote className="my-4 border-l-4 border-blue-500/50 bg-blue-500/10 pl-4 py-3 rounded-r-lg text-blue-100 italic" {...props}>
      {children}
    </blockquote>
  ),
  a: ({ node, ...props }: any) => (
    <a 
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors" 
      target="_blank" 
      rel="noopener noreferrer" 
      {...props} 
    />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-700/50">
      <table className="min-w-full divide-y divide-gray-700 bg-gray-900/50" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-gray-800/60" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-gray-700/50" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-gray-800/40 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-3 text-sm text-gray-200" {...props} />
  ),
  pre: ({ node, ...props }: any) => <pre className="overflow-auto p-0 bg-transparent" {...props} />,
  hr: ({ node, ...props }: any) => (
    <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-6" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  em: ({ node, ...props }: any) => <em className="italic text-gray-300" {...props} />,
};

const AppSidebar = ({ sessionId, onFileSelect }: { sessionId: string; onFileSelect: (filePath: string) => void }) => {
  const handleFileSelect = (filePath: string) => {
    console.log('Selected file:', filePath);
    onFileSelect(filePath);
  };

  return (
    <Sidebar className="border-r border-gray-700/50 bg-gray-900/95 backdrop-blur-sm">
      <SidebarContent className="bg-transparent">
        <div className="p-4 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-blue-400" />
            Codebase Explorer
          </h2>
          <p className="text-sm text-gray-400 mt-1">Browse repository structure</p>
        </div>
        <CodebaseTree sessionId={sessionId} onFileSelect={handleFileSelect} />
      </SidebarContent>
    </Sidebar>
  );
};

export default function ChatSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [allFiles, setAllFiles] = useState<{ path: string }[]>([]);
  const [allFolders, setAllFolders] = useState<{ path: string }[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [fileQuery, setFileQuery] = useState('');
  const [fileResults, setFileResults] = useState<{ path: string; type: 'file' | 'folder' }[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();

  const formatTimestamp = (timestamp: number): string => {
    // HH:MM AM/PM format
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Fetch file list when sessionId is available
  useEffect(() => {
    if (!sessionId) return; // Don't fetch until sessionId is set
    
    // Fetch both files and tree structure for folder support
    Promise.all([
      fetch(`http://localhost:8000/api/files?session_id=${sessionId}`).then(res => res.json()),
      fetch(`http://localhost:8000/api/tree?session_id=${sessionId}`).then(res => res.json())
    ]).then(([files, tree]) => {
      setAllFiles(files);
      // Extract folders from tree structure
      const folders = extractFoldersFromTree(tree);
      setAllFolders(folders);
    }).catch(err => {
      console.error('Error fetching files/folders:', err);
      // Fallback to just files
      fetch(`http://localhost:8000/api/files?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => setAllFiles(data))
        .catch(err => console.error('Error fetching files:', err));
    });
  }, [sessionId]);

  // Helper function to extract folders from tree structure
  const extractFoldersFromTree = (tree: any[], currentPath: string = ""): { path: string }[] => {
    let folders: { path: string }[] = [];
    
    tree.forEach(item => {
      if (item.type === "directory") {
        const folderPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        folders.push({ path: folderPath });
        
        // Recursively get subfolders
        if (item.children && item.children.length > 0) {
          folders = folders.concat(extractFoldersFromTree(item.children, folderPath));
        }
      }
    });
    
    return folders;
  };

  // Fuzzy search files when fileQuery changes
  useEffect(() => {
    if (!fileQuery) {
      // Show both files and folders when no query
      const combinedResults = [
        ...allFolders.map(folder => ({ ...folder, type: 'folder' as const })),
        ...allFiles.map(file => ({ ...file, type: 'file' as const }))
      ];
      setFileResults(combinedResults);
    } else {
      // Search in both files and folders
      const filesFuse = new Fuse(allFiles, { keys: ['path'], threshold: 0.3 });
      const foldersFuse = new Fuse(allFolders, { keys: ['path'], threshold: 0.3 });
      
      const fileMatches = filesFuse.search(fileQuery).map(r => ({ ...r.item, type: 'file' as const }));
      const folderMatches = foldersFuse.search(fileQuery).map(r => ({ ...r.item, type: 'folder' as const }));
      
      // Combine and sort: folders first, then files
      const combinedResults = [...folderMatches, ...fileMatches];
      setFileResults(combinedResults);
    }
  }, [fileQuery, allFiles, allFolders]);

  // Handle input changes and detect @ for file picker
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const cursor = e.target.selectionStart || 0;
    if (e.target.value[cursor - 1] === '@') {
      setShowFilePicker(true);
      setFileQuery('');
      setHighlight(0);
    } else {
      setShowFilePicker(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Keyboard navigation for file picker
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showFilePicker) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight(h => Math.min(h + 1, fileResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight(h => Math.max(h - 1, 0));
      } else if (e.key === 'Enter' && fileResults[highlight]) {
        e.preventDefault();
        handleFileSelect(fileResults[highlight]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowFilePicker(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Add file to selection
  const handleFileSelect = (item: { path: string; type?: 'file' | 'folder' }) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = input.slice(0, start);
      const after = input.slice(end);
      
      // Use different syntax for folders vs files
      const mention = item.type === 'folder' ? `@folder/${item.path}` : `@${item.path}`;
      const newValue = before + mention + after;
      setInput(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + mention.length;
      }, 0);
    } else {
      const mention = item.type === 'folder' ? `@folder/${item.path}` : `@${item.path}`;
      setInput(prev => prev + mention);
    }
    setShowFilePicker(false);
    setFileQuery('');
  };

  // Set initial message from route state
  useEffect(() => {
    const initialMessageFromState = location.state?.initialMessage;
    if (initialMessageFromState) {
      setMessages([{ role: 'assistant', content: initialMessageFromState, timestamp: Date.now() }]);
      setIsLoading(false);
    } else if (sessionId) {
      console.warn('ChatSession loaded without initial message in state. SessionId:', sessionId);
      setIsLoading(false);
    }
  }, [sessionId, location.state]);

  // Scroll to bottom of messages - enhanced for streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Enhanced send message with real-time streaming
  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    
    const userMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: Date.now() }]);
      setIsStreaming(true);
      setIsLoading(false);
      
      const response = await fetch(`http://localhost:8000/sessions/${sessionId}/messages?stream=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: currentInput })
      });
      
      if (!response.body) throw new Error('Response body is null');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponseContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();
              if (data === '[DONE]') { 
                setIsStreaming(false); 
                return; 
              }
              if (data) {
                try {
                  const json = JSON.parse(data);
                  if (json.error) throw new Error(json.error);
                  
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    assistantResponseContent += content;
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessageIndex = newMessages.length - 1;
                      if (lastMessageIndex >= 0 && newMessages[lastMessageIndex].role === 'assistant') {
                        newMessages[lastMessageIndex] = {
                          ...newMessages[lastMessageIndex],
                          content: assistantResponseContent
                        };
                      }
                      return newMessages;
                    });
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming chunk:', data, parseError);
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Failed to send message or stream response', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessageIndex = newMessages.length - 1;
        if (lastMessageIndex >= 0 && newMessages[lastMessageIndex].role === 'assistant') {
          newMessages[lastMessageIndex] = {
            ...newMessages[lastMessageIndex], // This will carry over the timestamp from the placeholder
            content: `Error: Failed to get response. ${error instanceof Error ? error.message : String(error)}`,
          };
        } else {
          newMessages.push({ role: 'assistant', content: `Error: Failed to get response. ${error instanceof Error ? error.message : String(error)}`, timestamp: Date.now() });
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  function highlightMentions(text: string) {
    return text.split(/(@folder\/[\w\-/\\.]+|@[\w\-/\\.]+)/g).map((part, i) =>
      part.startsWith('@folder/') ? (
        <span key={i} className="inline-flex items-center gap-1 bg-yellow-600/20 text-yellow-300 px-2 py-1 rounded-md font-medium border border-yellow-500/30 hover:bg-yellow-600/30 transition-all cursor-pointer" title="Folder reference">
          <span className="text-xs">📁</span>
          {part}
        </span>
      ) : part.startsWith('@') ? (
        <span key={i} className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 px-2 py-1 rounded-md font-medium border border-blue-500/30 hover:bg-blue-600/30 transition-all cursor-pointer" title="File attachment">
          <span className="text-xs">📎</span>
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Session ID</h1>
          <p className="text-gray-400">Please provide a valid session ID to continue.</p>
        </div>
      </div>
    );
  }

  const handleFileView = (filePath: string) => {
    setViewingFile(filePath);
  };

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <AppSidebar sessionId={sessionId} onFileSelect={handleFileView} />
        
        {viewingFile && (
          <FileViewer
            filePath={viewingFile}
            sessionId={sessionId}
            onClose={() => setViewingFile(null)}
          />
        )}
        
        <div className="flex flex-col flex-1 min-w-0">
          {/* Enhanced Header */}
          <div className="sticky top-0 z-40 border-b border-gray-700/40 bg-gray-800/95 backdrop-blur-xl px-6 py-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">AI</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-white">
                      Code Assistant
                    </h1>
                    <p className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Ready to help with your code
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 bg-gray-700/30 px-3 py-1.5 rounded-full border border-gray-600/30">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  Session: {sessionId?.slice(-8)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Messages Area */}
          <div className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full">
              <div className="px-6 py-8">
                <div className="mx-auto max-w-4xl space-y-8">
                  {messages.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
                        <FileText className="h-10 w-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3">
                        Welcome to Code Assistant
                      </h2>
                      <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                        Ask questions about your codebase, explore files, or get help with implementation
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors">
                          <div className="text-green-400 mb-2">@</div>
                          <p className="text-sm text-gray-300">Reference specific files with @ mentions</p>
                        </div>
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors">
                          <div className="text-yellow-400 mb-2">📁</div>
                          <p className="text-sm text-gray-300">Reference folders with @folder/ to query entire directories</p>
                        </div>
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors">
                          <div className="text-purple-400 mb-2">💬</div>
                          <p className="text-sm text-gray-300">Ask about code patterns and structure</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div key={index} className="group">
                        {msg.role === 'user' ? (
                          <div className="flex justify-end mb-6">
                            <div className="max-w-[85%] bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-2xl rounded-br-lg shadow-lg border border-blue-500/30">
                              <div className="text-[15px] leading-relaxed">
                                {highlightMentions(msg.content)}
                              </div>
                              {msg.timestamp && (
                                <div className="text-xs text-blue-200/80 mt-2 text-right">
                                  {formatTimestamp(msg.timestamp)}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-4 mb-8">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold shadow-lg border border-emerald-400/30">
                              AI
                            </div>
                            <div className="flex-1 min-w-0 bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 shadow-xl backdrop-blur-md"> {/* MODIFIED STYLING HERE */}
                              <div className="prose prose-invert max-w-none">
                                <ReactMarkdown
                                  components={MarkdownComponents}
                                  remarkPlugins={[remarkGfm]}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                                {isStreaming && index === messages.length - 1 && (
                                  <span className="inline-block w-2 h-5 bg-emerald-400 ml-1 animate-pulse rounded-sm" />
                                )}
                              </div>
                              {msg.timestamp && (!isStreaming || index !== messages.length -1) && (
                                <div className="text-xs text-gray-400/90 mt-4 pt-3 border-t border-gray-700/40 text-right">
                                  {formatTimestamp(msg.timestamp)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {/* Enhanced Loading Indicator */}
                  {isLoading && !isStreaming && (
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold shadow-lg">
                        AI
                      </div>
                      <div className="flex-1 min-w-0 bg-gray-800/40 border border-gray-700/40 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-gray-300 text-sm">Analyzing your code...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </ScrollArea>
          </div>
          
          {/* Enhanced Input Area */}
          <div className="sticky bottom-0 border-t border-gray-700/40 bg-gray-800/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="mx-auto max-w-4xl">
              <div className="relative">
                {/* Enhanced File Picker */}
                {showFilePicker && (
                  <div className="absolute bottom-full left-0 right-0 mb-4 z-50">
                    <div className="bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-2xl shadow-2xl overflow-hidden">
                      <div className="border-b border-gray-600/50 p-4">
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-200 mb-3">
                          <FileText className="h-5 w-5 text-blue-400" />
                          Reference Files & Folders
                          <span className="ml-auto text-xs text-gray-500">ESC to close</span>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            autoFocus
                            value={fileQuery}
                            onChange={e => { setFileQuery(e.target.value); setHighlight(0); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Search files and folders in repository..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-sm text-gray-100 placeholder:text-gray-400 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                          />
                        </div>
                      </div>
                      
                      {/* Enhanced Scrollable File List */}
                      <div className="relative">
                        <ScrollArea className="max-h-80 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {fileResults.length > 0 ? (
                              <>
                                {/* Show file count */}
                                <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700/30 mb-2">
                                  {fileResults.length} file{fileResults.length !== 1 ? 's' : ''} found
                                </div>
                                
                                {fileResults.map((item, idx) => (
                                  <div
                                    key={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all duration-200 ${
                                      highlight === idx 
                                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 scale-[1.02]' 
                                        : 'hover:bg-gray-700/40 text-gray-300 hover:scale-[1.01]'
                                    }`}
                                    onMouseEnter={() => setHighlight(idx)}
                                    onClick={() => handleFileSelect(item)}
                                  >
                                    {item.type === 'folder' ? (
                                      <FolderTree className="h-4 w-4 flex-shrink-0 text-yellow-400" />
                                    ) : (
                                      <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm truncate font-mono block">{item.path}</span>
                                      <span className="text-xs text-gray-500">
                                        {item.type === 'folder' ? 'Folder - @folder/' : 'File - @'}
                                      </span>
                                    </div>
                                    {highlight === idx && (
                                      <span className="text-xs text-blue-400 font-medium px-2 py-1 bg-blue-500/20 rounded-md">
                                        Enter ↵
                                      </span>
                                    )}
                                  </div>
                                ))}
                                
                                {/* Scroll indicator for many files */}
                                {fileResults.length > 8 && (
                                  <div className="sticky bottom-0 bg-gradient-to-t from-gray-800/95 to-transparent pt-4 pb-2">
                                    <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                      <ChevronDown className="h-3 w-3 animate-bounce" />
                                      Scroll for more files
                                      <ChevronDown className="h-3 w-3 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="px-4 py-8 text-center text-sm text-gray-400">
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                No files found matching "{fileQuery}"
                                <div className="text-xs text-gray-500 mt-2">
                                  Try a different search term
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Custom scrollbar styling - this will make scrollbar more visible */}
                          <style dangerouslySetInnerHTML={{
                            __html: `
                              .scroll-area-viewport {
                                scrollbar-width: thin;
                                scrollbar-color: rgba(156, 163, 175, 0.5) rgba(55, 65, 81, 0.3);
                              }
                              .scroll-area-viewport::-webkit-scrollbar {
                                width: 8px;
                              }
                              .scroll-area-viewport::-webkit-scrollbar-track {
                                background: rgba(55, 65, 81, 0.3);
                                border-radius: 4px;
                              }
                              .scroll-area-viewport::-webkit-scrollbar-thumb {
                                background: rgba(156, 163, 175, 0.5);
                                border-radius: 4px;
                              }
                              .scroll-area-viewport::-webkit-scrollbar-thumb:hover {
                                background: rgba(156, 163, 175, 0.7);
                              }
                            `
                          }} />
                        </ScrollArea>
                        
                        {/* Keyboard navigation hints */}
                        <div className="border-t border-gray-700/30 px-4 py-2 bg-gray-800/50">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <span>↑↓ Navigate</span>
                              <span>Enter Select</span>
                              <span>Esc Close</span>
                            </div>
                            <span>Type to filter</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Modern Input Field */}
                <div className="flex items-end gap-4 rounded-2xl bg-gray-700/50 border border-gray-600/50 p-4 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your codebase... Use @ for files, @folder/ for folders"
                    className="flex-1 min-h-[24px] max-h-[120px] bg-transparent border-0 resize-none text-gray-100 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-6"
                    disabled={isLoading || isStreaming}
                    rows={1}
                  />
                  <Button 
                    onClick={handleSend} 
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 transition-all duration-200 px-5 py-2.5 shadow-lg"
                    disabled={isLoading || isStreaming || !input.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>Use @ for files, @folder/ for folders</span>
                    <span>•</span>
                    <span>Enter to send, Shift+Enter for new line</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    <span>AI Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
