import React, { useState, useEffect } from 'react';
import { X, GitBranch, MessageCircle, Tag, Clock, User, ExternalLink, ChevronRight, Filter, Bug, CheckCircle, Circle, GitMerge, FileDiff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { listPullRequests, PullRequestInfo } from '@/lib/api';

interface Issue {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  url: string;
  labels: string[];
  assignees: string[];
  comments: Array<{
    body: string;
    user: string;
    created_at: string;
  }>;
}

interface IssuesPaneProps {
  open: boolean;
  onClose: () => void;
  repoUrl: string;
  onAddIssueToContext?: (issue: Issue) => void;
  sessionId?: string;
}

const IssuesPane: React.FC<IssuesPaneProps> = ({ open, onClose, repoUrl, onAddIssueToContext, sessionId }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequestInfo[]>([]);
  const [selectedItem, setSelectedItem] = useState<Issue | PullRequestInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'all' | 'merged_prs'>('open');
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (open && repoUrl) {
      setShowDetail(false); // Reset detail view when pane opens or repoUrl changes
      setSelectedItem(null);
      if (activeTab === 'merged_prs') {
        fetchPullRequests();
      } else {
        fetchIssues();
      }
    }
  }, [open, repoUrl, activeTab]);

  const fetchIssues = async () => {
    if (!repoUrl) return;
    setLoading(true);
    setError(null);
    setPullRequests([]);
    try {
      const issueState = (activeTab === 'merged_prs' ? 'all' : activeTab) as 'open' | 'closed' | 'all';
      const response = await fetch(`http://localhost:8000/api/issues?repo_url=${encodeURIComponent(repoUrl)}&state=${issueState}`);
      if (!response.ok) throw new Error(`Failed to fetch issues: ${response.status}`);
      const data = await response.json();
      setIssues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPullRequests = async () => {
    if (!repoUrl) return;
    setLoading(true);
    setError(null);
    setIssues([]);
    try {
      const data = await listPullRequests(repoUrl, sessionId, "merged");
      setPullRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pull requests');
      console.error('Error fetching pull requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueDetail = async (issueNumber: number) => {
    if (!repoUrl) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/issues/${issueNumber}?repo_url=${encodeURIComponent(repoUrl)}`);
      if (!response.ok) throw new Error(`Failed to fetch issue detail: ${response.status}`);
      const data = await response.json();
      setSelectedItem(data);
      setShowDetail(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issue detail');
      console.error('Error fetching issue detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleItemSelect = (item: Issue | PullRequestInfo) => {
    if ('comments' in item) { // It's an Issue
      fetchIssueDetail(item.number);
    } else { // It's a PullRequestInfo
      setSelectedItem(item);
      setShowDetail(true);
    }
  };

  const getStateIcon = (state: string) => {
    return state === 'open' ? (
      <Circle className="h-4 w-4 text-green-500" />
    ) : (
      <CheckCircle className="h-4 w-4 text-purple-500" />
    );
  };

  const getLabelColor = (label: string) => {
    const colorMap: { [key: string]: string } = {
      'bug': 'bg-red-500/20 text-red-300 border-red-500/30',
      'enhancement': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'documentation': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    return colorMap[label.toLowerCase()] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  if (!open) return null;

  const renderItemList = () => (
    <div className="h-full overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="p-3 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={activeTab === 'merged_prs' ? fetchPullRequests : fetchIssues} className="mt-2 text-red-300 border-red-700/50 hover:bg-red-900/20">Retry</Button>
          </div>
        )}
        {!loading && !error && activeTab !== 'merged_prs' && issues.length === 0 && (
          <div className="text-center py-8 text-gray-400"><Bug className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No {activeTab} issues found</p></div>
        )}
        {!loading && !error && activeTab === 'merged_prs' && pullRequests.length === 0 && (
          <div className="text-center py-8 text-gray-400"><GitMerge className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No merged PRs found</p></div>
        )}

        {activeTab !== 'merged_prs' && issues.map((issue) => (
          <div key={`issue-${issue.number}`} onClick={() => handleItemSelect(issue)} className="p-3 rounded-lg border border-gray-700/30 hover:border-gray-600/50 hover:bg-gray-800/40 cursor-pointer transition-all duration-200 group">
            <div className="flex items-start gap-3">
              {getStateIcon(issue.state)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1"><h4 className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">{issue.title}</h4><ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors flex-shrink-0" /></div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2"><span>#{issue.number}</span><span>•</span><Clock className="h-3 w-3" /><span>{formatDate(issue.created_at)}</span>{issue.comments.length > 0 && (<><span>•</span><MessageCircle className="h-3 w-3" /><span>{issue.comments.length}</span></>)}</div>
                {issue.labels.length > 0 && (<div className="flex flex-wrap gap-1">{issue.labels.slice(0, 3).map((label) => (<span key={label} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${getLabelColor(label)}`}><Tag className="h-2 w-2 mr-1" />{label}</span>))}{issue.labels.length > 3 && <span className="text-xs text-gray-500">+{issue.labels.length - 3} more</span>}</div>)}
              </div>
            </div>
          </div>
        ))}

        {activeTab === 'merged_prs' && pullRequests.map((pr) => (
          <div key={`pr-${pr.number}`} onClick={() => handleItemSelect(pr)} className="p-3 rounded-lg border border-gray-700/30 hover:border-gray-600/50 hover:bg-gray-800/40 cursor-pointer transition-all duration-200 group">
            <div className="flex items-start gap-3">
              <GitMerge className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1"><h4 className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">{pr.title}</h4><ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors flex-shrink-0" /></div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2"><span>PR #{pr.number}</span>{pr.merged_at && (<><span>•</span><Clock className="h-3 w-3" /><span>Merged {formatDate(pr.merged_at)}</span></>)}{pr.issue_id && (<><span>•</span><GitBranch className="h-3 w-3" /><span>Fixes #{pr.issue_id}</span></>)}</div>
                {pr.files_changed && pr.files_changed.length > 0 && (<div className="text-xs text-gray-500">{pr.files_changed.length} file{pr.files_changed.length > 1 ? 's' : ''} changed</div>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDetailView = () => {
    if (!selectedItem) return null;
    const isIssue = 'comments' in selectedItem; // Check if it's an Issue
    const itemAsIssue = isIssue ? selectedItem as Issue : null;
    const itemAsPr = !isIssue ? selectedItem as PullRequestInfo : null;

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-700/30 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-200 p-1"><ChevronRight className="h-4 w-4 rotate-180" /></Button>
            <span className="text-sm text-gray-400">Back to list</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isIssue ? getStateIcon(itemAsIssue!.state) : <GitMerge className="h-4 w-4 text-purple-400" />}
              <h3 className="text-lg font-semibold text-white">{selectedItem.title}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>#{selectedItem.number}</span><span>•</span>
              <span>{formatDate(isIssue ? itemAsIssue!.created_at : itemAsPr!.merged_at)}</span>
              {(isIssue && itemAsIssue!.url) || (itemAsPr && itemAsPr.url) ? (
                <><span>•</span><a href={isIssue ? itemAsIssue!.url : itemAsPr!.url!} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">View on GitHub <ExternalLink className="h-3 w-3" /></a></>
              ) : null}
            </div>
            {isIssue && onAddIssueToContext && (
              <div className="mt-3">
                <Button onClick={() => onAddIssueToContext(itemAsIssue!)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm" size="sm"><MessageCircle className="h-4 w-4 mr-2" />Add Issue as Context</Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0" style={{ height: 'calc(100vh - 240px)' }}>
          <div className="p-4">
            <div className="space-y-6">
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {(isIssue && itemAsIssue!.body) || (itemAsPr && itemAsPr.body) || '*No description provided*'}
                </ReactMarkdown>
              </div>
              {isIssue && itemAsIssue!.labels.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Labels</h4>
                  <div className="flex flex-wrap gap-2">{itemAsIssue!.labels.map((label) => (<span key={label} className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getLabelColor(label)}`}><Tag className="h-3 w-3 mr-1" />{label}</span>))}</div>
                </div>
              )}
              {itemAsPr && itemAsPr.files_changed && itemAsPr.files_changed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Files Changed ({itemAsPr.files_changed.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-800/30 p-2 rounded-md border border-gray-700/30">{itemAsPr.files_changed.map((file, idx) => (<div key={idx} className="text-xs text-gray-400 p-1 rounded font-mono truncate hover:bg-gray-700/50"><FileDiff className="h-3 w-3 inline-block mr-1.5 text-gray-500" />{file}</div>))}</div>
                </div>
              )}
              {isIssue && itemAsIssue!.comments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Comments ({itemAsIssue!.comments.length})</h4>
                  <div className="space-y-4">{itemAsIssue!.comments.map((comment, index) => (<div key={index} className="border border-gray-700/30 rounded-lg p-3 bg-gray-800/30"><div className="flex items-center gap-2 mb-2"><User className="h-4 w-4 text-gray-400" /><span className="text-sm font-medium text-gray-300">{comment.user}</span><span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span></div><div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown></div></div>))}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-screen w-[500px] bg-gray-900/95 backdrop-blur-lg border-l border-gray-700/50 shadow-2xl z-50 transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-800/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            {activeTab === 'merged_prs' ? <GitMerge className="h-5 w-5 text-gray-400" /> : <GitBranch className="h-5 w-5 text-gray-400" />}
            <div>
              <h3 className="text-lg font-semibold text-white">{activeTab === 'merged_prs' ? 'Pull Requests' : 'Issues'}</h3>
              <p className="text-sm text-gray-400">{repoUrl.replace('https://github.com/', '')}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-200"><X className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-1 p-3 border-b border-gray-700/30 flex-shrink-0">
          {(['open', 'closed', 'all', 'merged_prs'] as const).map((tab) => (
            <Button key={tab} variant={activeTab === tab ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(tab)} className={`text-xs ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`}>
              {tab === 'open' && <Circle className="h-3 w-3 mr-1" />}
              {tab === 'closed' && <CheckCircle className="h-3 w-3 mr-1" />}
              {tab === 'all' && <Filter className="h-3 w-3 mr-1" />}
              {tab === 'merged_prs' && <GitMerge className="h-3 w-3 mr-1" />}
              {tab === 'merged_prs' ? 'Merged PRs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          {!showDetail ? renderItemList() : renderDetailView()}
        </div>
      </div>
    </>
  );
};

export default IssuesPane;
