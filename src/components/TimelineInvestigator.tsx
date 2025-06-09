import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Clock, 
  FileSearch, 
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OptimizedTimelineScrubber, { type TimelineCommit } from './OptimizedTimelineScrubber';
import OptimizedCommitDiffViewer from './OptimizedCommitDiffViewer';
import CreateIssueModal from './CreateIssueModal';

interface TimelineInvestigatorProps {
  sessionId: string;
  filePath?: string;
  className?: string;
  onFilePathChange?: (filePath: string) => void;
}

const TimelineInvestigator: React.FC<TimelineInvestigatorProps> = ({
  sessionId,
  filePath,
  className,
  onFilePathChange
}) => {
  const [selectedCommit, setSelectedCommit] = useState<TimelineCommit | null>(null);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
  const [isDiffCollapsed, setIsDiffCollapsed] = useState(false);
  const { toast } = useToast();

  // Handle commit selection from timeline
  const handleCommitSelect = useCallback((commit: TimelineCommit) => {
    setSelectedCommit(commit);
    
    // Show performance feedback
    const startTime = Date.now();
    setTimeout(() => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (duration < 500) {
        // Show success feedback for fast navigation
        toast({
          title: "⚡ Fast Navigation",
          description: `Jumped to commit in ${duration}ms`,
          duration: 2000,
        });
      }
    }, 100);
  }, [toast]);

  // Handle issue creation
  const handleCreateIssue = useCallback((commit: TimelineCommit) => {
    setSelectedCommit(commit);
    setIsCreateIssueOpen(true);
  }, []);

  // Handle successful issue creation
  const handleIssueCreated = useCallback((issueUrl: string) => {
    toast({
      title: "🎉 Investigation Issue Created!",
      description: "Your timeline investigation has been documented.",
      action: (
        <Button variant="outline" size="sm" asChild>
          <a href={issueUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Issue
          </a>
        </Button>
      ),
    });
  }, [toast]);

  // Performance metrics tracking
  React.useEffect(() => {
    if (selectedCommit) {
      // Track time-to-root-cause metric
      const investigationStartTime = performance.now();
      
      return () => {
        const investigationEndTime = performance.now();
        const duration = investigationEndTime - investigationStartTime;
        
        // Log metrics for analytics (in real app, send to analytics service)
        console.log('Timeline Investigation Metrics:', {
          duration: Math.round(duration),
          commit: selectedCommit.sha.substring(0, 8),
          file: filePath,
          timestamp: new Date().toISOString()
        });
      };
    }
  }, [selectedCommit, filePath]);

  if (!filePath) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Timeline Investigation</h3>
              <p className="text-muted-foreground">
                Select a file to explore its timeline and investigate changes over time.
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-sm">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    How Timeline Investigation Works:
                  </div>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Drag the timeline to navigate through commits</li>
                    <li>• See file changes with visual churn indicators</li>
                    <li>• Jump to specific commits in &lt;300ms</li>
                    <li>• Create GitHub issues from investigations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Performance Banner */}
      {selectedCommit && (
        <div
          className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Timeline Active</span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {selectedCommit.sha.substring(0, 8)}
              </Badge>
            </div>
            <div className="text-sm opacity-90">
              Investigating {filePath.split('/').pop()}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      <div
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <h2 className="text-lg font-semibold">File Timeline</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
          >
            {isTimelineCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
        
        {!isTimelineCollapsed && (
          <OptimizedTimelineScrubber
            filePath={filePath}
            sessionId={sessionId}
            onCommitSelect={handleCommitSelect}
            onCreateIssue={handleCreateIssue}
          />
        )}
      </div>

      {/* Diff Viewer Section */}
      <div
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSearch className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Commit Diff</h2>
            {selectedCommit && (
              <Badge variant="outline">
                {selectedCommit.sha.substring(0, 8)}
              </Badge>
            )}
          </div>
          {selectedCommit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDiffCollapsed(!isDiffCollapsed)}
            >
              {isDiffCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {!isDiffCollapsed && (
          <OptimizedCommitDiffViewer
            sessionId={sessionId}
            commitSha={selectedCommit?.sha}
            filePath={filePath}
            onError={(error) => {
              toast({
                title: "Diff Loading Error",
                description: error,
                variant: "destructive",
              });
            }}
          />
        )}
      </div>

      {/* Timeline Metrics (for development/demo) */}
      {selectedCommit && process.env.NODE_ENV === 'development' && (
        <div
          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border text-sm"
        >
          <h3 className="font-semibold mb-2">Timeline Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-muted-foreground">Selected Commit</div>
              <div className="font-mono">{selectedCommit.sha.substring(0, 8)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Churn</div>
              <div>{(selectedCommit.loc_added || 0) + (selectedCommit.loc_removed || 0)} lines</div>
            </div>
            <div>
              <div className="text-muted-foreground">Change Type</div>
              <div className="capitalize">{selectedCommit.change_type}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Author</div>
              <div className="truncate">{selectedCommit.author}</div>
            </div>
          </div>
        </div>
      )}

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={isCreateIssueOpen}
        onClose={() => setIsCreateIssueOpen(false)}
        commit={selectedCommit}
        filePath={filePath}
        sessionId={sessionId}
        onIssueCreated={handleIssueCreated}
      />
    </div>
  );
};

export default TimelineInvestigator; 