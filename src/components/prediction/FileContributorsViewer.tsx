import React, { useState, useEffect } from 'react';
import { X, User, GitCommit, Calendar, Mail, ExternalLink, Loader2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FileContributorsViewerProps {
  filePath: string;
  sessionId: string;
  onClose: () => void;
}

interface Contributor {
  name: string;
  email: string;
  commits: number;
  additions: number;
  deletions: number;
  percentage: number;
  first_commit: string;
  last_commit: string;
  avatar_url?: string;
}

const FileContributorsViewer: React.FC<FileContributorsViewerProps> = ({ filePath, sessionId, onClose }) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileContributors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all commits since we can't filter by file path on the backend yet
        const commitsResponse = await fetch(`http://localhost:8000/api/commits?session_id=${sessionId}&limit=200`);
        
        if (!commitsResponse.ok) {
          throw new Error(`Failed to fetch commits: ${commitsResponse.status} ${commitsResponse.statusText}`);
        }
        
        const data = await commitsResponse.json();
        const commits = Array.isArray(data) ? data : [];
        
        if (commits.length === 0) {
          setContributors([]);
          return;
        }
        
        // Process commits to get contributor statistics
        const contributorMap = new Map<string, Contributor>();
        
        commits.forEach((commit: any) => {
          if (!commit.author || !commit.author.name || !commit.author.email) {
            return; // Skip commits without proper author info
          }
          
          const key = `${commit.author.name}|${commit.author.email}`;
          const existing = contributorMap.get(key);
          
          if (existing) {
            existing.commits += 1;
            existing.additions += commit.stats?.additions || 0;
            existing.deletions += commit.stats?.deletions || 0;
            existing.last_commit = commit.author.date > existing.last_commit ? commit.author.date : existing.last_commit;
            existing.first_commit = commit.author.date < existing.first_commit ? commit.author.date : existing.first_commit;
          } else {
            contributorMap.set(key, {
              name: commit.author.name,
              email: commit.author.email,
              commits: 1,
              additions: commit.stats?.additions || 0,
              deletions: commit.stats?.deletions || 0,
              percentage: 0, // Will calculate after processing all
              first_commit: commit.author.date,
              last_commit: commit.author.date,
            });
          }
        });
        
        // Convert to array and calculate percentages
        const contributorList = Array.from(contributorMap.values());
        const totalCommits = contributorList.reduce((sum, c) => sum + c.commits, 0);
        
        contributorList.forEach(contributor => {
          contributor.percentage = totalCommits > 0 ? (contributor.commits / totalCommits) * 100 : 0;
        });
        
        // Sort by number of commits (descending)
        contributorList.sort((a, b) => b.commits - a.commits);
        
        setContributors(contributorList);
      } catch (err) {
        console.error('Error fetching file contributors:', err);
        setError(err instanceof Error ? err.message : 'Failed to load file contributors');
      } finally {
        setLoading(false);
      }
    };

    fetchFileContributors();
  }, [filePath, sessionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getContributionColor = (percentage: number) => {
    if (percentage >= 50) return 'from-red-500 to-red-600';
    if (percentage >= 25) return 'from-orange-500 to-orange-600';
    if (percentage >= 10) return 'from-yellow-500 to-yellow-600';
    return 'from-blue-500 to-blue-600';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">File Contributors</h2>
            <p className="text-sm text-slate-400 font-mono">{filePath}</p>
            <p className="text-xs text-slate-500 mt-1">
              Note: Currently showing all repository contributors. File-specific analysis will be added in a future update.
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
                <p className="text-slate-400">Loading contributors...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-400 mb-3 text-2xl">⚠️</div>
                <p className="text-slate-400">{error}</p>
              </div>
            </div>
          ) : contributors.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <User className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No contributors found for this file</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(90vh-80px)]">
              <div className="p-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-slate-100">{contributors.length}</div>
                    <p className="text-sm text-slate-400">Total Contributors</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-slate-100">
                      {contributors.reduce((sum, c) => sum + c.commits, 0)}
                    </div>
                    <p className="text-sm text-slate-400">Total Commits</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-slate-100">
                      {contributors.reduce((sum, c) => sum + c.additions + c.deletions, 0)}
                    </div>
                    <p className="text-sm text-slate-400">Total Changes</p>
                  </div>
                </div>

                {/* Contributors List */}
                <div className="space-y-4">
                  {contributors.map((contributor, index) => (
                    <div key={`${contributor.name}-${contributor.email}`} className="border border-slate-600 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 bg-gradient-to-br ${getContributionColor(contributor.percentage)} rounded-full flex items-center justify-center text-white font-medium`}>
                              {getInitials(contributor.name)}
                            </div>
                          </div>

                          {/* Contributor Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-slate-100 font-medium mb-1">
                                  {contributor.name}
                                  {index === 0 && (
                                    <Badge variant="outline" className="ml-2 bg-yellow-900/20 text-yellow-400 border-yellow-600">
                                      Primary
                                    </Badge>
                                  )}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {contributor.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <GitCommit className="h-3 w-3" />
                                    {contributor.commits} commits
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BarChart3 className="h-3 w-3" />
                                    {contributor.percentage.toFixed(1)}%
                                  </span>
                                </div>
                                
                                {/* Contribution Progress */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                    <span>Contribution</span>
                                    <span>{contributor.percentage.toFixed(1)}%</span>
                                  </div>
                                  <Progress 
                                    value={contributor.percentage} 
                                    className="h-2 bg-slate-700"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="bg-slate-900/50 rounded p-2 text-center">
                                <div className="text-green-400 font-medium">+{contributor.additions}</div>
                                <div className="text-slate-400">Additions</div>
                              </div>
                              <div className="bg-slate-900/50 rounded p-2 text-center">
                                <div className="text-red-400 font-medium">-{contributor.deletions}</div>
                                <div className="text-slate-400">Deletions</div>
                              </div>
                              <div className="bg-slate-900/50 rounded p-2 text-center">
                                <div className="text-slate-100 font-medium">{formatDate(contributor.first_commit)}</div>
                                <div className="text-slate-400">First Commit</div>
                              </div>
                              <div className="bg-slate-900/50 rounded p-2 text-center">
                                <div className="text-slate-100 font-medium">{formatDate(contributor.last_commit)}</div>
                                <div className="text-slate-400">Last Commit</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileContributorsViewer; 