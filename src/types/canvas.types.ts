// Canvas-specific TypeScript interfaces
export interface Artifact {
  id: string;
  type: 'legacy_analysis' | 'agent_flow' | 'memory_timeline';
  data: any;
  createdAt: Date;
  updatedAt: Date;
  sessionId: string;
}

export interface LegacyAnalysisData {
  complexityScore: number;
  technicalDebt: {
    amount: number;
    currency: string;
  };
  modernizationPath: {
    phases: Array<{
      name: string;
      duration: string;
      risk: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
  codeMetrics: {
    loc: number;
    files: number;
    dependencies: number;
    outdatedDeps: number;
  };
}

export interface AgentNode {
  id: string;
  type: 'security' | 'quality' | 'performance' | 'orchestrator';
  status: 'idle' | 'thinking' | 'complete';
  output?: string;
}

export interface AgentFlowData {
  query: string;
  nodes: AgentNode[];
  edges: Array<{ from: string; to: string; label?: string }>;
  currentStep: string;
}

export interface MemoryData {
  timeline: Array<{
    day: number;
    patterns: number;
    successRate: number;
    responseTime: number;
  }>;
  currentStats: {
    totalPatterns: number;
    learningVelocity: number;
    querySuccessRate: number;
    avgResponseTime: number;
  };
  predictions: {
    day30Patterns: number;
    day30SuccessRate: number;
  };
}

export interface WebSocketMessage {
  type: 'analysis_update' | 'new_artifact' | 'agent_status' | 'memory_update';
  payload: any;
}

export interface CanvasLayoutConfig {
  chatWidth: number;
  artifactWidth: number;
  isCollapsed: boolean;
  isMobile: boolean;
}