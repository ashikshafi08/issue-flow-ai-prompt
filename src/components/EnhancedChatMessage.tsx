import React, { useState } from 'react';
import { File, GitBranch, Bug, Code, ChevronDown, ChevronRight, ExternalLink, Copy, Check, Terminal } from 'lucide-react'; // Added Terminal
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import AgenticStep from './AgenticStep'; // Import the new component

// Define the Step interface based on backend structure
interface Step {
  step: number;
  type: 'thought' | 'action' | 'observation' | 'answer' | 'error' | string;
  content: string | any; // Can be string or parsed JSON
  tool_name?: string;
  tool_input?: any;
  tool_output_preview?: string;
  observed_tool_name?: string;
}

interface ContextCard {
  type: 'file' | 'issue' | 'pr';
  title: string;
  subtitle?: string;
  path?: string;
  number?: number;
  url?: string;
  preview?: string;
}

interface EnhancedChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  contextCards?: ContextCard[];
  agenticSteps?: Step[]; // Use the more specific Step[] type
  suggestions?: string[]; // Add suggestions prop
  onFileSelect?: (filePath: string) => void;
  onIssueSelect?: (issueNumber: number) => void;
  onContextAdd?: (context: any) => void;
}

const EnhancedChatMessage: React.FC<EnhancedChatMessageProps> = ({
  role,
  content,
  timestamp,
  contextCards = [],
  agenticSteps = [],
  onFileSelect,
  onIssueSelect,
  onContextAdd
}) => {
  const [showAgenticSteps, setShowAgenticSteps] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const formatTimestamp = (ts: number): string => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderContextCard = (card: ContextCard, index: number) => {
    const getIcon = () => {
      switch (card.type) {
        case 'file': return <File className="h-4 w-4 text-blue-400" />;
        case 'issue': return <Bug className="h-4 w-4 text-red-400" />;
        case 'pr': return <GitBranch className="h-4 w-4 text-green-400" />;
        default: return <Code className="h-4 w-4 text-gray-400" />;
      }
    };

    const handleClick = () => {
      if (card.type === 'file' && card.path && onFileSelect) {
        onFileSelect(card.path);
      } else if (card.type === 'issue' && card.number && onIssueSelect) {
        onIssueSelect(card.number);
      } else if (card.url) {
        window.open(card.url, '_blank');
      }
    };

    return (
      <div
        key={index}
        className="flex items-center gap-3 p-3 bg-gray-800/40 border border-gray-700/30 rounded-lg cursor-pointer hover:border-gray-600/50 hover:bg-gray-800/60 transition-all duration-200 group"
        onClick={handleClick}
      >
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
              {card.title}
            </h4>
            {card.url && <ExternalLink className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
          {card.subtitle && (
            <p className="text-xs text-gray-400 truncate">{card.subtitle}</p>
          )}
          {card.preview && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{card.preview}</p>
          )}
        </div>
      </div>
    );
  };

  const customMarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
      
      if (!inline && match) {
        return (
          <div className="relative group">
            <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-700">
              <span className="text-xs text-gray-400 font-medium">{match[1]}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(String(children), codeId)}
              >
                {copiedCode === codeId ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-400" />
                )}
              </Button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-t-none !mt-0"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className={`flex gap-3 mb-6 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {role === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-white">AI</span>
        </div>
      )}

      <div className={`flex-1 max-w-3xl ${role === 'user' ? 'order-2' : ''}`}>
        {/* Message Header */}
        <div className={`flex items-center gap-2 mb-2 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs font-medium text-gray-400">
            {role === 'user' ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-500">{formatTimestamp(timestamp)}</span>
        </div>

        {/* Context Cards */}
        {contextCards.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Referenced Context
              </span>
            </div>
            <div className="space-y-2">
              {contextCards.map(renderContextCard)}
            </div>
          </div>
        )}

        {/* Main Message */}
        <div className={`
          rounded-lg px-4 py-3 shadow-sm
          ${role === 'user' 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-8' 
            : 'bg-gray-800/60 border border-gray-700/30 text-gray-100'
          }
        `}>
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={customMarkdownComponents}
              remarkPlugins={[remarkGfm]}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Agentic Steps */}
        {agenticSteps.length > 0 && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAgenticSteps(!showAgenticSteps)}
              className="text-xs text-gray-400 hover:text-gray-200 p-1 h-auto"
            >
              {showAgenticSteps ? (
                <ChevronDown className="h-3 w-3 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1" />
              )}
              View reasoning steps ({agenticSteps.length})
            </Button>
            
            {showAgenticSteps && (
              <div className="mt-2 space-y-1 pl-1">
                {agenticSteps.map((s, index) => (
                  // Ensure a unique key, preferably an ID from the step data if available
                  // If step object doesn't have a unique id, index might be okay for stable lists
                  <AgenticStep key={s.step || index} step={s} />
                ))}
              </div>
            )}
          </div>
        )}


      </div>

      {role === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center order-3">
          <span className="text-sm font-bold text-white">You</span>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatMessage;
