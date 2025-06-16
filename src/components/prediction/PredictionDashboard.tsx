import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Calendar, 
  Shield, 
  Download, 
  Share, 
  XCircle, 
  Eye, 
  History, 
  Users, 
  ExternalLink, 
  Info,
  BarChart3,
  Code,
  FileText,
  Search,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Activity,
  PieChart,
  GitBranch,
  Filter,
  Clock,
  User,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FileViewer from '@/components/FileViewer';
import FileHistoryViewer from './FileHistoryViewer';
import FileContributorsViewer from './FileContributorsViewer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RiskFile {
  path: string;
  risk_score: number;
  touch_count: number;
  unique_authors: number;
  recent_changes: number;
  complexity_score: number;
  last_modified: string;
  primary_author: string;
  issues_linked: number;
}

interface TeamMember {
  name: string;
  commits: number;
  files_touched: number;
  risk_contribution: number;
  velocity_trend: 'increasing' | 'decreasing' | 'stable';
  knowledge_areas: string[];
  collaboration_score: number;
}



interface DashboardData {
  summary: {
    total_risks: number;
    high_priority_risks: number;
    confidence_score: number;
    last_analysis: string;
    repository_health_score: number;
  };
  risk_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  pattern_insights: {
    bug_patterns_detected: number;
    team_patterns_detected: number;
    most_common_pattern_type: string;
    confidence_score: number;
  };
  semantic_analysis?: {
    total_risks: number;
    risk_categories: Record<string, number>;
    severity_distribution: Record<string, number>;
    top_risks: Array<{
      type: string;
      severity: string;
      description: string;
      files: string[];
    }>;
    analysis_timestamp: string;
  };
  hybrid_scoring?: {
    final_scores: {
      overall_risk_score: number;
      overall_confidence: number;
      algorithmic_weight: number;
      llm_weight: number;
      score_breakdown: {
        algorithmic_score: number;
        llm_score: number;
        combined_score: number;
      };
    };
    insights: {
      risk_level_assessment: string;
      top_concerns: string[];
      scoring_reliability: {
        level: string;
        confidence_score: number;
        note: string;
      };
      recommendations: string[];
    };
  };
  action_items: {
    immediate: string[];
    long_term: string[];
  };
  trend_data: {
    risk_trend: string;
    pattern_trend: string;
    confidence_trend: string;
  };
  risky_files: RiskFile[];
  team_insights: TeamMember[];
  deployment_metrics: {
    success_rate: number;
    average_deployment_time: number;
    rollback_frequency: number;
    last_deployment: string;
  };
}

interface PredictionDashboardProps {
  repoOwner: string;
  repoName: string;
  sessionId?: string;
}

