import React, { useState, useEffect } from 'react';
import { Brain, Clock, ExternalLink, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { getCachedAnalyses, deleteCachedAnalysis, type CachedAnalysesListResponse } from '@/lib/api';

interface AnalysisToolbarProps {
  sessionId: string;
  onAnalysisSelect: (issueUrl: string) => void;
  className?: string;
}

interface CachedAnalysisItem {
  issue_url: string;
  cached_at: number;
  status: string;
  issue_title?: string;
  issue_number?: number;
}

const AnalysisToolbar: React.FC<AnalysisToolbarProps> = ({
  sessionId,
  onAnalysisSelect,
  className = ""
}) => {
  const [cachedAnalyses, setCachedAnalyses] = useState<CachedAnalysisItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [repository, setRepository] = useState<string>('');
  const { toast } = useToast();

  const loadCachedAnalyses = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const response = await getCachedAnalyses(sessionId);
      setCachedAnalyses(response.cached_analyses);
      setRepository(response.repository);
    } catch (error) {
      console.error('Failed to load cached analyses:', error);
      // Don't show error toast for this as it's not critical
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCachedAnalyses();
  }, [sessionId]);

  const handleDeleteAnalysis = async (issueUrl: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await deleteCachedAnalysis(issueUrl);
      setCachedAnalyses(prev => prev.filter(analysis => analysis.issue_url !== issueUrl));
      toast({
        title: "Analysis deleted",
        description: "Cached analysis has been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cached analysis",
        variant: "destructive",
      });
    }
  };

  const extractIssueInfo = (issueUrl: string) => {
    const match = issueUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (match) {
      const [, owner, repo, number] = match;
      return {
        owner,
        repo,
        number: parseInt(number),
        shortUrl: `${owner}/${repo}#${number}`
      };
    }
    return null;
  };

  if (cachedAnalyses.length === 0) {
    return null; // Don't show toolbar if no cached analyses
  }

  return (
    <div className={`bg-gray-900/50 border-b border-gray-700/50 ${className}`}>
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">
                Cached Analyses
              </span>
              <Badge variant="secondary" className="text-xs">
                {cachedAnalyses.length}
              </Badge>
            </div>
            {repository && (
              <span className="text-xs text-gray-400">
                for {repository}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadCachedAnalyses}
              disabled={isLoading}
              className="text-gray-400 hover:text-white h-7 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white h-7 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3">
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {cachedAnalyses.map((analysis) => {
                  const issueInfo = extractIssueInfo(analysis.issue_url);
                  
                  return (
                    <div
                      key={analysis.issue_url}
                      className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => onAnalysisSelect(analysis.issue_url)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-blue-500/10 border border-blue-500/20 rounded flex items-center justify-center">
                            <span className="text-xs text-blue-400 font-medium">
                              {issueInfo?.number || '?'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium truncate">
                              {analysis.issue_title || issueInfo?.shortUrl || 'Unknown Issue'}
                            </span>
                            <Badge 
                              variant={analysis.status === 'completed' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {analysis.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-400">
                              {new Date(analysis.cached_at * 1000).toLocaleDateString()} at{' '}
                              {new Date(analysis.cached_at * 1000).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(analysis.issue_url, '_blank');
                          }}
                          className="text-gray-400 hover:text-white h-6 w-6 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteAnalysis(analysis.issue_url, e)}
                          className="text-gray-400 hover:text-red-400 h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisToolbar; 