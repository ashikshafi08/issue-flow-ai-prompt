import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, FileText, Image, Code, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-labelledby="file-viewer-title"
      aria-describedby="file-viewer-description"
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
      
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
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
            
            {fileContent?.type === 'text' && (
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
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              aria-label="Close file viewer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FileViewer; 