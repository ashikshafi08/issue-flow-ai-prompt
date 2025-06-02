
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  useEffect(() => {
    const fetchTreeStructure = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/tree?session_id=${sessionId}`);
        const data = await response.json();
        setTreeData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch tree structure:', error);
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchTreeStructure();
    }
  }, [sessionId]);

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.path);
    const paddingLeft = level * 16 + 8;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-700/50 cursor-pointer transition-colors rounded-sm ${
            node.type === 'file' ? 'text-gray-300' : 'text-gray-200'
          }`}
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
            <span className="mr-1 text-gray-400">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
          )}
          
          <span className="mr-2 text-blue-400">
            {node.type === 'directory' ? (
              isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />
            ) : (
              <File className="h-4 w-4" />
            )}
          </span>
          
          <span className="text-sm truncate" title={node.name}>
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

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
        <p className="text-sm text-gray-400 mt-2">Loading codebase...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <div className="mb-3 px-2">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Folder className="h-4 w-4 text-blue-400" />
            Codebase
          </h3>
        </div>
        {treeData.map(node => renderNode(node))}
      </div>
    </ScrollArea>
  );
};

export default CodebaseTree;
