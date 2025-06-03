import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Bot, Search, TestTube, Bug, Zap, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentInterfaceProps {
  sessionId: string;
}

interface Tool {
  name: string;
  description: string;
}

interface AgentTaskResponse {
  status: string;
  agent_type: string;
  response: string;
}

interface WorkflowResponse {
  status: string;
  results: {
    repository_overview?: string;
    issue_analysis?: string;
    testing_strategy?: string;
    final_summary?: string;
    quality_analysis?: string;
    testing_analysis?: string;
  };
  agents_used?: string[];
  focus_areas?: string[];
}

const AgentInterface: React.FC<AgentInterfaceProps> = ({ sessionId }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [agentQuery, setAgentQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('code_analysis');
  const [selectedModel, setSelectedModel] = useState('');
  const [response, setResponse] = useState<AgentTaskResponse | null>(null);
  const [workflowResponse, setWorkflowResponse] = useState<WorkflowResponse | null>(null);
  const [focusAreas, setFocusAreas] = useState<string[]>(['security', 'performance', 'maintainability']);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableTools();
  }, [sessionId]);

  const fetchAvailableTools = async () => {
    try {
      const response = await fetch(`/sessions/${sessionId}/available-tools`);
      if (response.ok) {
        const data = await response.json();
        setTools(data.tools || []);
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
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
      const response = await fetch(`/sessions/${sessionId}/agent-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: selectedAgent,
          query: agentQuery,
          model_name: selectedModel || undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AgentTaskResponse = await response.json();
      setResponse(data);
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
      const body: any = {
        workflow_type: workflowType,
        model_name: selectedModel || undefined
      };

      if (workflowType === 'quality_audit') {
        body.focus_areas = focusAreas;
      }

      const response = await fetch(`/sessions/${sessionId}/agent-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: WorkflowResponse = await response.json();
      setWorkflowResponse(data);
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
          <Tabs defaultValue="single-agent" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single-agent">Single Agent Task</TabsTrigger>
              <TabsTrigger value="workflows">Multi-Agent Workflows</TabsTrigger>
            </TabsList>

            <TabsContent value="single-agent" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agent Type</label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code_analysis">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Code Analysis
                        </div>
                      </SelectItem>
                      <SelectItem value="issue_resolution">
                        <div className="flex items-center gap-2">
                          <Bug className="h-4 w-4" />
                          Issue Resolution
                        </div>
                      </SelectItem>
                      <SelectItem value="testing">
                        <div className="flex items-center gap-2">
                          <TestTube className="h-4 w-4" />
                          Testing & QA
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {agentDescriptions[selectedAgent as keyof typeof agentDescriptions]}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Model (Optional)</label>
                  <Input
                    placeholder="e.g., gpt-4, claude-3-sonnet"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Task Query</label>
                <Textarea
                  placeholder="Describe what you want the agent to do..."
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={runAgentTask} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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

            <TabsContent value="workflows" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:bg-accent/50" 
                      onClick={() => runWorkflow('comprehensive_analysis')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Comprehensive Issue Analysis
                    </CardTitle>
                    <CardDescription>
                      Multi-agent workflow that analyzes repository structure, issue details, 
                      and provides testing recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Code Analysis + Issue Resolution + Testing</Badge>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-accent/50" 
                      onClick={() => runWorkflow('quality_audit')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Code Quality Audit
                    </CardTitle>
                    <CardDescription>
                      Comprehensive code quality analysis focusing on security, 
                      performance, and maintainability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Code Analysis + Testing</Badge>
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