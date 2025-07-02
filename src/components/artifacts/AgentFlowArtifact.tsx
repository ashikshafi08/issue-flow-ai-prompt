import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentFlowData, AgentNode } from '@/types/canvas.types';
import { DecisionTree } from '@/components/agents/DecisionTree';
import { useAgentWorkflow } from '@/hooks/useAgentWorkflow';
import { Shield, CheckCircle, Zap, Bot, Play, Pause, FileText, GitBranch, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface AgentFlowArtifactProps {
  data: AgentFlowData;
  onNodeClick: (nodeId: string) => void;
  sessionId?: string;
}

export const AgentFlowArtifact: React.FC<AgentFlowArtifactProps> = ({ 
  data, 
  onNodeClick,
  sessionId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('workflow');
  const { addToast } = useToast();

  const {
    workflow,
    pauseWorkflow,
    resumeWorkflow,
    resetWorkflow,
    isConnected,
    getNodeDetails,
    currentWorkflowId,
  } = useAgentWorkflow(sessionId);

  // AgentFlowArtifact is now display-only - workflow creation is handled by WorkflowManager
  // Remove auto-creation logic to prevent duplicate/mock workflows

  const getNodeIcon = (type: string) => {
    switch(type) {
      case 'security': return Shield;
      case 'quality': return CheckCircle;
      case 'performance': return Zap;
      case 'orchestrator': return Bot;
      default: return Bot;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'thinking': return 'text-blue-500 bg-blue-100';
      case 'analyzing': return 'text-yellow-500 bg-yellow-100';
      case 'complete': return 'text-green-500 bg-green-100';
      case 'error': return 'text-red-500 bg-red-100';
      case 'idle': return 'text-gray-500 bg-gray-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'thinking': return 'Thinking...';
      case 'analyzing': return 'Analyzing...';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      case 'idle': return 'Waiting';
      default: return 'Unknown';
    }
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node.id);
    onNodeClick(node.id);
    setActiveTab('details');
    
    addToast({
      message: `Agent selected: ${node.data.label}`,
      type: "success"
    });
  };

  const handlePauseResume = () => {
    if (workflow.isPaused) {
      resumeWorkflow();
      addToast({
        message: "Workflow resumed - agent analysis has been resumed",
        type: "success"
      });
    } else {
      pauseWorkflow();
      addToast({
        message: "Workflow paused - agent analysis has been paused",
        type: "info"
      });
    }
  };

  const selectedNodeData = selectedNode ? getNodeDetails(selectedNode) : null;

  // Legacy node positions for backward compatibility
  const nodePositions: Record<string, { x: number; y: number }> = {
    security: { x: 80, y: 60 },
    quality: { x: 200, y: 60 },
    performance: { x: 320, y: 60 },
    orchestrator: { x: 200, y: 160 },
  };

  return (
    <Card className="p-6 space-y-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-card/50">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                Multi-Agent Analysis
              </h3>
              <p className="text-sm text-muted-foreground">Real-time agent collaboration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-600">
              {isConnected ? 'Live' : 'Demo'}
            </Badge>
          </div>
        </div>
        
        {data.query && (
          <div className="p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30">
            <p className="text-sm font-medium text-slate-300 mb-2">Current Query:</p>
            <p className="text-sm text-slate-200 font-mono bg-slate-700/50 p-2 rounded-md border border-slate-600/50">{data.query}</p>
          </div>
        )}

        {/* Workflow Controls */}
        <div className="flex items-center justify-between p-3 bg-slate-800/95 rounded-lg border border-slate-600">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {workflow.nodes.length} agents
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {workflow.history.length} events
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePauseResume}
              className="flex items-center gap-1"
            >
              {workflow.isPaused ? (
                <>
                  <Play className="h-3 w-3" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Legacy View
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Details
          </TabsTrigger>
        </TabsList>

        {/* New React Flow Workflow View */}
        <TabsContent value="workflow" className="mt-4">
          {workflow.nodes.length > 0 ? (
            <DecisionTree
              workflowData={workflow}
              onNodeClick={handleNodeClick}
              isLive={!workflow.isPaused}
              onPause={pauseWorkflow}
              onResume={resumeWorkflow}
              className="h-[500px]"
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-center">
              <div className="space-y-3">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
                <h4 className="font-medium text-muted-foreground">No Active Workflow</h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  Create a new workflow from the Agent Task Creator above to see real-time agent collaboration here.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Legacy SVG View for Backward Compatibility */}
        <TabsContent value="legacy" className="mt-4">
          <div className="space-y-4">
            <h4 className="font-medium">Legacy Agent Workflow</h4>
            
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-6 min-h-[240px] border border-slate-600">
              <svg width="100%" height="240" className="overflow-visible">
                {/* Draw edges */}
                {data.edges.map((edge, index) => {
                  const from = nodePositions[edge.from];
                  const to = nodePositions[edge.to];
                  if (!from || !to) return null;
                  
                  return (
                    <g key={index}>
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="#e2e8f0"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                      {edge.label && (
                        <text
                          x={(from.x + to.x) / 2}
                          y={(from.y + to.y) / 2 - 5}
                          textAnchor="middle"
                          className="text-xs fill-slate-600"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                
                {/* Arrow marker definition */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#e2e8f0"
                    />
                  </marker>
                </defs>
                
                {/* Draw nodes */}
                {data.nodes.map((node) => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;
                  
                  const Icon = getNodeIcon(node.type);
                  const isActive = node.id === data.currentStep;
                  const isSelected = node.id === selectedNode;
                  
                  return (
                    <g key={node.id}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="30"
                        className={`cursor-pointer transition-all ${
                          node.status === 'thinking' 
                            ? 'fill-blue-100 stroke-blue-500' 
                            : node.status === 'complete'
                            ? 'fill-green-100 stroke-green-500'
                            : 'fill-gray-100 stroke-gray-400'
                        } ${isActive ? 'stroke-4' : 'stroke-2'} ${isSelected ? 'fill-primary/20' : ''}`}
                        onClick={() => {
                          setSelectedNode(node.id);
                          onNodeClick(node.id);
                        }}
                      />
                      {node.status === 'thinking' && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="35"
                          fill="none"
                          stroke="rgb(59 130 246)"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="animate-spin"
                          style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
              
              {/* Node labels positioned absolutely */}
              {data.nodes.map((node) => {
                const pos = nodePositions[node.id];
                if (!pos) return null;
                
                const Icon = getNodeIcon(node.type);
                
                return (
                  <div
                    key={`label-${node.id}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: pos.x, top: pos.y }}
                  >
                    <Icon className="h-4 w-4 text-slate-600" />
                  </div>
                );
              })}
              
              {/* Node info cards */}
              {data.nodes.map((node) => {
                const pos = nodePositions[node.id];
                if (!pos) return null;
                
                return (
                  <div
                    key={`info-${node.id}`}
                    className="absolute transform -translate-x-1/2 pointer-events-none"
                    style={{ left: pos.x, top: pos.y + 45 }}
                  >
                    <div className="text-center">
                                             <p className="text-xs font-medium text-slate-700">{node.type}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs mt-1 ${getStatusColor(node.status)}`}
                      >
                        {getStatusBadge(node.status)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Agent Details View */}
        <TabsContent value="details" className="mt-4">
          {selectedNodeData ? (
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getNodeIcon(selectedNodeData.data.type);
                  return <Icon className="h-6 w-6 text-primary" />;
                })()}
                <div>
                  <h4 className="font-semibold">{selectedNodeData.data.label}</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedNodeData.data.type} Agent
                  </p>
                </div>
                <Badge variant="outline" className={getStatusColor(selectedNodeData.data.status)}>
                  {getStatusBadge(selectedNodeData.data.status)}
                </Badge>
              </div>

              {selectedNodeData.data.thinking && (
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-blue-900 mb-1">Current Thinking:</p>
                  <p className="text-sm text-blue-700 italic">"{selectedNodeData.data.thinking}"</p>
                </div>
              )}

              {selectedNodeData.data.output && (
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm font-medium text-green-900 mb-1">Output:</p>
                  <p className="text-sm text-green-700">{selectedNodeData.data.output}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedNodeData.data.confidence && (
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${selectedNodeData.data.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-medium">
                        {Math.round(selectedNodeData.data.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}
                
                {selectedNodeData.data.duration && (
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">{selectedNodeData.data.duration}ms</p>
                  </div>
                )}
              </div>

              {selectedNodeData.data.reasoning && selectedNodeData.data.reasoning.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Reasoning Steps:</p>
                  <ul className="space-y-1">
                    {selectedNodeData.data.reasoning.map((step, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="font-mono text-xs bg-slate-100 px-1 rounded mt-0.5">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h4 className="font-medium mb-2">No Agent Selected</h4>
              <p className="text-sm">Click on an agent in the workflow to see details</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};