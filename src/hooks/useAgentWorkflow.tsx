import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { WorkflowState, AgentNodeData, WorkflowHistoryPoint } from '@/types/agents.types';
import { createWorkflow, executeWorkflow, getWorkflowStatus, connectWorkflowWebSocket } from '@/lib/api';
import type { CreateWorkflowRequest, ExecuteWorkflowRequest } from '@/lib/api';

interface AgentStatusUpdate {
  agents: Array<{
    id: string;
    name: string;
    type: 'security' | 'quality' | 'performance' | 'orchestrator' | 'memory';
    status: 'idle' | 'thinking' | 'analyzing' | 'complete' | 'error';
    output?: string;
    confidence?: number;
    duration?: number;
    thinking?: string;
    reasoning?: string[];
    progress?: number;
  }>;
  connections?: Array<{
    from: string;
    to: string;
    label?: string;
    active: boolean;
    confidence?: number;
  }>;
  currentAgent: string;
  workflowId: string;
}

export const useAgentWorkflow = (sessionId: string | undefined) => {
  const [workflow, setWorkflow] = useState<WorkflowState>({
    nodes: [],
    edges: [],
    activeNodeId: null,
    isPaused: false,
    history: [],
  });
  
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  const workflowRef = useRef(workflow);
  workflowRef.current = workflow;

  const updateWorkflowFromStatus = useCallback((status: AgentStatusUpdate) => {
    setWorkflow(prev => {
      // Calculate positions for agents in a circular layout
      const newNodes = status.agents.map((agent, index) => {
        const position = calculateNodePosition(index, status.agents.length);
        
        return {
          id: agent.id,
          type: 'agent' as const,
          position,
          data: {
            ...agent,
            label: agent.name,
          } as AgentNodeData,
        };
      });

      // Create edges based on connections
      const newEdges = (status.connections || []).map((conn, index) => ({
        id: `edge-${conn.from}-${conn.to}`,
        source: conn.from,
        target: conn.to,
        type: 'animated' as const,
        animated: conn.active,
        data: {
          label: conn.label,
          isActive: conn.active,
          confidence: conn.confidence,
        },
      }));

      // Add to history
      const historyPoint: WorkflowHistoryPoint = {
        timestamp: new Date(),
        action: 'decision_made',
        nodeId: status.currentAgent,
        data: status,
      };

      return {
        ...prev,
        nodes: newNodes,
        edges: newEdges,
        activeNodeId: status.currentAgent,
        history: [...prev.history.slice(-50), historyPoint], // Keep last 50 entries
      };
    });
  }, []);

  // Real WebSocket connection and API calls
  const [isConnected, setIsConnected] = useState(false);
  
  const sendMessage = useCallback((type: string, payload: any) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type, ...payload }));
    }
  }, []);

  const calculateNodePosition = (index: number, total: number) => {
    if (total === 1) {
      return { x: 400, y: 300 };
    }

    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(200 + (total * 10), 300); // Dynamic radius based on agent count
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const pauseWorkflow = useCallback(() => {
    sendMessage('pause_workflow', { sessionId });
    setWorkflow(prev => ({ ...prev, isPaused: true }));
  }, [sessionId, sendMessage]);

  const resumeWorkflow = useCallback(() => {
    sendMessage('resume_workflow', { sessionId });
    setWorkflow(prev => ({ ...prev, isPaused: false }));
  }, [sessionId, sendMessage]);

  const getNodeDetails = useCallback((nodeId: string) => {
    return workflow.nodes.find(node => node.id === nodeId);
  }, [workflow.nodes]);

  const getAgentHistory = useCallback((nodeId: string) => {
    return workflow.history.filter(point => point.nodeId === nodeId);
  }, [workflow.history]);

  const resetWorkflow = useCallback(() => {
    setWorkflow({
      nodes: [],
      edges: [],
      activeNodeId: null,
      isPaused: false,
      history: [],
    });
  }, []);

  // Simulate agent thinking updates for demo purposes
  const simulateAgentThinking = useCallback((agentId: string, thinking: string, progress: number) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === agentId 
          ? {
              ...node,
              data: {
                ...node.data,
                thinking,
                progress,
                status: progress < 1 ? 'thinking' : 'complete',
              }
            }
          : node
      ),
    }));
  }, []);

  // Create real workflow using API
  const createRealWorkflow = useCallback(async (workflowType: 'linear_swarm' | 'orchestrator' | 'custom_planner' = 'linear_swarm', query: string = 'Analyze the repository for code quality issues') => {
    if (!sessionId) {
      throw new Error('Session ID is required to create workflow');
    }
    
    try {
      // Create workflow using real API
      const createRequest: CreateWorkflowRequest = {
        workflow_type: workflowType,
        name: `${workflowType.replace('_', ' ')} Analysis`,
      };

      const workflowResponse = await createWorkflow(sessionId, createRequest);
      setCurrentWorkflowId(workflowResponse.workflow_id);

      // Initialize workflow visualization with the created agents
      const initialAgents = workflowResponse.config?.agents?.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        type: agent.specialization === 'orchestration' ? 'orchestrator' : 
              agent.specialization === 'code_analysis' ? 'security' :
              agent.specialization === 'issue_resolution' ? 'quality' :
              agent.specialization === 'testing_qa' ? 'performance' : 'memory',
        status: 'idle' as const,
        thinking: `Initializing ${agent.name}...`,
        progress: 0,
        confidence: 0,
      })) || [];

      const initialConnections = initialAgents.length > 1 ? initialAgents.slice(0, -1).map((agent: any, index: number) => ({
        from: agent.id,
        to: initialAgents[index + 1].id,
        active: false,
        label: 'Handoff'
      })) : [];

      updateWorkflowFromStatus({
        agents: initialAgents,
        connections: initialConnections,
        currentAgent: initialAgents[0]?.id || '',
        workflowId: workflowResponse.workflow_id,
      });

      // Connect WebSocket for real-time updates
      if (websocketRef.current) {
        websocketRef.current.close();
      }

      websocketRef.current = connectWorkflowWebSocket(sessionId, workflowResponse.workflow_id, (data) => {
        console.log('Workflow WebSocket message:', data);
        
        // Update workflow state based on WebSocket messages
        if (data.type === 'workflow_status') {
          // Handle workflow status updates
          updateWorkflowFromStatus({
            agents: data.agents || [],
            connections: data.connections || [],
            currentAgent: data.current_agent || '',
            workflowId: workflowResponse.workflow_id,
          });
        } else if (data.type === 'agent_update') {
          // Handle agent status updates
          updateWorkflowFromStatus({
            agents: data.agents || [],
            connections: data.connections || [],
            currentAgent: data.current_agent || '',
            workflowId: workflowResponse.workflow_id,
          });
        }
      });

      websocketRef.current.onopen = () => {
        setIsConnected(true);
      };

      websocketRef.current.onclose = () => {
        setIsConnected(false);
      };

      // Execute the workflow
      const executeRequest: ExecuteWorkflowRequest = {
        query: query,
        context: {}
      };

      await executeWorkflow(sessionId, workflowResponse.workflow_id, executeRequest);

      return workflowResponse.workflow_id;
    } catch (error) {
      console.error('Failed to create real workflow:', error);
      throw error;
    }
  }, [sessionId]);

  // Create mock workflow for testing
  const createMockWorkflow = useCallback(() => {
    const mockAgents = [
      {
        id: 'security-1',
        name: 'Security Specialist',
        type: 'security' as const,
        status: 'thinking' as const,
        thinking: 'Analyzing potential security vulnerabilities...',
        progress: 0.7,
        confidence: 0.85,
      },
      {
        id: 'quality-1', 
        name: 'Quality Architect',
        type: 'quality' as const,
        status: 'complete' as const,
        output: 'Code quality assessment complete. Found 3 areas for improvement.',
        confidence: 0.92,
        duration: 1250,
      },
      {
        id: 'performance-1',
        name: 'Performance Optimizer',
        type: 'performance' as const,
        status: 'analyzing' as const,
        thinking: 'Profiling memory usage patterns...',
        progress: 0.45,
        confidence: 0.78,
      },
      {
        id: 'orchestrator-1',
        name: 'Safety Orchestrator',
        type: 'orchestrator' as const,
        status: 'idle' as const,
      },
    ];

    const mockConnections = [
      { from: 'security-1', to: 'quality-1', active: true, label: 'Security Report' },
      { from: 'quality-1', to: 'performance-1', active: true, label: 'Quality Metrics' },
      { from: 'performance-1', to: 'orchestrator-1', active: false, label: 'Performance Data' },
    ];

    updateWorkflowFromStatus({
      agents: mockAgents,
      connections: mockConnections,
      currentAgent: 'security-1',
      workflowId: 'mock-workflow-' + Date.now(),
    });
  }, [updateWorkflowFromStatus]);

  return {
    workflow,
    pauseWorkflow,
    resumeWorkflow,
    resetWorkflow,
    getNodeDetails,
    getAgentHistory,
    simulateAgentThinking,
    createMockWorkflow,
    createRealWorkflow,
    isConnected,
    currentWorkflowId,
  };
}; 