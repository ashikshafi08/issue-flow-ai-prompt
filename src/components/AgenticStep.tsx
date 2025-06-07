import React from 'react';
import { MessageSquare, Terminal, Zap, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';

interface Step {
  step: number;
  type: 'thought' | 'action' | 'observation' | 'answer' | 'error' | string; // Allow string for flexibility
  content: string | any; // Can be string or parsed JSON (e.g., for tool_input or observation content)
  tool_name?: string;
  tool_input?: any;
  tool_output_preview?: string;
  observed_tool_name?: string; // For observations linked to actions
}

interface AgenticStepProps {
  step: Step;
}

const AgenticStep: React.FC<AgenticStepProps> = ({ step }) => {
  const renderContent = (content: string | any) => {
    if (typeof content === 'string') {
      // Basic check for JSON string that might not have been pre-parsed
      if ((content.startsWith('{') && content.endsWith('}')) || (content.startsWith('[') && content.endsWith(']'))) {
        try {
          const parsedJson = JSON.parse(content);
          return (
            <SyntaxHighlighter language="json" style={oneDark} PreTag="div" className="rounded-md text-xs max-h-60 overflow-auto">
              {JSON.stringify(parsedJson, null, 2)}
            </SyntaxHighlighter>
          );
        } catch (e) {
          // Not valid JSON, render as string
        }
      }
      return <p className="whitespace-pre-wrap">{content}</p>;
    }
    if (typeof content === 'object' && content !== null) {
      return (
        <SyntaxHighlighter language="json" style={oneDark} PreTag="div" className="rounded-md text-xs max-h-60 overflow-auto">
          {JSON.stringify(content, null, 2)}
        </SyntaxHighlighter>
      );
    }
    return <p className="whitespace-pre-wrap">{String(content)}</p>;
  };

  const getIcon = () => {
    switch (step.type) {
      case 'thought':
        return <MessageSquare className="h-4 w-4 text-purple-400" />;
      case 'action':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'observation':
        return <Eye className="h-4 w-4 text-cyan-400" />;
      case 'answer':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Terminal className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const title = step.type.charAt(0).toUpperCase() + step.type.slice(1);

  return (
    <div className="p-3 bg-gray-800/50 rounded-lg shadow-sm text-xs text-gray-300 mb-2 border border-gray-700/50">
      <div className="flex items-center font-medium text-gray-100 mb-1.5">
        {getIcon()}
        <span className="ml-2">{title}</span>
        {step.type === 'action' && step.tool_name && (
          <span className="ml-2 text-yellow-500 font-mono text-xs">Tool: {step.tool_name}</span>
        )}
        {step.type === 'observation' && step.observed_tool_name && (
          <span className="ml-2 text-cyan-500 font-mono text-xs">From: {step.observed_tool_name}</span>
        )}
      </div>
      
      {step.type === 'action' && step.tool_input && (
        <div className="mb-1 pl-6">
          <strong className="text-gray-400">Input:</strong>
          {renderContent(step.tool_input)}
        </div>
      )}
      
      <div className="pl-6">
        {step.type === 'observation' && step.tool_output_preview ? (
          <>
            <strong className="text-gray-400">Preview:</strong>
            <p className="whitespace-pre-wrap mb-1">{step.tool_output_preview}</p>
            {typeof step.content !== 'string' && (
                <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-300">View Full Observation</summary>
                    <div className="mt-1 p-2 bg-gray-900/50 rounded-md">
                        {renderContent(step.content)}
                    </div>
                </details>
            )}
          </>
        ) : (
          renderContent(step.content)
        )}
      </div>
    </div>
  );
};

export default AgenticStep;
