import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  X, 
  BookOpen, 
  Code, 
  HelpCircle, 
  Zap, 
  Brain,
  Github,
  Plus,
  FolderGit2,
  Lightbulb,
  MessageSquare,
  Settings,
  ArrowUp,
  Workflow,
  Target,
  FileCode,
  GitBranch,
  Database,
  Terminal,
  Layers,
  ArrowLeft,
  Maximize2,
  PanelLeft
} from 'lucide-react';
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text';
import SparklesText from '@/components/magicui/sparkles-text';
import { Marquee } from '@/components/magicui/marquee';
import EnhancedChatMessage from './EnhancedChatMessage';
import CodebaseTree from './CodebaseTree';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agenticSteps?: any[];
  structured_response?: {
    type: string;
    data: any;
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  repo_url: string;
  language: string;
  technologies: string[];
  status: 'active' | 'completed' | 'pending';
}

interface OnboardingAIChatProps {
  currentStep?: any;
  onSuggestionClick?: (suggestion: string) => void;
  onClose?: () => void;
  className?: string;
  mode?: 'overlay' | 'project';
  project?: Project;
  sessionId?: string;
  onBackToDashboard?: () => void;
}

export const OnboardingAIChat: React.FC<OnboardingAIChatProps> = ({ 
  currentStep, 
  onSuggestionClick, 
  onClose,
  className = "",
  mode = 'overlay',
  project,
  sessionId,
  onBackToDashboard
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: mode === 'project' && project 
        ? `Welcome to ${project.name}! 🚀 I'm here to help you understand this ${project.language} project. I can explain the codebase structure, help with specific files, or answer any questions about the ${project.technologies.join(', ')} technologies used here.`
        : "Welcome to OnboardAI! 🚀 I'm your intelligent companion for repository onboarding. I can help you understand codebases, import GitHub repositories, explain concepts, or answer any questions about your learning journey. What would you like to explore?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProjectImport, setShowProjectImport] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'projects' | 'help'>('chat');
  const [showCodebaseTree, setShowCodebaseTree] = useState(mode === 'project');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    
    try {
      const response = await simulateAIResponse(currentInput, currentStep, project);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        structured_response: response.structured_response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or ask your question differently.",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectImport = async () => {
    if (!newRepoUrl.trim()) return;
    
    const importMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🔄 **Importing Repository**\n\n**${newRepoUrl}**\n\nI'm analyzing this repository to create a personalized onboarding experience for you. This will include:\n\n• Code structure analysis\n• Technology stack identification\n• Learning path generation\n• Resource recommendations\n\n*This typically takes 2-3 minutes for most repositories.*`,
      timestamp: Date.now(),
      structured_response: {
        type: 'project_import',
        data: {
          repo_url: newRepoUrl,
          status: 'processing',
          steps: [
            'Cloning repository',
            'Analyzing code structure',
            'Identifying technologies',
            'Generating learning path'
          ]
        }
      }
    };
    
    setMessages(prev => [...prev, importMessage]);
    setNewRepoUrl('');
    setShowProjectImport(false);
    setActiveTab('chat');
  };
  
  const getQuickActions = () => {
    if (mode === 'project' && project) {
      return [
        "Explain the project architecture",
        "Show me the main entry points",
        "What are the key components?",
        "How do I set up the development environment?",
        "Walk me through the data flow",
        "What testing strategies are used?"
      ];
    }

    const baseActions = [
      "Explain this repository structure",
      "What should I learn first?",
      "Show me the main components",
      "Create a learning roadmap"
    ];

    if (!currentStep) return baseActions;
    
    switch (currentStep.step_type) {
      case 'setup':
        return [
          "How do I set up my development environment?",
          "What tools do I need to install?",
          "Show me the setup verification steps",
          "Common setup issues and fixes"
        ];
      case 'exploration':
        return [
          "Explain the repository structure",
          "What are the main components?",
          "Where should I start exploring?",
          "Show me the data flow"
        ];
      case 'task':
        return [
          "Suggest a good first task for me",
          "How do I create my first PR?",
          "What's the code review process?",
          "Best practices for contributions"
        ];
      default:
        return baseActions;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    // Add file context to chat
    const fileMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `📁 **File Selected: ${filePath}**\n\nI can help you understand this file. Ask me about its purpose, structure, dependencies, or how it fits into the overall project.`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, fileMessage]);
  };

  // PROJECT MODE - Full screen interface with codebase tree
  if (mode === 'project') {
    return (
      <div className="flex h-screen bg-background">
        {/* Sidebar with Codebase Tree */}
        {showCodebaseTree && (
          <div className="w-80 border-r border-border bg-card flex-shrink-0">
            <div className="h-full flex flex-col">
              {/* Tree Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-accent">
                      <FolderGit2 className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Files</h3>
                      <p className="text-xs text-muted-foreground">{project?.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCodebaseTree(false)}
                    className="h-8 w-8 p-0"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Tree Content */}
              <div className="flex-1 overflow-hidden">
                {sessionId && (
                  <CodebaseTree
                    sessionId={sessionId}
                    onFileSelect={handleFileSelect}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="border-b border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {onBackToDashboard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBackToDashboard}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                
                {!showCodebaseTree && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCodebaseTree(true)}
                    className="h-8 w-8 p-0"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                )}
                
                <div className="p-2 rounded-lg bg-accent">
                  <Brain className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-medium text-foreground">
                    {project?.name || 'Project Chat'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {project?.technologies.join(' • ') || 'AI Assistant'}
                  </p>
                </div>
              </div>
              
              <Badge variant="secondary" className="text-xs">
                {project?.language || 'Active'}
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {messages.map((message) => (
                  <EnhancedChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    agenticSteps={message.agenticSteps}
                    sessionId={sessionId}
                    structuredResponse={message.structured_response}
                    onFileSelect={handleFileSelect}
                  />
                ))}
                
                {loading && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                      <Bot className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-border bg-card/50 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-foreground/60" />
              <span className="text-xs font-medium text-muted-foreground">Quick Actions</span>
            </div>
            
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-1">
                {getQuickActions().map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput(action);
                      onSuggestionClick?.(action);
                    }}
                    className="whitespace-nowrap text-xs h-8 btn-minimal"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Input */}
          <div className="border-t border-border bg-card p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-3"
            >
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={`Ask about ${project?.name || 'this project'}...`}
                  className="resize-none pr-12 focus-ring"
                  rows={2}
                  disabled={loading}
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {input.length}/500
                </div>
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-minimal h-12 w-12 p-0"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // OVERLAY MODE - Original compact chat interface
  return (
    <div className={`relative ${className}`}>
      <Card className="flex flex-col h-[600px] bg-card border border-border shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent">
                <Brain className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-medium text-foreground">OnboardAI</h3>
                  <Badge variant="secondary" className="text-xs">
                    Online
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Your intelligent onboarding companion</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 bg-accent rounded-lg p-1">
                {[
                  { id: 'chat', icon: MessageSquare },
                  { id: 'projects', icon: FolderGit2 },
                  { id: 'help', icon: HelpCircle }
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id as any)}
                    className="h-8 w-8 p-0"
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                  </Button>
                ))}
              </div>
              
              {onClose && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                        <Bot className="h-4 w-4 text-foreground" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      
                      {message.structured_response && (
                        <div className="mt-4">
                          <StructuredResponseRenderer response={message.structured_response} />
                        </div>
                      )}
                      
                      <div className="text-xs mt-3 opacity-60">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                        <User className="h-4 w-4 text-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                      <Bot className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            <div className="p-3 border-t border-border bg-card/50">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-foreground/60" />
                <span className="text-xs font-medium text-muted-foreground">Quick Actions</span>
              </div>
              
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-1">
                  {getQuickActions().map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(action);
                        onSuggestionClick?.(action);
                      }}
                      className="whitespace-nowrap text-xs h-8 btn-minimal"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-3"
              >
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything about code, repositories, or learning..."
                    className="resize-none pr-12 focus-ring"
                    rows={2}
                    disabled={loading}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {input.length}/500
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="btn-minimal h-12 w-12 p-0"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="flex-1 p-4 space-y-4">
            <div className="text-center">
              <div className="p-4 rounded-full bg-accent w-16 h-16 mx-auto mb-4">
                <FolderGit2 className="h-8 w-8 text-foreground mx-auto mt-1" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Import Repository</h3>
              <p className="text-muted-foreground text-sm mb-6">Connect a GitHub repository to start your AI-powered onboarding</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://github.com/username/repository"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="pl-10 focus-ring"
                />
              </div>
              
              <Button
                onClick={handleProjectImport}
                disabled={!newRepoUrl.trim()}
                className="w-full btn-minimal gap-2"
              >
                <Plus className="h-4 w-4" />
                Import Repository
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Popular repositories: react, vue, angular, express, django
              </p>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="flex-1 p-4 space-y-4">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="p-4 rounded-full bg-accent w-16 h-16 mx-auto mb-4">
                  <HelpCircle className="h-8 w-8 text-foreground mx-auto mt-1" />
                </div>
                <h3 className="text-lg font-medium text-foreground">How can I help you?</h3>
              </div>

              {[
                { icon: Github, title: "Repository Analysis", desc: "Import and analyze any GitHub repository" },
                { icon: BookOpen, title: "Learning Paths", desc: "Get personalized learning recommendations" },
                { icon: Code, title: "Code Explanation", desc: "Understand complex code patterns and structures" },
                { icon: Lightbulb, title: "Goal Setting", desc: "Set and track your learning objectives" }
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border feature-card"
                >
                  <div className="p-2 rounded-lg bg-accent">
                    <item.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// Enhanced Component to render structured AI responses
const StructuredResponseRenderer: React.FC<{ response: any }> = ({ response }) => {
  if (!response || !response.type) return null;

  switch (response.type) {
    case 'project_import':
      return (
        <div className="mt-4 p-4 bg-accent/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <FolderGit2 className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium text-sm text-foreground">Repository Import</span>
            <Badge variant="secondary" className="text-xs">
              {response.data.status}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {response.data.steps?.map((step: string, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-card/50">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                <span className="text-foreground text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
};

// Enhanced simulate AI response - replace with actual API call
async function simulateAIResponse(input: string, currentStep: any, project?: Project) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  const inputLower = input.toLowerCase();

  if (project && (inputLower.includes('architecture') || inputLower.includes('structure'))) {
    return {
      content: `I'll help you understand the architecture of **${project.name}**!\n\n🏗️ **Project Overview**\n• Language: ${project.language}\n• Technologies: ${project.technologies.join(', ')}\n• Status: ${project.status}\n\n📁 **Key Areas to Explore**\n• Main application files\n• Configuration files\n• Documentation\n• Tests\n\nUse the file tree on the left to explore specific files, and I'll explain their purpose and how they fit into the overall architecture!`,
      structured_response: {
        type: 'project_analysis',
        data: {
          project_name: project.name,
          technologies: project.technologies,
          language: project.language
        }
      }
    };
  }

  if (inputLower.includes('repository') || inputLower.includes('structure') || inputLower.includes('import')) {
    return {
      content: "I can help you analyze any repository structure! Here's what I can do:\n\n🔍 **Repository Analysis**\n• Code structure mapping\n• Technology stack identification\n• Dependency analysis\n• Architecture patterns\n\n📚 **Learning Path Generation**\n• Personalized roadmaps\n• Skill gap analysis\n• Resource recommendations\n\nWould you like to import a specific repository to get started?"
    };
  }

  if (inputLower.includes('learn') || inputLower.includes('study') || inputLower.includes('roadmap')) {
    return {
      content: "I'll create a personalized learning plan based on your interests and current knowledge! Here's my approach:\n\n🎯 **Skill Assessment**\n• Current knowledge evaluation\n• Learning style analysis\n• Goal identification\n\n📈 **Custom Roadmap**\n• Step-by-step progression\n• Hands-on projects\n• Regular checkpoints\n\n🚀 **Continuous Support**\n• Real-time guidance\n• Code review assistance\n• Problem-solving help\n\nWhat specific technology or concept would you like to master?"
    };
  }

  // Default response
  return {
    content: project 
      ? `I'm here to help you understand **${project.name}**! 🌟\n\nI can help you with:\n• Code analysis and explanations\n• Architecture understanding\n• Technology-specific questions\n• Development workflow\n• Best practices\n\nWhat would you like to explore in this ${project.language} project?`
      : "I'm here to make your learning journey smooth and effective! 🌟\n\nI can help you with:\n• Repository analysis and code understanding\n• Personalized learning paths\n• Technical explanations\n• Project guidance\n• Resource recommendations\n\nWhat would you like to explore today? Feel free to ask me anything about code, technologies, or learning strategies!"
  };
}

export default OnboardingAIChat; 