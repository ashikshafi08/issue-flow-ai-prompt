import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Eye,
  Diff,
  Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Lightweight syntax highlighter (much faster than Prism)
const LightSyntaxHighlighter = React.memo(({ 
  code, 
  language 
}: { 
  code: string; 
  language: string;
}) => {
  const highlightedCode = useMemo(() => {
    // Simple regex-based highlighting for common languages
    if (language === 'python' || language === 'py') {
      return code
        .replace(/(def|class|import|from|if|else|elif|for|while|return|try|except)\b/g, '<span class="text-blue-400">$1</span>')
        .replace(/(#.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/(".*?"|'.*?')/g, '<span class="text-green-400">$1</span>');
    }
    
    if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
      return code
        .replace(/(function|const|let|var|if|else|for|while|return|class|import|export)\b/g, '<span class="text-blue-400">$1</span>')
        .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-green-400">$1</span>');
    }
    
    return code; // Fallback to plain text
  }, [code, language]);

  return (
    <pre className="text-sm overflow-auto p-4 bg-gray-950 rounded-lg">
      <code 
        className="font-mono leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </pre>
  );
});

// Ultra-fast diff cache
class DiffCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize = 100;
  private maxAge = 10 * 60 * 1000; // 10 minutes

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry || Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: any) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const diffCache = new DiffCache();

interface OptimizedCommitDiffViewerProps {
  sessionId: string;
  commitSha?: string;
  filePath?: string;
  className?: string;
  onError?: (error: string) => void;
}

const OptimizedCommitDiffViewer: React.FC<OptimizedCommitDiffViewerProps> = ({
  sessionId,
  commitSha,
  filePath,
  className,
  onError
}) => {
  const [diffData, setDiffData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'content' | 'diff'>('content');
  const { toast } = useToast();
  
  // Performance tracking
  const loadStartTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 🚀 PERFORMANCE: Ultra-fast data fetching with aggressive caching
  const fetchDiffData = useCallback(async (sha: string, path: string, type: 'content' | 'diff') => {
    const cacheKey = `${sessionId}:${sha}:${path}:${type}`;
    
    // Check cache first - should be instant
    const cachedData = diffCache.get(cacheKey);
    if (cachedData) {
      console.log('⚡ Diff cache hit - 0ms load time');
      setDiffData(cachedData);
      setIsLoading(false);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    loadStartTimeRef.current = performance.now();
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/diff/${sha}/${encodeURIComponent(path)}?session_id=${sessionId}&view_type=${type}`,
        { 
          signal: abortControllerRef.current.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'public, max-age=300' // 5 min browser cache
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!abortControllerRef.current.signal.aborted) {
        // Cache the result
        diffCache.set(cacheKey, data);
        
        setDiffData(data);
        
        const loadTime = performance.now() - loadStartTimeRef.current;
        console.log(`⚡ Diff loaded in ${Math.round(loadTime)}ms`);
        
        // Show performance feedback
        if (loadTime < 300) {
          toast({
            title: "⚡ Fast Load",
            description: `Content loaded in ${Math.round(loadTime)}ms`,
            duration: 1500,
          });
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content';
      console.error('Diff error:', err);
      
      if (!abortControllerRef.current.signal.aborted) {
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [sessionId, onError, toast]);

  // 🚀 PERFORMANCE: Debounced effect with shorter delay
  useEffect(() => {
    if (!commitSha || !filePath) {
      setDiffData(null);
      setIsLoading(false);
      return;
    }
    
    // Immediate UI update, then throttled API call
    const timeoutId = setTimeout(() => {
      fetchDiffData(commitSha, filePath, viewType);
    }, 100); // Reduced from 300ms to 100ms
    
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [commitSha, filePath, viewType, fetchDiffData]);

  // Get file language
  const getLanguage = useCallback((path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'py': 'python', 'js': 'javascript', 'ts': 'typescript',
      'jsx': 'javascript', 'tsx': 'typescript', 'java': 'java',
      'go': 'go', 'rs': 'rust', 'cpp': 'cpp', 'c': 'c'
    };
    return langMap[ext || ''] || 'text';
  }, []);

  // Quick actions
  const copyToClipboard = useCallback(async () => {
    if (!diffData?.content) return;
    
    try {
      await navigator.clipboard.writeText(diffData.content);
      toast({ title: "Copied!", description: "Content copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }, [diffData, toast]);

  const downloadFile = useCallback(() => {
    if (!diffData?.content) return;
    
    const blob = new Blob([diffData.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diffData.file_path.split('/').pop()}_${diffData.sha.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Downloaded!", description: "File downloaded" });
  }, [diffData, toast]);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-gray-300">Loading optimized content...</span>
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
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <div className="text-red-400">⚠️ Error Loading Content</div>
            <div className="text-sm text-gray-400 text-center">{error}</div>
            <Button 
              variant="outline" 
              onClick={() => fetchDiffData(commitSha!, filePath!, viewType)}
              className="border-red-500/50 text-red-400"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!diffData) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <GitCommit className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <div className="text-sm text-gray-400">Select a commit to view content</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <GitCommit className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Commit Content</span>
              <Badge variant="outline" className="text-green-500">Fast</Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'content' | 'diff')}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-800/80">
                <TabsTrigger 
                  value="content" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                >
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">File Content</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="diff" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                >
                  <Diff className="w-3 h-3" />
                  <span className="text-xs">Commit Diff</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={downloadFile}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Commit metadata */}
        <div className="space-y-2">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {diffData.sha.substring(0, 8)}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {diffData.commit?.author || 'Unknown'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {diffData.commit?.date ? new Date(diffData.commit.date).toLocaleDateString() : 'Unknown date'}
            </span>
          </div>
          
          <div className="text-sm text-gray-300">
            {diffData.commit?.message || 'No commit message'}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Content display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="font-mono text-sm">{diffData.file_path}</span>
              <Badge variant={diffData.change_type === 'added' ? 'default' : 'secondary'}>
                {diffData.change_type}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Zap className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500">Optimized</span>
            </div>
          </div>

          {/* Fast content display */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-800/50 px-4 py-2 border-b">
              <span className="text-xs text-gray-400">
                {getLanguage(diffData.file_path)} • {diffData.content.split('\n').length} lines
              </span>
            </div>
            
            <div className="max-h-96 overflow-auto">
              <LightSyntaxHighlighter
                code={diffData.content}
                language={getLanguage(diffData.file_path)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizedCommitDiffViewer; 