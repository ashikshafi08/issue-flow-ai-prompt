import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, FileText, RotateCcw, AlertTriangle, RefreshCw, Brain, Zap, Eye, MessageSquare, AlertCircleIcon, X, Download, Copy, Check, Image, Code, File, Loader2, FolderTree, Search, Info, Link2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Session, ChatMessage, AgenticStep } from '@/pages/Assistant'; // Import types from Assistant
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { sendMessage, resetAgenticMemory as apiResetAgenticMemory } from '@/lib/api'; // Removed getSessionStatus as it's no longer polled here
import { useToast } from '@/components/ui/use-toast';
import EnhancedChatMessage from './EnhancedChatMessage';
import SmartChatInput from './SmartChatInput';

interface ChatSessionProps {
  session: Session;
  onUpdateSessionMessages: (updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => void;
  selectedFile?: string | null;
  onCloseFileViewer?: () => void;
  onFileSelect?: (filePath: string) => void;
}

// FileViewerPane Component for side pane display
interface FileViewerPaneProps {
  filePath: string;
  sessionId: string;
}

interface FileContent {
  content: string;
  size: number;
  type: 'text' | 'image' | 'binary';
  encoding?: string;
}

const FileViewerPane: React.FC<FileViewerPaneProps> = ({ filePath, sessionId }) => {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchFileContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:8000/api/file-content?session_id=${sessionId}&file_path=${encodeURIComponent(filePath)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setFileContent(data);
      } catch (err) {
        console.error('Error fetching file content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    fetchFileContent();
  }, [filePath, sessionId]);

  const getLanguageFromExtension = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript', 'jsx': 'jsx', 'ts': 'typescript', 'tsx': 'tsx',
      'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'h': 'c', 'hpp': 'cpp',
      'cs': 'csharp', 'php': 'php', 'rb': 'ruby', 'go': 'go', 'rs': 'rust',
      'swift': 'swift', 'kt': 'kotlin', 'scala': 'scala', 'html': 'html', 'htm': 'html',
      'xml': 'xml', 'css': 'css', 'scss': 'scss', 'sass': 'sass', 'less': 'less',
      'json': 'json', 'yaml': 'yaml', 'yml': 'yaml', 'toml': 'toml', 'ini': 'ini',
      'conf': 'ini', 'config': 'ini', 'sh': 'bash', 'bash': 'bash', 'zsh': 'bash',
      'fish': 'bash', 'ps1': 'powershell', 'sql': 'sql', 'md': 'markdown',
      'markdown': 'markdown', 'tex': 'latex', 'r': 'r', 'R': 'r', 'dockerfile': 'dockerfile'
    };
    return languageMap[ext || ''] || 'text';
  };

  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4 text-green-400" />;
    } else if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c'].includes(ext || '')) {
      return <Code className="h-4 w-4 text-blue-400" />;
    } else {
      return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = async () => {
    if (fileContent?.content) {
      await navigator.clipboard.writeText(fileContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadFile = () => {
    if (fileContent?.content) {
      const blob = new Blob([fileContent.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const isImageFile = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '');
  };

  const isTextFile = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    const textExtensions = [
      'txt', 'md', 'json', 'yaml', 'yml', 'xml', 'html', 'css', 'js', 'jsx', 'ts', 'tsx',
      'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift',
      'kt', 'scala', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'sql', 'r', 'R', 'dockerfile',
      'makefile', 'cmake', 'gradle', 'vue', 'svelte', 'scss', 'sass', 'less', 'toml',
      'ini', 'conf', 'config', 'env', 'gitignore', 'gitattributes', 'log'
    ];
    return textExtensions.includes(ext || '') || !ext;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {getFileIcon(filePath)}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {filePath.split('/').pop()}
            </p>
            <p className="text-xs text-gray-400 truncate">{filePath}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {fileContent && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {formatFileSize(fileContent.size)}
            </span>
          )}
          
          {fileContent?.type === 'text' && (
            <>
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white h-8 px-2"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
              
              <Button
                onClick={downloadFile}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white h-8 px-2"
              >
                <Download className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-400 mb-2 text-xl">⚠️</div>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        ) : fileContent ? (
          <ScrollArea className="h-full">
            {fileContent.type === 'image' && isImageFile(filePath) ? (
              <div className="p-4 text-center">
                <img
                  src={`data:image/${filePath.split('.').pop()};base64,${fileContent.content}`}
                  alt={filePath}
                  className="max-w-full max-h-full rounded border border-gray-700"
                />
              </div>
            ) : fileContent.type === 'text' && isTextFile(filePath) ? (
              <SyntaxHighlighter
                language={getLanguageFromExtension(filePath)}
                style={vscDarkPlus}
                showLineNumbers
                wrapLines={false}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: 'transparent',
                  fontSize: '0.75rem',
                  lineHeight: '1.4',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace"
                  }
                }}
              >
                {fileContent.content}
              </SyntaxHighlighter>
            ) : (
              <div className="p-4 text-center h-full flex flex-col items-center justify-center">
                <File className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-2">Binary file cannot be displayed</p>
                <p className="text-xs text-gray-500 mb-3">
                  File type: {filePath.split('.').pop()?.toUpperCase() || 'Unknown'}
                </p>
                <Button
                  onClick={downloadFile}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </ScrollArea>
        ) : null}
      </div>
    </div>
  );
};

// File Path Inline Preview Component
const FilePathInlinePreview: React.FC<{ 
  filePath: string; 
  sessionId: string; 
  children: React.ReactNode;
  prNumber?: number;
}> = ({ filePath, sessionId, children, prNumber }) => {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Clear any existing leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    // Capture position immediately
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });

    // Set hover timeout
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
      fetchPreview();
    }, 300);
  };

  const handleMouseLeave = () => {
    // Clear hover timeout if still pending
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Set leave timeout
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setPreviewData(null);
      setIsLoading(false);
    }, 150);
  };

  const fetchPreview = async () => {
    if (previewData) return; // Already loaded
    
    setIsLoading(true);
    try {
      // Use the enhanced file-snippet endpoint with RAG support
      const params = new URLSearchParams({
        session_id: sessionId,
        file_path: filePath,
        lines: '15',
        ...(prNumber && { pr_number: prNumber.toString(), show_diff: 'true' })
      });
      
      const response = await fetch(`http://localhost:8000/api/file-snippet?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      }
    } catch (error) {
      console.error('Failed to fetch file preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {children}
      </span>
      
      {isHovered && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-xl p-4 max-w-md">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-300">Loading preview...</span>
              </div>
            ) : previewData ? (
              <div>
                <div className="text-xs text-gray-400 mb-2 font-mono">
                  {previewData.file_path}
                  {previewData.type === 'diff' && previewData.pr_number && (
                    <span className="ml-2 bg-blue-600 text-white px-2 py-0.5 rounded">
                      PR #{previewData.pr_number}
                    </span>
                  )}
                </div>
                <pre className="text-xs text-gray-200 font-mono bg-gray-800 p-2 rounded overflow-hidden">
                  <code
                    className={previewData.type === 'diff' ? 'diff-content' : ''}
                    dangerouslySetInnerHTML={{
                      __html: previewData.type === 'diff' 
                        ? formatDiffForDisplay(previewData.snippet)
                        : previewData.snippet.substring(0, 500)
                    }}
                  />
                  {previewData.truncated && <span className="text-gray-500">...</span>}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};

// Helper function to format diff content for HTML display
const formatDiffForDisplay = (diff: string): string => {
  return diff
    .split('\n')
    .map(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return `<span style="color: #22c55e; background-color: rgba(34, 197, 94, 0.1);">${line}</span>`;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        return `<span style="color: #ef4444; background-color: rgba(239, 68, 68, 0.1);">${line}</span>`;
      } else if (line.startsWith('@@')) {
        return `<span style="color: #a855f7; background-color: rgba(168, 85, 247, 0.1);">${line}</span>`;
      } else if (line.startsWith('+++') || line.startsWith('---')) {
        return `<span style="color: #94a3b8;">${line}</span>`;
      }
      return line;
    })
    .join('\n');
};

// Enhanced Agent Trace Panel - Showcasing AI Intelligence with Style
const AgenticTracePanel: React.FC<{ steps: AgenticStep[], isStreaming?: boolean }> = ({ steps, isStreaming }) => {
  const [visibleSteps, setVisibleSteps] = useState<AgenticStep[]>([]);
  const [currentStep, setCurrentStep] = useState<AgenticStep | null>(null);
  const [isExpanded, setIsExpanded] = useState(false); // Always start collapsed

  // Show steps with smooth animation
  useEffect(() => {
    if (steps.length === 0) {
      setVisibleSteps([]);
      return;
    }

    const showSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        if (i >= visibleSteps.length) {
          await new Promise(resolve => setTimeout(resolve, 300)); // Faster animation
          setVisibleSteps(prev => [...prev, steps[i]]);
        }
      }
    };

    showSteps();
  }, [steps.length]);

  // Set current step for streaming but don't auto-expand
  useEffect(() => {
    if (isStreaming && visibleSteps.length > 0) {
      setCurrentStep(visibleSteps[visibleSteps.length - 1]);
      // Remove any auto-expansion logic here
    } else {
      setCurrentStep(null);
    }
  }, [visibleSteps, isStreaming]);

  const getStepIcon = (type: string, isActive: boolean = false) => {
    const iconClass = `h-5 w-5 ${isActive ? 'animate-pulse' : ''}`;
    
    switch (type) {
      case 'thought':
        return <Brain className={`${iconClass} text-purple-400`} />;
      case 'action':
        return <Zap className={`${iconClass} text-blue-400`} />;
      case 'observation':
        return <Eye className={`${iconClass} text-green-400`} />;
      case 'answer':
        return <MessageSquare className={`${iconClass} text-teal-400`} />;
      case 'status':
        return <RefreshCw className={`${iconClass} text-yellow-400 ${isActive ? 'animate-spin' : ''}`} />;
      case 'error':
        return <AlertCircleIcon className={`${iconClass} text-red-400`} />;
      default:
        return <span className="text-gray-400">🤔</span>;
    }
  };

  const getStepTheme = (type: string) => {
    switch (type) {
      case 'thought':
        return {
          bg: 'bg-gradient-to-r from-purple-900/30 to-purple-800/20',
          border: 'border-purple-500/30',
          text: 'text-purple-200',
          accent: 'bg-purple-500/20'
        };
      case 'action':
        return {
          bg: 'bg-gradient-to-r from-blue-900/30 to-blue-800/20',
          border: 'border-blue-500/30',
          text: 'text-blue-200',
          accent: 'bg-blue-500/20'
        };
      case 'observation':
        return {
          bg: 'bg-gradient-to-r from-green-900/30 to-green-800/20',
          border: 'border-green-500/30',
          text: 'text-green-200',
          accent: 'bg-green-500/20'
        };
      case 'answer':
        return {
          bg: 'bg-gradient-to-r from-teal-900/30 to-teal-800/20',
          border: 'border-teal-500/30',
          text: 'text-teal-200',
          accent: 'bg-teal-500/20'
        };
      case 'status':
        return {
          bg: 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-200',
          accent: 'bg-yellow-500/20'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-900/30 to-red-800/20',
          border: 'border-red-500/30',
          text: 'text-red-200',
          accent: 'bg-red-500/20'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-900/30 to-gray-800/20',
          border: 'border-gray-500/30',
          text: 'text-gray-200',
          accent: 'bg-gray-500/20'
        };
    }
  };

  const formatStepContent = (content: string, type: string) => {
    // Enhanced content formatting for different step types
    if (type === 'observation' || type === 'action') {
      try {
        const parsed = JSON.parse(content);
        return `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
      } catch (e) {
        // Only format file paths when they appear in technical contexts (lists, mentions, etc.)
        // Don't format them in natural sentences
        const lines = content.split('\n');
        let hasFormattedContent = false;
        const formattedLines = lines.map(line => {
          const trimmed = line.trim();
          
          // Only format files in these contexts:
          // - Lines that start with bullets, dashes, or numbers (lists)
          // - Lines that contain "file:", "Found:", "Reading:", etc.
          // - Lines that are mostly just a file path
          const isList = /^[-*•\d+.]\s/.test(trimmed);
          const isTechnicalContext = /^(Found|Reading|Analyzing|File|Path|Directory|Folder):/i.test(trimmed);
          const isMostlyFilePath = /^[\w\-./]+\.[a-z]{1,4}$/i.test(trimmed);
          
          if (isList || isTechnicalContext || isMostlyFilePath) {
            const fileRegex = /\b([\w\-./]+\.(js|jsx|ts|tsx|py|json|md|txt|yml|yaml|css|html|php|rb|go|rs|java|cpp|c|h|sh|sql))\b/gi;
            const formatted = line.replace(fileRegex, '`$1`');
            if (formatted !== line) hasFormattedContent = true;
            return formatted;
          }
          
          return line;
        });
        
        return hasFormattedContent ? formattedLines.join('\n') : content;
      }
    }
    return content;
  };

  if (!visibleSteps.length && !isStreaming) return null;

  return (
    <div className="mb-4 border border-gray-700/30 rounded-lg bg-gray-900/60 backdrop-blur-sm shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/30 bg-gray-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
              <Brain className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white">AI Reasoning Process</h3>
              <p className="text-xs text-gray-400">
                {isStreaming ? 'Actively thinking...' : `Completed ${visibleSteps.length} reasoning steps`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-200 text-xs px-2"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </div>

      {/* Steps Content */}
      {isExpanded && (
        <div className="p-5 space-y-4">
          {visibleSteps.map((step, index) => {
            const theme = getStepTheme(step.type);
            const isCurrentStep = currentStep === step;
            const formattedContent = formatStepContent(step.content, step.type);
            
            return (
              <div 
                key={`${step.type}-${index}`}
                className={`relative transform transition-all duration-500 ease-out ${
                  isCurrentStep ? 'scale-[1.02]' : ''
                }`}
              >
                {/* Step indicator line */}
                {index < visibleSteps.length - 1 && (
                  <div className="absolute left-7 top-16 w-0.5 h-8 bg-gradient-to-b from-gray-600 to-transparent"></div>
                )}
                
                <div className={`rounded-lg border ${theme.border} ${theme.bg} backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                  isCurrentStep ? 'ring-1 ring-blue-400/50 shadow-lg' : 'hover:shadow-md'
                }`}>
                  {/* Step Header */}
                  <div className="flex items-start gap-4 p-4">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${theme.accent} border ${theme.border}`}>
                      {getStepIcon(step.type, isCurrentStep)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-white capitalize">
                          {step.type}
                        </h4>
                        <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">
                          Step {index + 1}
                        </span>
                        {isCurrentStep && (
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      
                      {/* Step Content */}
                      <div className={`${theme.text} leading-relaxed`}>
                        <ReactMarkdown
                          components={{
                            ...MarkdownComponents,
                            p: ({ children, ...props }: any) => (
                              <p className="my-2 leading-relaxed" {...props}>{children}</p>
                            ),
                            code: ({ node, inline, className, children, ...props }: any) => {
                              if (!inline) {
                                return MarkdownComponents.code({ node, inline, className, children, ...props });
                              }
                              return (
                                <code className="font-mono text-emerald-300 bg-gray-800/60 px-1.5 py-0.5 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                          remarkPlugins={[remarkGfm]}
                        >
                          {formattedContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Active thinking indicator */}
          {isStreaming && (
            <div className="rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-900/30 to-blue-800/20 backdrop-blur-sm">
              <div className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0 p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1">Analyzing...</h4>
                  <p className="text-blue-200">The AI is processing your request and gathering relevant context.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Keep the simple version for backwards compatibility
const AgenticStepDisplay: React.FC<{ step: AgenticStep }> = ({ step }) => {
  let icon: React.ReactNode = null;
  let title = '';
  let contentColor = 'text-gray-300';
  let borderColor = 'border-gray-700/50';
  let bgColor = 'bg-gray-800/30';

  switch (step.type) {
    case 'thought':
      icon = <Brain className="h-4 w-4 text-purple-400" />;
      title = 'Thought';
      contentColor = 'text-purple-300';
      borderColor = 'border-purple-500/30';
      bgColor = 'bg-purple-900/20';
      break;
    case 'action':
      icon = <Zap className="h-4 w-4 text-blue-400" />;
      title = 'Action';
      contentColor = 'text-blue-300';
      borderColor = 'border-blue-500/30';
      bgColor = 'bg-blue-900/20';
      break;
    case 'observation':
      icon = <Eye className="h-4 w-4 text-green-400" />;
      title = 'Observation';
      contentColor = 'text-green-300';
      borderColor = 'border-green-500/30';
      bgColor = 'bg-green-900/20';
      break;
    case 'answer':
      icon = <MessageSquare className="h-4 w-4 text-teal-400" />;
      title = 'Answer';
      contentColor = 'text-teal-300';
      borderColor = 'border-teal-500/30';
      bgColor = 'bg-teal-900/20';
      break;
    case 'status':
      icon = <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />;
      title = 'Status';
      contentColor = 'text-yellow-300';
      borderColor = 'border-yellow-500/30';
      bgColor = 'bg-yellow-900/20';
      break;
    case 'error':
      icon = <AlertCircleIcon className="h-4 w-4 text-red-400" />;
      title = 'Error';
      contentColor = 'text-red-300';
      borderColor = 'border-red-500/30';
      bgColor = 'bg-red-900/20';
      break;
    default:
      icon = '➡️';
  }

  let displayContent = step.content;
  if (step.type === 'observation' || step.type === 'action') {
    try {
      const parsedJson = JSON.parse(step.content);
      displayContent = `\`\`\`json\n${JSON.stringify(parsedJson, null, 2)}\n\`\`\``;
    } catch (e) {
      // Special handling for content that might contain file names
      const content = step.content;
      
      // Much more aggressive file detection - look for any common file patterns
      const fileExtensions = /\.(js|jsx|ts|tsx|py|json|md|txt|yml|yaml|css|html|php|rb|go|rs|java|cpp|c|h|sh|sql)\b/gi;
      const commonFiles = /(package\.json|README\.md|LICENSE|\.gitignore|\.dockerignore|docker-compose\.yml|Dockerfile|Makefile|\.env|yarn\.lock|package-lock\.json|composer\.json|requirements\.txt|Pipfile|setup\.py|pyproject\.toml|cargo\.toml|go\.mod|pom\.xml)/i;
      
      // Split content into lines and process each
      const lines = content.split('\n');
      let hasFiles = false;
      let processedContent = '';
      
      for (let line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) {
          processedContent += '\n';
          continue;
        }
        
        // Check if this line contains file names (either standalone or with description)
        const words = trimmedLine.split(/\s+/);
        let processedLine = '';
        
        for (let word of words) {
          // Remove common prefixes/suffixes like bullets, colons, etc.
          const cleanWord = word.replace(/^[-*•:]\s*/, '').replace(/[:,]$/, '');
          
          // Check if this word looks like a file
          if (fileExtensions.test(cleanWord) || commonFiles.test(cleanWord) || 
              (cleanWord.startsWith('.') && cleanWord.length > 1 && !cleanWord.includes(' '))) {
            processedLine += `\`${cleanWord}\` `;
            hasFiles = true;
          } else {
            processedLine += word + ' ';
          }
        }
        
        processedContent += processedLine.trim() + '\n';
      }
      
      // Use processed content if we found files, otherwise use original
      if (hasFiles) {
        displayContent = processedContent.trim();
      } else {
        displayContent = content;
      }
    }
  }

  return (
    <div className={`text-xs my-1.5 p-2.5 border ${borderColor} rounded-lg ${bgColor} shadow-sm`}>
      <div className={`font-semibold text-gray-300 mb-1.5 flex items-center gap-2`}>
        {icon} {title}
      </div>
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                customStyle={{ background: 'transparent', padding: '0.5rem', fontSize: '0.75rem', margin: 0 }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`${className || ''} bg-gray-700/60 text-gray-300 px-1 py-0.5 rounded text-[0.9em]`} {...props}>
                {children}
              </code>
            );
          },
           p: ({node, ...props}) => <p className={`my-0.5 ${contentColor}`} {...props} />
        }}
        remarkPlugins={[remarkGfm]}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
};

// Enhanced Processing Indicator - Shows AI Processing Intelligence Level
interface ProcessingIndicatorProps {
  strategy?: string;
  isStreaming?: boolean;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ strategy, isStreaming }) => {
  const getStrategyInfo = (strategy: string) => {
    switch (strategy) {
      case 'agentic_deep':
        return {
          label: 'Deep Analysis',
          icon: <Brain className="h-4 w-4" />,
          color: 'text-purple-400',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          description: 'Advanced reasoning with comprehensive analysis'
        };
      case 'agentic_focused':
        return {
          label: 'Focused Analysis',
          icon: <Zap className="h-4 w-4" />,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          description: 'Targeted analysis with specific focus'
        };
      case 'agentic_light':
        return {
          label: 'Quick Analysis',
          icon: <Eye className="h-4 w-4" />,
          color: 'text-green-400',
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          description: 'Fast analysis with basic enhancement'
        };
      case 'advanced_agentic':
        return {
          label: 'Advanced AI',
          icon: <Brain className="h-4 w-4" />,
          color: 'text-purple-400',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          description: 'Multi-step reasoning with agent tools'
        };
      case 'rag_only':
        return {
          label: 'Standard',
          icon: <MessageSquare className="h-4 w-4" />,
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          description: 'Standard retrieval-based response'
        };
      default:
        return {
          label: 'Processing',
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          description: 'AI is thinking...'
        };
    }
  };

  const strategyInfo = getStrategyInfo(strategy || 'default');

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${strategyInfo.border} ${strategyInfo.bg} backdrop-blur-sm`}>
      <div className={`${strategyInfo.color} ${isStreaming ? 'animate-pulse' : ''}`}>
        {strategyInfo.icon}
      </div>
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${strategyInfo.color}`}>
          {strategyInfo.label}
        </span>
        {isStreaming && (
          <span className="text-[10px] text-gray-500">
            {strategyInfo.description}
          </span>
        )}
      </div>
      {isStreaming && (
        <div className="flex gap-1 ml-1">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`h-1 w-1 rounded-full ${strategyInfo.color.replace('text-', 'bg-')} animate-pulse`}
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced Markdown Components for Superior Agent Output Presentation
const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'plaintext';
    const content = String(children).replace(/\n$/, '');
    
    // Check if this is diff content
    const isDiff = language === 'diff' || content.includes('diff --git') || 
                   /^[@]{2}.*[@]{2}$/m.test(content) || 
                   content.split('\n').some(line => line.match(/^[+-]{1}[^+-]/));
    
    // Force inline for specific cases (but not for diffs)
    const isFilePath = !isDiff && /^[\w\-./]+\.(js|jsx|ts|tsx|py|json|md|txt|yml|yaml|css|html|php|rb|go|rs|java|cpp|c|h|sh|sql)$/i.test(content.trim());
    const isFolderPath = !isDiff && (/^[@]?folder\/[\w\-./]+$/i.test(content.trim()) || /^[@][\w\-./]+$/i.test(content.trim()));
    const isShortCommand = !isDiff && content.length < 50 && !content.includes('\n') && /^(npm|yarn|git|sudo|apt|brew|pip|docker)\s/.test(content.trim());
    const isSimpleValue = !isDiff && content.length < 30 && !content.includes('\n') && !/[{}[\]();]/.test(content);
    
    if (inline || isFilePath || isFolderPath || isShortCommand || isSimpleValue) {
      // Enhanced inline code with better contrast (file paths will be handled by the enhanced MarkdownComponents)
      if (isFilePath) {
        return (
          <code className="font-mono text-blue-400 bg-gray-800/60 px-2 py-1 rounded-md text-sm font-medium hover:bg-blue-900/40 cursor-pointer transition-colors" {...props}>
            {content}
          </code>
        );
      }
      
      // Enhanced inline code with better contrast
      return (
        <code className="font-mono text-emerald-400 bg-gray-800/60 px-2 py-1 rounded-md text-sm font-medium" {...props}>
          {content}
        </code>
      );
    }
    
    // Only create full code blocks for substantial content
    const hasMultipleLines = content.includes('\n');
    const isSubstantialCode = content.length > 60;
    const hasCodePatterns = /[{}[\]();]/.test(content) || /^(import|from|def|class|if __name__|const|let|var|function|export)\s/m.test(content);
    
    if (!hasMultipleLines && !isSubstantialCode && !hasCodePatterns) {
      // Treat as inline code even if marked as block
      return (
        <code className="font-mono text-emerald-400 bg-gray-800/60 px-2 py-1 rounded-md text-sm font-medium" {...props}>
          {content}
        </code>
      );
    }
    
    // Advanced language detection for better syntax highlighting (only for actual code blocks)
    let detectedLang = language;
    if (detectedLang === 'plaintext' && (hasCodePatterns || content.length > 100)) {
      if (/^(import|from|def|class|if __name__)\s/m.test(content)) detectedLang = 'python';
      else if (/^(const|let|var|function|import|export)\s/m.test(content)) detectedLang = 'javascript';
      else if (/:\s*[A-Z][\w<>]+/m.test(content)) detectedLang = 'typescript';
      else if (/^(<!DOCTYPE|<html|<div|<body)/m.test(content)) detectedLang = 'html';
      else if (/^(\.|#|body|html|\*)\s*\{/m.test(content)) detectedLang = 'css';
      else if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\s/im.test(content)) detectedLang = 'sql';
      else if (/^(\$|npm|yarn|sudo|apt|brew)\s/m.test(content)) detectedLang = 'bash';
      else if (/^\{.*\}$/.test(content.trim()) && content.length > 20) detectedLang = 'json';
    }
    
          return (
        <div className="my-6 rounded-xl overflow-hidden border border-gray-600 bg-[#0d1117] shadow-lg">
          {/* GitHub-style Code Block Header */}
          <div className="flex items-center justify-between bg-[#161b22] px-4 py-3 border-b border-gray-600">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27ca3f]"></div>
              </div>
              <span className="text-gray-300 font-mono text-sm font-medium">{detectedLang}</span>
              {content.split('\n').length > 5 && (
                <span className="text-gray-500 text-xs bg-gray-800 px-2 py-1 rounded-md">
                  {content.split('\n').length} lines
                </span>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(content)}
              className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-1.5 text-sm border border-gray-600 hover:border-gray-500 rounded-md transition-all duration-200"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          
          {/* Enhanced Syntax Highlighter */}
          <div className="relative bg-[#0d1117]">
            <SyntaxHighlighter
              style={{
                ...vscDarkPlus,
                'hljs': {
                  ...vscDarkPlus['hljs'],
                  background: '#0d1117',
                  color: '#e6edf3'
                }
              }}
              language={detectedLang}
              PreTag="div"
              showLineNumbers={content.split('\n').length > 3}
              wrapLines={true}
              customStyle={{
                margin: 0,
                padding: '20px',
                background: '#0d1117',
                fontSize: '14px',
                lineHeight: '1.5',
                fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                borderRadius: '0',
              }}
              lineNumberStyle={{
                color: '#7d8590',
                backgroundColor: 'transparent',
                paddingRight: '12px',
                minWidth: '40px',
                textAlign: 'right',
                fontSize: '13px',
                borderRight: '1px solid #30363d',
                marginRight: '16px',
                userSelect: 'none',
              }}
              {...props}
            >
              {content}
            </SyntaxHighlighter>
          </div>
        </div>
      );
  },

  // Enhanced Headers with better visual hierarchy
  h1: ({ node, children, ...props }: any) => (
    <h1 className="text-lg font-bold text-white mt-8 mb-4 pb-3 border-b border-gray-600/50" {...props}>
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }: any) => (
    <h2 className="text-base font-semibold text-white mt-6 mb-3" {...props}>
      {children}
    </h2>
  ),
  h3: ({ node, children, ...props }: any) => (
    <h3 className="text-sm font-semibold text-white mt-5 mb-2" {...props}>
      {children}
    </h3>
  ),
  h4: ({ node, children, ...props }: any) => (
    <h4 className="text-sm font-medium text-gray-200 my-2" {...props}>
      {children}
    </h4>
  ),

  // Enhanced Lists with proper hierarchy and spacing
  ul: ({ node, depth = 0, ...props }: any) => (
    <ul className={`space-y-2 my-4 ${depth > 0 ? 'ml-6' : ''}`} {...props} />
  ),
  ol: ({ node, depth = 0, ...props }: any) => (
    <ol className={`space-y-2 my-4 ${depth > 0 ? 'ml-6' : ''}`} {...props} />
  ),
  li: ({ node, children, ordered, index, ...props }: any) => {
    // Determine bullet style based on nesting level
    const getBullet = (isOrdered: boolean, idx: number) => {
      if (isOrdered) {
        return <span className="text-blue-400 font-medium min-w-[24px]">{idx + 1}.</span>;
      }
      return <span className="text-blue-400 text-lg leading-none">•</span>;
    };

         return (
       <li className="flex items-start gap-3 leading-relaxed text-gray-200 text-sm" {...props}>
         <div className="flex-shrink-0 mt-0.5">
           {getBullet(ordered, index || 0)}
         </div>
         <div className="flex-1 min-w-0">{children}</div>
       </li>
     );
  },

  // Enhanced Paragraphs with better spacing
  p: ({ node, children, ...props }: any) => {
    // Check if the paragraph contains code blocks to avoid nesting issues
    const hasCodeBlock = React.Children.toArray(children).some((child: any) => 
      React.isValidElement(child) && child.type === 'code'
    );
    
    if (hasCodeBlock) {
      return <div className="mb-4 leading-relaxed text-gray-200 text-sm" {...props}>{children}</div>;
    }
    
    return <p className="mb-4 leading-relaxed text-gray-200 text-sm" {...props}>{children}</p>;
  },

  // Enhanced Blockquotes for callouts and important info
  blockquote: ({ node, children, ...props }: any) => (
    <div className="my-8 relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full"></div>
      <blockquote className="ml-6 pl-6 py-5 bg-blue-950/30 border border-blue-500/30 rounded-r-lg" {...props}>
        <div className="text-blue-100 italic leading-relaxed text-base">{children}</div>
      </blockquote>
    </div>
  ),

  // Enhanced Links
  a: ({ node, ...props }: any) => (
    <a 
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-all duration-200 hover:bg-blue-400/10 px-1 py-0.5 rounded-md" 
      target="_blank" 
      rel="noopener noreferrer" 
      {...props} 
    />
  ),

  // Enhanced Tables with better styling
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-gray-600/40 shadow-xl bg-gray-900/50 backdrop-blur-sm">
      <table className="min-w-full divide-y divide-gray-600/50" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-gradient-to-r from-gray-800/80 to-gray-800/60" {...props} />
  ),
  tbody: ({ node, ...props }: any) => (
    <tbody className="divide-y divide-gray-700/40 bg-gray-900/30" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="hover:bg-gray-700/30 transition-colors duration-200" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/30" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-6 py-4 text-sm text-gray-300 border-b border-gray-700/20" {...props} />
  ),

  // Enhanced formatting elements
  pre: ({ node, ...props }: any) => (
    <pre className="overflow-auto p-0 bg-transparent m-0" {...props} />
  ),
  hr: ({ node, ...props }: any) => (
    <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent my-8" {...props} />
  ),
  strong: ({ node, children, ...props }: any) => {
    // Check if this strong element looks like a section header (ends with colon)
    const text = React.Children.toArray(children).join('');
    const isHeader = text.endsWith(':') || text.match(/^\d+\.\s/);
    
    if (isHeader) {
      return (
        <strong className="block font-bold text-white mt-6 mb-3 text-base" {...props}>
          {children}
        </strong>
      );
    }
    
    return <strong className="font-semibold text-white" {...props} />;
  },
  em: ({ node, ...props }: any) => (
    <em className="italic text-gray-300 font-medium" {...props} />
  ),
};

