import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  ArrowLeft,
  ArrowRight,
  FileText
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

// Simple cache
class TimelineCache {
  private cache = new Map<string, { data: TimelineData; timestamp: number }>();
  private maxSize = 50;
  private maxAge = 5 * 60 * 1000;

  get(key: string): TimelineData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: TimelineData): void {
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
  
  const throttleTimeoutRef = useRef<NodeJS.Timeout>();
  const cacheKey = useMemo(() => `${sessionId}:${filePath}`, [sessionId, filePath]);

  const fetchTimelineData = useCallback(async () => {
    if (!filePath || !sessionId) return;
    
    const cachedData = timelineCache.get(cacheKey);
    if (cachedData) {
      setTimelineData(cachedData);
      
      if (cachedData.timeline.length > 0) {
        setSelectedCommitIndex(0);
        onCommitSelect?.(cachedData.timeline[0]);
      }
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/timeline/file?session_id=${encodeURIComponent(sessionId)}&file_path=${encodeURIComponent(filePath)}&limit=10`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch timeline: ${response.status}`);
      }
      
      const data: TimelineData = await response.json();
      timelineCache.set(cacheKey, data);
      setTimelineData(data);
      
      if (data.timeline.length > 0) {
        setSelectedCommitIndex(0);
        onCommitSelect?.(data.timeline[0]);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  }, [filePath, sessionId, onCommitSelect, cacheKey]);

  const handleCommitSelection = useCallback((newIndex: number) => {
    setSelectedCommitIndex(newIndex);
    
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    const commit = timelineData?.timeline[newIndex];
    if (!commit) return;
    
    throttleTimeoutRef.current = setTimeout(() => {
      onCommitSelect?.(commit);
    }, 50);
  }, [timelineData, onCommitSelect]);

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

  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  const renderedTimeline = useMemo(() => {
    if (!timelineData || timelineData.timeline.length === 0) return null;

    const timeline = timelineData.timeline;
    const totalCommits = timeline.length;
    const currentCommit = timeline[selectedCommitIndex];
    const progressPercent = ((selectedCommitIndex + 1) / totalCommits) * 100;
    
    return (
      <div className="space-y-4">
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{selectedCommitIndex + 1} of {totalCommits}</span>
            <code className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">
              {currentCommit.sha.substring(0, 8)}
            </code>
          </div>
          
          <div>
            <p className="text-sm leading-relaxed text-gray-100">
              {currentCommit.message}
            </p>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>{currentCommit.author}</span>
              <span>
                <span className="text-green-400">+{currentCommit.loc_added}</span>
                {' '}
                <span className="text-red-400">-{currentCommit.loc_removed}</span>
              </span>
            </div>
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
            <div className="text-sm text-gray-400">Loading timeline...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full border-red-800", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-sm text-red-400 mb-2">{error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTimelineData}
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
            <div className="text-center text-gray-400">
              <FileText className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm">No timeline data available</div>
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
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTimeline('prev')}
              disabled={selectedCommitIndex === 0}
              title="Previous commit"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTimeline('next')}
              disabled={selectedCommitIndex === timelineData.timeline.length - 1}
              title="Next commit"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          {filePath}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderedTimeline}
      </CardContent>
    </Card>
  );
};

export default TimelineScrubber; 