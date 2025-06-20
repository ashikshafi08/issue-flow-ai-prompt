import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  CheckCircle, 
  Circle, 
  Bot, 
  Target, 
  TrendingUp,
  BookOpen,
  Code,
  Play,
  Award,
  Brain,
  Github,
  Plus,
  ExternalLink,
  GitBranch,
  Star,
  FolderGit2,
  Activity,
  FileCode,
  Terminal,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { createOnboardingAPI } from '@/lib/onboarding-api';
import { OnboardingAIChat } from '@/components/OnboardingAIChat';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  step_type: string;
  estimated_time: number;
  completed?: boolean;
  resources: Resource[];
  difficulty_level?: string;
}

interface Resource {
  type: 'guide' | 'video' | 'ai_chat' | 'markdown' | 'interactive';
  title: string;
  url?: string;
  path?: string;
  prompt?: string;
}

interface ProgressSummary {
  current_step: number;
  total_steps: number;
  completion_percentage: number;
  time_spent_hours: number;
  estimated_time_remaining: number;
  achievements: string[];
  current_phase: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  repo_url: string;
  language: string;
  stars: number;
  forks: number;
  last_updated: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  technologies: string[];
}

export const OnboardingDashboard: React.FC = () => {
  const [workflow, setWorkflow] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatVisible, setChatVisible] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [addingProject, setAddingProject] = useState(false);
  
  // New state for project chat mode
  const [projectChatMode, setProjectChatMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSessionId, setProjectSessionId] = useState<string | null>(null);
  
  useEffect(() => {
    const initData = async () => {
      try {
        setWorkflow(getDemoWorkflow());
        setProgress(getDemoProgress());
        setProjects(getDemoProjects());
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initData();
  }, []);

  const handleAddProject = async () => {
    if (!newRepoUrl.trim()) return;
    
    setAddingProject(true);
    const newProject: Project = {
      id: Date.now().toString(),
      name: newRepoUrl.split('/').pop() || 'New Project',
      description: 'Imported from GitHub repository',
      repo_url: newRepoUrl,
      language: 'TypeScript',
      stars: 0,
      forks: 0,
      last_updated: new Date().toISOString(),
      status: 'pending',
      progress: 0,
      technologies: ['React', 'TypeScript']
    };
    
    setProjects(prev => [newProject, ...prev]);
    setNewRepoUrl('');
    setAddingProject(false);
  };

  const handleProjectClick = async (project: Project) => {
    try {
      setSelectedProject(project);
      
      // Create or get session for this project
      const sessionResponse = await createProjectSession(project);
      setProjectSessionId(sessionResponse.session_id);
      
      // Switch to project chat mode
      setProjectChatMode(true);
    } catch (error) {
      console.error('Failed to start project chat:', error);
      // For demo purposes, use a mock session ID
      setSelectedProject(project);
      setProjectSessionId(`demo-${project.id}`);
      setProjectChatMode(true);
    }
  };

  const createProjectSession = async (project: Project) => {
    // This would call your backend to create a new session for the project
    // For now, we'll simulate this
    return {
      session_id: `session-${project.id}-${Date.now()}`,
      project_id: project.id,
      repo_url: project.repo_url
    };
  };

  const handleBackToDashboard = () => {
    setProjectChatMode(false);
    setSelectedProject(null);
    setProjectSessionId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-8 h-8 mx-auto border-2 border-foreground/20 border-t-foreground rounded-full animate-spin"></div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-foreground">OnboardAI Intelligence</h3>
            <p className="text-muted-foreground text-sm">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // PROJECT CHAT MODE - Full screen project-specific chat
  if (projectChatMode && selectedProject && projectSessionId) {
    return (
      <OnboardingAIChat
        mode="project"
        project={selectedProject}
        sessionId={projectSessionId}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Clean Header */}
        <div className="mb-8 animate-fade-in">
          <div className="card-minimal">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent">
                  <Brain className="h-8 w-8 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Welcome to the Future</p>
                  <h1 className="text-2xl font-semibold text-foreground">OnboardAI Intelligence</h1>
                  <p className="text-muted-foreground">Your AI-powered development companion</p>
                </div>
              </div>
              
              <Button 
                onClick={() => setChatVisible(!chatVisible)}
                className="btn-minimal gap-2"
              >
                <Bot className="h-4 w-4" />
                AI Assistant
              </Button>
            </div>
          </div>
        </div>

        {/* Clean Navigation */}
        <div className="animate-slide-up">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-card border border-border rounded-lg p-1">
              {[
                { id: 'overview', icon: TrendingUp, label: 'Overview' },
                { id: 'projects', icon: FolderGit2, label: 'Projects' },
                { id: 'workflow', icon: Activity, label: 'Workflow' },
                { id: 'progress', icon: BarChart3, label: 'Analytics' },
                { id: 'resources', icon: BookOpen, label: 'Resources' }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className="flex items-center gap-2 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground transition-colors rounded-md px-4 py-2 text-sm font-medium focus-ring"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <OverviewSection progress={progress} workflow={workflow} />
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <ProjectsSection 
                projects={projects} 
                newRepoUrl={newRepoUrl}
                setNewRepoUrl={setNewRepoUrl}
                onAddProject={handleAddProject}
                addingProject={addingProject}
                onProjectClick={handleProjectClick}
              />
            </TabsContent>

            <TabsContent value="workflow" className="space-y-6">
              <WorkflowSection workflow={workflow} />
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <ProgressSection progress={progress} />
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <ResourcesSection workflow={workflow} />
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Chat Overlay */}
        {chatVisible && (
          <div className="fixed bottom-6 right-6 w-96 h-[600px] z-50 animate-slide-up">
            <OnboardingAIChat onClose={() => setChatVisible(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

// Clean sections with minimal styling
const OverviewSection: React.FC<{
  progress: ProgressSummary | null;
  workflow: OnboardingStep[];
}> = ({ progress, workflow }) => {
  const completedSteps = workflow.filter(step => step.completed).length;
  const totalSteps = workflow.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 33;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-2 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-foreground" />
            <h3 className="text-lg font-medium text-foreground">Your Learning Journey</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            {Math.round(progressPercentage)}% complete • {completedSteps} of {totalSteps} steps
          </p>
          <div className="progress-minimal">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="h-5 w-5 text-foreground" />
            <h3 className="text-lg font-medium text-foreground">AI Companion</h3>
          </div>
          <p className="text-muted-foreground text-sm">Get instant help and guidance</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Time Invested', value: '2.5h', icon: Clock },
          { title: 'Achievements', value: 3, icon: Award },
          { title: 'Estimated Remaining', value: '3.5h', icon: Target }
        ].map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{stat.title}</p>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-accent">
                <stat.icon className="h-5 w-5 text-foreground" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ProjectsSection: React.FC<{
  projects: Project[];
  newRepoUrl: string;
  setNewRepoUrl: (url: string) => void;
  onAddProject: () => void;
  addingProject: boolean;
  onProjectClick: (project: Project) => void;
}> = ({ projects, newRepoUrl, setNewRepoUrl, onAddProject, addingProject, onProjectClick }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 rounded-lg bg-accent">
            <Plus className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">Import GitHub Repository</h3>
            <p className="text-muted-foreground text-sm">Connect your project to start your AI-powered onboarding journey</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="https://github.com/username/repository"
              value={newRepoUrl}
              onChange={(e) => setNewRepoUrl(e.target.value)}
              className="pl-10 focus-ring"
            />
          </div>
          <Button
            onClick={onAddProject}
            disabled={!newRepoUrl.trim() || addingProject}
            className="btn-minimal gap-2"
          >
            {addingProject ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="p-4 feature-card cursor-pointer group" onClick={() => onProjectClick(project)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{project.name}</h4>
                <p className="text-sm text-muted-foreground">{project.language}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {project.status}
                </Badge>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MessageSquare className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
            
            {/* Technology tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {project.technologies.map((tech, index) => (
                <span key={index} className="px-2 py-1 bg-accent text-foreground text-xs rounded">
                  {tech}
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {project.stars}
                </div>
                <div className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {project.forks}
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs font-medium">Open Chat</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const WorkflowSection: React.FC<{ workflow: OnboardingStep[] }> = ({ workflow }) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {workflow.map((step) => (
        <Card key={step.id} className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${step.completed ? 'bg-green-100 text-green-600' : 'bg-accent text-foreground'}`}>
              {step.completed ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-foreground">{step.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {step.estimated_time}m
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const ProgressSection: React.FC<{ progress: ProgressSummary | null }> = ({ progress }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Learning Analytics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Complete</span>
                <span className="text-foreground">33%</span>
              </div>
              <div className="progress-minimal">
                <div className="progress-fill" style={{ width: '33%' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Achievements</h3>
          <div className="space-y-2">
            {['Environment Setup', 'First PR', 'Code Review'].map((achievement, index) => (
              <div key={index} className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-foreground">{achievement}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const ResourcesSection: React.FC<{ workflow: OnboardingStep[] }> = ({ workflow }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Available Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {workflow.flatMap(step => step.resources).map((resource, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded border border-border">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{resource.title}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const getDemoProjects = (): Project[] => [
  {
    id: '1',
    name: 'triage.flow',
    description: 'AI-powered repository analysis and onboarding system',
    repo_url: 'https://github.com/ash/triage.flow',
    language: 'TypeScript',
    stars: 24,
    forks: 8,
    last_updated: '2024-01-15T10:30:00Z',
    status: 'active',
    progress: 75,
    technologies: ['React', 'TypeScript', 'FastAPI', 'Python']
  },
  {
    id: '2',
    name: 'react-dashboard',
    description: 'Modern dashboard with real-time analytics',
    repo_url: 'https://github.com/ash/react-dashboard',
    language: 'JavaScript',
    stars: 12,
    forks: 3,
    last_updated: '2024-01-10T14:20:00Z',
    status: 'completed',
    progress: 100,
    technologies: ['React', 'Chart.js', 'CSS3']
  },
  {
    id: '3',
    name: 'api-gateway',
    description: 'Microservices API gateway with authentication',
    repo_url: 'https://github.com/ash/api-gateway',
    language: 'Go',
    stars: 8,
    forks: 2,
    last_updated: '2024-01-12T09:15:00Z',
    status: 'pending',
    progress: 30,
    technologies: ['Go', 'Docker', 'Redis', 'JWT']
  }
];

const getDemoWorkflow = (): OnboardingStep[] => [
  {
    id: '1',
    title: 'Environment Setup',
    description: 'Set up your development environment',
    step_type: 'setup',
    estimated_time: 30,
    completed: true,
    difficulty_level: 'beginner',
    resources: [{ type: 'guide', title: 'Setup Guide', url: '/guides/setup' }]
  },
  {
    id: '2',
    title: 'Code Architecture Overview',
    description: 'Learn about the codebase structure',
    step_type: 'learning',
    estimated_time: 45,
    completed: false,
    difficulty_level: 'intermediate',
    resources: [{ type: 'guide', title: 'Architecture Docs', url: '/docs/architecture' }]
  }
];

const getDemoProgress = (): ProgressSummary => ({
  current_step: 1,
  total_steps: 3,
  completion_percentage: 33,
  time_spent_hours: 2.5,
  estimated_time_remaining: 3.5,
  achievements: ['Environment Setup', 'First PR', 'Code Review'],
  current_phase: 'Learning Path Active'
});

export default OnboardingDashboard; 