import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  GitCommit, 
  User, 
  Calendar, 
  ExternalLink, 
  FileText, 
  Bug,
  Zap,
  ArrowLeft,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineCommit {
  sha: string;
  ts: string;
  loc_added: number;
  loc_removed: number;
  pr_number?: number;
  author: string;
  message: string;
  change_type: 'added' | 'modified' | 'deleted';
  churn?: number;
}

export interface TimelineData {
  file_path: string;
  timeline: TimelineCommit[];
  total_commits: number;
}

interface TimelineScrubberProps {
  filePath: string;
  sessionId: string;
  onCommitSelect?: (commit: TimelineCommit) => void;
  onCreateIssue?: (commit: TimelineCommit) => void;
  className?: string;
}

// 🚀 PERFORMANCE: Global cache with LRU eviction
class TimelineCache {
  private cache = new Map<string, { data: TimelineData; timestamp: number }>();
  private maxSize = 50; // Keep 50 file timelines cached
  private maxAge = 5 * 60 * 1000; // 5 minutes

  get(key: string): TimelineData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: TimelineData): void {
    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

const timelineCache = new TimelineCache();

const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  filePath,
  sessionId,
  onCommitSelect,
  onCreateIssue,
  className
}) => {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [selectedCommitIndex, setSelectedCommitIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackData, setIsFallbackData] = useState(false);
  
  // 🚀 PERFORMANCE: Throttled commit selection
  const throttleTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCommitSelectTime = useRef<number>(0);

  // 🚀 PERFORMANCE: Memoized cache key
  const cacheKey = useMemo(() => `${sessionId}:${filePath}`, [sessionId, filePath]);

  // 🚀 PERFORMANCE: Optimized timeline fetching with caching
  const fetchTimelineData = useCallback(async () => {
    if (!filePath || !sessionId) return;
    
    // Check cache first - this should be instant
    const cachedData = timelineCache.get(cacheKey);
    if (cachedData) {
      console.log('🚀 Timeline cache hit - instant load');
      setTimelineData(cachedData);
      setIsFallbackData(cachedData.timeline.length > 0 && (cachedData.timeline[0].loc_added || 0) > 1000);
      
      if (cachedData.timeline.length > 0) {
        setSelectedCommitIndex(0);
        onCommitSelect?.(cachedData.timeline[0]);
      }
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const startTime = performance.now();
    
    try {
      // 🚀 PERFORMANCE: Reduced limit for faster initial load, pagination later
      const response = await fetch(
        `http://localhost:8000/api/timeline/file?session_id=${encodeURIComponent(sessionId)}&file_path=${encodeURIComponent(filePath)}&limit=10`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch timeline: ${response.status}`);
      }
      
      const data: TimelineData = await response.json();
      
      // Cache the response
      timelineCache.set(cacheKey, data);
      
      setTimelineData(data);
      setIsFallbackData(data.timeline.length > 0 && (data.timeline[0].loc_added || 0) > 1000);
      
      if (data.timeline.length > 0) {
        setSelectedCommitIndex(0);
        onCommitSelect?.(data.timeline[0]);
      }
      
      const loadTime = performance.now() - startTime;
      console.log(`🚀 Timeline loaded in ${Math.round(loadTime)}ms`);
      
    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  }, [filePath, sessionId, onCommitSelect, cacheKey]);

  // 🚀 PERFORMANCE: Throttled commit selection to prevent rapid API calls
  const handleCommitSelection = useCallback((newIndex: number) => {
    const now = Date.now();
    const timeSinceLastSelect = now - lastCommitSelectTime.current;
    
    // Update UI immediately for responsiveness
    setSelectedCommitIndex(newIndex);
    
    // Throttle the callback to prevent API spam
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    const commit = timelineData?.timeline[newIndex];
    if (!commit) return;
    
    // If it's been less than 100ms since last selection, throttle
    const delay = timeSinceLastSelect < 100 ? 100 : 0;
    
    throttleTimeoutRef.current = setTimeout(() => {
      lastCommitSelectTime.current = Date.now();
      onCommitSelect?.(commit);
    }, delay);
  }, [timelineData, onCommitSelect]);

  // 🚀 PERFORMANCE: Virtual navigation with keyboard support
  const navigateTimeline = useCallback((direction: 'prev' | 'next') => {
    if (!timelineData) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = Math.max(0, selectedCommitIndex - 1);
    } else {
      newIndex = Math.min(timelineData.timeline.length - 1, selectedCommitIndex + 1);
    }
    
    if (newIndex !== selectedCommitIndex) {
      handleCommitSelection(newIndex);
    }
  }, [timelineData, selectedCommitIndex, handleCommitSelection]);

  // 🚀 PERFORMANCE: Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!timelineData) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateTimeline('prev');
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateTimeline('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigateTimeline, timelineData]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  // Cleanup throttle on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  // 🚀 PERFORMANCE: Memoized rendered timeline to prevent re-renders
  const renderedTimeline = useMemo(() => {
    if (!timelineData || timelineData.timeline.length === 0) return null;

    const timeline = timelineData.timeline;
    const totalCommits = timeline.length;
    
    return (
      <div className="space-y-3">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Commit {selectedCommitIndex + 1} of {totalCommits}</span>
          <span className="flex items-center gap-2">
            <Zap className="w-3 h-3" />
            Optimized for speed
          </span>
        </div>
        
        {/* Visual timeline bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200 ease-out"
            style={{ 
              width: `${((selectedCommitIndex + 1) / totalCommits) * 100}%` 
            }}
          />
          <div 
            className="absolute top-0 w-3 h-full bg-white rounded-full shadow-md transition-all duration-200 ease-out"
            style={{ 
              left: `calc(${(selectedCommitIndex / Math.max(totalCommits - 1, 1)) * 100}% - 6px)` 
            }}
          />
        </div>
        
        {/* Quick commit info */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm">{timeline[selectedCommitIndex].sha.substring(0, 8)}</span>
            <Badge variant={timeline[selectedCommitIndex].change_type === 'added' ? 'default' : 'secondary'}>
              {timeline[selectedCommitIndex].change_type}
            </Badge>
          </div>
          <p className="text-sm line-clamp-2">{timeline[selectedCommitIndex].message}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{timeline[selectedCommitIndex].author}</span>
            <span>+{timeline[selectedCommitIndex].loc_added} -{timeline[selectedCommitIndex].loc_removed}</span>
          </div>
        </div>
      </div>
    );
  }, [timelineData, selectedCommitIndex]);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Loading optimized timeline...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full border-red-200", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️ Timeline Error</div>
              <div className="text-sm text-muted-foreground">{error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTimelineData}
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timelineData || timelineData.timeline.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">No timeline data available</div>
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
          <CardTitle className="text-lg flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Timeline</span>
            <Badge variant="secondary">{timelineData.total_commits} commits</Badge>
            <Badge variant="outline" className="text-green-500">Fast</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTimeline('prev')}
              disabled={selectedCommitIndex === 0}
              title="Previous commit (←)"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTimeline('next')}
              disabled={selectedCommitIndex === timelineData.timeline.length - 1}
              title="Next commit (→)"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {filePath} • Use ← → keys to navigate
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Fallback Data Notice */}
        {isFallbackData && (
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-amber-200 mb-1">
                  Showing Recent Repository Activity
                </div>
                <div className="text-amber-300/80">
                  File-specific timeline not available. Displaying recent commits that may have affected this file.
                </div>
              </div>
            </div>
          </div>
        )}

        {renderedTimeline}
      </CardContent>
    </Card>
  );
};

export default TimelineScrubber; 