import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Clock, 
  FileSearch, 
  ExternalLink,
  ChevronDown,
  ChevronUp
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

  const handleCommitSelect = useCallback((commit: TimelineCommit) => {
    setSelectedCommit(commit);
  }, []);

  const handleCreateIssue = useCallback((commit: TimelineCommit) => {
    setSelectedCommit(commit);
    setIsCreateIssueOpen(true);
  }, []);

  const handleIssueCreated = useCallback((issueUrl: string) => {
    toast({
      title: "Issue Created",
      description: "Your investigation has been documented.",
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

  if (!filePath) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-500 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Timeline Investigation</h3>
              <p className="text-gray-400">
                Select a file to explore its timeline and investigate changes over time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Timeline Section */}
      <div className="space-y-3">
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
      {selectedCommit && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSearch className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Changes</h2>
              <code className="text-sm bg-gray-800 px-2 py-1 rounded">
                {selectedCommit.sha.substring(0, 8)}
              </code>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDiffCollapsed(!isDiffCollapsed)}
            >
              {isDiffCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>

          {!isDiffCollapsed && (
            <OptimizedCommitDiffViewer
              sessionId={sessionId}
              commitSha={selectedCommit.sha}
              filePath={filePath}
              onError={(error) => {
                toast({
                  title: "Error loading diff",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
          )}
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