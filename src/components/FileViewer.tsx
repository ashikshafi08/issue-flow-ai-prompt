import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Copy, Check, FileText, Image, Code, File, Clock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TimelineInvestigator from './TimelineInvestigator';

interface FileViewerProps {
  filePath: string;
  sessionId: string;
  onClose: () => void;
}

interface FileContent {
  content: string;
  size: number;
  type: 'text' | 'image' | 'binary';
  encoding?: string;
  error?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ filePath, sessionId, onClose }) => {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'timeline'>('content');

  useEffect(() => {
    let isCancelled = false;
    
    const fetchFileContent = async () => {
      // Validate inputs
      if (!sessionId || !filePath) {
        console.warn('FileViewer: Missing sessionId or filePath', { sessionId, filePath });
        if (!isCancelled) {
          setError('Invalid session or file path');
          setLoading(false);
        }
        return;
      }

      try {
        if (!isCancelled) {
          setLoading(true);
          setError(null);
        }
        
        console.log(`FileViewer: Fetching content for file "${filePath}" with session "${sessionId}"`);
        
        const response = await fetch(`http://localhost:8000/api/file-content?session_id=${sessionId}&file_path=${encodeURIComponent(filePath)}`);
        
        if (isCancelled) {
          console.log('FileViewer: Request cancelled');
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!isCancelled) {
          setFileContent(data);
          console.log(`FileViewer: Successfully loaded content for "${filePath}"`);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error fetching file content:', err);
          setError(err instanceof Error ? err.message : 'Failed to load file');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchFileContent();
    
    return () => {
      isCancelled = true;
    };
  }, [filePath, sessionId]);

  // Handle escape key to close modal - without body manipulation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('FileViewer: Escape key pressed, closing modal');
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    // Add escape key listener with capture to ensure it works
    document.addEventListener('keydown', handleEscape, true);
    
    return () => {
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [onClose]);

  const getLanguageFromExtension = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'html': 'html',
      'htm': 'html',
      'xml': 'xml',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'conf': 'ini',
      'config': 'ini',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'fish': 'bash',
      'ps1': 'powershell',
      'sql': 'sql',
      'md': 'markdown',
      'markdown': 'markdown',
      'tex': 'latex',
      'r': 'r',
      'R': 'r',
      'matlab': 'matlab',
      'm': 'matlab',
      'dockerfile': 'dockerfile',
      'makefile': 'makefile',
      'cmake': 'cmake',
      'gradle': 'gradle',
      'vue': 'vue',
      'svelte': 'svelte',
    };
    return languageMap[ext || ''] || 'text';
  };

  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <Image className="h-5 w-5 text-green-400" />;
    } else if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c'].includes(ext || '')) {
      return <Code className="h-5 w-5 text-blue-400" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-400" />;
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

    const modalContent = (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden"
      role="dialog"
      aria-labelledby="file-viewer-title"
      aria-describedby="file-viewer-description"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: '1rem'
      }}
      onMouseDown={(e) => {
        // Close when clicking backdrop (using mousedown for better responsiveness)
        if (e.target === e.currentTarget) {
          console.log('FileViewer: Backdrop clicked, closing modal');
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="sr-only" id="file-viewer-description">
        File viewer dialog showing contents of {filePath}. Use Escape key or close button to exit.
      </div>
      
      <style>{`
        .file-viewer-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .file-viewer-scroll::-webkit-scrollbar-track {
          background: #1F2937;
        }
        .file-viewer-scroll::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 4px;
        }
        .file-viewer-scroll::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
      
      <div 
        className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col border-b border-gray-700 flex-shrink-0">
          {/* File Info Row */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-3">
              {getFileIcon(filePath)}
              <div>
                <h2 id="file-viewer-title" className="text-lg font-semibold text-white truncate">
                  {filePath.split('/').pop()}
                </h2>
                <p className="text-sm text-gray-400 truncate">{filePath}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {fileContent && (
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                  {formatFileSize(fileContent.size)}
                </span>
              )}
              
              {/* Action buttons - only show for content tab and text files */}
              {activeTab === 'content' && fileContent?.type === 'text' && (
                <>
                  <Button
                    onClick={copyToClipboard}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    aria-label="Copy file content to clipboard"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  
                  <Button
                    onClick={downloadFile}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    aria-label="Download file"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </>
              )}
              
              <Button
                onClick={(e) => {
                  console.log('FileViewer: Close button clicked, closing modal');
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
                aria-label="Close file viewer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex px-4 pb-2">
            <div className="flex bg-gray-800/80 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('content')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'content'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Content
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'timeline'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                Timeline
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'content' ? (
            // File Content Tab
            loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
                  <p className="text-gray-400">Loading file...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-red-400 mb-3 text-2xl">⚠️</div>
                  <p className="text-gray-400">{error}</p>
                </div>
              </div>
            ) : fileContent ? (
              <div 
                className="h-full overflow-auto file-viewer-scroll" 
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4B5563 #1F2937'
                }}
              >
                {fileContent.type === 'image' && isImageFile(filePath) ? (
                  <div className="p-6 text-center min-h-full flex items-center justify-center">
                    <img
                      src={`data:image/${filePath.split('.').pop()};base64,${fileContent.content}`}
                      alt={filePath}
                      className="max-w-full max-h-full rounded-lg shadow-lg border border-gray-700"
                    />
                  </div>
                ) : fileContent.type === 'text' && isTextFile(filePath) ? (
                  <div className="w-full">
                    <SyntaxHighlighter
                      language={getLanguageFromExtension(filePath)}
                      style={vscDarkPlus}
                      showLineNumbers
                      wrapLines={false}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        background: 'transparent',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        width: '100%',
                        maxWidth: 'none',
                      }}
                      codeTagProps={{
                        style: {
                          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace"
                        }
                      }}
                    >
                      {fileContent.content}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <div className="p-6 text-center h-full flex flex-col items-center justify-center">
                    <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">Binary file cannot be displayed</p>
                    <p className="text-sm text-gray-500">
                      File type: {filePath.split('.').pop()?.toUpperCase() || 'Unknown'}
                    </p>
                    <Button
                      onClick={downloadFile}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            ) : null
          ) : (
            // Timeline Tab
            <div className="h-full overflow-auto bg-gray-950">
              <div className="p-4 h-full">
                <TimelineInvestigator
                  sessionId={sessionId}
                  filePath={filePath}
                  className="h-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render outside the normal component tree
  return createPortal(modalContent, document.body);
};

export default FileViewer; 