const ChatSession: React.FC<ChatSessionProps> = ({ session, onUpdateSessionMessages, selectedFile, onCloseFileViewer, onFileSelect }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // File autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteItems, setAutocompleteItems] = useState<Array<{path: string, type: 'file' | 'folder'}>>([]);
  const [filteredAutocompleteItems, setFilteredAutocompleteItems] = useState<Array<{path: string, type: 'file' | 'folder'}>>([]);
  const [autocompleteHighlight, setAutocompleteHighlight] = useState(0);

  // Format timestamp helper
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
      setShowAutocomplete(false);
    }
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = (item: {path: string, type: 'file' | 'folder'}) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = input.slice(0, start);
      const after = input.slice(end);
      
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
    setShowAutocomplete(false);
    setAutocompleteQuery('');
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Check if user is typing @ to trigger autocomplete
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1 && lastAtSymbol === cursorPos - 1) {
      // Just typed @, show autocomplete
      setShowAutocomplete(true);
      setAutocompleteQuery('');
      setFilteredAutocompleteItems(autocompleteItems.slice(0, 20));
    } else if (lastAtSymbol !== -1) {
      // Currently in a mention, filter based on what's typed after @
      const queryAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      if (queryAfterAt && !queryAfterAt.includes(' ')) {
        setShowAutocomplete(true);
        setAutocompleteQuery(queryAfterAt);
        const filtered = autocompleteItems.filter(item =>
          item.path.toLowerCase().includes(queryAfterAt.toLowerCase()) ||
          item.path.split('/').pop()?.toLowerCase().includes(queryAfterAt.toLowerCase())
        ).slice(0, 20);
        setFilteredAutocompleteItems(filtered);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
    
    setAutocompleteHighlight(0);
  };

  // Handle autocomplete search input changes
  const handleAutocompleteQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setAutocompleteQuery(query);
    
    if (!query) {
      setFilteredAutocompleteItems(autocompleteItems.slice(0, 20));
    } else {
      const filtered = autocompleteItems.filter(item =>
        item.path.toLowerCase().includes(query.toLowerCase()) ||
        item.path.split('/').pop()?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20);
      setFilteredAutocompleteItems(filtered);
    }
    
    setAutocompleteHighlight(0);
  };

  // Enhanced key handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showAutocomplete && filteredAutocompleteItems.length > 0) {
      handleAutocompleteKeyDown(e);
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Fetch file tree data on session change
  useEffect(() => {
    const fetchFileTree = async () => {
      if (!session?.id) return;
      
      try {
        const response = await fetch(`http://localhost:8000/api/tree?session_id=${session.id}`);
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
  }, [session?.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !session?.id) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    // Add user message immediately
    onUpdateSessionMessages(prevSessionMessages => [...prevSessionMessages, userMessage]);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // For agentic queries, don't create a placeholder message since the backend
    // will save the complete message and we'll reload it when needed
    let assistantMessagePlaceholder: ChatMessage | null = null;
    let isAgenticQuery = false;
    
    try {
      const stream = sendMessage(session.id, currentInput, true); 
      let accumulatedContent = ""; // To accumulate content from 'answer' type steps
      let finalAnswerFromStream: string | null = null;
      let allSteps: AgenticStep[] = [];

      for await (const chunk of stream) {
        // Detect if this is an agentic response
        if (chunk.type === 'step' || chunk.type === 'final' || chunk.step) {
          isAgenticQuery = true;
          
          // Create placeholder only when we detect it's agentic and haven't created one yet
          if (!assistantMessagePlaceholder) {
            assistantMessagePlaceholder = {
              role: 'assistant',
              content: '', // Initially empty
              timestamp: Date.now(),
              isStreaming: true,
              agenticSteps: [],
            };
            onUpdateSessionMessages(prevSessionMessages => [...prevSessionMessages, assistantMessagePlaceholder!]);
          }
        }

        // Only update UI if we have a placeholder (for agentic queries)
        if (assistantMessagePlaceholder) {
          let updatedMessagePart: Partial<ChatMessage> = { agenticSteps: [...allSteps] }; // Start with current steps

          if (chunk.type === 'error') {
            updatedMessagePart.content = chunk.error || 'An unknown error occurred during streaming.';
            updatedMessagePart.error = chunk.error || 'An unknown error occurred';
            updatedMessagePart.isStreaming = false;
            toast({ title: "Stream Error", description: chunk.error, variant: "destructive" });
          } else if (chunk.type === 'final') {
            finalAnswerFromStream = chunk.final_answer || null;
            allSteps = chunk.steps || allSteps; // Update with all steps from final chunk
            updatedMessagePart.agenticSteps = [...allSteps];
            updatedMessagePart.content = finalAnswerFromStream || accumulatedContent || "Agentic analysis complete.";
            updatedMessagePart.isStreaming = false;
          } else if (chunk.step) { 
            allSteps.push(chunk.step);
            updatedMessagePart.agenticSteps = [...allSteps];
            if (chunk.step.type === 'answer') {
              accumulatedContent += chunk.step.content + "\n";
              // Display accumulated answer content as it comes, if no final_answer is set yet
              if (!finalAnswerFromStream) {
                   updatedMessagePart.content = accumulatedContent;
              }
            }
            updatedMessagePart.isStreaming = true; 
          } else if (chunk.type === 'status' && chunk.content) {
             allSteps.push({type: 'status', content: chunk.content, step: allSteps.length});
             updatedMessagePart.agenticSteps = [...allSteps];
          }
          
          onUpdateSessionMessages(prevSessionMessages => 
            prevSessionMessages.map(msg => 
              msg.timestamp === assistantMessagePlaceholder!.timestamp 
                ? { ...msg, ...updatedMessagePart } 
                : msg
            )
          );
        }
      }
      
      // Keep the placeholder message visible - the backend will save the real message
      // and session reloads will show the persisted version
      
    } catch (error) {
      console.error('Error sending message or processing stream:', error);
      if (assistantMessagePlaceholder) {
        onUpdateSessionMessages(prevSessionMessages => 
          prevSessionMessages.map(msg => 
            msg.timestamp === assistantMessagePlaceholder!.timestamp 
              ? { 
                  ...msg,
                  content: 'Sorry, I encountered an error processing your request. Please try again.',
                  error: error instanceof Error ? error.message : 'Unknown streaming error',
                  isStreaming: false,
                }
              : msg
          )
        );
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (assistantMessagePlaceholder) {
        onUpdateSessionMessages(prevSessionMessages => 
          prevSessionMessages.map(msg => 
            msg.timestamp === assistantMessagePlaceholder!.timestamp && msg.isStreaming
              ? { ...msg, isStreaming: false } 
              : msg
          )
        );
      }
    }
  }, [input, session, onUpdateSessionMessages, toast]);

  const handleResetMemory = async () => {
    if (!session?.id) return;
    try {
      await apiResetAgenticMemory(session.id);
      toast({
        title: "Agent Memory Reset",
        description: "The agent's memory for this session has been cleared.",
      });
      const systemMessage: ChatMessage = {
        role: 'assistant', 
        content: "*Agent memory has been reset for this session.*",
        timestamp: Date.now(),
        type: 'status'
      };
      onUpdateSessionMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error("Failed to reset agent memory:", error);
      toast({
        title: "Error",
        description: "Could not reset agent memory.",
        variant: "destructive",
      });
    }
  };

  const highlightMentions = (text: string) => {
    return text.split(/(@(?:folder\/)?[\w\-/\\.]+)/g).map((part, i) =>
      part.startsWith('@') ? (
        <button
          key={i}
          onClick={() => {
            const filePath = part.substring(part.startsWith('@folder/') ? 8 : 1);
            onFileSelect?.(filePath);
          }}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-medium text-sm transition-all duration-200 border
            ${selectedFile === part.substring(part.startsWith('@folder/') ? 8 : 1)
              ? 'bg-blue-500/20 text-blue-300 border border-blue-400/50 ring-1 ring-blue-400/30' // Active state
              : 'bg-gray-600/30 hover:bg-gray-600/50 text-blue-300 hover:text-blue-200 border-gray-500/30 hover:border-blue-400/40'
            } cursor-pointer hover:scale-105 hover:shadow-md`}
          title={`Click to view ${part.substring(part.startsWith('@folder/') ? 8 : 1)} in file explorer`}
        >
          <span className="text-xs">
            {part.startsWith('@folder/') ? '📁' : '📄'}
          </span>
          <span className="truncate max-w-[200px]">
            {part.substring(part.startsWith('@folder/') ? 8 : 1)}
          </span>
          {selectedFile === part.substring(part.startsWith('@folder/') ? 8 : 1) && (
            <span className="text-xs text-blue-400">●</span>
          )}
        </button>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-gray-100">
      {/* Background Progress Indicator based on session.metadata.status */}
      {session?.metadata?.status && (session.metadata.status === 'core_ready' || session.metadata.status === 'issue_linking' || session.metadata.status === 'warning_issue_rag_failed') && (
        <div className={`px-4 py-2 text-xs border-b border-gray-700 flex items-center gap-2 transition-all duration-300
          ${session.metadata.status === 'warning_issue_rag_failed' ? 'bg-yellow-900/50 text-yellow-300' : 
            session.metadata.status === 'core_ready' || session.metadata.status === 'issue_linking' ? 'bg-blue-900/30 text-blue-300' : ''}`}>
          
          {session.metadata.status === 'warning_issue_rag_failed' ? <AlertTriangle className="h-4 w-4 flex-shrink-0" /> :
           (session.metadata.status === 'core_ready' || session.metadata.status === 'issue_linking') ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" /> :
           null}

          <span className="font-medium">
            {session.metadata.status === 'core_ready' ? "Context Status:" :
             session.metadata.status === 'issue_linking' ? "Issue Linking:" :
             session.metadata.status === 'warning_issue_rag_failed' ? "Context Warning:" :
             "Status:"}
          </span>
          <span>{session.metadata.message || (session.metadata.status === 'core_ready' ? 'Issue context loading...' : 'Processing...')}</span>
          
          {/* Progress bar could be added here if session.metadata provides progress for issue_linking */}
        </div>
      )}

      {/* File Tree and Messages Container */}
      <div className="flex-1 overflow-hidden flex">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col bg-black min-w-0">
          {/* Messages Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-8">
                <div className="mx-auto max-w-4xl space-y-8">
                  {session.messages.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
                        <FileText className="h-10 w-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3">
                        Ready to chat!
                      </h2>
                      <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                        Ask questions about the code, files, or repository structure.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 hover:bg-gray-900 transition-colors">
                          <div className="text-green-400 mb-2">@</div>
                          <p className="text-sm text-gray-300">Reference specific files with @ mentions</p>
                        </div>
                        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 hover:bg-gray-900 transition-colors">
                          <div className="text-yellow-400 mb-2">📁</div>
                          <p className="text-sm text-gray-300">Reference folders with @folder/ to query entire directories</p>
                        </div>
                        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 hover:bg-gray-900 transition-colors">
                          <div className="text-purple-400 mb-2">💬</div>
                          <p className="text-sm text-gray-300">Ask about code patterns and structure</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    session.messages.map((message, index) => {
                      // Extract context cards from message
                      const contextCards = [];
                      
                      // Add file context cards based on @ mentions
                      const fileMentions = message.content.match(/@[^\s@]+/g);
                      if (fileMentions) {
                        fileMentions.forEach(mention => {
                          const filePath = mention.substring(1);
                          contextCards.push({
                            type: 'file' as const,
                            title: filePath.split('/').pop() || filePath,
                            subtitle: filePath,
                            path: filePath
                          });
                        });
                      }
                      
                      // Add issue context cards if available
                      if (message.issueContext) {
                        contextCards.push({
                          type: 'issue' as const,
                          title: `Issue #${message.issueContext.number}`,
                          subtitle: message.issueContext.title,
                          number: message.issueContext.number,
                          url: message.issueContext.url,
                          preview: message.issueContext.body?.substring(0, 150)
                        });
                      }
                      
                      return (
                        <EnhancedChatMessage
                          key={index}
                          role={message.role}
                          content={message.content}
                          timestamp={message.timestamp}
                          contextCards={contextCards}
                          agenticSteps={message.agenticSteps}
                          suggestions={message.suggestions}
                          sessionId={session.id}
                          onFileSelect={onFileSelect}
                          onIssueSelect={(issueNumber) => {
                            // Handle issue selection
                            console.log('Issue selected:', issueNumber);
                          }}
                        />
                      );
                    })
                  )}
                  
                  {/* Loading Indicator */}
                  {isLoading && (
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
                          <span className="text-gray-300 text-sm">Analyzing your request...</span>
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
          <div className="sticky bottom-0 border-t border-gray-800 bg-gray-950/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="mx-auto max-w-4xl">
              <SmartChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                onFileSelect={onFileSelect}
                disabled={isLoading}
                sessionId={session.id}
                currentContext={{
                  discussingFiles: session.messages
                    .flatMap(m => {
                      const mentions = m.content.match(/@[^\s@]+/g);
                      return mentions ? mentions.map(m => m.substring(1)) : [];
                    })
                    .slice(-3), // Last 3 mentioned files
                  relatedIssues: session.messages
                    .filter(m => m.issueContext)
                    .map(m => m.issueContext!.number)
                    .slice(-3), // Last 3 related issues
                  lastUserQuery: session.messages
                    .filter(m => m.role === 'user')
                    .slice(-1)[0]?.content
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSession;
