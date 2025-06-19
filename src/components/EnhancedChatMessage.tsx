import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { File, GitBranch, Bug, Code, ChevronDown, ChevronRight, ExternalLink, Copy, Check, Terminal, Loader2, Clock, BarChart3, FileText, Settings, Tag } from 'lucide-react';
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
  structuredResponse?: any; // Professional structured response data
}

// File Hover Preview Component
interface FileHoverPreviewProps {
  filePath: string;
  sessionId?: string;
  messageContent?: string;
}

const FileHoverPreview: React.FC<{ filePath: string; sessionId: string; messageContent?: string }> = ({ filePath, sessionId, messageContent }) => {
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
    
    // **NEW: Use requestIdleCallback for non-blocking processing**
    await new Promise<void>((resolve) => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => resolve(), { timeout: 50 });
      } else {
        setTimeout(() => resolve(), 0);
      }
    });
    
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

    // **NEW: Process large diffs in chunks to avoid blocking**
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
        <div className="bg-gray-900/95 backdrop-blur-2xl border border-gray-700 shadow-2xl rounded-2xl overflow-hidden">
          {/* Enhanced Header with GitHub-style stats */}
          <div className="px-5 py-4 bg-gray-800/90 backdrop-blur-xl border-b border-gray-700">
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
                    <span className="text-sm font-semibold text-gray-100 tracking-tight">{filePath}</span>
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
                              <div className="flex items-center bg-gray-600/30 rounded-full px-2 py-1">
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
                className="group flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 hover:border-gray-500 rounded-lg transition-all duration-200 text-xs font-medium text-gray-200 hover:text-white"
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
              <div className="text-xs text-gray-300 mt-3 pl-12 flex items-center gap-4">
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
          <div className="max-h-[500px] overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50">
            {loading && (
              <div className="p-12 text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-600/30 border-t-blue-400 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full h-10 w-10 border-2 border-blue-400/20 animate-pulse mx-auto"></div>
                </div>
                <div className="text-sm text-gray-200 mt-4 font-medium">Loading preview...</div>
                <div className="text-xs text-gray-400 mt-1">Fetching file content</div>
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
              <div className="font-mono text-sm bg-gradient-to-b from-gray-900/30 to-gray-800/50">
                {isDiff ? (
                  // Enhanced diff view with glassmorphism styling
                  <div className="bg-gray-900/20 backdrop-blur-sm">
                    {diffLines.length > 0 ? diffLines.map((line, idx) => (
                      <div 
                        key={idx}
                        className={`flex group hover:bg-gray-700/20 transition-colors duration-150 ${
                          line.type === 'addition' ? 'bg-emerald-500/10 border-l-2 border-emerald-400/60' :
                          line.type === 'deletion' ? 'bg-red-500/10 border-l-2 border-red-400/60' :
                          line.type === 'header' ? 'bg-blue-500/10 border-l-2 border-blue-400/60' :
                          line.type === 'meta' ? 'bg-gray-500/10' :
                          ''
                        }`}
                      >
                        {/* Enhanced line numbers with better styling */}
                        <div className="flex-shrink-0 px-4 py-2 text-gray-400 text-xs bg-gray-900/30 border-r border-gray-600 min-w-[90px] select-none backdrop-blur-sm">
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
                          line.type === 'meta' ? 'text-gray-300 text-xs italic' :
                          'text-gray-200'
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
                        <div className="text-gray-300 text-sm">No diff content available</div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Enhanced regular file view
                  <div className="bg-gray-900/20 backdrop-blur-sm">
                    <pre className="p-6 text-gray-200 whitespace-pre-wrap leading-relaxed tracking-wide" style={{ tabSize: 2 }}>
                      {previewData.snippet}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            {!loading && !error && !previewData && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-700/20 rounded-full mb-3 ring-1 ring-gray-600">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-pulse" />
                </div>
                <div className="text-gray-300 text-sm">Hover to load preview...</div>
              </div>
            )}
          </div>
          
          {/* Enhanced footer with better information display */}
          {previewData?.truncated && (
            <div className="px-5 py-3 bg-gradient-to-r from-amber-900/20 via-yellow-900/20 to-amber-900/20 border-t border-amber-400/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs text-amber-300/90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className="cursor-pointer text-blue-400 hover:text-blue-300 hover:underline bg-gray-700/40 px-1.5 py-0.5 rounded-sm text-[0.95em] font-mono transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {filePath}
      </code>
      
      {createPortal(<DiffViewer />, document.body)}
    </>
  );
};

// Professional Structured Response Renderer
interface StructuredResponseRendererProps {
  response: any;
  onFileSelect?: (filePath: string) => void;
}

const StructuredResponseRenderer: React.FC<StructuredResponseRendererProps> = ({ 
  response, 
  onFileSelect 
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryTitle: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryTitle)) {
      newExpanded.delete(categoryTitle);
    } else {
      newExpanded.add(categoryTitle);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleDetail = (detailId: string) => {
    const newExpanded = new Set(expandedDetails);
    if (newExpanded.has(detailId)) {
      newExpanded.delete(detailId);
    } else {
      newExpanded.add(detailId);
    }
    setExpandedDetails(newExpanded);
  };

  const getIconByType = (iconStr: string) => {
    switch (iconStr) {
      case '📁': return <FileText className="h-4 w-4" />;
      case '🔍': return <Bug className="h-4 w-4" />;
      case '🐛': return <Bug className="h-4 w-4" />;
      case '🚀': return <Settings className="h-4 w-4" />;
      case '⚡': return <BarChart3 className="h-4 w-4" />;
      case '📊': return <BarChart3 className="h-4 w-4" />;
      case '🏗️': return <Code className="h-4 w-4" />;
      case '💻': return <Terminal className="h-4 w-4" />;
      default: return <span className="text-sm">{iconStr}</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500/40 bg-red-900/20 text-red-300';
      case 'high': return 'border-orange-500/40 bg-orange-900/20 text-orange-300';
      case 'medium': return 'border-yellow-500/40 bg-yellow-900/20 text-yellow-300';
      case 'low': return 'border-blue-500/40 bg-blue-900/20 text-blue-300';
      default: return 'border-gray-500/40 bg-gray-900/20 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">{response.title}</h3>
            <p className="text-gray-300 mb-3">{response.executive_summary}</p>
            
            {/* Key Findings */}
            {response.key_findings && response.key_findings.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-blue-300 mb-2">Key Findings</h4>
                <ul className="space-y-1">
                  {response.key_findings.map((finding: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      {response.categories && response.categories.map((category: any, categoryIndex: number) => {
        const isExpanded = expandedCategories.has(category.title);
        
        return (
          <div key={categoryIndex} className={`border rounded-lg ${getPriorityColor(category.priority)}`}>
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.title)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-current/20 rounded">
                  {getIconByType(category.icon)}
                </div>
                <div className="text-left">
                  <h4 className="font-semibold">{category.title}</h4>
                  <p className="text-sm opacity-80">{category.summary}</p>
                </div>
                <span className="ml-2 px-2 py-1 bg-current/20 rounded-full text-xs font-medium">
                  {category.count}
                </span>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            {/* Category Content */}
            {isExpanded && (
              <div className="border-t border-current/20 p-4 space-y-4">
                {/* Items */}
                {category.items && category.items.length > 0 && (
                  <div className="grid gap-2">
                    {category.items.map((item: any, itemIndex: number) => (
                      <div key={itemIndex} className="bg-black/20 rounded p-3 text-sm">
                        {item.path && (
                          <button
                            onClick={() => onFileSelect?.(item.path)}
                            className="text-blue-300 hover:text-blue-200 hover:underline font-mono text-xs mb-1 block"
                          >
                            {item.path}
                          </button>
                        )}
                        {item.preview && (
                          <p className="text-gray-400 text-xs mb-1">{item.preview}</p>
                        )}
                        {item.matches && (
                          <span className="text-yellow-400 text-xs">{item.matches} matches</span>
                        )}
                        {item.line_numbers && (
                          <div className="flex gap-1 mt-1">
                            {item.line_numbers.map((lineNum: number, i: number) => (
                              <span key={i} className="bg-gray-600/40 text-gray-300 px-1.5 py-0.5 rounded text-xs font-mono">
                                L{lineNum}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Detail Sections */}
                {category.details && category.details.length > 0 && (
                  <div className="space-y-2">
                    {category.details.map((detail: any, detailIndex: number) => {
                      const detailId = `${category.title}-detail-${detailIndex}`;
                      const isDetailExpanded = expandedDetails.has(detailId);
                      
                      return (
                        <div key={detailIndex} className="bg-black/30 rounded-lg">
                          <button
                            onClick={() => toggleDetail(detailId)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                          >
                            <span className="text-sm font-medium">{detail.title}</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${isDetailExpanded ? 'rotate-90' : ''}`} />
                          </button>
                          
                          {isDetailExpanded && (
                            <div className="border-t border-white/10 p-3">
                              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-black/30 p-3 rounded overflow-x-auto">
                                {detail.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Next Actions */}
      {response.next_actions && response.next_actions.length > 0 && (
        <div className="border border-green-500/30 bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-5 w-5 text-green-400" />
            <h4 className="font-semibold text-green-200">Suggested Next Steps</h4>
          </div>
          
          <div className="space-y-3">
            {response.next_actions.map((action: any, index: number) => (
              <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(action.priority)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm mb-1">{action.title}</h5>
                    <p className="text-xs opacity-80 mb-2">{action.description}</p>
                    {action.estimated_effort && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{action.estimated_effort}</span>
                      </div>
                    )}
                  </div>
                  <Tag className={`h-4 w-4 ${getPriorityColor(action.priority)} flex-shrink-0`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {response.metadata && (response.processing_time || response.confidence_score) && (
        <div className="text-xs text-gray-500 border-t border-gray-700/50 pt-3">
          <div className="flex items-center gap-4">
            {response.processing_time && (
              <span>Processing: {response.processing_time.toFixed(2)}s</span>
            )}
            {response.confidence_score && (
              <span>Confidence: {Math.round(response.confidence_score * 100)}%</span>
            )}
            {response.timestamp && (
              <span>Generated: {new Date(response.timestamp).toLocaleString()}</span>
            )}
          </div>
        </div>
      )}
    </div>
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
  onContextAdd,
  structuredResponse
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
        case 'pr': return <GitBranch className="h-4 w-4 text-green-500" />;
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
        className="flex items-center gap-3 p-4 bg-gray-800/40 border border-gray-700/50 rounded-lg cursor-pointer hover:border-gray-600/60 hover:bg-gray-700/40 transition-all duration-200 group"
        onClick={handleClick}
      >
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-100 truncate group-hover:text-blue-300 transition-colors">
              {card.title}
            </h4>
            {card.url && <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
          {card.subtitle && (
            <p className="text-xs text-gray-300 truncate mt-1">{card.subtitle}</p>
          )}
          {card.preview && (
            <p className="text-xs text-gray-400 line-clamp-2 mt-2">{card.preview}</p>
          )}
        </div>
      </div>
    );
  };

  const customMarkdownComponents = {
    // Improved paragraph spacing
    p: ({ children, ...props }: any) => (
      <p className="mb-4 leading-relaxed text-gray-100" style={{ lineHeight: '1.7' }} {...props}>
        {children}
      </p>
    ),
    
    // Better heading spacing and typography
    h1: ({ children, ...props }: any) => (
      <h1 className="text-2xl font-bold text-gray-100 mb-6 mt-8 leading-tight" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-xl font-semibold text-gray-100 mb-4 mt-6 leading-tight" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-lg font-medium text-gray-100 mb-3 mt-5 leading-tight" {...props}>
        {children}
      </h3>
    ),
    
    // Enhanced list spacing
    ul: ({ children, ...props }: any) => (
      <ul className="mb-4 space-y-2 pl-0" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="mb-4 space-y-2 pl-0" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="flex items-start gap-3 text-gray-100 leading-relaxed" {...props}>
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2.5 flex-shrink-0"></span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    
    // Better blockquote styling
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-blue-400/50 pl-6 py-3 my-6 bg-gray-800/30 rounded-r-lg italic text-gray-200" {...props}>
        {children}
      </blockquote>
    ),
    
    // Enhanced strong/bold text
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-gray-50" {...props}>
        {children}
      </strong>
    ),
    
    // Improved emphasis
    em: ({ children, ...props }: any) => (
      <em className="italic text-gray-200" {...props}>
        {children}
      </em>
    ),

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
          <code className="bg-gray-700/40 text-orange-300 px-1.5 py-0.5 rounded-sm text-[0.95em] font-mono" {...props}>
            {children}
          </code>
        );
      }
      
      // ALSO handle when inline is undefined but content looks like a file path (common with certain markdown parsers)
      if ((inline === undefined || inline === false) && isFilePath(text) && !text.includes('\n') && text.length < 100) {
        console.log('✅ File path detected in non-inline code, rendering FileHoverPreview');
        return <FileHoverPreview filePath={text} sessionId={sessionId} messageContent={content} />;
      }
      
      // Handle code blocks with better spacing
      if (match) {
        return (
          <div className="relative group my-6">
            <div className="flex items-center justify-between bg-gray-800/90 px-4 py-3 rounded-t-lg border-b border-gray-700">
              <span className="text-xs text-gray-300 font-medium uppercase tracking-wide">{match[1]}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-700"
                onClick={() => copyToClipboard(text, codeId)}
              >
                {copiedCode === codeId ? (
                  <Check className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-gray-200" />
                )}
              </Button>
            </div>
            <div className="rounded-t-none overflow-hidden">
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="!mt-0 !mb-0"
                customStyle={{
                  margin: 0,
                  borderRadius: '0 0 8px 8px',
                  padding: '16px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
                {...props}
              >
                {text}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      }

      return (
        <code className="bg-gray-700/40 text-orange-300 px-1.5 py-0.5 rounded-sm text-[0.95em] font-mono" {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className={`flex gap-4 mb-8 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex-1 max-w-4xl ${role === 'user' ? 'order-1' : ''}`}>
        {/* Enhanced message header with better spacing */}
        <div className={`flex items-center gap-2 mb-3 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500 font-medium tracking-wide">{formatTimestamp(timestamp)}</span>
        </div>

        {/* Context Cards with improved spacing */}
        {contextCards.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Referenced Context
              </span>
            </div>
            <div className="space-y-3">
              {contextCards.map(renderContextCard)}
            </div>
          </div>
        )}

        {/* Main Message with enhanced typography and spacing */}
        <div className={`
          rounded-xl px-6 py-5 shadow-lg
          ${role === 'user' 
            ? 'bg-gray-700/60 backdrop-blur-sm text-gray-100 ml-12 border border-gray-600/40' 
            : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/40 text-gray-100'
          }
        `}>
          <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              components={customMarkdownComponents}
              remarkPlugins={[remarkGfm]}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Professional Structured Response */}
          {structuredResponse && (
            <div className="mt-6 border-t border-gray-700/50 pt-6">
              <StructuredResponseRenderer response={structuredResponse} onFileSelect={onFileSelect} />
            </div>
          )}
        </div>

        {/* Agentic Steps with better spacing */}
        {agenticSteps.length > 0 && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAgenticSteps(!showAgenticSteps)}
              className="text-xs text-gray-400 hover:text-gray-200 p-2 h-auto hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              {showAgenticSteps ? (
                <ChevronDown className="h-3.5 w-3.5 mr-2" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 mr-2" />
              )}
              View reasoning steps ({agenticSteps.length})
            </Button>
            
            {showAgenticSteps && (
              <div className="mt-3 space-y-2 pl-2">
                {agenticSteps.map((s, index) => (
                  <AgenticStep key={s.step || index} step={s} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatMessage;
