import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Search, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FileViewer from './FileViewer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface CodebaseTreeProps {
  sessionId: string;
  onFileSelect?: (filePath: string) => void;
  onTimelineSelect?: (filePath: string) => void;
}

const CodebaseTree: React.FC<CodebaseTreeProps> = ({ sessionId, onFileSelect, onTimelineSelect }) => {
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    const fetchTreeStructure = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response = await fetch(`${API_BASE_URL}/api/tree?session_id=${sessionId}`);
        
        if (response.status === 404) {
          response = await fetch(`${API_BASE_URL}/api/files?session_id=${sessionId}`);
          if (response.ok) {
            const filesData = await response.json();
            const treeStructure = buildTreeFromFiles(filesData);
            setTreeData(treeStructure);
            setFilteredData(treeStructure);
          } else {
            throw new Error('Failed to fetch files');
          }
        } else if (response.ok) {
          const data = await response.json();
          const dataArray = Array.isArray(data) ? data : [];
          setTreeData(dataArray);
          setFilteredData(dataArray);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch tree structure:', error);
        setError(error instanceof Error ? error.message : 'Failed to load codebase');
        setTreeData([]);
        setFilteredData([]);
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchTreeStructure();
    }
  }, [sessionId]);

  // Filter tree data based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(treeData);
      return;
    }

    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce((acc: FileNode[], node) => {
        const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             node.path.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (node.type === 'directory' && node.children) {
          const filteredChildren = filterNodes(node.children);
          if (filteredChildren.length > 0 || matchesSearch) {
            acc.push({
              ...node,
              children: filteredChildren
            });
            // Auto-expand directories that contain matches
            if (filteredChildren.length > 0) {
              setExpandedNodes(prev => new Set([...prev, node.path]));
            }
          }
        } else if (matchesSearch) {
          acc.push(node);
        }
        
        return acc;
      }, []);
    };

    setFilteredData(filterNodes(treeData));
  }, [searchQuery, treeData]);

  const buildTreeFromFiles = (files: { path: string }[]): FileNode[] => {
    const tree: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();

    files.forEach(file => {
      const parts = file.path.split('/');
      let currentPath = '';
      
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!pathMap.has(currentPath)) {
          const node: FileNode = {
            name: part,
            path: currentPath,
            type: isLast ? 'file' : 'directory',
            children: isLast ? undefined : []
          };
          
          pathMap.set(currentPath, node);
          
          if (index === 0) {
            tree.push(node);
          } else {
            const parentPath = parts.slice(0, index).join('/');
            const parent = pathMap.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        }
      });
    });

    return tree;
  };

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'js': '📄', 'jsx': '⚛️', 'ts': '📘', 'tsx': '⚛️',
      'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️',
      'html': '🌐', 'css': '🎨', 'scss': '🎨', 'sass': '🎨',
      'json': '📋', 'yaml': '📋', 'yml': '📋', 'xml': '📋',
      'md': '📖', 'txt': '📄', 'pdf': '📕', 'doc': '📄',
      'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
      'zip': '🗜️', 'tar': '🗜️', 'gz': '🗜️'
    };
    return iconMap[ext || ''] || '📄';
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.path);
    const paddingLeft = level * 16 + 8;
    const isHighlighted = searchQuery && (
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.path.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1.5 px-2 hover:bg-gray-800/60 cursor-pointer transition-all duration-150 group ${
            isHighlighted ? 'bg-blue-600/20 border-r-2 border-blue-500' : ''
          } ${node.type === 'file' ? 'text-gray-300' : 'text-gray-200'}`}
          style={{ paddingLeft }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleNode(node.path);
            } else {
              // Show FileViewer with integrated timeline
              setSelectedFile(node.path);
              // Also call onFileSelect if provided (for backward compatibility)
              if (onFileSelect) {
                onFileSelect(node.path);
              }
            }
          }}
        >
          {node.type === 'directory' && (
            <span className="mr-1 text-gray-500 group-hover:text-gray-400 transition-colors flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
          )}
          
          <span className="mr-2 flex-shrink-0 text-sm">
            {node.type === 'directory' ? (
              isExpanded ? '📂' : '📁'
            ) : (
              getFileIcon(node.name)
            )}
          </span>
          
          <span className="text-sm truncate flex-1 group-hover:text-white transition-colors" title={node.path}>
            {node.name}
          </span>
        </div>
        
        {node.type === 'directory' && isExpanded && node.children && (
          <div className="bg-gray-950">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const expandAll = () => {
    const getAllPaths = (nodes: FileNode[]): string[] => {
      const paths: string[] = [];
      nodes.forEach(node => {
        if (node.type === 'directory') {
          paths.push(node.path);
          if (node.children) {
            paths.push(...getAllPaths(node.children));
          }
        }
      });
      return paths;
    };
    
    setExpandedNodes(new Set(getAllPaths(treeData)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (loading) {
    return (
      <div className="p-6 text-center bg-gray-950 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
        <p className="text-sm text-gray-400">Loading repository structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-gray-950 h-full">
        <div className="text-red-400 mb-3 text-2xl">⚠️</div>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          size="sm"
          className="text-blue-400 border-blue-600 hover:bg-blue-600/20"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100">
      {/* Header with Search */}
      <div className="p-4 border-b border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Files</h3>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
            className="text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors px-3 py-1 h-7"
          >
            Expand All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            className="text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors px-3 py-1 h-7"
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Loading codebase...
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-center p-4">
                <div className="text-red-400 mb-2">⚠️</div>
                <div className="text-sm font-medium text-gray-300 mb-1">Failed to load codebase</div>
                <div className="text-xs text-gray-500">{error}</div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-center p-4">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <div className="text-sm font-medium text-gray-300 mb-1">No files found</div>
                <div className="text-xs text-gray-500">
                  {searchQuery ? `No matches for "${searchQuery}"` : 'Repository appears to be empty'}
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredData.map(node => renderNode(node))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* FileViewer Modal with integrated Timeline */}
      {selectedFile && (
        <FileViewer
          filePath={selectedFile}
          sessionId={sessionId}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
};

export default CodebaseTree;
