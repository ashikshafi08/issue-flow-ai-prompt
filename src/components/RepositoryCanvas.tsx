import React, { useState, useEffect, useCallback } from 'react';
import { ChatPanel } from './canvas/ChatPanel';
import { ArtifactSpace } from './canvas/ArtifactSpace';
import { CanvasHeader } from './canvas/CanvasHeader';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useArtifactState } from '@/hooks/useArtifactState';
import { useCanvasLayout } from '@/hooks/useCanvasLayout';
import { Session, ChatMessage } from '@/pages/Assistant';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { LegacyAnalysisData, AgentFlowData, MemoryData } from '@/types/canvas.types';

interface RepositoryCanvasProps {
  session: Session;
  onUpdateSessionMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
  onCloseFileViewer: () => void;
}

export const RepositoryCanvas: React.FC<RepositoryCanvasProps> = ({
  session,
  onUpdateSessionMessages,
  selectedFile,
  onFileSelect,
  onCloseFileViewer
}) => {
  const { artifacts, updateArtifact, addArtifact } = useArtifactState(session.id);
  
  // Handler for creating new agent workflow from AgentInterface
  const handleAgentWorkflowCreated = useCallback((workflowData: any) => {
    const newArtifact = {
      id: `agent-flow-${Date.now()}`,
      type: 'agent_flow' as const,
      sessionId: session.id,
      data: {
        query: workflowData.query || 'Agent workflow execution',
        nodes: workflowData.agents?.map((agent: any, index: number) => ({
          id: agent.id || agent.agent_type,
          type: agent.agent_type,
          status: agent.status || 'thinking',
          output: agent.response
        })) || [],
        edges: workflowData.connections || [],
        currentStep: workflowData.currentAgent || 'orchestrator',
        workflowType: workflowData.workflow_type,
        agents_used: workflowData.agents_used,
        results: workflowData.results
      } as AgentFlowData,
    };
    
    addArtifact(newArtifact);
    
    // Show a system message about the new workflow
    const workflowMessage = {
      role: 'assistant' as const,
      content: `🤖 **Agent Workflow Started**\n\nType: ${workflowData.workflow_type || 'Custom workflow'}\nAgents: ${workflowData.agents_used?.join(', ') || 'Multiple agents'}\n\n*View progress in the Agents tab*`,
      timestamp: Date.now(),
      type: 'status' as const
    };
    
    onUpdateSessionMessages(prev => [...prev, workflowMessage]);
  }, [session.id, addArtifact, onUpdateSessionMessages]);
  const { layout, toggleCollapse, setSplitRatio } = useCanvasLayout();
  const [showArtifacts, setShowArtifacts] = useState(true);

  const ws = useWebSocket(session.id, {
    onAnalysisUpdate: (data) => {
      console.log('Analysis update received:', data);
      updateArtifact(data.artifactId, data);
    },
    onNewArtifact: (artifact) => {
      console.log('New artifact received:', artifact);
      addArtifact(artifact);
    },
    onAgentStatus: (status) => {
      console.log('Agent status update:', status);
      // Update agent flow artifact if exists
      const agentArtifact = artifacts.find(a => a.type === 'agent_flow');
      if (agentArtifact) {
        updateArtifact(agentArtifact.id, { data: { ...agentArtifact.data, ...status } });
      }
    },
    onMemoryUpdate: (memory) => {
      console.log('Memory update received:', memory);
      // Update memory timeline artifact if exists
      const memoryArtifact = artifacts.find(a => a.type === 'memory_timeline');
      if (memoryArtifact) {
        updateArtifact(memoryArtifact.id, { data: memory });
      }
    },
  });

  // Initialize with mock artifacts for demo purposes
  useEffect(() => {
    if (artifacts.length === 0) {
      // Add legacy analysis artifact
      addArtifact({
        id: 'legacy-analysis-1',
        type: 'legacy_analysis',
        sessionId: session.id,
        data: {
          complexityScore: 8.2,
          technicalDebt: {
            amount: 2300000,
            currency: '$',
          },
          modernizationPath: {
            phases: [
              {
                name: 'Architecture Assessment',
                duration: '2-3 weeks',
                risk: 'low' as const,
                description: 'Analyze current architecture and identify modernization opportunities',
              },
              {
                name: 'Dependency Modernization',
                duration: '4-6 weeks',
                risk: 'medium' as const,
                description: 'Update critical dependencies and refactor legacy patterns',
              },
              {
                name: 'Core System Migration',
                duration: '8-12 weeks',
                risk: 'high' as const,
                description: 'Migrate core business logic to modern frameworks',
              },
            ],
          },
          codeMetrics: {
            loc: 145000,
            files: 432,
            dependencies: 89,
            outdatedDeps: 23,
          },
        } as LegacyAnalysisData,
      });

      // Add agent flow artifact
      addArtifact({
        id: 'agent-flow-1',
        type: 'agent_flow',
        sessionId: session.id,
        data: {
          query: 'Analyze security vulnerabilities in authentication system',
          nodes: [
            { id: 'security', type: 'security', status: 'complete' },
            { id: 'quality', type: 'quality', status: 'thinking' },
            { id: 'performance', type: 'performance', status: 'idle' },
            { id: 'orchestrator', type: 'orchestrator', status: 'idle' },
          ],
          edges: [
            { from: 'security', to: 'orchestrator', label: 'Security OK' },
            { from: 'quality', to: 'orchestrator', label: 'Analyzing...' },
            { from: 'performance', to: 'orchestrator' },
          ],
          currentStep: 'quality',
        } as AgentFlowData,
      });

      // Add memory timeline artifact
      addArtifact({
        id: 'memory-timeline-1',
        type: 'memory_timeline',
        sessionId: session.id,
        data: {
          timeline: [
            { day: 1, patterns: 23, successRate: 65, responseTime: 2.8 },
            { day: 7, patterns: 341, successRate: 78, responseTime: 1.9 },
            { day: 14, patterns: 1247, successRate: 84, responseTime: 1.2 },
            { day: 21, patterns: 2856, successRate: 89, responseTime: 0.9 },
            { day: 30, patterns: 4721, successRate: 92, responseTime: 0.8 },
          ],
          currentStats: {
            totalPatterns: 4721,
            learningVelocity: 156,
            querySuccessRate: 92,
            avgResponseTime: 0.8,
          },
          predictions: {
            day30Patterns: 8500,
            day30SuccessRate: 95,
          },
        } as MemoryData,
      });
    }
  }, [session.id, artifacts.length, addArtifact]);

  if (layout.isMobile) {
    return (
      <div className="flex flex-col h-full bg-background">
        <CanvasHeader 
          title={session.title}
          repoUrl={session.repoUrl}
          onToggleArtifacts={() => setShowArtifacts(!showArtifacts)}
          showingArtifacts={showArtifacts}
          isMobile={true}
        />
        
        {showArtifacts ? (
          <ArtifactSpace
            artifacts={artifacts}
            sessionId={session.id}
            onFileSelect={onFileSelect}
            onAgentWorkflowCreated={handleAgentWorkflowCreated}
            className="flex-1"
          />
        ) : (
          <ChatPanel
            session={session}
            onUpdateMessages={onUpdateSessionMessages}
            isCollapsed={false}
            className="flex-1"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <CanvasHeader 
        title={session.title}
        repoUrl={session.repoUrl}
        onToggleCollapse={toggleCollapse}
        isCollapsed={layout.isCollapsed}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel 
          defaultSize={layout.chatWidth} 
          minSize={20}
          maxSize={60}
          className="min-w-0"
        >
          <ChatPanel
            session={session}
            onUpdateMessages={onUpdateSessionMessages}
            isCollapsed={layout.isCollapsed}
            className="h-full"
          />
        </ResizablePanel>
        
        <ResizableHandle className="w-2 bg-border hover:bg-primary/20 transition-colors" />
        
        <ResizablePanel 
          defaultSize={layout.artifactWidth}
          minSize={40}
          className="min-w-0"
        >
          <ArtifactSpace
            artifacts={artifacts}
            sessionId={session.id}
            onFileSelect={onFileSelect}
            onAgentWorkflowCreated={handleAgentWorkflowCreated}
            className="h-full"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};