import React, { useState, useEffect, useMemo } from 'react';
import { Search, File, GitBranch, GitMerge, Bug, Code, Folder, ChevronRight, ChevronDown, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface Issue {
  number: number;
  title: string;
  state: string;
  labels: string[];
}

interface PullRequest {
  number: number;
  title: string;
  merged_at?: string;
  files_changed?: string[];
}

interface UnifiedContextPanelProps {
  sessionId: string;
  currentContext?: {
    discussingFiles?: string[];
    relatedIssues?: number[];
    activeThread?: string;
  };
  onFileSelect: (filePath: string) => void;
  onIssueSelect: (issue: Issue) => void;
  onPRSelect: (pr: PullRequest) => void;
  repoUrl?: string;
}

const UnifiedContextPanel: React.FC<UnifiedContextPanelProps> = ({
  sessionId,
  currentContext,
  onFileSelect,
  onIssueSelect,
  onPRSelect,
  repoUrl
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'smart' | 'files' | 'issues' | 'prs'>('smart');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Smart context determination based on current conversation
  const smartContext = useMemo(() => {
    const context = {
      primaryType: 'files' as 'files' | 'issues' | 'prs',
      suggestions: [] as Array<{type: string, item: any, reason: string}>
    };

    // Analyze current context to determine what to show
    if (currentContext?.discussingFiles?.length) {
      context.primaryType = 'files';
      context.suggestions = currentContext.discussingFiles.map(file => ({
        type: 'file',
        item: { path: file, name: file.split('/').pop() },
        reason: 'Currently discussing'
      }));
    } else if (currentContext?.relatedIssues?.length) {
      context.primaryType = 'issues';
    }

    return context;
  }, [currentContext]);

  const fetchFileTree = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/tree?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Transform the flat array structure to hierarchical tree structure
        const transformToTree = (nodes: any[]): FileNode[] => {
          if (!Array.isArray(nodes)) return [];
          
          return nodes.map((node: any) => ({
            name: node.name || node.path.split('/').pop() || node.path,
            path: node.path,
            type: node.type === 'directory' ? 'folder' : 'file',
            children: node.children ? transformToTree(node.children) : undefined
          }));
        };
        
        setFileTree(transformToTree(Array.isArray(data) ? data : []));
      } else {
        console.error('Failed to fetch file tree:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch file tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    if (!repoUrl) return;
    try {
      const response = await fetch(`http://localhost:8000/api/issues?repo_url=${encodeURIComponent(repoUrl)}&state=all`);
      const data = await response.json();
      setIssues(data.slice(0, 10)); // Limit for performance
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    }
  };

  const fetchPullRequests = async () => {
    if (!repoUrl) return;
    try {
      const response = await fetch(`http://localhost:8000/api/prs?repo_url=${encodeURIComponent(repoUrl)}&state=merged`);
      const data = await response.json();
      setPullRequests(data.slice(0, 10)); // Limit for performance
    } catch (error) {
      console.error('Failed to fetch PRs:', error);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchFileTree();
    }
    if (repoUrl) {
      fetchIssues();
      fetchPullRequests();
    }
  }, [sessionId, repoUrl]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isCurrentlyDiscussed = currentContext?.discussingFiles?.includes(node.path);

    return (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 ${
            isCurrentlyDiscussed 
              ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' 
              : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              )}
              <Folder className="h-4 w-4 text-blue-400" />
            </>
          ) : (
            <>
              <div className="w-3" /> {/* Spacer for alignment */}
              <File className="h-4 w-4 text-gray-400" />
            </>
          )}
          <span className="text-sm font-medium truncate flex-1">{node.name}</span>
          {isCurrentlyDiscussed && (
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          )}
        </div>
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderSmartContext = () => (
    <div className="space-y-4">
      {/* Context-aware suggestions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Contextual Resources
        </h3>
        
        {smartContext.suggestions.length > 0 ? (
          <div className="space-y-1">
            {smartContext.suggestions.map((suggestion, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10 border border-blue-500/20 cursor-pointer hover:bg-blue-500/15 transition-colors"
                onClick={() => {
                  if (suggestion.type === 'file') {
                    onFileSelect(suggestion.item.path);
                  }
                }}
              >
                <Code className="h-4 w-4 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {suggestion.item.name}
                  </p>
                  <p className="text-xs text-blue-300">{suggestion.reason}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start chatting to see relevant context</p>
          </div>
        )}
      </div>

      {/* Quick access to recent items */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Quick Access
        </h3>
        
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-2 flex flex-col items-center gap-1 text-gray-400 hover:text-white hover:bg-gray-700/50"
            onClick={() => setActiveTab('files')}
          >
            <File className="h-4 w-4" />
            <span className="text-xs">Files</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-2 flex flex-col items-center gap-1 text-gray-400 hover:text-white hover:bg-gray-700/50"
            onClick={() => setActiveTab('issues')}
          >
            <Bug className="h-4 w-4" />
            <span className="text-xs">Issues</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-2 flex flex-col items-center gap-1 text-gray-400 hover:text-white hover:bg-gray-700/50"
            onClick={() => setActiveTab('prs')}
          >
            <GitMerge className="h-4 w-4" />
            <span className="text-xs">PRs</span>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderFiles = () => {
    const filteredFiles = searchQuery 
      ? fileTree.filter(node => 
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.path.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : fileTree;

    return (
      <div className="space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Loading files...</p>
            </div>
          </div>
        ) : filteredFiles.length > 0 ? (
          filteredFiles.map(node => renderFileNode(node))
        ) : fileTree.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files found</p>
            <p className="text-xs text-gray-600 mt-1">Make sure the session is properly initialized</p>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No files match "{searchQuery}"</p>
          </div>
        )}
      </div>
    );
  };

  const renderIssues = () => (
    <div className="space-y-2">
      {issues.map(issue => (
        <div
          key={issue.number}
          className="p-3 rounded-md border border-gray-700/30 hover:border-gray-600/50 hover:bg-gray-800/40 cursor-pointer transition-all duration-200"
          onClick={() => onIssueSelect(issue)}
        >
          <div className="flex items-center gap-2 mb-1">
            <Bug className={`h-3 w-3 ${issue.state === 'open' ? 'text-green-400' : 'text-purple-400'}`} />
            <span className="text-sm font-medium text-white truncate">#{issue.number}</span>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2 mb-2">{issue.title}</p>
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {issue.labels.slice(0, 2).map(label => (
                <span key={label} className="px-1.5 py-0.5 bg-gray-700/50 text-xs text-gray-400 rounded">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderPRs = () => (
    <div className="space-y-2">
      {pullRequests.map(pr => (
        <div
          key={pr.number}
          className="p-3 rounded-md border border-gray-700/30 hover:border-gray-600/50 hover:bg-gray-800/40 cursor-pointer transition-all duration-200"
          onClick={() => onPRSelect(pr)}
        >
          <div className="flex items-center gap-2 mb-1">
            <GitMerge className="h-3 w-3 text-purple-400" />
            <span className="text-sm font-medium text-white">PR #{pr.number}</span>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2 mb-2">{pr.title}</p>
          {pr.files_changed && (
            <p className="text-xs text-gray-500">{pr.files_changed.length} files changed</p>
          )}
        </div>
      ))}
    </div>
  );

  const getTabContent = () => {
    switch (activeTab) {
      case 'smart': return renderSmartContext();
      case 'files': return renderFiles();
      case 'issues': return renderIssues();
      case 'prs': return renderPRs();
      default: return renderSmartContext();
    }
  };

  return (
    <div className="w-80 bg-gray-900/95 border-l border-gray-700/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/30">
        <h2 className="text-lg font-semibold text-white mb-3">Context</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files, issues, PRs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-800/50 rounded-md">
          {[
            { id: 'smart', label: 'Smart', icon: Plus },
            { id: 'files', label: 'Files', icon: File },
            { id: 'issues', label: 'Issues', icon: Bug },
            { id: 'prs', label: 'PRs', icon: GitMerge }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {getTabContent()}
      </div>
    </div>
  );
};

export default UnifiedContextPanel; 