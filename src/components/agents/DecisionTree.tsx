import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import AgentNode from './AgentNode';
import AnimatedEdge from '../visualizations/AnimatedEdge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  Activity,
  GitBranch
} from 'lucide-react';
import { WorkflowState } from '@/types/agents.types';

const nodeTypes = {
  agent: AgentNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

interface DecisionTreeProps {
  workflowData: WorkflowState;
  onNodeClick: (node: any) => void;
  isLive?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
}

export const DecisionTree: React.FC<DecisionTreeProps> = ({
  workflowData,
  onNodeClick,
  isLive = false,
  onPause,
  onResume,
  className,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflowData.edges);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update nodes and edges when workflowData changes
  useEffect(() => {
    setNodes(workflowData.nodes);
    setEdges(workflowData.edges);
  }, [workflowData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleExport = () => {
    const data = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
      metadata: {
        activeNodeId: workflowData.activeNodeId,
        isPaused: workflowData.isPaused,
        totalAgents: nodes.length,
        activeConnections: edges.filter(e => e.data?.isActive).length,
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setNodes(workflowData.nodes);
    setEdges(workflowData.edges);
  };

  const activeAgentCount = nodes.filter(node => 
    node.data.status === 'thinking' || node.data.status === 'analyzing'
  ).length;

  const completedAgentCount = nodes.filter(node => 
    node.data.status === 'complete'
  ).length;

  const errorAgentCount = nodes.filter(node => 
    node.data.status === 'error'
  ).length;

  return (
    <Card className={`relative overflow-hidden ${className || 'h-[600px]'}`}>
      <ReactFlowProvider>
        {/* Header Controls */}
        <Panel position="top-right" className="m-4">
          <div className="flex items-center gap-2 bg-slate-800/95 backdrop-blur-sm rounded-lg p-2 border border-slate-600 shadow-lg">
            {/* Status Indicators */}
            <div className="flex items-center gap-3 mr-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs text-slate-300">{activeAgentCount} active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-slate-300">{completedAgentCount} done</span>
              </div>
              {errorAgentCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs text-slate-300">{errorAgentCount} error</span>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            {isLive && (
              <Button
                size="sm"
                variant="outline"
                onClick={workflowData.isPaused ? onResume : onPause}
                className="h-8 px-3"
              >
                {workflowData.isPaused ? (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </>
                )}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="h-8 px-3"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              className="h-8 px-3"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 px-3"
            >
              <Maximize className="h-3 w-3" />
            </Button>
          </div>
        </Panel>

        {/* Live Status Badge */}
        {isLive && (
          <Panel position="top-left" className="m-4">
            <Badge 
              variant="outline" 
              className="bg-slate-800/95 backdrop-blur-sm border-green-400/50 text-slate-200"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              <Activity className="h-3 w-3 mr-1" />
              Live Workflow
            </Badge>
          </Panel>
        )}

        {/* Workflow Title */}
        <Panel position="top-center" className="m-4">
          <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-600 shadow-lg">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Multi-Agent Analysis
              <Badge variant="secondary" className="text-xs">
                {nodes.length} agents
              </Badge>
            </h3>
          </div>
        </Panel>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => onNodeClick(node)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.1,
            maxZoom: 1.5,
          }}
          attributionPosition="bottom-left"
          className="bg-slate-800 dark:bg-slate-900"
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2 },
          }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1.5} 
            className="opacity-20"
            color="#64748b"
          />
          
          <Controls 
            className="bg-slate-800 border border-slate-600 shadow-lg rounded-lg"
            showZoom
            showFitView
            showInteractive={false}
          />
          
          <MiniMap 
            nodeColor={(node) => {
              switch (node.data.status) {
                case 'complete': return '#10B981';
                case 'thinking': return '#3B82F6';
                case 'analyzing': return '#F59E0B';
                case 'error': return '#EF4444';
                default: return '#64748B';
              }
            }}
            nodeStrokeWidth={3}
            nodeStrokeColor={(node) => {
              return node.data.status === 'thinking' || node.data.status === 'analyzing' 
                ? '#3B82F6' 
                : 'transparent';
            }}
            className="bg-slate-800 border border-slate-600 shadow-lg rounded-lg"
            pannable
            zoomable
          />
        </ReactFlow>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <GitBranch className="h-12 w-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-300">No Workflow Active</h3>
              <p className="text-sm text-slate-400">
                Start an analysis to see the agent workflow visualization
              </p>
            </div>
          </div>
        )}
      </ReactFlowProvider>
    </Card>
  );
}; 