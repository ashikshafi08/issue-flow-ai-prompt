import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Search, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface CodebaseTreeProps {
  sessionId: string;
  onFileSelect?: (filePath: string) => void;
}

const CodebaseTree: React.FC<CodebaseTreeProps> = ({ sessionId, onFileSelect }) => {
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<FileNode[]>([]);

  useEffect(() => {
    const fetchTreeStructure = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response = await fetch(`http://localhost:8000/api/tree?session_id=${sessionId}`);
        
        if (response.status === 404) {
          response = await fetch(`http://localhost:8000/api/files?session_id=${sessionId}`);
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
          className={`flex items-center py-1 px-2 hover:bg-gray-700/50 cursor-pointer transition-all duration-150 group ${
            isHighlighted ? 'bg-blue-600/20 border-r-2 border-blue-500' : ''
          } ${node.type === 'file' ? 'text-gray-300' : 'text-gray-200'}`}
          style={{ paddingLeft }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleNode(node.path);
            } else if (onFileSelect) {
              onFileSelect(node.path);
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
          <div>
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
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
        <p className="text-sm text-gray-400">Loading repository structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
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
    <div className="flex flex-col h-full">
      {/* Enhanced Search Header */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-gray-100 placeholder:text-gray-400 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={expandAll}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              Expand All
            </Button>
            <Button
              onClick={collapseAll}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              Collapse
            </Button>
          </div>
          
          {searchQuery && (
            <span className="text-xs text-gray-500">
              {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <ScrollArea className="flex-1 px-2">
        <div className="pb-4">
          {Array.isArray(filteredData) && filteredData.length > 0 ? (
            filteredData.map(node => renderNode(node))
          ) : searchQuery ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No files found matching "{searchQuery}"
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No files found in repository
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CodebaseTree;
