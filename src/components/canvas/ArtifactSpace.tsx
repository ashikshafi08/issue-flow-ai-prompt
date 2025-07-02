import React, { useState } from 'react';
import { Artifact } from '@/types/canvas.types';
import { LegacyAnalysisArtifact } from '@/components/artifacts/LegacyAnalysisArtifact';
import { AgentFlowArtifact } from '@/components/artifacts/AgentFlowArtifact';
import { MemoryTimelineArtifact } from '@/components/artifacts/MemoryTimelineArtifact';
import AgentInterface from '@/components/AgentInterface';
import { WorkflowManager } from '@/components/agents/WorkflowManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { 
  AlertTriangle, 
  Bot, 
  Brain, 
  Sparkles,
  Clock,
  Zap,
  Eye,
  GitBranch
} from 'lucide-react';

interface ArtifactSpaceProps {
  artifacts: Artifact[];
  sessionId: string;
  onFileSelect: (filePath: string) => void;
  onAgentWorkflowCreated?: (workflowData: any) => void;
  className?: string;
}

export const ArtifactSpace: React.FC<ArtifactSpaceProps> = ({
  artifacts,
  sessionId,
  onFileSelect,
  onAgentWorkflowCreated,
  className
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { addToast } = useToast();
  
  const handleTimePointClick = (day: number) => {
    addToast({
      message: `Memory snapshot for Day ${day} - ${Math.round(day * 23 + 100)} patterns learned`,
      type: 'info'
    });
  };
  
  const handleNodeClick = (nodeId: string) => {
    addToast({
      message: `Agent ${nodeId} selected - viewing execution details`,
      type: 'info'
    });
  };
  
  const handleDrillDown = (section: string) => {
    addToast({
      message: `Loading ${section} details...`,
      type: 'info'
    });
  };

  const legacyArtifacts = artifacts.filter(a => a.type === 'legacy_analysis');
  const agentArtifacts = artifacts.filter(a => a.type === 'agent_flow');
  const memoryArtifacts = artifacts.filter(a => a.type === 'memory_timeline');

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'legacy': return <AlertTriangle className="h-4 w-4" />;
      case 'agents': return <Bot className="h-4 w-4" />;
      case 'memory': return <Brain className="h-4 w-4" />;
      case 'control': return <Zap className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTabBadgeCount = (type: string) => {
    switch (type) {
      case 'legacy': return legacyArtifacts.length;
      case 'agents': return agentArtifacts.length;
      case 'memory': return memoryArtifacts.length;
      default: return artifacts.length;
    }
  };

  if (artifacts.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full bg-muted/30 p-8",
        className
      )}>
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Repository Canvas Ready</h3>
          <p className="text-muted-foreground text-sm">
            Ask questions about your repository and watch as intelligent artifacts appear here.
            Use the Control tab to trigger agent workflows, then view results in real-time.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
              Agent Control
            </Badge>
            <Badge variant="outline">Legacy Analysis</Badge>
            <Badge variant="outline">Agent Workflows</Badge>
            <Badge variant="outline">Memory Timeline</Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-5 w-full mx-4 mt-4 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:text-slate-100 font-medium transition-all duration-200"
          >
            <div className={cn(
              "w-4 h-4 rounded-sm flex items-center justify-center transition-colors",
              activeTab === "overview" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {getTabIcon('overview')}
            </div>
            <span className="hidden sm:inline">Overview</span>
            {artifacts.length > 0 && (
              <Badge variant="secondary" className={cn(
                "ml-1 h-5 text-xs transition-colors",
                activeTab === "overview" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {artifacts.length}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="control" 
            className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:text-slate-100 font-medium transition-all duration-200"
          >
            <div className={cn(
              "w-4 h-4 rounded-sm flex items-center justify-center transition-colors",
              activeTab === "control" ? "bg-purple-500 text-white" : "bg-muted"
            )}>
              {getTabIcon('control')}
            </div>
            <span className="hidden sm:inline">Control</span>
            <Badge variant="secondary" className={cn(
              "ml-1 h-5 text-xs transition-colors",
              activeTab === "control" ? "bg-purple-500/10 text-purple-700" : "bg-muted text-muted-foreground"
            )}>
              Live
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="legacy" 
            className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:text-slate-100 font-medium transition-all duration-200"
          >
            <div className={cn(
              "w-4 h-4 rounded-sm flex items-center justify-center transition-colors",
              activeTab === "legacy" ? "bg-yellow-500 text-white" : "bg-muted"
            )}>
              {getTabIcon('legacy')}
            </div>
            <span className="hidden sm:inline">Legacy</span>
            {legacyArtifacts.length > 0 && (
              <Badge variant="secondary" className={cn(
                "ml-1 h-5 text-xs transition-colors",
                activeTab === "legacy" ? "bg-yellow-500/10 text-yellow-700" : "bg-muted text-muted-foreground"
              )}>
                {legacyArtifacts.length}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="agents" 
            className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:text-slate-100 font-medium transition-all duration-200"
          >
            <div className={cn(
              "w-4 h-4 rounded-sm flex items-center justify-center transition-colors",
              activeTab === "agents" ? "bg-blue-500 text-white" : "bg-muted"
            )}>
              {getTabIcon('agents')}
            </div>
            <span className="hidden sm:inline">Agents</span>
            {agentArtifacts.length > 0 && (
              <Badge variant="secondary" className={cn(
                "ml-1 h-5 text-xs transition-colors",
                activeTab === "agents" ? "bg-blue-500/10 text-blue-700" : "bg-muted text-muted-foreground"
              )}>
                {agentArtifacts.length}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="memory" 
            className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:text-slate-100 font-medium transition-all duration-200"
          >
            <div className={cn(
              "w-4 h-4 rounded-sm flex items-center justify-center transition-colors",
              activeTab === "memory" ? "bg-green-500 text-white" : "bg-muted"
            )}>
              {getTabIcon('memory')}
            </div>
            <span className="hidden sm:inline">Memory</span>
            {memoryArtifacts.length > 0 && (
              <Badge variant="secondary" className={cn(
                "ml-1 h-5 text-xs transition-colors",
                activeTab === "memory" ? "bg-green-500/10 text-green-700" : "bg-muted text-muted-foreground"
              )}>
                {memoryArtifacts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)] px-4">
            <div className="space-y-6 pb-6">
              {/* Latest from each category */}
              {legacyArtifacts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <h3 className="font-medium">Legacy Analysis</h3>
                    <Badge variant="outline" className="text-xs">Latest</Badge>
                  </div>
                  <LegacyAnalysisArtifact
                    data={legacyArtifacts[legacyArtifacts.length - 1].data}
                    onDrillDown={handleDrillDown}
                  />
                </div>
              )}

              {agentArtifacts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    <h3 className="font-medium">Agent Analysis</h3>
                    <Badge variant="outline" className="text-xs">Live</Badge>
                  </div>
                  <AgentFlowArtifact
                    data={agentArtifacts[agentArtifacts.length - 1].data}
                    onNodeClick={handleNodeClick}
                  />
                </div>
              )}

              {memoryArtifacts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-green-500" />
                    <h3 className="font-medium">Learning Progress</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Updated 2m ago
                    </div>
                  </div>
                  <MemoryTimelineArtifact
                    data={memoryArtifacts[memoryArtifacts.length - 1].data}
                    onTimePointClick={handleTimePointClick}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="control" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)] px-4">
                          <div className="space-y-6 pb-6">
                <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/20 dark:via-background dark:to-blue-950/20 p-6">
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                        <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">Agent Control Center</h3>
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mr-1 animate-pulse" />
                            Interactive
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Trigger individual agent tasks or run multi-agent workflows. 
                          Results will appear in the Agents tab as interactive visualizations.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs bg-slate-700/50 dark:bg-slate-800/50">
                        <Bot className="h-3 w-3 mr-1" />
                        Multi-Agent Orchestration
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-slate-700/50 dark:bg-slate-800/50">
                        <GitBranch className="h-3 w-3 mr-1" />
                        Real-time Visualization
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-slate-700/50 dark:bg-slate-800/50">
                        <Clock className="h-3 w-3 mr-1" />
                        Live Progress Tracking
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-purple-200/30 to-blue-200/30 dark:from-purple-800/10 dark:to-blue-800/10 -translate-y-16 translate-x-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-800/10 dark:to-purple-800/10 translate-y-12 -translate-x-12" />
                </div>
                
                <AgentInterface 
                  sessionId={sessionId} 
                  onWorkflowCreated={onAgentWorkflowCreated}
                />
              </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="legacy" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)] px-4">
            <div className="space-y-4 pb-6">
              {legacyArtifacts.map((artifact) => (
                <LegacyAnalysisArtifact
                  key={artifact.id}
                  data={artifact.data}
                  onDrillDown={handleDrillDown}
                />
              ))}
              {legacyArtifacts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No legacy analysis artifacts yet. Ask about code complexity or technical debt to see analysis here.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="agents" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)] px-4">
            <div className="space-y-6 pb-6">
              {/* Workflow Management */}
              <WorkflowManager 
                sessionId={sessionId}
                onWorkflowSelected={(workflowId) => {
                  addToast({
                    title: "Workflow Selected",
                    description: `Selected workflow: ${workflowId}`,
                    type: "info"
                  });
                }}
              />
              
              {/* Live Agent Workflow Visualization */}
              {agentArtifacts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    <h3 className="font-medium">Workflow Visualizations</h3>
                    <Badge variant="outline" className="text-xs">Saved Artifacts</Badge>
                  </div>
                  {agentArtifacts.map((artifact) => (
                    <AgentFlowArtifact
                      key={artifact.id}
                      data={artifact.data}
                      onNodeClick={handleNodeClick}
                      sessionId={sessionId}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="memory" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)] px-4">
            <div className="space-y-4 pb-6">
              {memoryArtifacts.map((artifact) => (
                <MemoryTimelineArtifact
                  key={artifact.id}
                  data={artifact.data}
                  onTimePointClick={handleTimePointClick}
                />
              ))}
              {memoryArtifacts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Memory timeline will appear as the system learns from your interactions.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      {/* Toast notifications handled by useToast hook */}
    </div>
  );
};