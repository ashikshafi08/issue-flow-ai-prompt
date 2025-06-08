import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { File, GitBranch, Bug, Code, ChevronDown, ChevronRight, ExternalLink, Copy, Check, Terminal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import AgenticStep from './AgenticStep';

// Define the Step interface based on backend structure
interface Step {
  step: number;
  type: 'thought' | 'action' | 'observation' | 'answer' | 'error' | string;
  content: string | any;
  tool_name?: string;
  tool_input?: any;
  tool_output_preview?: string;
  observed_tool_name?: string;
}

interface ContextCard {
  type: 'file' | 'issue' | 'pr';
  title: string;
  subtitle?: string;
  path?: string;
  number?: number;
  url?: string;
  preview?: string;
}

interface EnhancedChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  contextCards?: ContextCard[];
  agenticSteps?: Step[];
  suggestions?: string[];
  sessionId?: string; // Add sessionId for API calls
  onFileSelect?: (filePath: string) => void;
  onIssueSelect?: (issueNumber: number) => void;
  onContextAdd?: (context: any) => void;
}

// File Hover Preview Component
interface FileHoverPreviewProps {
  filePath: string;
  sessionId?: string;
  messageContent?: string;
}

const FileHoverPreview = ({ filePath, sessionId, messageContent }: { filePath: string; sessionId: string; messageContent?: string }) => {
  const [previewData, setPreviewData] = useState<{
    snippet: string;
    file_path: string;
    start_line?: number;
    end_line?: number;
    total_lines?: number;
    truncated?: boolean;
    type?: string;
    pr_number?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [leaveTimeout, setLeaveTimeout] = useState<NodeJS.Timeout | null>(null);

  console.log('🎨 FileHoverPreview render:', { filePath, showPreview, hasLoaded, loading });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (leaveTimeout) clearTimeout(leaveTimeout);
    };
  }, [hoverTimeout, leaveTimeout]);

  const fetchPreview = useCallback(async () => {
    if (loading || hasLoaded) {
      console.log('🚫 Skipping fetch:', { loading, hasLoaded });
      return;
    }
    
    console.log('🚀 Starting fetch for:', filePath);
    setLoading(true);
    setError(null);
    
    try {
      // Detect PR context from the current message content first, then fallback to page search
      let prNumber = null;
      let isPRContext = false;
      
      // First, check the current message content for PR context
      if (messageContent) {
        const prMatch = messageContent.match(/PR #(\d+)|Pull Request #(\d+)|pr #(\d+)|#(\d+)/i);
        if (prMatch) {
          prNumber = prMatch[1] || prMatch[2] || prMatch[3] || prMatch[4];
          isPRContext = true;
          console.log('🎯 Found PR context from current message:', prNumber);
        }
      }
      
      // Fallback: look for recent PR mentions in the conversation (most recent first)
      if (!prNumber) {
        const messages = document.querySelectorAll('[class*="mb-6"]');
        // Search from most recent to oldest
        for (let i = messages.length - 1; i >= 0; i--) {
          const messageText = messages[i].textContent || '';
          const prMatch = messageText.match(/PR #(\d+)|Pull Request #(\d+)|pr #(\d+)|#(\d+)/i);
          if (prMatch) {
            prNumber = prMatch[1] || prMatch[2] || prMatch[3] || prMatch[4];
            isPRContext = true;
            console.log('🔍 Found recent PR context from conversation:', prNumber);
            break;
          }
        }
      }
      
      console.log('🔍 Context:', { isPRContext, prNumber, sessionId, filePath });
      
      // Build API URL
      const params = new URLSearchParams({
        session_id: sessionId,
        file_path: filePath,
        lines: '50'
      });
      
      // Try to get diff if in PR context
      if (isPRContext && prNumber) {
        params.set('show_diff', 'true');
        params.set('pr_number', prNumber);
        console.log('🎯 Requesting diff for PR #' + prNumber);
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${API_BASE_URL}/api/file-snippet?${params.toString()}`;
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📄 Preview data received:', data);
      setPreviewData(data);
      setHasLoaded(true);
      
    } catch (err) {
      console.error('❌ Error fetching file preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preview');
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [filePath, sessionId, messageContent, loading, hasLoaded]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    console.log('🖱️ Mouse enter on:', filePath);
    
    if (hoverTimeout) {
      console.log('🚫 Hover timeout already exists, skipping');
      return;
    }
    
    // Clear any existing leave timeout
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      setLeaveTimeout(null);
    }
    
    // Capture position immediately before timeout
    const rect = e.currentTarget.getBoundingClientRect();
    const newPosition = {
      x: rect.left,
      y: rect.top - 20
    };
    
    console.log('📍 Captured position:', newPosition);
    
    const timeout = setTimeout(() => {
      console.log('⏰ Timeout fired, showing preview');
      setPosition(newPosition);
      setShowPreview(true);
      
      if (!hasLoaded) {
        console.log('📥 Loading preview data');
        fetchPreview();
      }
      setHoverTimeout(null); // Clear the timeout ID
    }, 300);
    
    setHoverTimeout(timeout);
  }, [hoverTimeout, leaveTimeout, hasLoaded, fetchPreview, filePath]);

  const handleMouseLeave = useCallback(() => {
    console.log('🖱️ Mouse leave on:', filePath);
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      console.log('👋 Hiding preview');
      setShowPreview(false);
      setLeaveTimeout(null);
    }, 150);
    
    setLeaveTimeout(timeout);
  }, [hoverTimeout, leaveTimeout, filePath]);

  const parseDiff = (diffText: string) => {
    const lines = diffText.split('\n');
    const diffLines: Array<{
      type: 'context' | 'addition' | 'deletion' | 'header' | 'meta';
      content: string;
      lineNumber?: number;
      oldLineNumber?: number;
    }> = [];

    let currentLine = 0;
    let currentOldLine = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // Hunk header - extract line numbers
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          currentOldLine = parseInt(match[1]);
          currentLine = parseInt(match[2]);
        }
        diffLines.push({ type: 'header', content: line });
      } else if (line.startsWith('diff --git') || line.startsWith('index') || line.startsWith('+++') || line.startsWith('---')) {
        diffLines.push({ type: 'meta', content: line });
      } else if (line.startsWith('+')) {
        diffLines.push({ 
          type: 'addition', 
          content: line.slice(1),
          lineNumber: currentLine++
        });
      } else if (line.startsWith('-')) {
        diffLines.push({ 
          type: 'deletion', 
          content: line.slice(1),
          oldLineNumber: currentOldLine++
        });
      } else if (line.startsWith(' ') || line === '') {
        diffLines.push({ 
          type: 'context', 
          content: line.slice(1) || '',
          lineNumber: currentLine++,
          oldLineNumber: currentOldLine++
        });
      }
    }

    return diffLines;
  };

  const DiffViewer = () => {
    if (!showPreview) {
      console.log('🙈 DiffViewer not showing - showPreview is false');
      return null;
    }

    console.log('👁️ DiffViewer rendering - showPreview is true');

    const isDiff = previewData?.type === 'diff';
    const diffLines = isDiff ? parseDiff(previewData.snippet) : [];

    return (
      <div 
        className="fixed bg-gray-900/98 backdrop-blur-xl border border-gray-700/50 shadow-2xl rounded-xl overflow-hidden z-[9999] max-w-3xl w-[700px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 720),
          top: Math.max(position.y - 300, 20),
          maxHeight: '80vh'
        }}
        onMouseEnter={() => {
          console.log('🖱️ Mouse enter on DiffViewer');
          if (leaveTimeout) {
            clearTimeout(leaveTimeout);
            setLeaveTimeout(null);
          }
        }}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-gray-800/90 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-white truncate">{filePath}</span>
              {isDiff && (
                <span className="text-xs bg-emerald-600/90 text-white px-2 py-0.5 rounded-full font-medium">
                  DIFF {previewData.pr_number ? `#${previewData.pr_number}` : ''}
                </span>
              )}
            </div>
          </div>
          {previewData && (
            <div className="text-xs text-gray-400 mt-2">
              {isDiff 
                ? `Changes in ${previewData.file_path}`
                : `Lines ${previewData.start_line || 1}-${previewData.end_line || previewData.total_lines} of ${previewData.total_lines}`
              }
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-auto">
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent mx-auto"></div>
              <div className="text-sm text-gray-400 mt-3">Loading preview...</div>
            </div>
          )}
          
          {error && (
            <div className="p-4 text-red-400 text-sm">
              <div className="font-medium">❌ Error loading preview:</div>
              <div className="text-xs mt-1 text-red-300">{error}</div>
            </div>
          )}
          
          {previewData && !loading && !error && (
            <div className="font-mono text-sm">
              {isDiff ? (
                // Diff view with proper styling
                <div className="bg-gray-950/80">
                  {diffLines.length > 0 ? diffLines.map((line, idx) => (
                    <div 
                      key={idx}
                      className={`flex ${
                        line.type === 'addition' ? 'bg-emerald-900/40 border-l-2 border-emerald-500' :
                        line.type === 'deletion' ? 'bg-red-900/40 border-l-2 border-red-500' :
                        line.type === 'header' ? 'bg-blue-900/30 border-l-2 border-blue-500' :
                        line.type === 'meta' ? 'bg-gray-800/60' :
                        'hover:bg-gray-800/20'
                      }`}
                    >
                      {/* Line numbers */}
                      <div className="flex-shrink-0 px-3 py-1 text-gray-500 text-xs bg-gray-900/60 border-r border-gray-700/50 min-w-[80px] select-none">
                        {line.type === 'addition' && <span className="text-emerald-400">+{line.lineNumber}</span>}
                        {line.type === 'deletion' && <span className="text-red-400">-{line.oldLineNumber}</span>}
                        {line.type === 'context' && (
                          <span>{line.oldLineNumber} {line.lineNumber}</span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className={`flex-1 px-3 py-1 whitespace-pre-wrap ${
                        line.type === 'addition' ? 'text-emerald-200' :
                        line.type === 'deletion' ? 'text-red-200' :
                        line.type === 'header' ? 'text-blue-200 font-semibold' :
                        line.type === 'meta' ? 'text-gray-400 text-xs' :
                        'text-gray-300'
                      }`}>
                        {line.type === 'addition' && <span className="text-emerald-400 mr-1">+</span>}
                        {line.type === 'deletion' && <span className="text-red-400 mr-1">-</span>}
                        {line.content || ' '}
                      </div>
                    </div>
                  )) : (
                    <div className="p-4 text-gray-400 text-center">
                      No diff content available
                    </div>
                  )}
                </div>
              ) : (
                // Regular file view with syntax highlighting
                <div className="bg-gray-950/80">
                  <pre className="p-4 text-gray-200 whitespace-pre-wrap" style={{ tabSize: 2 }}>
                    {previewData.snippet}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {!loading && !error && !previewData && (
            <div className="p-6 text-gray-400 text-center text-sm">
              Hover to load preview...
            </div>
          )}
        </div>
        
        {previewData?.truncated && (
          <div className="px-4 py-2 bg-gray-800/70 border-t border-gray-700/50 text-xs text-gray-400 text-center">
            Preview truncated • {previewData.total_lines} total lines
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <code 
        className="cursor-pointer text-blue-400 hover:text-blue-300 hover:underline bg-gray-800/60 px-1.5 py-0.5 rounded text-sm font-mono transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {filePath}
      </code>
      
      {createPortal(<DiffViewer />, document.body)}
    </>
  );
};

const EnhancedChatMessage: React.FC<EnhancedChatMessageProps> = ({
  role,
  content,
  timestamp,
  contextCards = [],
  agenticSteps = [],
  sessionId,
  onFileSelect,
  onIssueSelect,
  onContextAdd
}) => {
  const [showAgenticSteps, setShowAgenticSteps] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const formatTimestamp = (ts: number): string => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Enhanced file path detection regex
  const isFilePath = (text: string): boolean => {
    // Detects paths ending with common file extensions
    const result = /[\w\-\/\.]+\.(js|jsx|ts|tsx|py|java|cpp|c|h|hpp|rs|go|php|rb|css|scss|html|xml|json|yaml|yml|md|sh|sql|txt)$/i.test(text);
    if (result) {
      console.log('🔍 File path detected:', text);
    }
    return result;
  };

  const renderContextCard = (card: ContextCard, index: number) => {
    const getIcon = () => {
      switch (card.type) {
        case 'file': return <File className="h-4 w-4 text-blue-400" />;
        case 'issue': return <Bug className="h-4 w-4 text-red-400" />;
        case 'pr': return <GitBranch className="h-4 w-4 text-green-400" />;
        default: return <Code className="h-4 w-4 text-gray-400" />;
      }
    };

    const handleClick = () => {
      if (card.type === 'file' && card.path && onFileSelect) {
        onFileSelect(card.path);
      } else if (card.type === 'issue' && card.number && onIssueSelect) {
        onIssueSelect(card.number);
      } else if (card.url) {
        window.open(card.url, '_blank');
      }
    };

    return (
      <div
        key={index}
        className="flex items-center gap-3 p-3 bg-gray-800/40 border border-gray-700/30 rounded-lg cursor-pointer hover:border-gray-600/50 hover:bg-gray-800/60 transition-all duration-200 group"
        onClick={handleClick}
      >
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
              {card.title}
            </h4>
            {card.url && <ExternalLink className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
          {card.subtitle && (
            <p className="text-xs text-gray-400 truncate">{card.subtitle}</p>
          )}
          {card.preview && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{card.preview}</p>
          )}
        </div>
      </div>
    );
  };

  const customMarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      console.log('🛠️ customMarkdownComponents.code called:', { inline, children: String(children), className });
      
      const match = /language-(\w+)/.exec(className || '');
      const text = String(children).trim();
      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
      
      // Handle inline code that might be file paths
      if (inline) {
        console.log('📝 Processing inline code:', text);
        if (isFilePath(text)) {
          console.log('✅ File path detected, rendering FileHoverPreview');
          return <FileHoverPreview filePath={text} sessionId={sessionId} messageContent={content} />;
        }
        
        return (
          <code className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      }
      
      // ALSO handle when inline is undefined but content looks like a file path (common with certain markdown parsers)
      if ((inline === undefined || inline === false) && isFilePath(text) && !text.includes('\n') && text.length < 100) {
        console.log('✅ File path detected in non-inline code, rendering FileHoverPreview');
        return <FileHoverPreview filePath={text} sessionId={sessionId} messageContent={content} />;
      }
      
      // Handle code blocks
      if (match) {
        return (
          <div className="relative group">
            <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-700">
              <span className="text-xs text-gray-400 font-medium">{match[1]}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(text, codeId)}
              >
                {copiedCode === codeId ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-400" />
                )}
              </Button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-t-none !mt-0"
              {...props}
            >
              {text}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className={`flex gap-3 mb-6 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {role === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-white">AI</span>
        </div>
      )}

      <div className={`flex-1 max-w-3xl ${role === 'user' ? 'order-2' : ''}`}>
        {/* Message Header */}
        <div className={`flex items-center gap-2 mb-2 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs font-medium text-gray-400">
            {role === 'user' ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-500">{formatTimestamp(timestamp)}</span>
        </div>

        {/* Context Cards */}
        {contextCards.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Referenced Context
              </span>
            </div>
            <div className="space-y-2">
              {contextCards.map(renderContextCard)}
            </div>
          </div>
        )}

        {/* Main Message */}
        <div className={`
          rounded-lg px-4 py-3 shadow-sm
          ${role === 'user' 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-8' 
            : 'bg-gray-800/60 border border-gray-700/30 text-gray-100'
          }
        `}>
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={customMarkdownComponents}
              remarkPlugins={[remarkGfm]}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Agentic Steps */}
        {agenticSteps.length > 0 && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAgenticSteps(!showAgenticSteps)}
              className="text-xs text-gray-400 hover:text-gray-200 p-1 h-auto"
            >
              {showAgenticSteps ? (
                <ChevronDown className="h-3 w-3 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1" />
              )}
              View reasoning steps ({agenticSteps.length})
            </Button>
            
            {showAgenticSteps && (
              <div className="mt-2 space-y-1 pl-1">
                {agenticSteps.map((s, index) => (
                  <AgenticStep key={s.step || index} step={s} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {role === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center order-3">
          <span className="text-sm font-bold text-white">You</span>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatMessage;
