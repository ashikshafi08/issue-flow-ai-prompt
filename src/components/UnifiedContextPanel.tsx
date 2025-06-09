import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  File, 
  GitCommit,
  Clock,
  User,
  Hash,
  TrendingUp,
  Activity,
  ArrowRight,
  Zap,
  X,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  FileText,
  Plus,
  Minus
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import CodebaseTree from './CodebaseTree';

interface CommitInfo {
  sha: string;
  subject: string;
  author_name: string;
  author_email: string;
  commit_date: string;
  files_changed: string[];
  insertions: number;
  deletions: number;
  is_merge: boolean;
  pr_number?: number;
}

interface UnifiedContextPanelProps {
  sessionId: string;
  currentContext?: {
    discussingFiles?: string[];
    relatedIssues?: number[];
    activeThread?: string;
  };
  onFileSelect: (filePath: string) => void;
  onIssueSelect: (issue: any) => void;
  onPRSelect: (pr: any) => void;
  repoUrl?: string;
}

const UnifiedContextPanel: React.FC<UnifiedContextPanelProps> = ({
  sessionId,
  currentContext,
  onFileSelect,
  repoUrl
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'commits'>('files');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [commitsError, setCommitsError] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<CommitInfo | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch commits with better error handling and more comprehensive data
  const fetchCommits = async () => {
    try {
      setCommitsLoading(true);
      setCommitsError(null);
      
      console.log(`UnifiedContextPanel: Fetching commits for session ${sessionId}`);
      
      // Try to get more commits and handle different response formats
      const response = await fetch(`${API_BASE_URL}/api/commits?session_id=${sessionId}&limit=100`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle different response formats
      let commitsData = [];
      if (data.commits) {
        commitsData = data.commits;
      } else if (Array.isArray(data)) {
        commitsData = data;
      } else {
        console.warn('Unexpected commits response format:', data);
        commitsData = [];
      }
      
      console.log(`UnifiedContextPanel: Fetched ${commitsData.length} commits for session ${sessionId}`);
      
      if (commitsData.length === 0) {
        console.warn('UnifiedContextPanel: No commits returned, repository may not be properly indexed');
        setCommitsError('No commits found. Repository may still be indexing.');
      } else if (commitsData.length < 5) {
        console.warn(`UnifiedContextPanel: Suspiciously low commit count (${commitsData.length}) for session ${sessionId}`);
      }
      
      setCommits(commitsData);
      
    } catch (error) {
      console.error('Error fetching commits:', error);
      setCommitsError(error instanceof Error ? error.message : 'Failed to load commits');
      setCommits([]);
    } finally {
      setCommitsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId && activeTab === 'commits') {
      fetchCommits();
    }
  }, [sessionId, activeTab]);

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));

      if (days > 7) return date.toLocaleDateString();
      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    } catch {
      return 'Unknown';
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'sha') {
        setCopiedSha(text);
        setTimeout(() => setCopiedSha(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getFileChangeIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) return '🟨';
    if (['py'].includes(ext || '')) return '🐍';
    if (['java'].includes(ext || '')) return '☕';
    if (['css', 'scss'].includes(ext || '')) return '🎨';
    if (['html'].includes(ext || '')) return '🌐';
    if (['md'].includes(ext || '')) return '📝';
    if (['json', 'yaml', 'yml'].includes(ext || '')) return '📋';
    return '📄';
  };

  const renderCommitDetail = () => {
    if (!selectedCommit) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedCommit(null);
          }
        }}
      >
        <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                <GitCommit className="w-5 h-5 text-blue-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-semibold text-white/95 leading-tight mb-2">
                  {selectedCommit.subject}
                </h3>
                
                <div className="flex items-center gap-4 text-[12px] text-white/60">
                  <span className="font-medium">{selectedCommit.author_name}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(selectedCommit.commit_date)}</span>
                  <span>•</span>
                  <button
                    onClick={() => copyToClipboard(selectedCommit.sha, 'sha')}
                    className="font-mono hover:text-white/80 transition-colors flex items-center gap-1"
                  >
                    {selectedCommit.sha.slice(0, 7)}
                    {copiedSha === selectedCommit.sha ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedCommit(null)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Plus className="w-3.5 h-3.5" />
                      {selectedCommit.insertions} additions
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="flex items-center gap-1.5 text-red-400">
                      <Minus className="w-3.5 h-3.5" />
                      {selectedCommit.deletions} deletions
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[13px] text-white/60">
                    <FileText className="w-3.5 h-3.5" />
                    {selectedCommit.files_changed?.length || 0} file{(selectedCommit.files_changed?.length || 0) !== 1 ? 's' : ''} changed
                  </div>

                  {selectedCommit.is_merge && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-500/15 text-purple-300 rounded-lg text-[12px] font-medium">
                      <ArrowRight className="w-3 h-3" />
                      Merge commit
                    </span>
                  )}

                  {selectedCommit.pr_number && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/15 text-blue-300 rounded-lg text-[12px] font-medium">
                      #{selectedCommit.pr_number}
                    </span>
                  )}
                </div>

                {/* Files Changed */}
                {selectedCommit.files_changed && selectedCommit.files_changed.length > 0 && (
                  <div>
                    <h4 className="text-[14px] font-semibold text-white/90 mb-3">Files changed</h4>
                    <div className="space-y-1">
                      {selectedCommit.files_changed.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 hover:bg-white/[0.03] rounded-lg cursor-pointer transition-all duration-200 group"
                          onClick={() => {
                            onFileSelect(file);
                            setSelectedCommit(null);
                          }}
                        >
                          <span className="text-sm">{getFileChangeIcon(file)}</span>
                          <span className="text-[13px] text-white/80 group-hover:text-white transition-colors flex-1 font-mono">
                            {file}
                          </span>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => copyToClipboard(selectedCommit.sha, 'sha')}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[12px] text-white/70 hover:text-white/90 transition-colors"
                  >
                    {copiedSha === selectedCommit.sha ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy SHA
                      </>
                    )}
                  </button>
                  
                  {repoUrl && (
                    <button
                      onClick={() => {
                        const url = `${repoUrl}/commit/${selectedCommit.sha}`;
                        window.open(url, '_blank');
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[12px] text-white/70 hover:text-white/90 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View on GitHub
                    </button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  };

  const renderCommitItem = (commit: CommitInfo) => (
    <div 
      key={commit.sha} 
      className="group p-4 hover:bg-white/[0.02] transition-all duration-200 border-b border-white/[0.06] last:border-b-0 cursor-pointer"
      onClick={() => setSelectedCommit(commit)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <GitCommit className="w-3.5 h-3.5 text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Commit message */}
          <p className="text-[13px] font-medium text-white/90 leading-tight mb-1.5 group-hover:text-white transition-colors">
            {commit.subject}
          </p>
          
          {/* Metadata */}
          <div className="flex items-center gap-3 text-[11px] text-white/50 mb-2">
            <span className="font-medium">{commit.author_name}</span>
            <span>•</span>
            <span>{formatTimeAgo(commit.commit_date)}</span>
            <span>•</span>
            <span className="font-mono">{commit.sha.slice(0, 7)}</span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                +{commit.insertions}
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-1 h-1 rounded-full bg-red-400"></span>
                -{commit.deletions}
              </span>
            </div>
            
            <span className="text-[11px] text-white/40">
              {commit.files_changed?.length || 0} file{(commit.files_changed?.length || 0) !== 1 ? 's' : ''}
            </span>
            
            {commit.is_merge && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[10px] font-medium">
                <ArrowRight className="w-2.5 h-2.5" />
                merge
              </span>
            )}
            
            {commit.pr_number && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded text-[10px] font-medium">
                #{commit.pr_number}
              </span>
            )}
          </div>
        </div>
        
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0 mt-1" />
      </div>
    </div>
  );

  const renderCommits = () => {
    if (commitsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mb-3"></div>
          <p className="text-[13px] text-white/50">Loading commits...</p>
        </div>
      );
    }

    if (commitsError) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-[13px] text-white/70 mb-1">Failed to load commits</p>
          <p className="text-[11px] text-white/40 text-center max-w-[200px]">{commitsError}</p>
          <button 
            onClick={fetchCommits}
            className="mt-3 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-white/70 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (commits.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <GitCommit className="w-5 h-5 text-white/30" />
          </div>
          <p className="text-[13px] text-white/50">No commits found</p>
          <p className="text-[11px] text-white/30 mt-1">Commit history will appear here</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-full">
        <div className="divide-y divide-white/[0.06]">
          {commits.map(commit => renderCommitItem(commit))}
        </div>
      </ScrollArea>
    );
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'files':
        return (
          <div className="h-full">
            <CodebaseTree 
              sessionId={sessionId} 
              onFileSelect={(filePath) => {
                onFileSelect(filePath);
                setSelectedFilePath(filePath);
              }}
            />
          </div>
        );
      case 'commits':
        return renderCommits();
      default:
        return null;
    }
  };

  return (
    <>
      <div className="w-80 bg-black/40 backdrop-blur-xl border-l border-white/[0.08] flex flex-col h-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <h2 className="text-[15px] font-semibold text-white/90 mb-4">Context</h2>
          
          {/* Tab Navigation */}
          <div className="flex p-0.5 bg-white/[0.04] rounded-lg">
                          {[
                { key: 'files' as const, label: 'Files', icon: File },
                { key: 'commits' as const, label: 'Commits', icon: GitCommit },
              ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-md text-[12px] font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/[0.06]'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {getTabContent()}
        </div>
      </div>

      {/* Commit Detail Modal */}
      {renderCommitDetail()}
    </>
  );
};

export default UnifiedContextPanel; 