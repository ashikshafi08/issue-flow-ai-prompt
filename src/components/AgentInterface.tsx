import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Bot, Search, TestTube, Bug, Zap, CheckCircle, XCircle, Play, Pause, Square, RotateCcw, GitBranch, Clock, ChevronRight, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  getAvailableTools, 
  getLlamaWorkflows, 
  createAndExecuteWorkflow, 
  pauseWorkflow as apiPauseWorkflow, 
  resumeWorkflow as apiResumeWorkflow, 
  runAgentTask as apiRunAgentTask, 
  runAgentWorkflow as apiRunAgentWorkflow,
  createWorkflowWebSocket,
  type Tool,
  type AgentTaskResponse,
  type WorkflowResponse,
  type LlamaIndexWorkflow
} from "@/lib/api";

interface AgentInterfaceProps {
  sessionId: string;
  onWorkflowCreated?: (workflowData: any) => void;
}

const AgentInterface: React.FC<AgentInterfaceProps> = ({ sessionId, onWorkflowCreated }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [agentQuery, setAgentQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('code_analysis');
  const [selectedModel, setSelectedModel] = useState('');
  const [response, setResponse] = useState<AgentTaskResponse | null>(null);
  const [workflowResponse, setWorkflowResponse] = useState<WorkflowResponse | null>(null);
  const [focusAreas, setFocusAreas] = useState<string[]>(['security', 'performance', 'maintainability']);
  
  // New LlamaIndex Workflow state
  const [llamaWorkflows, setLlamaWorkflows] = useState<LlamaIndexWorkflow[]>([]);
  const [selectedWorkflowType, setSelectedWorkflowType] = useState<'linear_swarm' | 'orchestrator' | 'custom_planner'>('linear_swarm');
  const [workflowQuery, setWorkflowQuery] = useState('');
  const [activeWorkflow, setActiveWorkflow] = useState<LlamaIndexWorkflow | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableTools();
    fetchLlamaWorkflows();
  }, [sessionId]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [websocket]);

  const fetchAvailableTools = async () => {
    try {
      const tools = await getAvailableTools(sessionId);
      setTools(tools);
    } catch (error) {
      console.error('Error fetching tools:', error);
    }
  };

  const fetchLlamaWorkflows = async () => {
    try {
      const workflows = await getLlamaWorkflows(sessionId);
      setLlamaWorkflows(workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const createLlamaWorkflow = async () => {
    console.log('createLlamaWorkflow called!');
    console.log('workflowQuery:', workflowQuery);
    console.log('selectedWorkflowType:', selectedWorkflowType);
    console.log('workflowLoading:', workflowLoading);
    
    if (!workflowQuery.trim()) {
      console.log('Workflow query is empty, showing error toast');
      toast({
        title: "Error",
        description: "Please enter a query for the workflow",
        variant: "destructive"
      });
      return;
    }

    console.log('Setting workflow loading to true');
    setWorkflowLoading(true);
    try {
      const { workflow, executionResult } = await createAndExecuteWorkflow(
        sessionId, 
        selectedWorkflowType, 
        workflowQuery,
        `${selectedWorkflowType.replace('_', ' ')} Analysis`
      );
      
      // Set active workflow and start WebSocket connection
      const workflowData = {
        ...workflow,
        status: 'running'
      };
      setActiveWorkflow(workflowData);
      connectToWorkflowWebSocket(workflow.workflow_id);
      
      // Create artifact for visualization
      if (onWorkflowCreated) {
        onWorkflowCreated({
          workflow_type: 'llamaindex_workflow',
          workflow_id: workflow.workflow_id,
          workflow_config: selectedWorkflowType,
          query: workflowQuery,
          status: 'running'
        });
      }
      
      toast({
        title: "Success",
        description: `${selectedWorkflowType} workflow started`,
      });

      // Refresh workflows list
      fetchLlamaWorkflows();
      
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive"
      });
    } finally {
      setWorkflowLoading(false);
    }
  };

  const connectToWorkflowWebSocket = (workflowId: string) => {
    if (websocket) {
      websocket.close();
    }

    const ws = createWorkflowWebSocket(sessionId, workflowId);
    
    ws.onopen = () => {
      console.log('Workflow WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'workflow_status') {
          setActiveWorkflow(prev => prev ? { ...prev, status: data.status } : null);
        } else if (data.type === 'workflow_completed') {
          setActiveWorkflow(prev => prev ? { ...prev, status: 'completed' } : null);
          fetchLlamaWorkflows();
          
          toast({
            title: "Workflow Completed",
            description: "The workflow has finished execution",
          });
        } else if (data.type === 'workflow_failed') {
          setActiveWorkflow(prev => prev ? { ...prev, status: 'failed' } : null);
          
          toast({
            title: "Workflow Failed",
            description: data.data?.error || "The workflow encountered an error",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('Workflow WebSocket disconnected');
    };
    
    setWebsocket(ws);
  };

  const pauseWorkflow = async (workflowId: string) => {
    try {
      await apiPauseWorkflow(sessionId, workflowId);
      setActiveWorkflow(prev => prev ? { ...prev, status: 'paused' } : null);
      toast({
        title: "Workflow Paused",
        description: "The workflow has been paused",
      });
    } catch (error) {
      console.error('Error pausing workflow:', error);
      toast({
        title: "Error",
        description: "Failed to pause workflow",
        variant: "destructive"
      });
    }
  };

  const resumeWorkflow = async (workflowId: string) => {
    try {
      await apiResumeWorkflow(sessionId, workflowId);
      setActiveWorkflow(prev => prev ? { ...prev, status: 'running' } : null);
      toast({
        title: "Workflow Resumed",
        description: "The workflow has been resumed",
      });
    } catch (error) {
      console.error('Error resuming workflow:', error);
      toast({
        title: "Error",
        description: "Failed to resume workflow",
        variant: "destructive"
      });
    }
  };

  const runAgentTask = async () => {
    if (!agentQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a query for the agent",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const data = await apiRunAgentTask(sessionId, selectedAgent, agentQuery, selectedModel);
      setResponse(data);
      
      // Create agent workflow artifact for single agent tasks too
      if (onWorkflowCreated && data.status === 'success') {
        onWorkflowCreated({
          workflow_type: 'single_agent',
          agents_used: [data.agent_type],
          results: { [data.agent_type]: data.response },
          query: agentQuery,
          agents: [{ 
            id: data.agent_type, 
            agent_type: data.agent_type, 
            status: 'complete',
            response: data.response 
          }]
        });
      }
      
      toast({
        title: "Success",
        description: `${selectedAgent} agent completed the task`,
      });
    } catch (error) {
      console.error('Error running agent task:', error);
      toast({
        title: "Error",
        description: "Failed to run agent task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runWorkflow = async (workflowType: string) => {
    setWorkflowLoading(true);
    setWorkflowResponse(null);

    try {
      const data = await apiRunAgentWorkflow(
        sessionId, 
        workflowType, 
        selectedModel,
        workflowType === 'quality_audit' ? focusAreas : undefined
      );
      setWorkflowResponse(data);
      
      // Create agent workflow artifact when workflow completes
      if (onWorkflowCreated && data.status === 'success') {
        onWorkflowCreated({
          workflow_type: workflowType,
          agents_used: data.agents_used,
          results: data.results,
          query: `${workflowType} analysis`,
          focus_areas: workflowType === 'quality_audit' ? focusAreas : undefined
        });
      }
      
      toast({
        title: "Success",
        description: `${workflowType} workflow completed`,
      });
    } catch (error) {
      console.error('Error running workflow:', error);
      toast({
        title: "Error",
        description: "Failed to run workflow",
        variant: "destructive"
      });
    } finally {
      setWorkflowLoading(false);
    }
  };

  const agentIcons = {
    code_analysis: <Search className="h-4 w-4" />,
    issue_resolution: <Bug className="h-4 w-4" />,
    testing: <TestTube className="h-4 w-4" />
  };

  const agentDescriptions = {
    code_analysis: "Analyze repository structure, search patterns, and examine code quality",
    issue_resolution: "Resolve GitHub issues with comprehensive analysis and solutions",
    testing: "Create test strategies, analyze coverage, and ensure quality assurance"
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Agent Interface
          </CardTitle>
          <CardDescription>
            Use specialized AI agents to analyze code, resolve issues, and improve quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="llamaindex-workflows" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="single-agent">Single Agent Task</TabsTrigger>
              <TabsTrigger value="llamaindex-workflows">LlamaIndex Workflows</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="workflows">Legacy Workflows</TabsTrigger>
            </TabsList>

            <TabsContent value="single-agent" className="space-y-6">
              {/* Agent Selection Cards */}
              <div>
                <label className="text-sm font-medium mb-3 block">Select Agent Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'code_analysis', icon: Search, label: 'Code Analysis', color: 'blue', desc: 'Analyze repository structure and code quality' },
                    { id: 'issue_resolution', icon: Bug, label: 'Issue Resolution', color: 'red', desc: 'Resolve GitHub issues with analysis' },
                    { id: 'testing', icon: TestTube, label: 'Testing & QA', color: 'green', desc: 'Create test strategies and coverage analysis' }
                  ].map((agent) => {
                    const Icon = agent.icon;
                    const isSelected = selectedAgent === agent.id;
                    return (
                      <Card 
                        key={agent.id}
                        className={cn(
                          "cursor-pointer transition-all duration-300 hover:shadow-lg border-l-4",
                          isSelected 
                            ? agent.color === 'blue' ? "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg" 
                              : agent.color === 'red' ? "border-l-red-500 bg-red-50 dark:bg-red-950/20 shadow-lg"
                              : "border-l-green-500 bg-green-50 dark:bg-green-950/20 shadow-lg"
                            : "border-l-gray-200 hover:border-l-gray-400"
                        )}
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg transition-colors",
                              isSelected 
                                ? agent.color === 'blue' ? "bg-blue-100 dark:bg-blue-900/50" 
                                  : agent.color === 'red' ? "bg-red-100 dark:bg-red-900/50"
                                  : "bg-green-100 dark:bg-green-900/50"
                                : "bg-gray-100 dark:bg-gray-800"
                            )}>
                              <Icon className={cn(
                                "h-5 w-5",
                                isSelected 
                                  ? agent.color === 'blue' ? "text-blue-600" 
                                    : agent.color === 'red' ? "text-red-600"
                                    : "text-green-600"
                                  : "text-gray-600"
                              )} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">{agent.label}</h3>
                              <p className="text-xs text-muted-foreground mt-1">{agent.desc}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle className={cn(
                                "h-5 w-5",
                                agent.color === 'blue' ? "text-blue-600" 
                                  : agent.color === 'red' ? "text-red-600"
                                  : "text-green-600"
                              )} />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model (Optional)</label>
                  <Input
                    placeholder="e.g., gpt-4, claude-3-sonnet"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Actions</label>
                  <Select value="" onValueChange={(value) => setAgentQuery(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Analyze the security vulnerabilities in this repository">
                        🔒 Security Analysis
                      </SelectItem>
                      <SelectItem value="Review code quality and suggest improvements">
                        ⭐ Quality Review
                      </SelectItem>
                      <SelectItem value="Identify performance bottlenecks">
                        ⚡ Performance Check
                      </SelectItem>
                      <SelectItem value="Generate comprehensive test coverage plan">
                        🧪 Test Coverage
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Task Query</label>
                <Textarea
                  placeholder="Describe what you want the agent to do..."
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  rows={4}
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button 
                onClick={runAgentTask} 
                disabled={loading || !agentQuery.trim()} 
                className="w-full py-3 text-base font-medium transition-all hover:shadow-lg"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  agentIcons[selectedAgent as keyof typeof agentIcons]
                )}
                {loading ? 'Running Agent...' : `Run ${selectedAgent.replace('_', ' ')} Agent`}
              </Button>

              {response && (
                <Alert className={response.status === 'success' ? 'border-green-200' : 'border-red-200'}>
                  <div className="flex items-center gap-2">
                    {response.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">Agent Response</span>
                  </div>
                  <AlertDescription className="mt-2">
                    <pre className="whitespace-pre-wrap text-sm">{response.response}</pre>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="llamaindex-workflows" className="space-y-6">
              {/* LlamaIndex Workflow Creation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Create LlamaIndex Workflow
                  </CardTitle>
                  <CardDescription>
                    Create and execute advanced multi-agent workflows using LlamaIndex architecture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Workflow Type Selection */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Select Workflow Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { 
                          id: 'linear_swarm', 
                          icon: GitBranch, 
                          label: 'Linear Swarm', 
                          color: 'blue',
                          desc: 'Sequential agent execution with automatic handoffs'
                        },
                        { 
                          id: 'orchestrator', 
                          icon: Bot, 
                          label: 'Orchestrator', 
                          color: 'purple',
                          desc: 'Central orchestrator managing specialized sub-agents'
                        },
                        { 
                          id: 'custom_planner', 
                          icon: Zap, 
                          label: 'Custom Planner', 
                          color: 'orange',
                          desc: 'Maximum flexibility with user-defined configurations'
                        }
                      ].map((workflowType) => {
                        const Icon = workflowType.icon;
                        const isSelected = selectedWorkflowType === workflowType.id;
                        return (
                          <Card 
                            key={workflowType.id}
                            className={cn(
                              "cursor-pointer transition-all duration-300 hover:shadow-lg border-l-4",
                              isSelected 
                                ? workflowType.color === 'blue' ? "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg" 
                                  : workflowType.color === 'purple' ? "border-l-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-lg"
                                  : "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20 shadow-lg"
                                : "border-l-gray-200 hover:border-l-gray-400"
                            )}
                            onClick={() => setSelectedWorkflowType(workflowType.id as any)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg transition-colors",
                                  isSelected 
                                    ? workflowType.color === 'blue' ? "bg-blue-100 dark:bg-blue-900/50" 
                                      : workflowType.color === 'purple' ? "bg-purple-100 dark:bg-purple-900/50"
                                      : "bg-orange-100 dark:bg-orange-900/50"
                                    : "bg-gray-100 dark:bg-gray-800"
                                )}>
                                  <Icon className={cn(
                                    "h-5 w-5",
                                    isSelected 
                                      ? workflowType.color === 'blue' ? "text-blue-600" 
                                        : workflowType.color === 'purple' ? "text-purple-600"
                                        : "text-orange-600"
                                      : "text-gray-600"
                                  )} />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-sm">{workflowType.label}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">{workflowType.desc}</p>
                                </div>
                                {isSelected && (
                                  <CheckCircle className={cn(
                                    "h-5 w-5",
                                    workflowType.color === 'blue' ? "text-blue-600" 
                                      : workflowType.color === 'purple' ? "text-purple-600"
                                      : "text-orange-600"
                                  )} />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Workflow Query Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Workflow Query</label>
                    <Textarea
                      placeholder="Describe what you want the workflow to analyze or accomplish..."
                      value={workflowQuery}
                      onChange={(e) => setWorkflowQuery(e.target.value)}
                      rows={4}
                      className="transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Quick Actions for Workflows */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quick Workflow Templates</label>
                    <Select value="" onValueChange={(value) => setWorkflowQuery(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a workflow template..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Analyze this repository for security vulnerabilities and provide comprehensive remediation recommendations">
                          🔒 Complete Security Analysis
                        </SelectItem>
                        <SelectItem value="Perform end-to-end code quality review with testing strategy and performance optimization suggestions">
                          ⭐ Full Quality Audit
                        </SelectItem>
                        <SelectItem value="Analyze the issue from multiple perspectives: technical implementation, testing requirements, and security implications">
                          🔍 Multi-Perspective Issue Analysis
                        </SelectItem>
                        <SelectItem value="Create a comprehensive modernization plan including dependency updates, performance improvements, and architectural recommendations">
                          🚀 Modernization Strategy
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={() => {
                      console.log('Button clicked!');
                      console.log('workflowQuery:', workflowQuery);
                      console.log('workflowLoading:', workflowLoading);
                      console.log('Button disabled?', workflowLoading || !workflowQuery.trim());
                      createLlamaWorkflow();
                    }}
                    disabled={workflowLoading || !workflowQuery.trim()} 
                    className="w-full py-3 text-base font-medium transition-all hover:shadow-lg"
                    size="lg"
                  >
                    {workflowLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <GitBranch className="h-5 w-5 mr-2" />
                    )}
                    {workflowLoading ? 'Creating Workflow...' : `Create ${selectedWorkflowType.replace('_', ' ')} Workflow`}
                  </Button>
                </CardContent>
              </Card>

              {/* Active Workflow Display */}
              {activeWorkflow && (
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          activeWorkflow.status === 'running' ? "bg-green-500 animate-pulse" :
                          activeWorkflow.status === 'completed' ? "bg-blue-500" :
                          activeWorkflow.status === 'paused' ? "bg-yellow-500" :
                          activeWorkflow.status === 'failed' ? "bg-red-500" : "bg-gray-500"
                        )} />
                        Active Workflow: {activeWorkflow.type.replace('_', ' ')}
                      </div>
                      <div className="flex items-center gap-2">
                        {activeWorkflow.status === 'running' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pauseWorkflow(activeWorkflow.workflow_id)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {activeWorkflow.status === 'paused' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resumeWorkflow(activeWorkflow.workflow_id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveWorkflow(null);
                            if (websocket) {
                              websocket.close();
                              setWebsocket(null);
                            }
                          }}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      ID: {activeWorkflow.workflow_id} • Created: {new Date(activeWorkflow.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Display */}
                      {activeWorkflow.progress && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(activeWorkflow.progress.progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${activeWorkflow.progress.progress}%` }}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activeWorkflow.progress.current_step}
                          </div>
                          {activeWorkflow.current_agent && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                              Current Agent: {activeWorkflow.current_agent.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            activeWorkflow.status === 'running' ? 'default' :
                            activeWorkflow.status === 'completed' ? 'secondary' :
                            activeWorkflow.status === 'failed' ? 'destructive' : 'outline'
                          }
                        >
                          {activeWorkflow.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Last updated: {new Date(activeWorkflow.updated_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Workflows List */}
              {llamaWorkflows.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Recent Workflows</span>
                      <Button variant="outline" size="sm" onClick={fetchLlamaWorkflows}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      View and manage your recent LlamaIndex workflows
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {llamaWorkflows.slice(0, 5).map((workflow) => (
                        <div 
                          key={workflow.workflow_id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => setActiveWorkflow(workflow)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              workflow.status === 'running' ? "bg-green-500" :
                              workflow.status === 'completed' ? "bg-blue-500" :
                              workflow.status === 'paused' ? "bg-yellow-500" :
                              workflow.status === 'failed' ? "bg-red-500" : "bg-gray-500"
                            )} />
                            <div>
                              <div className="font-medium text-sm">{workflow.name || workflow.type.replace('_', ' ')}</div>
                              <div className="text-xs text-muted-foreground">
                                {workflow.type} • {new Date(workflow.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                workflow.status === 'running' ? "border-green-200 text-green-700" :
                                workflow.status === 'completed' ? "border-blue-200 text-blue-700" :
                                workflow.status === 'failed' ? "border-red-200 text-red-700" :
                                "border-gray-200 text-gray-700"
                              )}
                            >
                              {workflow.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="agents" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Agents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Active Agents
                      <Badge variant="outline" className="ml-auto">
                        {llamaWorkflows.filter(w => w.status === 'running').length} running
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Currently executing agents and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {llamaWorkflows.filter(w => w.status === 'running').length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No agents currently running</p>
                          <p className="text-xs">Start a workflow to see active agents</p>
                        </div>
                      ) : (
                        llamaWorkflows.filter(w => w.status === 'running').map((workflow) => (
                          <div key={workflow.workflow_id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <div>
                                  <div className="font-medium text-sm">{workflow.name || workflow.type.replace('_', ' ')}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Workflow ID: {workflow.workflow_id.split('_').pop()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => pauseWorkflow(workflow.workflow_id)}
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                                                         {/* Current Agent Status */}
                             {(workflow as any).current_agent && (
                               <div className="bg-muted/50 rounded-lg p-3">
                                 <div className="flex items-center gap-2 mb-2">
                                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                   <span className="text-sm font-medium">
                                     {(workflow as any).current_agent.replace('_', ' ')}
                                   </span>
                                   <Badge variant="secondary" className="text-xs">
                                     Thinking...
                                   </Badge>
                                 </div>
                                 {(workflow as any).current_analysis && (
                                   <p className="text-xs text-muted-foreground">
                                     {(workflow as any).current_analysis}
                                   </p>
                                 )}
                               </div>
                             )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Execution History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Execution History
                    </CardTitle>
                    <CardDescription>
                      Recent agent executions and their results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {llamaWorkflows.slice(0, 10).map((workflow) => (
                        <div key={workflow.workflow_id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                workflow.status === 'completed' ? "bg-green-500" :
                                workflow.status === 'failed' ? "bg-red-500" :
                                workflow.status === 'running' ? "bg-blue-500" :
                                "bg-gray-400"
                              )} />
                              <span className="text-sm font-medium">
                                {workflow.type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {workflow.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(workflow.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          
                                                     {/* Agent Chain */}
                           {(workflow as any).agent_chain && (
                             <div className="flex items-center gap-1 mt-2">
                               {(workflow as any).agent_chain.map((agent: string, index: number) => (
                                 <React.Fragment key={agent}>
                                   <Badge 
                                     variant="secondary" 
                                     className={cn(
                                       "text-xs",
                                       (workflow as any).current_agent === agent ? "bg-blue-100 text-blue-800" : ""
                                     )}
                                   >
                                     {agent.replace('_', ' ')}
                                   </Badge>
                                   {index < (workflow as any).agent_chain.length - 1 && (
                                     <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                   )}
                                 </React.Fragment>
                               ))}
                             </div>
                           )}
                           
                           {/* Results Summary */}
                           {workflow.status === 'completed' && (workflow as any).summary && (
                             <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded text-xs">
                               {(workflow as any).summary.substring(0, 100)}...
                             </div>
                           )}
                           
                           {workflow.status === 'failed' && (workflow as any).error && (
                             <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs text-red-700">
                               Error: {(workflow as any).error.substring(0, 100)}...
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Agent Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Agent Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Performance statistics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {llamaWorkflows.filter(w => w.status === 'completed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {llamaWorkflows.filter(w => w.status === 'running').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Running</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {llamaWorkflows.filter(w => w.status === 'failed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {llamaWorkflows.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflows" className="space-y-4">
              <Alert className="mb-4">
                <AlertDescription>
                  <strong>Legacy Workflows:</strong> These are the original workflow implementations. 
                  For advanced multi-agent capabilities, please use the LlamaIndex Workflows tab.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600" 
                      onClick={() => runWorkflow('comprehensive_analysis')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                        <Zap className="h-5 w-5 text-blue-600" />
                      </div>
                      Comprehensive Issue Analysis (Legacy)
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Multi-agent workflow that analyzes repository structure, issue details, 
                      and provides testing recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Search className="h-3 w-3 mr-1" />
                        Code Analysis
                      </Badge>
                      <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                        <Bug className="h-3 w-3 mr-1" />
                        Issue Resolution
                      </Badge>
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        <TestTube className="h-3 w-3 mr-1" />
                        Testing
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 hover:border-l-green-600" 
                      onClick={() => runWorkflow('quality_audit')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 group-hover:text-green-600 transition-colors">
                      <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      Code Quality Audit (Legacy)
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Comprehensive code quality analysis focusing on security, 
                      performance, and maintainability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        <Search className="h-3 w-3 mr-1" />
                        Code Analysis
                      </Badge>
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        <TestTube className="h-3 w-3 mr-1" />
                        Testing
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {workflowLoading && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Running multi-agent workflow... This may take a few minutes.
                  </AlertDescription>
                </Alert>
              )}

              {workflowResponse && (
                <div className="space-y-4">
                  <Alert className={workflowResponse.status === 'success' ? 'border-green-200' : 'border-red-200'}>
                    <div className="flex items-center gap-2">
                      {workflowResponse.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">Workflow Results</span>
                      {workflowResponse.agents_used && (
                        <div className="ml-auto flex gap-1">
                          {workflowResponse.agents_used.map(agent => (
                            <Badge key={agent} variant="outline" className="text-xs">
                              {agent.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Alert>

                  {workflowResponse.status === 'success' && workflowResponse.results && (
                    <div className="space-y-4">
                      {Object.entries(workflowResponse.results).map(([key, value]) => (
                        <Card key={key}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <pre className="whitespace-pre-wrap text-sm">{value}</pre>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {tools.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Available Tools</CardTitle>
                <CardDescription>
                  Tools that agents can use to analyze your repository
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tools.map((tool, index) => (
                    <div key={index} className="flex flex-col p-2 border rounded">
                      <span className="font-medium text-sm">{tool.name}</span>
                      <span className="text-xs text-muted-foreground">{tool.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentInterface; 