export const PredictionDashboard: React.FC<PredictionDashboardProps> = ({
  repoOwner,
  repoName,
  sessionId: propSessionId
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<RiskFile | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [confidenceExplanation, setConfidenceExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [expandedFileDetails, setExpandedFileDetails] = useState<string | null>(null);
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  
  // Progress tracking states
  const [progressData, setProgressData] = useState<{
    phase: string;
    message: string;
    progress: number;
    currentFile?: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // File viewer states
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showFileHistory, setShowFileHistory] = useState(false);
  const [showFileContributors, setShowFileContributors] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');

  // Use the sessionId from props, or fallback to a dummy one
  const sessionId = propSessionId || 'dummy-session-id';

  // WebSocket connection for progress updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket(`ws://localhost:8000/prediction/ws/progress/${repoOwner}/${repoName}`);
        
        ws.onopen = () => {
          console.log('WebSocket connected for progress updates');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'progress') {
              setProgressData({
                phase: data.phase,
                message: data.message,
                progress: data.progress,
                currentFile: data.current_file
              });
              setIsAnalyzing(true);
            } else if (data.type === 'complete') {
              setProgressData({
                phase: 'complete',
                message: data.message,
                progress: 100
              });
              // Clear progress after a short delay
              setTimeout(() => {
                setIsAnalyzing(false);
                setProgressData(null);
              }, 2000);
            } else if (data.type === 'connection') {
              console.log('Progress WebSocket connected:', data.message);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          // Attempt to reconnect after a delay if we're still loading
          if (loading || refreshing) {
            setTimeout(connectWebSocket, 3000);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (err) {
        console.error('Error connecting WebSocket:', err);
      }
    };
    
    // Connect WebSocket when component mounts or when refreshing
    if (loading || refreshing) {
      connectWebSocket();
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [repoOwner, repoName, loading, refreshing]);

  const fetchConfidenceExplanation = async () => {
    try {
      setLoadingExplanation(true);
      const response = await fetch(`http://localhost:8000/prediction/explain-confidence/${repoOwner}/${repoName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confidence_score: dashboardData?.summary.confidence_score,
          risk_factors: dashboardData?.risk_breakdown,
          pattern_insights: dashboardData?.pattern_insights
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfidenceExplanation(data.explanation);
      } else {
        setConfidenceExplanation('Unable to generate explanation at this time.');
      }
    } catch (err) {
      setConfidenceExplanation('Error generating explanation. Please try again.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`http://localhost:8000/prediction/dashboard/${repoOwner}/${repoName}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Use real data from backend with fallbacks for UI stability
      const enhancedData = {
        ...data,
        // Ensure required fields exist with sensible defaults
        risky_files: data.risky_files || [],
        team_insights: data.team_insights || [],
        predicted_issues: data.predicted_issues || [],
        deployment_metrics: data.deployment_metrics || {
          success_rate: 0,
          average_deployment_time: 0,
          rollback_frequency: 0,
          last_deployment: new Date().toISOString()
        },
        action_items: data.action_items || {
          immediate: [],
          long_term: []
        }
      };
      
      setDashboardData(enhancedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [repoOwner, repoName]);

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColorClass = (score: number) => {
    if (score >= 0.8) return 'text-red-500 bg-red-50 border-red-200';
    if (score >= 0.6) return 'text-orange-500 bg-orange-50 border-orange-200';
    if (score >= 0.4) return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    return 'text-green-500 bg-green-50 border-green-200';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // File action handlers
  const handleViewFile = (filePath: string) => {
    setSelectedFilePath(filePath);
    setShowFileViewer(true);
  };

  const handleViewHistory = (filePath: string) => {
    setSelectedFilePath(filePath);
    setShowFileHistory(true);
  };

  const handleViewContributors = (filePath: string) => {
    setSelectedFilePath(filePath);
    setShowFileContributors(true);
  };

  // Enhanced markdown components for better formatting
  const MarkdownComponents = {
    p: ({ children }: any) => <p className="mb-2 text-slate-300 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-3 space-y-1 text-slate-300">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-3 space-y-1 text-slate-300">{children}</ol>,
    li: ({ children }: any) => <li className="text-slate-300">{children}</li>,
    strong: ({ children }: any) => <strong className="font-semibold text-slate-100">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-slate-200">{children}</em>,
    code: ({ children }: any) => <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-slate-200">{children}</code>,
    h1: ({ children }: any) => <h1 className="text-xl font-bold text-slate-100 mb-3">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-semibold text-slate-100 mb-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-medium text-slate-100 mb-2">{children}</h3>,
  };

  const filteredFiles = dashboardData?.risky_files?.filter(file => {
    const matchesSearch = file.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = selectedRiskLevel === 'all' || 
      (selectedRiskLevel === 'high' && file.risk_score >= 0.7) ||
      (selectedRiskLevel === 'medium' && file.risk_score >= 0.4 && file.risk_score < 0.7) ||
      (selectedRiskLevel === 'low' && file.risk_score < 0.4);
    return matchesSearch && matchesRisk;
  }) || [];

  if (loading || isAnalyzing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="max-w-md w-full mx-4">
          <Card className="bg-slate-800 border-slate-700 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {loading ? 'Loading Prediction Dashboard' : 'Analyzing Repository'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {repoOwner}/{repoName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">
                    {progressData?.message || 'Initializing analysis...'}
                  </span>
                  <span className="text-slate-400">
                    {progressData?.progress || 0}%
                  </span>
                </div>
                <Progress 
                  value={progressData?.progress || 0} 
                  className="h-3 bg-slate-700"
                  style={{
                    '--progress-background': 'rgb(51 65 85)', // slate-700
                    '--progress-foreground': 'rgb(99 102 241)', // indigo-500
                  } as React.CSSProperties}
                />
              </div>

              {/* Current Phase */}
              {progressData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600/50">
                    <div className="flex-shrink-0">
                      {progressData.phase === 'initialization' && (
                        <div className="p-2 bg-blue-900/30 rounded-lg">
                          <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
                        </div>
                      )}
                      {progressData.phase === 'data_collection' && (
                        <div className="p-2 bg-green-900/30 rounded-lg">
                          <BarChart3 className="h-4 w-4 text-green-400" />
                        </div>
                      )}
                      {progressData.phase === 'semantic_analysis' && (
                        <div className="p-2 bg-purple-900/30 rounded-lg">
                          <Code className="h-4 w-4 text-purple-400" />
                        </div>
                      )}
                      {progressData.phase === 'file_analysis' && (
                        <div className="p-2 bg-orange-900/30 rounded-lg">
                          <FileText className="h-4 w-4 text-orange-400" />
                        </div>
                      )}
                      {progressData.phase === 'pattern_detection' && (
                        <div className="p-2 bg-yellow-900/30 rounded-lg">
                          <Search className="h-4 w-4 text-yellow-400" />
                        </div>
                      )}
                      {progressData.phase === 'risk_scoring' && (
                        <div className="p-2 bg-red-900/30 rounded-lg">
                          <Target className="h-4 w-4 text-red-400" />
                        </div>
                      )}
                      {progressData.phase === 'synthesis' && (
                        <div className="p-2 bg-indigo-900/30 rounded-lg">
                          <Zap className="h-4 w-4 text-indigo-400" />
                        </div>
                      )}
                      {progressData.phase === 'complete' && (
                        <div className="p-2 bg-emerald-900/30 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-200 capitalize">
                        {progressData.phase.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-slate-400">
                        {progressData.message}
                      </div>
                      {progressData.currentFile && (
                        <div className="text-xs text-slate-500 mt-1 font-mono">
                          📄 {progressData.currentFile}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phase Descriptions */}
                  <div className="text-xs text-slate-500 text-center">
                    {progressData.phase === 'initialization' && 'Setting up analysis environment...'}
                    {progressData.phase === 'data_collection' && 'Gathering repository metrics and statistics...'}
                    {progressData.phase === 'semantic_discovery' && 'Discovering files for semantic analysis...'}
                    {progressData.phase === 'semantic_analysis' && 'AI is analyzing code quality and patterns...'}
                    {progressData.phase === 'file_analysis' && 'Deep-diving into individual files with AI...'}
                    {progressData.phase === 'pattern_detection' && 'Detecting bug patterns and team dynamics...'}
                    {progressData.phase === 'repository_patterns' && 'Analyzing repository-wide patterns...'}
                    {progressData.phase === 'risk_scoring' && 'Running hybrid AI + algorithmic risk assessment...'}
                    {progressData.phase === 'synthesis' && 'Combining all analysis results...'}
                    {progressData.phase === 'complete' && 'Analysis complete! Loading dashboard...'}
                  </div>
                </div>
              )}

              {/* Fallback for no progress data */}
              {!progressData && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                    <span className="text-slate-300">Connecting to analysis engine...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={fetchDashboardData}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return <div>No data available</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Predictive Issue Resolution
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-400">
              {repoOwner}/{repoName}
            </p>
            <Badge variant="outline" className="flex items-center gap-1 bg-slate-800 border-slate-600 text-slate-300">
              <Calendar className="h-3 w-3" />
              Last updated: {new Date(dashboardData.summary.last_analysis).toLocaleString()}
            </Badge>
            <Badge 
              variant={dashboardData.summary.repository_health_score >= 0.8 ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              Health: {Math.round(dashboardData.summary.repository_health_score * 100)}%
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button 
            onClick={fetchDashboardData} 
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Overall Risk Score</CardTitle>
            <div className="p-2 bg-emerald-900/30 rounded-lg">
              <Target className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {dashboardData.hybrid_scoring?.final_scores?.overall_risk_score 
                ? Math.round(dashboardData.hybrid_scoring.final_scores.overall_risk_score * 100) 
                : 'N/A'}%
            </div>
            <p className="text-xs text-slate-400">
              Hybrid AI + Algorithmic Assessment
            </p>
            <div className="mt-2">
              <Progress 
                value={dashboardData.hybrid_scoring?.final_scores?.overall_risk_score 
                  ? dashboardData.hybrid_scoring.final_scores.overall_risk_score * 100 
                  : 0} 
                className="h-2 bg-slate-700"
                style={{
                  '--progress-background': 'rgb(51 65 85)', // slate-700
                  '--progress-foreground': 'rgb(16 185 129)', // emerald-500
                } as React.CSSProperties}
              />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-blue-500 bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          onClick={() => setShowConfidenceModal(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Confidence Score
              <span className="ml-2 text-xs text-blue-400">(Click for details)</span>
            </CardTitle>
            <div className="p-2 bg-blue-900/30 rounded-lg">
              <Target className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {Math.round(dashboardData.summary.confidence_score * 100)}%
            </div>
            <Progress 
              value={dashboardData.summary.confidence_score * 100} 
              className="mt-2 h-2 bg-slate-700"
              style={{
                '--progress-background': 'rgb(51 65 85)', // slate-700
                '--progress-foreground': 'rgb(59 130 246)', // blue-500
              } as React.CSSProperties}
            />
            <p className="text-xs text-slate-400 mt-1">
              Model accuracy • Click to learn how this is calculated
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Code Quality Issues</CardTitle>
            <div className="p-2 bg-purple-900/30 rounded-lg">
              <Code className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {dashboardData.semantic_analysis?.total_risks || 0}
            </div>
            <p className="text-xs text-slate-400">
              Semantic analysis detected
            </p>
            <div className="flex items-center mt-2 text-xs">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              <span className="text-slate-400">
                {dashboardData.semantic_analysis?.severity_distribution?.critical || 0} critical
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Repository Health</CardTitle>
            <div className="p-2 bg-orange-900/30 rounded-lg">
              <Shield className="h-4 w-4 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {Math.round(dashboardData.summary.repository_health_score * 100)}%
            </div>
            <p className="text-xs text-slate-400">
              Overall health score
            </p>
            <div className="text-xs text-slate-400 mt-1">
              {dashboardData.hybrid_scoring?.insights?.risk_level_assessment?.split(' ')[0] || 'UNKNOWN'} risk level
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400">Risk Overview</TabsTrigger>
          <TabsTrigger value="files" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400">Code Analysis</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400">Team Insights</TabsTrigger>
          <TabsTrigger value="actions" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Semantic Analysis Summary */}
          {dashboardData.semantic_analysis && (
            <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Code className="h-5 w-5 text-purple-400" />
                  Semantic Code Analysis
                  <Badge variant="outline" className="bg-purple-900/30 text-purple-300 border-purple-500/50">
                    AI-Powered
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Line-by-line code quality analysis using RAG-indexed codebase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">
                      {dashboardData.semantic_analysis.total_risks}
                    </div>
                    <p className="text-xs text-slate-400">Code Quality Issues</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">
                      {dashboardData.semantic_analysis.severity_distribution.critical || 0}
                    </div>
                    <p className="text-xs text-slate-400">Critical Issues</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-400">
                      {Object.keys(dashboardData.semantic_analysis.risk_categories).length}
                    </div>
                    <p className="text-xs text-slate-400">Risk Categories</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {new Date(dashboardData.semantic_analysis.analysis_timestamp).toLocaleDateString()}
                    </div>
                    <p className="text-xs text-slate-400">Last Analysis</p>
                  </div>
                </div>
                
                {/* Top Semantic Risks */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Top Code Quality Issues</h4>
                  {dashboardData.semantic_analysis.top_risks.slice(0, 3).map((risk, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-600/50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        risk.severity === 'critical' ? 'bg-red-500' :
                        risk.severity === 'high' ? 'bg-orange-500' :
                        risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs bg-slate-700 border-slate-600 text-slate-300">
                            {risk.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${
                            risk.severity === 'critical' ? 'bg-red-900/30 text-red-400 border-red-600' :
                            risk.severity === 'high' ? 'bg-orange-900/30 text-orange-400 border-orange-600' :
                            risk.severity === 'medium' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-600' :
                            'bg-green-900/30 text-green-400 border-green-600'
                          }`}>
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 mb-1">
                          {risk.description.length > 100 ? `${risk.description.substring(0, 100)}...` : risk.description}
                        </p>
                        <p className="text-xs text-slate-400">
                          Files: {risk.files.slice(0, 2).join(', ')}{risk.files.length > 2 ? ` +${risk.files.length - 2} more` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hybrid Risk Scoring Results */}
          {dashboardData.hybrid_scoring && (
            <Card className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Target className="h-5 w-5 text-emerald-400" />
                  Hybrid Risk Scoring
                  <Badge variant="outline" className="bg-emerald-900/30 text-emerald-300 border-emerald-500/50">
                    AI + Algorithmic
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Combined algorithmic and LLM-based risk assessment with confidence weighting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-400">
                      {Math.round(dashboardData.hybrid_scoring.final_scores.overall_risk_score * 100)}%
                    </div>
                    <p className="text-xs text-slate-400">Overall Risk Score</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {Math.round(dashboardData.hybrid_scoring.final_scores.overall_confidence * 100)}%
                    </div>
                    <p className="text-xs text-slate-400">Scoring Confidence</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className={`text-2xl font-bold ${
                      dashboardData.hybrid_scoring.insights.scoring_reliability.level === 'HIGH' ? 'text-green-400' :
                      dashboardData.hybrid_scoring.insights.scoring_reliability.level === 'MEDIUM' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {dashboardData.hybrid_scoring.insights.scoring_reliability.level}
                    </div>
                    <p className="text-xs text-slate-400">Reliability</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-400">
                      {dashboardData.hybrid_scoring.insights.top_concerns.length}
                    </div>
                    <p className="text-xs text-slate-400">Top Concerns</p>
                  </div>
                </div>

                {/* Risk Level Assessment */}
                <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-600/50">
                  <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    Risk Level Assessment
                  </h4>
                  <p className={`text-sm font-medium ${
                    dashboardData.hybrid_scoring.insights.risk_level_assessment.includes('CRITICAL') ? 'text-red-400' :
                    dashboardData.hybrid_scoring.insights.risk_level_assessment.includes('HIGH') ? 'text-orange-400' :
                    dashboardData.hybrid_scoring.insights.risk_level_assessment.includes('MEDIUM') ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {dashboardData.hybrid_scoring.insights.risk_level_assessment}
                  </p>
                </div>

                {/* Score Breakdown */}
                <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-600/50">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Score Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Algorithmic Score</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={dashboardData.hybrid_scoring.final_scores.score_breakdown.algorithmic_score * 100} 
                          className="w-20 h-2 bg-slate-700"
                          style={{
                            '--progress-background': 'rgb(51 65 85)',
                            '--progress-foreground': 'rgb(59 130 246)',
                          } as React.CSSProperties}
                        />
                        <span className="text-sm font-medium text-slate-300 w-12">
                          {Math.round(dashboardData.hybrid_scoring.final_scores.score_breakdown.algorithmic_score * 100)}%
                        </span>
                        <Badge variant="outline" className="text-xs bg-slate-700 border-slate-600 text-slate-400">
                          {Math.round(dashboardData.hybrid_scoring.final_scores.algorithmic_weight * 100)}% weight
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">LLM Score</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={dashboardData.hybrid_scoring.final_scores.score_breakdown.llm_score * 100} 
                          className="w-20 h-2 bg-slate-700"
                          style={{
                            '--progress-background': 'rgb(51 65 85)',
                            '--progress-foreground': 'rgb(168 85 247)',
                          } as React.CSSProperties}
                        />
                        <span className="text-sm font-medium text-slate-300 w-12">
                          {Math.round(dashboardData.hybrid_scoring.final_scores.score_breakdown.llm_score * 100)}%
                        </span>
                        <Badge variant="outline" className="text-xs bg-slate-700 border-slate-600 text-slate-400">
                          {Math.round(dashboardData.hybrid_scoring.final_scores.llm_weight * 100)}% weight
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Concerns */}
                {dashboardData.hybrid_scoring.insights.top_concerns.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Top Concerns</h4>
                    {dashboardData.hybrid_scoring.insights.top_concerns.slice(0, 3).map((concern, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-red-900/10 rounded-lg border border-red-800/30">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-300">{concern}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution Chart */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <PieChart className="h-5 w-5" />
                  Risk Distribution
                </CardTitle>
                <CardDescription className="text-slate-400">Current risk levels across the repository</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dashboardData.risk_breakdown).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${getRiskColor(severity)}`} />
                        <span className="capitalize font-medium text-slate-300">{severity}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-slate-700 text-slate-300">{count}</Badge>
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getRiskColor(severity)}`}
                            style={{ width: `${(count / dashboardData.summary.total_risks) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <BarChart3 className="h-5 w-5" />
                  Trend Analysis
                </CardTitle>
                <CardDescription className="text-slate-400">Repository health trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-slate-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(dashboardData.trend_data.risk_trend)}
                      <span className="font-medium text-slate-300">Risk Trend</span>
                    </div>
                    <Badge variant="outline" className="capitalize bg-slate-700 border-slate-600 text-slate-300">
                      {dashboardData.trend_data.risk_trend}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-slate-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(dashboardData.trend_data.pattern_trend)}
                      <span className="font-medium text-slate-300">Pattern Detection</span>
                    </div>
                    <Badge variant="outline" className="capitalize bg-slate-700 border-slate-600 text-slate-300">
                      {dashboardData.trend_data.pattern_trend}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-slate-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(dashboardData.trend_data.confidence_trend)}
                      <span className="font-medium text-slate-300">Model Confidence</span>
                    </div>
                    <Badge variant="outline" className="capitalize bg-slate-700 border-slate-600 text-slate-300">
                      {dashboardData.trend_data.confidence_trend}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          {/* Risk Explanation */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <AlertCircle className="h-5 w-5 text-blue-400" />
                Understanding File Risk
              </CardTitle>
              <CardDescription className="text-slate-400">
                Files are considered risky based on multiple factors that indicate potential for bugs or maintenance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-orange-400" />
                    <span className="font-medium text-slate-200">High Change Frequency</span>
                  </div>
                  <p className="text-xs text-slate-400">Files modified frequently are more prone to introducing bugs</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-slate-200">Multiple Contributors</span>
                  </div>
                  <p className="text-xs text-slate-400">Files touched by many developers may have inconsistent patterns</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium text-slate-200">High Complexity</span>
                  </div>
                  <p className="text-xs text-slate-400">Complex files are harder to understand and modify safely</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="h-4 w-4 text-red-400" />
                    <span className="font-medium text-slate-200">Issue History</span>
                  </div>
                  <p className="text-xs text-slate-400">Files linked to many bug reports indicate problem areas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Filters */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Filter className="h-5 w-5" />
                File Risk Analysis
              </CardTitle>
              <CardDescription className="text-slate-400">
                Detailed analysis of files with potential issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400"
                  />
                </div>
                <select
                  value={selectedRiskLevel}
                  onChange={(e) => setSelectedRiskLevel(e.target.value)}
                  className="px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk (&gt;=70%)</option>
                  <option value="medium">Medium Risk (40-70%)</option>
                  <option value="low">Low Risk (&lt;40%)</option>
                </select>
              </div>

              <div className="space-y-3">
                {filteredFiles.length > 0 ? filteredFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className={`border border-slate-600 rounded-lg transition-all hover:shadow-md bg-slate-800 ${
                      (file.risk_score || 0) >= 0.8 ? 'border-l-4 border-l-red-500' :
                      (file.risk_score || 0) >= 0.6 ? 'border-l-4 border-l-orange-500' :
                      (file.risk_score || 0) >= 0.4 ? 'border-l-4 border-l-yellow-500' :
                      'border-l-4 border-l-green-500'
                    }`}
                  >
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedFileDetails(expandedFileDetails === file.path ? null : file.path)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Code className="h-4 w-4 text-slate-400" />
                            <span className="font-mono text-sm font-medium text-slate-100">
                              {file.path || 'Unknown file'}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                (file.risk_score || 0) >= 0.8 ? 'bg-red-900/20 text-red-400 border-red-600' :
                                (file.risk_score || 0) >= 0.6 ? 'bg-orange-900/20 text-orange-400 border-orange-600' :
                                (file.risk_score || 0) >= 0.4 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-600' :
                                'bg-green-900/20 text-green-400 border-green-600'
                              }`}
                            >
                              Risk: {Math.round((file.risk_score || 0) * 100)}%
                            </Badge>
                            {(file.risk_score || 0) >= 0.8 && (
                              <Badge variant="outline" className="text-xs bg-red-900/20 text-red-400 border-red-600">
                                Critical
                              </Badge>
                            )}
                            {(file.touch_count || 0) > 50 && (
                              <Badge variant="outline" className="text-xs bg-orange-900/20 text-orange-400 border-orange-600">
                                High Activity
                              </Badge>
                            )}
                            {(file.unique_authors || 0) > 10 && (
                              <Badge variant="outline" className="text-xs bg-purple-900/20 text-purple-400 border-purple-600">
                                Many Contributors
                              </Badge>
                            )}
                            {(file.complexity_score || 0) > 0.7 && (
                              <Badge variant="outline" className="text-xs bg-yellow-900/20 text-yellow-400 border-yellow-600">
                                Complex
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {file.touch_count || 0} changes
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {file.unique_authors || 0} authors
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {file.last_modified ? new Date(file.last_modified).toLocaleDateString() : 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {file.primary_author || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className={`h-4 w-4 text-slate-400 transition-transform ${
                          expandedFileDetails === file.path ? 'rotate-90' : ''
                        }`} />
                      </div>
                      <Progress 
                        value={(file.risk_score || 0) * 100} 
                        className="mt-3 h-2 bg-slate-700"
                        style={{
                          '--progress-background': 'rgb(51 65 85)', // slate-700
                          '--progress-foreground': (file.risk_score || 0) >= 0.8 ? 'rgb(239 68 68)' : // red-500
                                                   (file.risk_score || 0) >= 0.6 ? 'rgb(249 115 22)' : // orange-500
                                                   (file.risk_score || 0) >= 0.4 ? 'rgb(234 179 8)' : // yellow-500
                                                   'rgb(34 197 94)', // green-500
                        } as React.CSSProperties}
                      />
                    </div>
                    
                    {expandedFileDetails === file.path && (
                      <div className="border-t border-slate-600 p-4 bg-slate-900/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-slate-800 rounded-lg">
                            <div className="text-2xl font-bold text-slate-100">
                              {file.touch_count || 0}
                            </div>
                            <p className="text-xs text-slate-400">Total Changes</p>
                          </div>
                          <div className="text-center p-3 bg-slate-800 rounded-lg">
                            <div className="text-2xl font-bold text-slate-100">
                              {Math.round((file.complexity_score || 0) * 100)}%
                            </div>
                            <p className="text-xs text-slate-400">Complexity</p>
                          </div>
                          <div className="text-center p-3 bg-slate-800 rounded-lg">
                            <div className="text-2xl font-bold text-slate-100">
                              {file.issues_linked || 0}
                            </div>
                            <p className="text-xs text-slate-400">Linked Issues</p>
                          </div>
                        </div>

                        {/* Risk Breakdown */}
                        <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                          <h4 className="text-sm font-medium text-slate-100 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-400" />
                            Risk Factors
                          </h4>
                          <div className="space-y-2 text-xs">
                            {(file.touch_count || 0) > 50 && (
                              <div className="flex items-center gap-2 text-orange-300">
                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                High change frequency ({file.touch_count} modifications) increases bug risk
                              </div>
                            )}
                            {(file.unique_authors || 0) > 10 && (
                              <div className="flex items-center gap-2 text-purple-300">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                Many contributors ({file.unique_authors}) may lead to inconsistent code patterns
                              </div>
                            )}
                            {(file.complexity_score || 0) > 0.7 && (
                              <div className="flex items-center gap-2 text-yellow-300">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                High complexity ({Math.round((file.complexity_score || 0) * 100)}%) makes maintenance difficult
                              </div>
                            )}
                            {(file.issues_linked || 0) > 0 && (
                              <div className="flex items-center gap-2 text-red-300">
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                Linked to {file.issues_linked} issue(s) indicating past problems
                              </div>
                            )}
                            {(file.risk_score || 0) < 0.3 && (
                              <div className="flex items-center gap-2 text-green-300">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                Low risk file with stable change patterns
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleViewFile(file.path)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View File
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => handleViewHistory(file.path)}
                          >
                            <GitBranch className="h-4 w-4 mr-2" />
                            View History
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => handleViewContributors(file.path)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Contributors
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Code className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-400">No risky files found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting the risk level filter or search terms
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="team" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Users className="h-5 w-5" />
                Team Risk Analysis
              </CardTitle>
              <CardDescription className="text-slate-400">Individual contributor patterns and risk factors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {dashboardData.team_insights?.map((member, index) => (
                  <div key={index} className="p-4 border border-slate-600 rounded-lg bg-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-100">{member.name || 'Unknown User'}</h3>
                          <p className="text-sm text-slate-400">
                            {member.commits || 0} commits • {member.files_touched || 0} files
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(member.velocity_trend || 'stable')}
                        <Badge variant="outline" className="bg-slate-700 border-slate-600 text-slate-300">
                          Risk: {Math.round((member.risk_contribution || 0) * 100)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-slate-300">Knowledge Areas</h4>
                        <div className="flex flex-wrap gap-1">
                          {(member.knowledge_areas || []).map((area, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                              {area}
                            </Badge>
                          ))}
                          {(!member.knowledge_areas || member.knowledge_areas.length === 0) && (
                            <span className="text-xs text-slate-500">No specific areas identified</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-slate-300">Collaboration Score</h4>
                        <div className="flex items-center gap-2">
                          <Progress 
                          value={(member.collaboration_score || 0) * 100} 
                          className="flex-1 h-2 bg-slate-700"
                          style={{
                            '--progress-background': 'rgb(51 65 85)', // slate-700
                            '--progress-foreground': 'rgb(34 197 94)', // green-500
                          } as React.CSSProperties}
                        />
                          <span className="text-sm font-medium text-slate-300">
                            {Math.round((member.collaboration_score || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Zap className="h-5 w-5 text-red-400" />
                  Immediate Actions
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Critical actions needed within 1 week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.action_items.immediate.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.action_items.immediate.map((action, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border border-slate-600 rounded-lg bg-red-900/10">
                        <div className="p-1 bg-red-900/30 rounded">
                          <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-300 font-medium mb-2">
                            <ReactMarkdown 
                              components={MarkdownComponents}
                              remarkPlugins={[remarkGfm]}
                            >
                              {action.replace(/^\d+\.\s*/, '').replace(/^[•\-*]\s*/, '')}
                            </ReactMarkdown>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="text-xs h-7 border-slate-600 text-slate-400 hover:text-slate-200">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm" className="text-xs h-7 bg-red-600 hover:bg-red-700 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <p className="text-slate-400">No immediate actions required</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Target className="h-5 w-5 text-blue-400" />
                  Strategic Improvements
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Long-term strategies for sustained health
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.action_items.long_term.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.action_items.long_term.map((strategy, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border border-slate-600 rounded-lg bg-blue-900/10">
                        <div className="p-1 bg-blue-900/30 rounded">
                          <Shield className="h-3 w-3 text-blue-400 flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-300 font-medium mb-2">
                            <ReactMarkdown 
                              components={MarkdownComponents}
                              remarkPlugins={[remarkGfm]}
                            >
                              {strategy.replace(/^\d+\.\s*/, '').replace(/^[•\-*]\s*/, '')}
                            </ReactMarkdown>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="text-xs h-7 border-slate-600 text-slate-400 hover:text-slate-200">
                              <Calendar className="h-3 w-3 mr-1" />
                              Schedule
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7 border-slate-600 text-slate-400 hover:text-slate-200">
                              <Users className="h-3 w-3 mr-1" />
                              Assign Team
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                    <p className="text-slate-400">No long-term strategies identified</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confidence Explanation Modal */}
      {showConfidenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-slate-100">
                Confidence Score Explanation
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfidenceModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ×
              </Button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {Math.round(dashboardData.summary.confidence_score * 100)}%
                  </div>
                  <p className="text-slate-400">
                    Current Model Confidence
                  </p>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-medium text-slate-100 mb-2">
                    How is this calculated?
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Our confidence score is based on multiple factors including data quality, 
                    pattern consistency, and historical prediction accuracy.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Data Quality</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={85} 
                          className="w-20 h-2"
                          style={{
                            '--progress-background': 'rgb(51 65 85)', // slate-700
                            '--progress-foreground': 'rgb(34 197 94)', // green-500
                          } as React.CSSProperties}
                        />
                        <span className="text-sm font-medium text-slate-300">85%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Pattern Consistency</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={72} 
                          className="w-20 h-2"
                          style={{
                            '--progress-background': 'rgb(51 65 85)', // slate-700
                            '--progress-foreground': 'rgb(234 179 8)', // yellow-500
                          } as React.CSSProperties}
                        />
                        <span className="text-sm font-medium text-slate-300">72%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Historical Accuracy</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={78} 
                          className="w-20 h-2"
                          style={{
                            '--progress-background': 'rgb(51 65 85)', // slate-700
                            '--progress-foreground': 'rgb(59 130 246)', // blue-500
                          } as React.CSSProperties}
                        />
                        <span className="text-sm font-medium text-slate-300">78%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {confidenceExplanation ? (
                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                    <h3 className="font-medium text-slate-100 mb-2">
                      AI Analysis
                    </h3>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {confidenceExplanation}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button 
                      onClick={fetchConfidenceExplanation}
                      disabled={loadingExplanation}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loadingExplanation ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Generating Explanation...
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4 mr-2" />
                          Get AI Explanation
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-slate-100">File Risk Analysis</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ×
              </Button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                <div>
                  <h3 className="font-mono text-lg font-medium mb-2">{selectedFile.path}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Risk Score: {Math.round(selectedFile.risk_score * 100)}%</span>
                    <span>Complexity: {Math.round(selectedFile.complexity_score * 100)}%</span>
                    <span>Last Modified: {new Date(selectedFile.last_modified).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Change Frequency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedFile.touch_count}</div>
                      <p className="text-xs text-muted-foreground">Total changes</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Contributors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedFile.unique_authors}</div>
                      <p className="text-xs text-muted-foreground">Unique authors</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Linked Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedFile.issues_linked}</div>
                      <p className="text-xs text-muted-foreground">Related issues</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button>
                    <Eye className="h-4 w-4 mr-2" />
                    View File
                  </Button>
                  <Button variant="outline">
                    <GitBranch className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    View Contributors
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Components */}
      {showFileViewer && selectedFilePath && sessionId && (
        <FileViewer
          filePath={selectedFilePath}
          sessionId={sessionId}
          onClose={() => setShowFileViewer(false)}
        />
      )}

      {showFileHistory && selectedFilePath && sessionId && (
        <FileHistoryViewer
          filePath={selectedFilePath}
          sessionId={sessionId}
          onClose={() => setShowFileHistory(false)}
        />
      )}

      {showFileContributors && selectedFilePath && sessionId && (
        <FileContributorsViewer
          filePath={selectedFilePath}
          sessionId={sessionId}
          onClose={() => setShowFileContributors(false)}
        />
      )}
    </div>
  );
}; 