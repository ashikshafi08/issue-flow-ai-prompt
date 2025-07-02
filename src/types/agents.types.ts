export interface AgentNodeData {
  id: string;
  type: 'security' | 'quality' | 'performance' | 'orchestrator' | 'memory';
  status: 'idle' | 'thinking' | 'analyzing' | 'complete' | 'error';
  label: string;
  output?: string;
  confidence?: number;
  duration?: number;
  icon?: any;
  thinking?: string;
  reasoning?: string[];
  progress?: number;
}

export interface WorkflowState {
  nodes: AgentWorkflowNode[];
  edges: AgentWorkflowEdge[];
  activeNodeId: string | null;
  isPaused: boolean;
  history: WorkflowHistoryPoint[];
}

export interface AgentWorkflowNode {
  id: string;
  type: 'agent';
  position: { x: number; y: number };
  data: AgentNodeData;
}

export interface AgentWorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: 'animated';
  data: {
    label?: string;
    isActive: boolean;
    confidence?: number;
  };
}

export interface WorkflowHistoryPoint {
  timestamp: Date;
  action: 'started' | 'thinking' | 'analyzing' | 'completed' | 'error' | 'decision_made';
  nodeId: string;
  data: any;
  confidence?: number;
  duration?: number;
}

export interface DecisionPoint {
  id: string;
  agentId: string;
  timestamp: Date;
  decision: string;
  confidence: number;
  reasoning: string[];
  alternatives: Array<{
    option: string;
    confidence: number;
    rejected_reason: string;
  }>;
}

export interface AgentCapability {
  type: string;
  description: string;
  confidence: number;
  tools: string[];
}

export interface WorkflowMetrics {
  totalDuration: number;
  agentCount: number;
  decisionsCount: number;
  averageConfidence: number;
  successRate: number;
} 