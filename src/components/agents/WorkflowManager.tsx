import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Bot,
  Zap,
  GitBranch,
  Eye,
  Target,
  Settings,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { 
  listWorkflows, 
  getWorkflowStatus, 
  executeWorkflow,
  createWorkflow,
  getWorkflowDetails,
  type WorkflowStatusResponse 
} from '@/lib/api';

interface WorkflowManagerProps {
  sessionId: string;
  onWorkflowSelected?: (workflowId: string) => void;
}

interface ActiveWorkflow {
  workflow_id: string;
  status: string;
  type: string;
  name: string;
  created_at: string;
  current_agent?: string;
  progress?: any;
}

export const WorkflowManager: React.FC<WorkflowManagerProps> = ({ 
  sessionId, 
  onWorkflowSelected 
}) => {
  const [activeWorkflows, setActiveWorkflows] = useState<ActiveWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatusResponse | null>(null);
  const [workflowDetails, setWorkflowDetails] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state for workflow creation
  const [workflowGoal, setWorkflowGoal] = useState('');
  const [workflowContext, setWorkflowContext] = useState('');
  const [selectedType, setSelectedType] = useState<'linear_swarm' | 'orchestrator' | 'custom_planner'>('linear_swarm');
  const [focusAreas, setFocusAreas] = useState<string[]>(['security']);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetFiles, setTargetFiles] = useState('');
  
  const { addToast } = useToast();

  const focusAreaOptions = [
    { id: 'security', label: 'Security Analysis', description: 'Vulnerability scanning and security review' },
    { id: 'performance', label: 'Performance Optimization', description: 'Code efficiency and bottleneck analysis' },
    { id: 'testing', label: 'Testing Strategy', description: 'Test coverage and quality assessment' },
    { id: 'code_quality', label: 'Code Quality', description: 'Style, maintainability, and best practices' },
    { id: 'architecture', label: 'Architecture Review', description: 'Design patterns and structure analysis' },
    { id: 'dependencies', label: 'Dependencies', description: 'Package management and updates' },
  ];

  // Load active workflows
  const loadWorkflows = async () => {
    try {
      const workflows = await listWorkflows(sessionId);
      setActiveWorkflows(workflows);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      addToast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive"
      });
    }
  };

  // Load workflow status
  const loadWorkflowStatus = async (workflowId: string) => {
    try {
      const status = await getWorkflowStatus(sessionId, workflowId);
      setWorkflowStatus(status);
      
      // If workflow is completed, load detailed results
      if (status.status === 'completed') {
        try {
          const details = await getWorkflowDetails(sessionId, workflowId, true);
          setWorkflowDetails(details);
        } catch (error) {
          console.error('Failed to load workflow details:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load workflow status:', error);
    }
  };

  // Create new workflow with user-specified goals
  const createNewWorkflow = async () => {
    if (!workflowGoal.trim()) {
      addToast({
        title: "Goal Required",
        description: "Please specify what you want the agents to do",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Build comprehensive query from user input
      const focusAreaDescriptions = focusAreas.map(area => 
        focusAreaOptions.find(opt => opt.id === area)?.label || area
      ).join(', ');

      const contextualQuery = `
Goal: ${workflowGoal}
${workflowContext ? `Context: ${workflowContext}` : ''}
Focus Areas: ${focusAreaDescriptions}
${targetFiles ? `Target Files/Directories: ${targetFiles}` : ''}
Priority: ${priority}

Please analyze the repository with focus on the specified goal and areas. Provide actionable insights and recommendations.
      `.trim();

      const workflowName = `${workflowGoal.substring(0, 30)}${workflowGoal.length > 30 ? '...' : ''}`;

      const workflow = await createWorkflow(sessionId, {
        workflow_type: selectedType,
        name: workflowName
      });

      // Execute the workflow with user-specified context
      await executeWorkflow(sessionId, workflow.workflow_id, {
        query: contextualQuery,
        context: {
          goal: workflowGoal,
          focus_areas: focusAreas,
          priority: priority,
          target_files: targetFiles,
          additional_context: workflowContext
        }
      });

      addToast({
        title: "Workflow Created",
        description: `Started "${workflowGoal.substring(0, 40)}${workflowGoal.length > 40 ? '...' : ''}"`,
      });

      // Reset form and close
      setWorkflowGoal('');
      setWorkflowContext('');
      setTargetFiles('');
      setShowCreateForm(false);
      
      await loadWorkflows();
      setSelectedWorkflow(workflow.workflow_id);
      onWorkflowSelected?.(workflow.workflow_id);
    } catch (error) {
      console.error('Failed to create workflow:', error);
      addToast({
        title: "Error", 
        description: `Failed to create workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFocusArea = (areaId: string) => {
    setFocusAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  // Poll for updates
  useEffect(() => {
    loadWorkflows();
    const interval = setInterval(loadWorkflows, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [sessionId]);

  // Load status when workflow is selected
  useEffect(() => {
    if (selectedWorkflow) {
      loadWorkflowStatus(selectedWorkflow);
      const interval = setInterval(() => loadWorkflowStatus(selectedWorkflow), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedWorkflow]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Agent Task Creator
            </div>
            <Button 
              onClick={loadWorkflows}
              variant="ghost"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showCreateForm ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Create focused agent workflows with specific goals and contexts
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                Create New Agent Task
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Goal Input */}
              <div className="space-y-2">
                <Label htmlFor="goal" className="text-sm font-medium">
                  What do you want the agents to do? *
                </Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Find security vulnerabilities in the authentication system, Optimize database queries, Improve test coverage for API endpoints..."
                  value={workflowGoal}
                  onChange={(e) => setWorkflowGoal(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Context Input */}
              <div className="space-y-2">
                <Label htmlFor="context" className="text-sm font-medium">
                  Additional Context (optional)
                </Label>
                <Textarea
                  id="context"
                  placeholder="Any specific areas to focus on, constraints, or background information..."
                  value={workflowContext}
                  onChange={(e) => setWorkflowContext(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              {/* Focus Areas */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Focus Areas *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {focusAreaOptions.map((option) => (
                    <div 
                      key={option.id} 
                      className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleFocusArea(option.id)}
                    >
                      <Checkbox
                        checked={focusAreas.includes(option.id)}
                        onChange={() => toggleFocusArea(option.id)}
                      />
                      <div className="space-y-1 flex-1">
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Type and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Agent Type</Label>
                  <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear_swarm">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Linear Swarm
                        </div>
                      </SelectItem>
                      <SelectItem value="orchestrator">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Orchestrator
                        </div>
                      </SelectItem>
                      <SelectItem value="custom_planner">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Custom Planner
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Priority</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Files */}
              <div className="space-y-2">
                <Label htmlFor="targets" className="text-sm font-medium">
                  Target Files/Directories (optional)
                </Label>
                <Input
                  id="targets"
                  placeholder="e.g., src/auth/, config/, *.py, specific-file.js"
                  value={targetFiles}
                  onChange={(e) => setTargetFiles(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button 
                  onClick={createNewWorkflow}
                  disabled={loading || !workflowGoal.trim() || focusAreas.length === 0}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Start Agent Task
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setWorkflowGoal('');
                    setWorkflowContext('');
                    setTargetFiles('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Active Workflows ({activeWorkflows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeWorkflows.length === 0 ? (
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertDescription>
                No active workflows. Create a new workflow using the controls above.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {activeWorkflows.map((workflow) => (
                <div
                  key={workflow.workflow_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedWorkflow === workflow.workflow_id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setSelectedWorkflow(workflow.workflow_id);
                    onWorkflowSelected?.(workflow.workflow_id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getStatusColor(workflow.status)}`}>
                        {getStatusIcon(workflow.status)}
                      </div>
                      <div>
                        <div className="font-medium">{workflow.name || workflow.workflow_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {workflow.type?.replace('_', ' ')} • Created: {new Date(workflow.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                      {workflow.current_agent && (
                        <Badge variant="secondary">
                          {workflow.current_agent}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Details */}
      {selectedWorkflow && workflowStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Workflow Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-4">
                {/* Workflow Goal Display */}
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="text-sm font-medium mb-2">Task Goal</div>
                  <div className="text-sm">
                    {workflowStatus.context?.goal || 'General repository analysis'}
                  </div>
                  {workflowStatus.context?.focus_areas && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">Focus Areas:</div>
                      <div className="flex flex-wrap gap-1">
                        {workflowStatus.context.focus_areas.map((area: string) => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {focusAreaOptions.find(opt => opt.id === area)?.label || area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <Badge className={getStatusColor(workflowStatus.status)}>
                      {workflowStatus.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Priority</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {workflowStatus.context?.priority || 'Medium'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Current Agent</div>
                    <div className="text-sm text-muted-foreground">
                      {workflowStatus.current_agent || 'None'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Last Update</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(workflowStatus.last_update).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {workflowStatus.context?.target_files && (
                  <div>
                    <div className="text-sm font-medium mb-1">Target Files</div>
                    <div className="text-sm text-muted-foreground font-mono bg-muted/30 p-2 rounded">
                      {workflowStatus.context.target_files}
                    </div>
                  </div>
                )}

                {workflowStatus.context?.additional_context && (
                  <div>
                    <div className="text-sm font-medium mb-1">Additional Context</div>
                    <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                      {workflowStatus.context.additional_context}
                    </div>
                  </div>
                )}
              </div>
              
              {workflowStatus.progress && (
                <div>
                  <div className="text-sm font-medium mb-2">Progress</div>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs text-muted-foreground overflow-auto">
                      {JSON.stringify(workflowStatus.progress, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comprehensive Analysis Results */}
      {selectedWorkflow && workflowDetails?.result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="recommendations">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="space-y-4">
                  {workflowDetails.result.analysis_metadata && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Duration</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(workflowDetails.result.analysis_metadata.total_duration_seconds || 0)}s
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Stages Completed</div>
                        <div className="text-sm text-muted-foreground">
                          {workflowDetails.result.analysis_metadata.stages_completed?.join(', ') || 'None'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Analysis Overview</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Security Findings:</span>
                          <span className="font-medium">{workflowDetails.result.security_analysis?.findings_count || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Quality Issues:</span>
                          <span className="font-medium">{workflowDetails.result.quality_analysis?.findings?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Performance Issues:</span>
                          <span className="font-medium">{workflowDetails.result.performance_analysis?.findings_count || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Dependencies Analyzed:</span>
                          <span className="font-medium">
                            {workflowDetails.result.dependencies_analysis ? 
                              Object.values(workflowDetails.result.dependencies_analysis)
                                .reduce((total: number, dep: any) => total + (dep.parsed_dependencies?.length || 0), 0) : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Repository Stats</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Files:</span>
                          <span className="font-medium">
                            {workflowDetails.result.repository_overview?.file_type_distribution ? 
                              Object.values(workflowDetails.result.repository_overview.file_type_distribution)
                                .reduce((total: number, type: any) => total + (type.count || 0), 0) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Repository Size:</span>
                          <span className="font-medium">
                            {workflowDetails.result.repository_overview?.total_size_bytes ? 
                              `${(workflowDetails.result.repository_overview.total_size_bytes / 1024 / 1024).toFixed(1)} MB` : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>File Types:</span>
                          <span className="font-medium">
                            {workflowDetails.result.repository_overview?.file_type_distribution ? 
                              Object.keys(workflowDetails.result.repository_overview.file_type_distribution).length : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {workflowDetails.result.summary && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Executive Summary</div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {workflowDetails.result.summary}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                {workflowDetails.result.security_analysis && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {workflowDetails.result.security_analysis.findings_count || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Findings</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold capitalize">
                          {workflowDetails.result.security_analysis.risk_level || 'Low'}
                        </div>
                        <div className="text-sm text-muted-foreground">Risk Level</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {workflowDetails.result.security_analysis.findings?.filter((f: any) => f.severity === 'high').length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">High Risk</div>
                      </div>
                    </div>

                    {workflowDetails.result.security_analysis.findings?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Security Findings</div>
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {workflowDetails.result.security_analysis.findings.map((finding: any, index: number) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{finding.category}</span>
                                  <Badge variant={finding.severity === 'high' ? 'destructive' : 'secondary'}>
                                    {finding.severity}
                                  </Badge>
                                </div>
                                {finding.files_affected && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {finding.files_affected} files affected
                                  </div>
                                )}
                                {finding.message && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {finding.message}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="dependencies" className="space-y-4">
                {workflowDetails.result.dependencies_analysis && (
                  <div className="space-y-4">
                    {Object.entries(workflowDetails.result.dependencies_analysis).map(([filename, data]: [string, any]) => (
                      <div key={filename} className="space-y-2">
                        <div className="text-sm font-medium">{filename}</div>
                        <div className="bg-muted/30 p-3 rounded-lg">
                          {data.parsed_dependencies && data.parsed_dependencies.length > 0 ? (
                            <div className="space-y-1">
                              {data.parsed_dependencies.slice(0, 10).map((dep: any, index: number) => (
                                <div key={index} className="flex justify-between text-xs">
                                  <span>{dep.name}</span>
                                  <span className="text-muted-foreground">{dep.version}</span>
                                </div>
                              ))}
                              {data.parsed_dependencies.length > 10 && (
                                <div className="text-xs text-muted-foreground">
                                  ... and {data.parsed_dependencies.length - 10} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              {data.lines || 0} lines, {data.size || 0} bytes
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="structure" className="space-y-4">
                {workflowDetails.result.repository_overview && (
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Repository Overview</div>
                    
                    {workflowDetails.result.repository_overview.file_type_distribution && (
                      <div>
                        <div className="text-sm font-medium mb-2">File Types</div>
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <div className="space-y-1">
                            {Object.entries(workflowDetails.result.repository_overview.file_type_distribution).map(([ext, data]: [string, any]) => (
                              <div key={ext} className="flex justify-between text-xs">
                                <span>{ext || 'no extension'}</span>
                                <span>{data.count} files ({Math.round(data.total_size / 1024)}KB)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {workflowDetails.result.repository_overview.total_size_bytes && (
                      <div>
                        <div className="text-sm font-medium">Total Size</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(workflowDetails.result.repository_overview.total_size_bytes / 1024 / 1024 * 100) / 100} MB
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="quality" className="space-y-4">
                {workflowDetails.result.quality_analysis && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {workflowDetails.result.quality_analysis.findings?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Quality Issues</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {workflowDetails.result.quality_analysis.quality_metrics ? 
                            Object.keys(workflowDetails.result.quality_analysis.quality_metrics).length : 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Metrics Tracked</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {workflowDetails.result.quality_analysis.findings?.filter((f: any) => f.severity === 'high').length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">High Priority</div>
                      </div>
                    </div>

                    {workflowDetails.result.quality_analysis.findings?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Quality Findings</div>
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {workflowDetails.result.quality_analysis.findings.map((finding: any, index: number) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm capitalize">{finding.category.replace('_', ' ')}</span>
                                  <Badge variant={finding.severity === 'high' ? 'destructive' : 'secondary'}>
                                    {finding.severity}
                                  </Badge>
                                </div>
                                {finding.description && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {finding.description}
                                  </div>
                                )}
                                {finding.files_with_pattern !== undefined && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {finding.files_with_pattern} files with this pattern
                                  </div>
                                )}
                                {finding.coverage !== undefined && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Coverage: {Math.round(finding.coverage * 100)}%
                                  </div>
                                )}
                                {finding.quality_impact && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Impact: {finding.quality_impact}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {workflowDetails.result.quality_analysis.quality_metrics && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Quality Metrics</div>
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(workflowDetails.result.quality_analysis.quality_metrics).map(([metric, value]: [string, any]) => (
                              <div key={metric} className="flex justify-between text-xs">
                                <span className="capitalize">{metric.replace('_', ' ')}</span>
                                <span className="text-muted-foreground">
                                  {typeof value === 'number' ? `${Math.round(value * 100)}%` : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                {workflowDetails.result.recommendations && workflowDetails.result.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {workflowDetails.result.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{rec.title}</span>
                          <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {rec.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 capitalize">
                          Category: {rec.category}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No specific recommendations at this time.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};