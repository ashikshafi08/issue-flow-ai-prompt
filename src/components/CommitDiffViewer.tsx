import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Copy, 
  Download, 
  GitCommit, 
  Calendar, 
  User,
  Hash,
  RotateCcw,
  Loader2,
  ExternalLink,
  Eye,
  Diff
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface CommitInfo {
  sha: string;
  author: string;
  date: string;
  message: string;
  body: string;
  insertions: number;
  deletions: number;
  pr_number?: number;
  is_merge: boolean;
}

interface CommitDiffData {
  sha: string;
  file_path: string;
  content: string;
  content_type: 'file_content' | 'diff';
  view_type: 'content' | 'diff';
  file_changed: boolean;
  change_type: 'added' | 'modified' | 'deleted' | 'unknown';
  is_truncated: boolean;
  original_length: number;
  commit: CommitInfo;
}

interface CommitDiffViewerProps {
  sessionId: string;
  commitSha?: string;
  filePath?: string;
  className?: string;
  onError?: (error: string) => void;
}

const CommitDiffViewer: React.FC<CommitDiffViewerProps> = ({
  sessionId,
  commitSha,
  filePath,
  className,
  onError
}) => {
  const [diffData, setDiffData] = useState<CommitDiffData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'metadata'>('content');
  const [viewType, setViewType] = useState<'content' | 'diff'>('content'); // Default to file content
  const { toast } = useToast();
  const { theme } = useTheme();
  
  // Debouncing refs
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Fetch diff data with debouncing and abort controller
  const fetchDiffData = useCallback(async (sha?: string, path?: string, view?: string) => {
    if (!sha || !path || !sessionId) {
      setDiffData(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/diff/${encodeURIComponent(sha)}/${encodeURIComponent(path)}?session_id=${encodeURIComponent(sessionId)}&view_type=${view || 'content'}`,
        { signal: abortControllerRef.current.signal }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
      }
      
      const data: CommitDiffData = await response.json();
      
      // Only update state if request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setDiffData(data);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load commit content';
      console.error('Error fetching content:', err);
      
      if (!abortControllerRef.current.signal.aborted) {
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [sessionId, onError]);

  // Debounced effect for commit changes
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    if (!commitSha || !filePath) {
      setDiffData(null);
      setIsLoading(false);
      return;
    }
    
    // Debounce API calls by 300ms to prevent rapid firing
    debounceTimeoutRef.current = setTimeout(() => {
      fetchDiffData(commitSha, filePath, viewType);
    }, 300);
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [commitSha, filePath, viewType, fetchDiffData]);

  // Handle view type change
  const handleViewTypeChange = useCallback((newViewType: 'content' | 'diff') => {
    if (newViewType !== viewType) {
      setViewType(newViewType);
      // This will trigger the useEffect above to fetch new data
    }
  }, [viewType]);

  // Get file language for syntax highlighting
  const getLanguage = useCallback((filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'clj': 'clojure',
      'hs': 'haskell',
      'ml': 'ocaml',
      'fs': 'fsharp',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'fish': 'bash',
      'ps1': 'powershell',
      'sql': 'sql',
      'html': 'html',
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
      'cfg': 'ini',
      'conf': 'ini',
      'md': 'markdown',
      'markdown': 'markdown',
      'tex': 'latex',
      'r': 'r',
      'mat': 'matlab',
      'm': 'matlab',
      'pl': 'perl',
      'pm': 'perl',
      'lua': 'lua',
      'vim': 'vim',
      'dockerfile': 'dockerfile',
      'makefile': 'makefile',
      'cmake': 'cmake'
    };
    
    return languageMap[extension || ''] || 'text';
  }, []);

  // Copy content to clipboard
  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Download file content
  const downloadFile = useCallback(() => {
    if (!diffData) return;
    
    const blob = new Blob([diffData.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diffData.file_path.split('/').pop()}_${diffData.sha.substring(0, 8)}.${diffData.view_type === 'diff' ? 'diff' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: `File saved as ${a.download}`,
    });
  }, [diffData, toast]);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-lg text-gray-300">Loading commit content...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full border-red-500/50", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="text-red-400 text-lg">⚠️ Error Loading Content</div>
            <div className="text-sm text-gray-400 text-center max-w-md">
              {error}
            </div>
            <Button 
              variant="outline" 
              onClick={() => fetchDiffData(commitSha, filePath, viewType)}
              className="mt-4 border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!diffData || !commitSha || !filePath) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <FileText className="w-12 h-12 text-gray-500" />
            <div className="text-lg text-gray-400">Select a commit to view content</div>
            <div className="text-sm text-gray-500 text-center max-w-md">
              Use the timeline above to navigate through commits and see the file content at different points in time.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const language = getLanguage(diffData.file_path);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <GitCommit className="w-5 h-5" />
            <span>File at Commit</span>
            {diffData.file_changed && (
              <Badge variant={diffData.change_type === 'added' ? 'default' : 
                           diffData.change_type === 'deleted' ? 'destructive' : 'secondary'}>
                {diffData.change_type}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {/* View Type Toggle */}
            <div className="flex bg-gray-800/80 rounded-lg p-1">
              <button
                onClick={() => handleViewTypeChange('content')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewType === 'content'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Eye className="w-4 h-4" />
                File Content
              </button>
              <button
                onClick={() => handleViewTypeChange('diff')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewType === 'diff'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Diff className="w-4 h-4" />
                Changes
              </button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(diffData.content)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadFile}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>{diffData.file_path}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Hash className="w-4 h-4" />
              <code className="bg-gray-800/80 text-gray-200 px-2 py-1 rounded text-xs font-mono">
                {diffData.sha.substring(0, 8)}
              </code>
            </span>
          </div>
          
          {diffData.is_truncated && (
            <Badge variant="secondary" className="bg-amber-900/50 text-amber-200 border-amber-700">
              Truncated ({(diffData.original_length / 1024).toFixed(1)}KB → 100KB)
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/80">
            <TabsTrigger 
              value="content" 
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              {viewType === 'content' ? 'File Content' : 'Diff Changes'}
            </TabsTrigger>
            <TabsTrigger 
              value="metadata"
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Commit Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${diffData.sha}-${diffData.view_type}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border border-gray-700/50 overflow-hidden bg-gray-900/50"
              >
                <div className="bg-gray-800/80 px-4 py-2 border-b border-gray-700/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {language}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      {diffData.content.split('\n').length.toLocaleString()} lines
                    </span>
                    {diffData.view_type === 'content' && (
                      <span className="text-xs text-green-400">
                        📄 File at commit {diffData.sha.substring(0, 8)}
                      </span>
                    )}
                    {diffData.view_type === 'diff' && (
                      <span className="text-xs text-orange-400">
                        🔄 Changes in commit {diffData.sha.substring(0, 8)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(diffData.content.length / 1024 * 100) / 100} KB
                  </div>
                </div>
                
                <div className="overflow-auto max-h-[600px] bg-gray-950">
                  <SyntaxHighlighter
                    language={diffData.view_type === 'diff' ? 'diff' : language}
                    style={{
                      ...oneDark,
                      'pre[class*="language-"]': {
                        ...oneDark['pre[class*="language-"]'],
                        background: 'transparent',
                        margin: 0,
                        padding: '1rem',
                      },
                      // Improved diff colors
                      '.token.inserted': {
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        color: '#86efac',
                        display: 'block'
                      },
                      '.token.deleted': {
                        backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                        color: '#fca5a5',
                        display: 'block'
                      },
                      '.token.prefix.inserted': {
                        color: '#22c55e',
                        fontWeight: 'bold'
                      },
                      '.token.prefix.deleted': {
                        color: '#ef4444',
                        fontWeight: 'bold'
                      }
                    }}
                    showLineNumbers
                    lineNumberStyle={{ 
                      minWidth: '3em', 
                      paddingRight: '1em',
                      color: '#6b7280',
                      borderRight: '1px solid #374151',
                      marginRight: '1em',
                      backgroundColor: 'transparent'
                    }}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace"
                    }}
                    wrapLines
                    wrapLongLines
                  >
                    {diffData.content || '// File is empty or could not be loaded'}
                  </SyntaxHighlighter>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Commit Info */}
              <Card className="bg-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-200">Commit Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">SHA</span>
                      </div>
                      <code className="text-sm bg-gray-800/80 text-gray-200 p-2 rounded block font-mono">
                        {diffData.commit.sha}
                      </code>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">Author</span>
                      </div>
                      <div className="text-sm text-gray-200">{diffData.commit.author}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">Date</span>
                      </div>
                      <div className="text-sm text-gray-200">{new Date(diffData.commit.date).toLocaleString()}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <GitCommit className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">Changes</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <span className="text-green-400 font-medium">+{diffData.commit.insertions}</span>
                        <span className="text-red-400 font-medium">-{diffData.commit.deletions}</span>
                        {diffData.commit.is_merge && (
                          <Badge variant="secondary" className="bg-purple-900/50 text-purple-200 border-purple-700">
                            Merge
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {diffData.commit.pr_number && (
                    <div className="pt-4 border-t border-gray-700">
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View PR #{diffData.commit.pr_number}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Commit Message */}
              <Card className="bg-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-200">Commit Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="font-medium text-gray-200 leading-relaxed">{diffData.commit.message}</div>
                    {diffData.commit.body && (
                      <div className="text-sm text-gray-400 whitespace-pre-wrap border-l-2 border-blue-500/50 pl-4 bg-gray-800/30 p-3 rounded-r">
                        {diffData.commit.body}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* File Change Summary */}
              <Card className="bg-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-200">File Change Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">View Type</span>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {diffData.view_type === 'content' ? 'File Content at Commit' : 'Changes in Commit'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">File Status</span>
                      <Badge variant={diffData.file_changed ? 'default' : 'secondary'}>
                        {diffData.file_changed ? `${diffData.change_type} in commit` : 'Unchanged in commit'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Content Type</span>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {diffData.content_type === 'file_content' ? 'Full File' : 'Diff Only'}
                      </Badge>
                    </div>
                    
                    {diffData.is_truncated && (
                      <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <Hash className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-amber-200 mb-1">
                              Content Truncated
                            </div>
                            <div className="text-amber-300">
                              Original size: {(diffData.original_length / 1024).toFixed(1)}KB, truncated to 100KB for performance.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CommitDiffViewer; 