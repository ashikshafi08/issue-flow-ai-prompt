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

// Simple code display without HTML injection
const CodeDisplay = React.memo(({ 
  code, 
  language 
}: { 
  code: string; 
  language: string;
}) => {
  return (
    <pre className="text-sm overflow-auto p-4 bg-gray-900 dark:bg-gray-900 rounded-lg border border-gray-700">
      <code className="font-mono leading-relaxed text-gray-100">
        {code}
      </code>
    </pre>
  );
});

// Simple cache
class DiffCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize = 100;
  private maxAge = 10 * 60 * 1000;

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
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDiffData = useCallback(async (sha: string, path: string, type: 'content' | 'diff') => {
    const cacheKey = `${sessionId}:${sha}:${path}:${type}`;
    
    const cachedData = diffCache.get(cacheKey);
    if (cachedData) {
      setDiffData(cachedData);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/diff/${sha}/${encodeURIComponent(path)}?session_id=${sessionId}&view_type=${type}`,
        { 
          signal: abortControllerRef.current.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'public, max-age=300'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!abortControllerRef.current.signal.aborted) {
        diffCache.set(cacheKey, data);
        setDiffData(data);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content';
      
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

  useEffect(() => {
    if (!commitSha || !filePath) {
      setDiffData(null);
      setIsLoading(false);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      fetchDiffData(commitSha, filePath, viewType);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [commitSha, filePath, viewType, fetchDiffData]);

  const getLanguage = useCallback((path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'py': 'python', 'js': 'javascript', 'ts': 'typescript',
      'jsx': 'javascript', 'tsx': 'typescript', 'java': 'java',
      'go': 'go', 'rs': 'rust', 'cpp': 'cpp', 'c': 'c'
    };
    return langMap[ext || ''] || 'text';
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!diffData?.content) return;
    
    try {
      await navigator.clipboard.writeText(diffData.content);
      toast({ title: "Copied to clipboard" });
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
    
    toast({ title: "File downloaded" });
  }, [diffData, toast]);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-gray-400">Loading content...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full border-red-800", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <div className="text-red-400">Error loading content</div>
            <div className="text-sm text-gray-400 text-center">{error}</div>
            <Button 
              variant="outline" 
              onClick={() => fetchDiffData(commitSha!, filePath!, viewType)}
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
            <div className="text-center text-gray-400">
              <GitCommit className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm">Select a commit to view content</div>
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
            <GitCommit className="w-5 h-5" />
            <span className="font-medium">Commit Content</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'content' | 'diff')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">Content</span>
                </TabsTrigger>
                <TabsTrigger value="diff" className="flex items-center gap-2">
                  <Diff className="w-3 h-3" />
                  <span className="text-xs">Diff</span>
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

        <div className="space-y-2">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="font-mono text-sm">{diffData.file_path}</span>
            </div>
            
            <div className="text-xs text-gray-400">
              {getLanguage(diffData.file_path)} • {diffData.content.split('\n').length} lines
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-auto">
              <CodeDisplay
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