import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { File, GitBranch, Bug, Code, ChevronDown, ChevronRight, ExternalLink, Copy, Check, Terminal, Loader2, Brain, Zap } from 'lucide-react';
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  console.log('🎨 FileHoverPreview render:', { filePath, showPreview, hasLoaded, loading });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (leaveTimeout) clearTimeout(leaveTimeout);
    };
  }, [hoverTimeout, leaveTimeout]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

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
    
    // Calculate GitHub-style diff statistics
    const diffStats = diffLines.reduce(
      (acc, line) => {
        if (line.type === 'addition') acc.additions++;
        if (line.type === 'deletion') acc.deletions++;
        return acc;
      },
      { additions: 0, deletions: 0 }
    );

    return (
      <div 
        className="fixed z-[9999] max-w-4xl w-[800px] transform transition-all duration-300 ease-out"
        style={{
          left: Math.min(position.x, window.innerWidth - 820),
          top: Math.max(position.y - 350, 20),
          maxHeight: '85vh'
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
        {/* Glassmorphism container with enhanced design */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/5">
          {/* Enhanced Header with GitHub-style stats */}
          <div className="px-5 py-4 bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* macOS-style window controls */}
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/90 shadow-lg ring-1 ring-red-400/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/90 shadow-lg ring-1 ring-yellow-400/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/90 shadow-lg ring-1 ring-green-400/50"></div>
                </div>
                
                <div className="flex items-center gap-3 ml-1">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg ring-1 ring-blue-400/30">
                    <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white/90 tracking-tight">{filePath}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isDiff && (
                        <>
                          <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-medium ring-1 ring-emerald-400/30">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                            </svg>
                            DIFF {previewData.pr_number ? `#${previewData.pr_number}` : ''}
                          </span>
                          {/* GitHub-style diff statistics */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono font-medium">
                              <span className="text-emerald-400">+{diffStats.additions}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-red-400 font-mono font-medium">
                              <span className="text-red-400">-{diffStats.deletions}</span>
                            </span>
                            {(diffStats.additions > 0 || diffStats.deletions > 0) && (
                              <div className="flex items-center bg-white/10 rounded-full px-2 py-1">
                                <div className="flex h-2 w-16 overflow-hidden rounded-full bg-gray-700">
                                  {diffStats.additions > 0 && (
                                    <div 
                                      className="bg-emerald-500 transition-all duration-500"
                                      style={{ 
                                        width: `${(diffStats.additions / (diffStats.additions + diffStats.deletions)) * 100}%` 
                                      }}
                                    />
                                  )}
                                  {diffStats.deletions > 0 && (
                                    <div 
                                      className="bg-red-500 transition-all duration-500"
                                      style={{ 
                                        width: `${(diffStats.deletions / (diffStats.additions + diffStats.deletions)) * 100}%` 
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Copy button with enhanced design */}
              <button 
                onClick={() => copyToClipboard(previewData?.snippet || '', 'diff-preview')}
                className="group flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 text-xs font-medium text-gray-300 hover:text-white"
              >
                {copiedCode === 'diff-preview' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Enhanced file info */}
            {previewData && (
              <div className="text-xs text-gray-400/80 mt-3 pl-12 flex items-center gap-4">
                {isDiff 
                  ? (
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                      Changes in {previewData.file_path}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      Lines {previewData.start_line || 1}-{previewData.end_line || previewData.total_lines} of {previewData.total_lines}
                    </span>
                  )
                }
              </div>
            )}
          </div>

          {/* Enhanced Content Area */}
          <div className="max-h-[500px] overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
            {loading && (
              <div className="p-12 text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-blue-400 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full h-10 w-10 border-2 border-blue-400/20 animate-pulse mx-auto"></div>
                </div>
                <div className="text-sm text-gray-300/80 mt-4 font-medium">Loading preview...</div>
                <div className="text-xs text-gray-400/60 mt-1">Fetching file content</div>
              </div>
            )}
            
            {error && (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-3 ring-1 ring-red-400/30">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-red-300 text-sm font-medium">Failed to load preview</div>
                <div className="text-xs mt-1 text-red-400/80 max-w-sm mx-auto">{error}</div>
              </div>
            )}
            
            {previewData && !loading && !error && (
              <div className="font-mono text-sm bg-gradient-to-b from-black/20 to-black/40">
                {isDiff ? (
                  // Enhanced diff view with glassmorphism styling
                  <div className="bg-black/20 backdrop-blur-sm">
                    {diffLines.length > 0 ? diffLines.map((line, idx) => (
                      <div 
                        key={idx}
                        className={`flex group hover:bg-white/5 transition-colors duration-150 ${
                          line.type === 'addition' ? 'bg-emerald-500/10 border-l-2 border-emerald-400/60' :
                          line.type === 'deletion' ? 'bg-red-500/10 border-l-2 border-red-400/60' :
                          line.type === 'header' ? 'bg-blue-500/10 border-l-2 border-blue-400/60' :
                          line.type === 'meta' ? 'bg-gray-500/10' :
                          ''
                        }`}
                      >
                        {/* Enhanced line numbers with better styling */}
                        <div className="flex-shrink-0 px-4 py-2 text-gray-400/70 text-xs bg-black/20 border-r border-white/10 min-w-[90px] select-none backdrop-blur-sm">
                          {line.type === 'addition' && (
                            <span className="text-emerald-400 font-semibold">+{line.lineNumber}</span>
                          )}
                          {line.type === 'deletion' && (
                            <span className="text-red-400 font-semibold">-{line.oldLineNumber}</span>
                          )}
                          {line.type === 'context' && (
                            <span className="text-gray-400">{line.oldLineNumber} {line.lineNumber}</span>
                          )}
                        </div>
                        
                        {/* Enhanced content with better typography */}
                        <div className={`flex-1 px-4 py-2 whitespace-pre-wrap leading-relaxed ${
                          line.type === 'addition' ? 'text-emerald-200/90 bg-emerald-500/5' :
                          line.type === 'deletion' ? 'text-red-200/90 bg-red-500/5' :
                          line.type === 'header' ? 'text-blue-200/90 font-semibold bg-blue-500/5' :
                          line.type === 'meta' ? 'text-gray-400/80 text-xs italic' :
                          'text-gray-200/80'
                        }`}>
                          {line.type === 'addition' && (
                            <span className="text-emerald-400 mr-2 font-bold select-none">+</span>
                          )}
                          {line.type === 'deletion' && (
                            <span className="text-red-400 mr-2 font-bold select-none">-</span>
                          )}
                          {line.content || <span className="text-gray-500/50">·</span>}
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center">
                        <div className="text-gray-400/80 text-sm">No diff content available</div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Enhanced regular file view
                  <div className="bg-black/20 backdrop-blur-sm">
                    <pre className="p-6 text-gray-200/90 whitespace-pre-wrap leading-relaxed tracking-wide" style={{ tabSize: 2 }}>
                      {previewData.snippet}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            {!loading && !error && !previewData && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 rounded-full mb-3 ring-1 ring-white/10">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-pulse" />
                </div>
                <div className="text-gray-400/80 text-sm">Hover to load preview...</div>
              </div>
            )}
          </div>
          
          {/* Enhanced footer with better information display */}
          {previewData?.truncated && (
            <div className="px-5 py-3 bg-gradient-to-r from-amber-900/20 via-yellow-900/20 to-amber-900/20 border-t border-amber-400/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs text-amber-300/90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Preview truncated</span>
                <span className="text-amber-400/70">•</span>
                <span className="text-amber-400/80">{previewData.total_lines} total lines</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <code 
        className="cursor-pointer text-blue-400 hover:text-blue-300 hover:underline bg-gray-800/60 px-1.5 py-0.5 rounded text-sm font-mono transition-colors"
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

  const isFilePath = (text: string): boolean => {
    const result = /[\w\-\/\.]+\.(js|jsx|ts|tsx|py|java|cpp|c|h|hpp|rs|go|php|rb|css|scss|html|xml|json|yaml|yml|md|sh|sql|txt)$/i.test(text);
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
      const match = /language-(\w+)/.exec(className || '');
      const text = String(children).trim();
      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
      
      if (inline) {
        if (isFilePath(text)) {
          return <FileHoverPreview filePath={text} sessionId={sessionId || ''} messageContent={content} />;
        }
        
        return (
          <code className="bg-slate-700/60 text-blue-300 px-2 py-1 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      }
      
      if ((inline === undefined || inline === false) && isFilePath(text) && !text.includes('\n') && text.length < 100) {
        return <FileHoverPreview filePath={text} sessionId={sessionId || ''} messageContent={content} />;
      }
      
      if (match) {
        return (
          <div className="relative group my-6">
            <div className="flex items-center justify-between bg-slate-800/80 px-4 py-2 rounded-t-lg border-b border-slate-700">
              <span className="text-xs text-slate-400 font-medium">{match[1]}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(text, codeId)}
              >
                {copiedCode === codeId ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-slate-400" />
                )}
              </Button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-t-none !mt-0 !mb-0"
              {...props}
            >
              {text}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code className="bg-slate-700/60 text-blue-300 px-2 py-1 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    
    p({ children, ...props }) {
      return <p className="mb-5 leading-7 text-slate-200" {...props}>{children}</p>;
    },
    
    h1({ children, ...props }) {
      return <h1 className="text-xl font-bold mb-6 mt-8 text-white" {...props}>{children}</h1>;
    },
    h2({ children, ...props }) {
      return <h2 className="text-lg font-semibold mb-5 mt-7 text-white" {...props}>{children}</h2>;
    },
    h3({ children, ...props }) {
      return <h3 className="text-base font-medium mb-4 mt-6 text-white" {...props}>{children}</h3>;
    },
    
    ul({ children, ...props }) {
      return <ul className="mb-5 space-y-2 pl-5" {...props}>{children}</ul>;
    },
    ol({ children, ...props }) {
      return <ol className="mb-5 space-y-2 pl-5" {...props}>{children}</ol>;
    },
    li({ children, ...props }) {
      return <li className="leading-7 text-slate-200" {...props}>{children}</li>;
    },
    
    blockquote({ children, ...props }) {
      return (
        <blockquote className="border-l-4 border-blue-500 pl-6 my-6 italic text-slate-300 bg-slate-800/30 py-3 rounded-r-lg" {...props}>
          {children}
        </blockquote>
      );
    }
  };

  return (
    <div className="w-full">
      {/* Context Cards */}
      {contextCards.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Referenced Context
            </span>
          </div>
          <div className="space-y-3">
            {contextCards.map(renderContextCard)}
          </div>
        </div>
      )}

      {/* Main Message Bubble */}
      <div className={`
        rounded-2xl px-6 py-5 shadow-xl backdrop-blur-sm border
        ${role === 'user' 
          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-tr-lg border-blue-500/20 shadow-blue-500/20' 
          : 'bg-slate-800/90 border-slate-700/50 text-slate-100 rounded-tl-lg shadow-slate-900/50'
        }
      `}>
        {/* Timestamp */}
        <div className={`text-xs mb-4 ${role === 'user' ? 'text-blue-100/80' : 'text-slate-400'}`}>
          {formatTimestamp(timestamp)}
        </div>

        {/* Message Content */}
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={customMarkdownComponents}
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* AI Reasoning Steps */}
      {agenticSteps.length > 0 && role === 'assistant' && (
        <div className="mt-5 bg-slate-800/60 backdrop-blur-sm border border-slate-700/40 rounded-2xl overflow-hidden shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAgenticSteps(!showAgenticSteps)}
            className="w-full justify-start text-left p-5 hover:bg-slate-700/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {showAgenticSteps ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="text-sm font-semibold text-white">Thought Process</span>
                  <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">
                    {agenticSteps.length} step{agenticSteps.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">View AI reasoning and decision-making process</p>
              </div>
            </div>
          </Button>
          
          {showAgenticSteps && (
            <div className="border-t border-slate-700/40 bg-slate-900/30">
              <div className="p-5 space-y-4">
                {agenticSteps.map((step, index) => (
                  <div key={step.step || index} className="flex items-start gap-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700/30 shadow-sm">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                      {step.step || index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                          step.type === 'thought' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' :
                          step.type === 'action' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          step.type === 'observation' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                        }`}>
                          {step.type === 'thought' && <Brain className="w-3 h-3 inline mr-1.5" />}
                          {step.type === 'action' && <Zap className="w-3 h-3 inline mr-1.5" />}
                          {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{step.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedChatMessage;
