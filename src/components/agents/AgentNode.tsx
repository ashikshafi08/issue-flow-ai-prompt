import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle, Zap, Bot, Brain, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentNodeData } from '@/types/agents.types';

const AgentNode = memo(({ data, isConnectable, selected }: NodeProps<AgentNodeData>) => {
  const getIcon = () => {
    const icons = {
      security: Shield,
      quality: CheckCircle,
      performance: Zap,
      orchestrator: Bot,
      memory: Brain,
    };
    const Icon = icons[data.type] || Bot;
    return <Icon className="h-5 w-5" />;
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'thinking': return 'border-blue-400 bg-slate-800 shadow-lg shadow-blue-500/30 ring-1 ring-blue-500/20';
      case 'analyzing': return 'border-yellow-400 bg-slate-800 shadow-lg shadow-yellow-500/30 ring-1 ring-yellow-500/20';
      case 'complete': return 'border-green-400 bg-slate-800 shadow-lg shadow-green-500/30 ring-1 ring-green-500/20';
      case 'error': return 'border-red-400 bg-slate-800 shadow-lg shadow-red-500/30 ring-1 ring-red-500/20';
      default: return 'border-slate-500 bg-slate-800 shadow-lg shadow-slate-500/20 ring-1 ring-slate-500/20';
    }
  };

  const getIconColor = () => {
    switch (data.status) {
      case 'complete': return 'bg-green-500 text-white ring-2 ring-green-400/50';
      case 'thinking': return 'bg-blue-500 text-white animate-pulse ring-2 ring-blue-400/50';
      case 'analyzing': return 'bg-yellow-500 text-white animate-pulse ring-2 ring-yellow-400/50';
      case 'error': return 'bg-red-500 text-white ring-2 ring-red-400/50';
      default: return 'bg-slate-600 text-slate-200 ring-2 ring-slate-500/50';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'thinking': return <Brain className="h-3 w-3 animate-pulse" />;
      case 'analyzing': return <Zap className="h-3 w-3 animate-pulse" />;
      case 'complete': return <CheckCircle className="h-3 w-3" />;
      case 'error': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const isActive = data.status === 'thinking' || data.status === 'analyzing';

  return (
    <Card className={cn(
      "p-4 min-w-[220px] max-w-[280px] transition-all duration-300 hover:shadow-lg",
      getStatusColor(),
      selected && "ring-2 ring-primary shadow-lg scale-105",
      isActive && "animate-pulse"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-background"
      />
      
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
              getIconColor()
            )}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate text-slate-100">{data.label}</h3>
              <p className="text-xs text-slate-400 capitalize">{data.type} agent</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs flex items-center gap-1",
              isActive && "animate-pulse"
            )}
          >
            {getStatusIcon()}
            {data.status}
          </Badge>
        </div>

        {/* Thinking/Progress Section */}
        {isActive && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">
                {data.status === 'thinking' ? 'Thinking...' : 'Analyzing...'}
              </span>
              {data.confidence && (
                <span className="font-semibold text-blue-400">
                  {Math.round(data.confidence * 100)}%
                </span>
              )}
            </div>
            
            <Progress 
              value={(data.progress || data.confidence || 0) * 100} 
              className="h-2"
            />
            
            {data.thinking && (
              <p className="text-xs text-slate-300 italic bg-slate-700/50 p-2 rounded border-l-2 border-blue-400">
                "{data.thinking}"
              </p>
            )}
          </div>
        )}

        {/* Output Section */}
        {data.output && data.status === 'complete' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Output</span>
              {data.confidence && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(data.confidence * 100)}% confident
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-200 bg-slate-700/50 p-2 rounded border-l-2 border-green-400 line-clamp-3">
              {data.output}
            </p>
          </div>
        )}

        {/* Error Section */}
        {data.status === 'error' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-red-400">Error</span>
            </div>
            <p className="text-xs text-red-300 bg-red-900/30 p-2 rounded border-l-2 border-red-400">
              {data.output || 'An error occurred during processing'}
            </p>
          </div>
        )}

        {/* Duration & Metrics */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          {data.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{data.duration}ms</span>
            </div>
          )}
          
          {data.reasoning && data.reasoning.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {data.reasoning.length} reasoning steps
            </Badge>
          )}
        </div>

        {/* Active Thinking Indicator */}
        {isActive && (
          <div className="flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-background"
      />
    </Card>
  );
});

AgentNode.displayName = 'AgentNode';
export default AgentNode; 