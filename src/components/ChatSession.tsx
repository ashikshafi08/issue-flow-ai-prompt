import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, FileText, RotateCcw, AlertTriangle, RefreshCw, Brain, Zap, Eye, MessageSquare, AlertCircleIcon, X, Download, Copy, Check, Image, Code, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Session, ChatMessage, AgenticStep } from '@/pages/Assistant'; // Import types from Assistant
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { sendMessage, resetAgenticMemory as apiResetAgenticMemory } from '@/lib/api'; // Import API functions
import { useToast } from '@/components/ui/use-toast';

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
    
    // Force inline for specific cases
    const isFilePath = /^[\w\-./]+\.(js|jsx|ts|tsx|py|json|md|txt|yml|yaml|css|html|php|rb|go|rs|java|cpp|c|h|sh|sql)$/i.test(content.trim());
    const isFolderPath = /^[@]?folder\/[\w\-./]+$/i.test(content.trim()) || /^[@][\w\-./]+$/i.test(content.trim());
    const isShortCommand = content.length < 50 && !content.includes('\n') && /^(npm|yarn|git|sudo|apt|brew|pip|docker)\s/.test(content.trim());
    const isSimpleValue = content.length < 30 && !content.includes('\n') && !/[{}[\]();]/.test(content);
    
    if (inline || isFilePath || isFolderPath || isShortCommand || isSimpleValue) {
      // Enhanced inline code with better contrast
      return (
        <code className="font-mono text-emerald-400 bg-gray-800/60 px-1.5 py-0.5 rounded text-[0.9em] font-medium" {...props}>
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
        <code className="font-mono text-emerald-400 bg-gray-800/60 px-1.5 py-0.5 rounded text-[0.9em] font-medium" {...props}>
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
      <div className="my-3 rounded-lg overflow-hidden border border-gray-600/30 bg-gray-900/80 shadow-md">
        {/* Compact Code Block Header */}
        <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 border-b border-gray-600/20">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500/70"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500/70"></div>
              <div className="w-2 h-2 rounded-full bg-green-500/70"></div>
            </div>
            <span className="text-gray-400 font-mono text-xs">{detectedLang}</span>
            {content.split('\n').length > 5 && (
              <span className="text-gray-500 text-xs bg-gray-700/30 px-1.5 py-0.5 rounded">
                {content.split('\n').length} lines
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(content)}
            className="text-gray-400 hover:text-gray-200 p-1 h-auto text-xs"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Compact Syntax Highlighter */}
        <div className="relative">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={detectedLang}
            PreTag="div"
            showLineNumbers={content.split('\n').length > 8}
            wrapLines={true}
            customStyle={{
              margin: 0,
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
              fontSize: '0.75rem',
              lineHeight: '1.4',
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              borderRadius: '0',
            }}
            lineNumberStyle={{
              color: '#64748b',
              backgroundColor: 'transparent',
              paddingRight: '0.75rem',
              minWidth: '2rem',
              textAlign: 'right',
              fontSize: '0.7rem',
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
    <div className="my-8">
      <h1 className="text-3xl font-bold text-white mb-4 pb-3 border-b-2 border-gradient-to-r from-blue-500 to-purple-600 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent" {...props}>
        {children}
      </h1>
    </div>
  ),
  h2: ({ node, children, ...props }: any) => (
    <div className="my-6">
      <h2 className="text-2xl font-semibold text-white mb-3 pb-2 border-b border-gray-700/70 flex items-center gap-3" {...props}>
        <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></span>
        {children}
      </h2>
    </div>
  ),
  h3: ({ node, children, ...props }: any) => (
    <div className="my-5">
      <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2" {...props}>
        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
        {children}
      </h3>
    </div>
  ),
  h4: ({ node, children, ...props }: any) => (
    <h4 className="text-lg font-medium text-gray-200 my-4 flex items-center gap-2" {...props}>
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
      {children}
    </h4>
  ),

  // Enhanced Lists with better spacing and bullets
  ul: ({ node, ...props }: any) => (
    <ul className="list-none my-4 space-y-2 text-gray-200" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-none my-4 space-y-2 text-gray-200" {...props} />
  ),
  li: ({ node, children, ordered, ...props }: any) => (
    <li className="leading-relaxed text-gray-200 flex items-start gap-3" {...props}>
      <span className="text-blue-400 mt-2 flex-shrink-0">
        {ordered ? '•' : '▸'}
      </span>
      <div className="flex-1">{children}</div>
    </li>
  ),

  // Enhanced Paragraphs with better spacing
  p: ({ node, children, ...props }: any) => (
    <p className="my-4 leading-relaxed text-gray-200 text-[15px]" {...props}>
      {children}
    </p>
  ),

  // Enhanced Blockquotes for callouts and important info
  blockquote: ({ node, children, ...props }: any) => (
    <div className="my-6 relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
      <blockquote className="ml-6 pl-6 py-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-r-lg border border-blue-500/20 backdrop-blur-sm" {...props}>
        <div className="text-blue-100 italic font-medium">{children}</div>
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
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-white bg-gray-800/40 px-1.5 py-0.5 rounded-md" {...props} />
  ),
  em: ({ node, ...props }: any) => (
    <em className="italic text-gray-300 font-medium" {...props} />
  ),
};

const ChatSession: React.FC<ChatSessionProps> = ({ session, onUpdateSessionMessages, selectedFile, onCloseFileViewer, onFileSelect }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<Array<{path: string, type: 'file' | 'folder'}>>([]);
  const [filteredItems, setFilteredItems] = useState<Array<{path: string, type: 'file' | 'folder'}>>([]);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [currentMentionStart, setCurrentMentionStart] = useState<number>(-1);
  const [fileTreeData, setFileTreeData] = useState<Array<{path: string, type: 'file' | 'folder'}>>([]);

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
          setFileTreeData(items);
          setAutocompleteItems(items);
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

  // Handle input changes for autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setInput(value);
    
    // Check if we should show autocomplete
    const beforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@([^@\s]*)$/);
    
    if (mentionMatch) {
      const mentionText = mentionMatch[1];
      const mentionStart = beforeCursor.lastIndexOf('@');
      
      setCurrentMentionStart(mentionStart);
      setShowAutocomplete(true);
      setSelectedAutocompleteIndex(0);
      
      // Filter items based on the typed text
      const filtered = fileTreeData.filter(item => 
        item.path.toLowerCase().includes(mentionText.toLowerCase()) ||
        item.path.split('/').pop()?.toLowerCase().includes(mentionText.toLowerCase())
      ).slice(0, 10); // Limit to 10 items
      
      setFilteredItems(filtered);
    } else {
      setShowAutocomplete(false);
      setCurrentMentionStart(-1);
    }
  };

  const insertMention = (item: {path: string, type: 'file' | 'folder'}) => {
    if (currentMentionStart === -1) return;
    
    const prefix = item.type === 'folder' ? '@folder/' : '@';
    const mention = `${prefix}${item.path}`;
    
    const beforeMention = input.substring(0, currentMentionStart);
    const afterCursor = input.substring(textareaRef.current?.selectionStart || input.length);
    
    const newValue = beforeMention + mention + ' ' + afterCursor;
    setInput(newValue);
    setShowAutocomplete(false);
    setCurrentMentionStart(-1);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = beforeMention.length + mention.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const extractMentionedFiles = (text: string): string[] => {
    const mentionRegex = /@(?:folder\/)?([^\s@]+)/g;
    const matches = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showAutocomplete && filteredItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredItems[selectedAutocompleteIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        setCurrentMentionStart(-1);
        return;
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || !session?.id) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    // Extract context files from the input
    const mentionedFiles = extractMentionedFiles(input.trim());

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
      const stream = sendMessage(session.id, currentInput, true, mentionedFiles.length > 0 ? mentionedFiles : undefined); 
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
              ? 'bg-blue-500/20 text-blue-300 border-blue-400/50 ring-1 ring-blue-400/30' // Active state
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
      <div className="flex-1 overflow-hidden flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-8">
                <div className="mx-auto max-w-4xl space-y-10">
                  {session.messages.length === 0 ? (
                    <div className="text-center py-16">
                      <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-2">Ready to chat!</h3>
                      <p className="text-gray-500 text-sm mb-6">
                        Ask questions about the code, files, or repository structure.
                      </p>
                      <div className="text-left max-w-md mx-auto space-y-3 text-sm text-gray-600">
                        <p>• <span className="text-gray-400">@filename.ts</span> - Ask about specific files</p>
                        <p>• <span className="text-gray-400">@folder/path</span> - Explore a directory</p>
                        <p>• <span className="text-gray-300">"What does this function do?"</span></p>
                      </div>
                    </div>
                  ) : (
                    session.messages.map((message, index) => (
                      <div 
                        key={`${session.id}-msg-${index}-${message.timestamp}`}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[95%] sm:max-w-[85%] lg:max-w-[80%] rounded-2xl shadow-lg ${
                            message.role === 'user' 
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-3 sm:px-4 py-3' 
                              : 'bg-gray-800/90 text-gray-100 border border-gray-700/50 backdrop-blur-sm'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="px-3 sm:px-4 py-3 border-b border-gray-700/30 flex items-center justify-between bg-gray-800/40">
                              <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                                  <span className="text-xs sm:text-sm font-bold text-white">AI</span>
                                </div>
                                <span className="text-sm font-medium text-gray-100">Assistant</span>
                              </div>
                              {/* Show processing strategy indicator */}
                              <ProcessingIndicator 
                                strategy={(message as any).processingType || (message as any).agenticSteps?.length > 0 ? 'agentic_deep' : 'rag_only'}
                                isStreaming={message.isStreaming}
                              />
                            </div>
                          )}
                          
                          <div className={`${message.role === 'assistant' ? 'px-3 sm:px-4 py-4' : ''}`}>
                            {message.error && (
                              <div className="my-3 p-3 bg-red-900/20 border border-red-700/40 rounded-lg text-red-300 text-sm">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="font-medium mb-1">Analysis Error</div>
                                    <div className="text-red-200">
                                      {message.error.includes("reasoning steps") || message.error.includes("max iterations") 
                                        ? "The analysis was more complex than expected. Try asking a more specific question or breaking it down into smaller parts."
                                        : message.error
                                      }
                                    </div>
                                    {(message.error.includes("reasoning steps") || message.error.includes("max iterations")) && (
                                      <div className="mt-2 text-xs text-red-300">
                                        💡 Try: "Show me files in src/" or "What's in the main directory?"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* User messages */}
                            {message.role === 'user' && (
                              <div className="leading-relaxed">{highlightMentions(message.content)}</div>
                            )}
                            
                            {/* Assistant messages */}
                            {message.role === 'assistant' && !message.error && message.content && (
                              <div className="prose prose-sm prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-200 prose-a:text-blue-400 prose-code:text-pink-400 prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2">
                                <ReactMarkdown 
                                  components={MarkdownComponents}
                                  remarkPlugins={[remarkGfm]}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )}
                            
                            {message.isStreaming && !message.content && !message.error && (
                              <div className="flex items-center py-2">
                                <div className="flex space-x-1">
                                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-0"></div>
                                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100"></div>
                                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200"></div>
                                </div>
                                <span className="ml-3 text-sm text-gray-400">Generating response...</span>
                              </div>
                            )}
                            
                            {message.agenticSteps && message.agenticSteps.length > 0 && (
                              <AgenticTracePanel 
                                steps={message.agenticSteps} 
                                isStreaming={message.isStreaming}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isLoading && !session.messages.some(m => m.isStreaming) && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800/60 border border-gray-700/30 rounded-2xl">
                        <div className="px-4 py-3 border-b border-gray-700/30 flex items-center">
                          <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gray-500 to-gray-600">
                            <span className="text-xs font-semibold">AI</span>
                          </div>
                          <span className="text-sm font-medium text-gray-200">Assistant</span>
                        </div>
                        <div className="px-4 py-4 flex items-center">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-0"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200"></div>
                          </div>
                          <span className="ml-3 text-sm text-gray-400">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="border-t border-gray-700 bg-gray-800/60 p-3 sm:p-4 shadow-inner">
            <div className="mx-auto max-w-4xl relative">
              <div className="flex items-end gap-2 sm:gap-3 rounded-xl bg-gray-700/60 border border-gray-600/70 p-2 sm:p-3 focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all duration-200 shadow-md">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about the code... Use @filename or @folder/path"
                    className="flex-1 min-h-[24px] max-h-[120px] bg-transparent border-0 resize-none text-gray-100 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                    disabled={isLoading}
                    rows={1}
                  />
                  
                  {/* Autocomplete Dropdown - Make it more mobile friendly */}
                  {showAutocomplete && filteredItems.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto z-50">
                      <div className="p-2 border-b border-gray-700">
                        <p className="text-xs text-gray-400">Select a file or folder</p>
                      </div>
                      <div className="py-1">
                        {filteredItems.map((item, index) => (
                          <button
                            key={item.path}
                            className={`w-full text-left px-3 py-3 sm:py-2 text-sm hover:bg-gray-700 flex items-center gap-2 transition-colors ${
                              index === selectedAutocompleteIndex ? 'bg-gray-700 border-r-2 border-blue-500' : ''
                            }`}
                            onClick={() => insertMention(item)}
                            onMouseEnter={() => setSelectedAutocompleteIndex(index)}
                          >
                            <span className="text-xs">
                              {item.type === 'folder' ? '📁' : '📄'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-200 truncate">
                                {item.path.split('/').pop()}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {item.path}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                              {item.type === 'folder' ? '@folder/' : '@'}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="p-2 border-t border-gray-700 bg-gray-800/50">
                        <p className="text-xs text-gray-500">
                          Use ↑↓ to navigate, Enter/Tab to select, Esc to cancel
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* AgenticRAG indicator - Hide text on small screens */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <Brain className="h-3 w-3 text-purple-400" />
                    <span className="text-xs text-purple-300 hidden sm:inline">Enhanced</span>
                  </div>
                  
                  <Button 
                    onClick={handleSend} 
                    disabled={isLoading || !input.trim()}
                    size="sm"
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white disabled:opacity-60 disabled:bg-gray-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File Viewer Pane */}
        {selectedFile && (
          <div className="w-2/5 border-l border-gray-700 bg-gray-900/50 flex flex-col">
            <div className="border-b border-gray-700 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">File Viewer</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCloseFileViewer}
                className="text-gray-400 hover:text-gray-200 h-auto p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <FileViewerPane 
                filePath={selectedFile}
                sessionId={session.id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSession;
