import React, { useState, useEffect } from 'react';
import { X, GitCommit, User, Calendar, Hash, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface FileHistoryViewerProps {
  filePath: string;
  sessionId: string;
  onClose: () => void;
}

interface CommitInfo {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url?: string;
  stats?: {
    additions: number;
    deletions: number;
    changes: number;
  };
}

const FileHistoryViewer: React.FC<FileHistoryViewerProps> = ({ filePath, sessionId, onClose }) => {
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the existing commits API - it doesn't support file_path filtering yet
        // So we'll get all commits and filter client-side for now
        const response = await fetch(`http://localhost:8000/api/commits?session_id=${sessionId}&limit=100`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch commits: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Ensure data is an array
        const commitsArray = Array.isArray(data) ? data : [];
        
        // For now, show all commits since we can't filter by file path on the backend
        // In a real implementation, you'd want to add file path filtering to the backend
        setCommits(commitsArray);
      } catch (err) {
        console.error('Error fetching file history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load file history');
      } finally {
        setLoading(false);
      }
    };

    fetchFileHistory();
  }, [filePath, sessionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">File History</h2>
            <p className="text-sm text-slate-400 font-mono">{filePath}</p>
            <p className="text-xs text-slate-500 mt-1">
              Note: Currently showing all repository commits. File-specific filtering will be added in a future update.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-3" />
                <p className="text-slate-400">Loading file history...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-400 mb-3 text-2xl">⚠️</div>
                <p className="text-slate-400">{error}</p>
              </div>
            </div>
          ) : commits.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <GitCommit className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No commit history found for this file</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(90vh-80px)]">
              <div className="p-4 space-y-4">
                {commits.map((commit, index) => (
                  <div key={commit.sha} className="flex gap-4 p-4 border border-slate-600 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {getInitials(commit.author.name)}
                      </div>
                    </div>

                    {/* Commit Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-100 font-medium mb-1 leading-tight">
                            {commit.message.split('\n')[0]}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {commit.author.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(commit.author.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {commit.sha.slice(0, 7)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {commit.stats && (
                            <div className="flex items-center gap-2 text-xs">
                              {commit.stats.additions > 0 && (
                                <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-600">
                                  +{commit.stats.additions}
                                </Badge>
                              )}
                              {commit.stats.deletions > 0 && (
                                <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-600">
                                  -{commit.stats.deletions}
                                </Badge>
                              )}
                            </div>
                          )}
                          {commit.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(commit.url, '_blank')}
                              className="text-slate-400 hover:text-slate-200 h-8 px-2"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Extended commit message */}
                      {commit.message.includes('\n') && (
                        <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-slate-300 font-mono">
                          {commit.message.split('\n').slice(1).join('\n').trim()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileHistoryViewer; 