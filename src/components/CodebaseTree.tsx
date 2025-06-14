import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Search, X, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    
    // Return subtle, monochromatic icons that aid recognition without distraction
    if (!ext) return <FileText className="h-3.5 w-3.5 text-gray-400" />;
    
    const iconClass = "h-3.5 w-3.5";
    
    switch (ext) {
      // JavaScript/TypeScript
      case 'js':
      case 'jsx':
        return <span className={`${iconClass} flex items-center justify-center text-yellow-400/80 font-bold text-xs`}>JS</span>;
      case 'ts':
      case 'tsx':
        return <span className={`${iconClass} flex items-center justify-center text-blue-400/80 font-bold text-xs`}>TS</span>;
      
      // Python
      case 'py':
        return <span className={`${iconClass} flex items-center justify-center text-green-400/80 font-bold text-xs`}>PY</span>;
      
      // Java
      case 'java':
        return <span className={`${iconClass} flex items-center justify-center text-orange-400/80 font-bold text-xs`}>J</span>;
      
      // C/C++
      case 'c':
        return <span className={`${iconClass} flex items-center justify-center text-blue-300/80 font-bold text-xs`}>C</span>;
      case 'cpp':
      case 'cc':
      case 'cxx':
        return <span className={`${iconClass} flex items-center justify-center text-blue-300/80 font-bold text-xs`}>C+</span>;
      
      // Web files
      case 'html':
      case 'htm':
        return <span className={`${iconClass} flex items-center justify-center text-orange-400/80 font-bold text-xs`}>H</span>;
      case 'css':
        return <span className={`${iconClass} flex items-center justify-center text-blue-400/80 font-bold text-xs`}>C</span>;
      case 'scss':
      case 'sass':
        return <span className={`${iconClass} flex items-center justify-center text-pink-400/80 font-bold text-xs`}>S</span>;
      
      // Data/Config files
      case 'json':
        return <span className={`${iconClass} flex items-center justify-center text-yellow-400/80 font-bold text-xs`}>{}</span>;
      case 'yaml':
      case 'yml':
        return <span className={`${iconClass} flex items-center justify-center text-purple-400/80 font-bold text-xs`}>Y</span>;
      case 'xml':
        return <span className={`${iconClass} flex items-center justify-center text-orange-400/80 font-bold text-xs`}>X</span>;
      case 'toml':
        return <span className={`${iconClass} flex items-center justify-center text-gray-400/80 font-bold text-xs`}>T</span>;
      
      // Documentation
      case 'md':
      case 'markdown':
        return <span className={`${iconClass} flex items-center justify-center text-gray-300/80 font-bold text-xs`}>M</span>;
      case 'txt':
        return <FileText className={`${iconClass} text-gray-400/80`} />;
      case 'rst':
        return <span className={`${iconClass} flex items-center justify-center text-gray-400/80 font-bold text-xs`}>R</span>;
      
      // Other languages
      case 'go':
        return <span className={`${iconClass} flex items-center justify-center text-cyan-400/80 font-bold text-xs`}>GO</span>;
      case 'rs':
        return <span className={`${iconClass} flex items-center justify-center text-orange-400/80 font-bold text-xs`}>RS</span>;
      case 'rb':
        return <span className={`${iconClass} flex items-center justify-center text-red-400/80 font-bold text-xs`}>RB</span>;
      case 'php':
        return <span className={`${iconClass} flex items-center justify-center text-purple-400/80 font-bold text-xs`}>P</span>;
      case 'swift':
        return <span className={`${iconClass} flex items-center justify-center text-orange-400/80 font-bold text-xs`}>SW</span>;
      
      // Special files
      case 'dockerfile':
        return <span className={`${iconClass} flex items-center justify-center text-blue-400/80 font-bold text-xs`}>🐳</span>;
      case 'gitignore':
        return <span className={`${iconClass} flex items-center justify-center text-gray-400/80 font-bold text-xs`}>G</span>;
      case 'env':
        return <span className={`${iconClass} flex items-center justify-center text-yellow-400/80 font-bold text-xs`}>E</span>;
      
      // Default
      default:
        return <FileText className={`${iconClass} text-gray-400/80`} />;
    }
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.path);
    const isHighlighted = searchQuery && (
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.path.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div key={node.path}>
        <div
          className={`
            group flex items-center py-2 px-3 rounded-md mx-1 my-0.5
            hover:bg-slate-800/60 cursor-pointer transition-all duration-200
            ${isHighlighted ? 'bg-blue-500/10 ring-1 ring-blue-500/30' : ''}
            ${node.type === 'file' ? 'text-slate-300' : 'text-slate-200'}
          `}
          style={{ marginLeft: level * 16 }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleNode(node.path);
            } else {
              setSelectedFile(node.path);
              if (onFileSelect) {
                onFileSelect(node.path);
              }
            }
          }}
        >
          {/* Expand/collapse indicator */}
          {node.type === 'directory' && (
            <div className="w-5 h-5 flex items-center justify-center mr-2 text-slate-500 group-hover:text-slate-400">
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </div>
          )}
          
          {/* File/folder icon */}
          <div className="w-5 h-5 flex items-center justify-center mr-3">
            {node.type === 'directory' ? (
              <span className={isExpanded ? 'text-blue-400' : 'text-slate-400'}>
                {isExpanded ? '📂' : '📁'}
              </span>
            ) : (
              getFileIcon(node.name)
            )}
          </div>
          
          {/* File/folder name */}
          <span 
            className="text-sm truncate flex-1 group-hover:text-white transition-colors font-medium" 
            title={node.path}
          >
            {node.name}
          </span>
        </div>
        
        {/* Children */}
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-slate-400">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm">Loading repository...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-slate-400 p-6">
        <div className="text-red-400 mb-4 text-3xl">⚠️</div>
        <p className="text-sm text-center mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Search - only show when needed */}
      <div className="p-4 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-700 rounded-lg 
              text-sm text-slate-100 placeholder:text-slate-400 
              focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
              transition-all duration-200
            "
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="
                absolute right-3 top-1/2 transform -translate-y-1/2 
                p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 
                transition-colors
              "
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3">
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-center">
                <Search className="h-8 w-8 mb-3 opacity-40" />
                <p className="text-sm font-medium text-slate-300 mb-1">No files found</p>
                <p className="text-xs text-slate-500">
                  {searchQuery ? `No matches for "${searchQuery}"` : 'Repository appears to be empty'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredData.map(node => renderNode(node))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* FileViewer Modal */}
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