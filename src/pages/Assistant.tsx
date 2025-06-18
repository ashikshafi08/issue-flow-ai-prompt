import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssistantSidebar from '@/components/AssistantSidebar';
import ChatSession from '@/components/ChatSession';
import CodebaseTree from '@/components/CodebaseTree';
import NewChatModal from '@/components/NewChatModal';
import IssuesPane from '@/components/IssuesPane';
import FileViewer from '@/components/FileViewer';
import UnifiedContextPanel from '@/components/UnifiedContextPanel';
import IssueAnalysisHub from '@/components/IssueAnalysisHub';
import AnalysisToolbar from '@/components/AnalysisToolbar';
import { listAssistantSessions, SessionInfo, getSessionMessages, getSessionMetadata, resetAgenticMemory, syncRepository, SyncRepositoryOptions } from '@/lib/api'; // Added syncRepository
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PanelLeft, FolderTree, RefreshCw, GitBranch, Zap as SyncIcon } from 'lucide-react'; // Removed Clock
import { Button } from '@/components/ui/button';
import { useKeyboardShortcuts, createChatShortcuts } from '@/hooks/useKeyboardShortcuts';
import KeyboardShortcutsIndicator from '@/components/KeyboardShortcutsIndicator';

// Define a more detailed Session type that ChatSessionComponent will use
export interface AgenticStep {
  type: 'thought' | 'action' | 'observation' | 'answer' | 'status' | 'error';
  content: string;
  step: number; // Make step required to align with backend and EnhancedChatMessage
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agenticSteps?: AgenticStep[];
  isStreaming?: boolean;
  error?: string;
  type?: 'thought' | 'action' | 'observation' | 'answer' | 'status' | 'error' | 'final_answer_chunk';
  issueContext?: any;
  processingType?: string;
  suggestions?: string[];
}

export interface Session {
  id: string;
  title: string;
  repoUrl: string;
  filePath?: string;
  messages: ChatMessage[];
  type?: string;
  created_at?: string;
  last_accessed?: string;
  metadata?: any;
  message_count?: number;
  session_name?: string;
  agentic_enabled?: boolean;
}

const Assistant = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [detailedActiveSession, setDetailedActiveSession] = useState<Session | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showIssuesPane, setShowIssuesPane] = useState(false);
  const [showAnalysisHub, setShowAnalysisHub] = useState(false);
  const [selectedAnalysisIssue, setSelectedAnalysisIssue] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCodebaseTree, setShowCodebaseTree] = useState(true);
  const [showUnifiedContext, setShowUnifiedContext] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false); // New state for sync status
  const [currentContext, setCurrentContext] = useState<{
    discussingFiles?: string[];
    relatedIssues?: number[];
    activeThread?: string;
  }>({});
  const { toast } = useToast();

  // Load sessions only once on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await listAssistantSessions('repo_chat');
        setSessions(response.sessions);
      } catch (error) {
        console.error('Failed to load sessions:', error);
        setError(error instanceof Error ? error.message : 'Failed to load sessions');
        toast({
          title: "Error",
          description: "Failed to load sessions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []); // No dependencies - run only once

  // Handle URL session ID changes
  useEffect(() => {
    if (sessionId && sessionId !== activeSessionId) {
      setActiveSessionId(sessionId);
      // Clear any open file viewer when switching sessions
      setSelectedFile(null);
    } else if (!sessionId && activeSessionId) {
      setActiveSessionId(null);
      setSelectedFile(null);
    }
  }, [sessionId]); // Only depend on sessionId

  // Load detailed session when activeSessionId changes
  useEffect(() => {
    const loadDetailedSession = async (sId: string) => {
      setIsSessionLoading(true);
      setDetailedActiveSession(null);
      
      try {
        console.log('🔄 Loading session details for:', sId);
        
        const [metadata, messagesData] = await Promise.all([
          getSessionMetadata(sId),
          getSessionMessages(sId)
        ]);
        
        const summarySession = sessions.find(s => s.id === sId);

        const sessionData = {
          id: sId,
          title: summarySession?.session_name || `${metadata.metadata?.owner}/${metadata.metadata?.repo}` || 'Chat',
          repoUrl: metadata.metadata?.repo_url || '',
          filePath: metadata.metadata?.initial_file,
          messages: messagesData.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp).getTime(),
            agenticSteps: msg.agenticSteps,
            isStreaming: msg.isStreaming,
            error: msg.error,
            type: msg.type,
            issueContext: msg.issueContext,
            processingType: msg.processingType,
            suggestions: msg.suggestions,
          })),
          type: metadata.type,
          created_at: metadata.created_at,
          last_accessed: metadata.last_accessed,
          metadata: metadata.metadata,
          message_count: messagesData.total_messages,
          session_name: metadata.session_name,
          agentic_enabled: metadata.metadata?.agentic_enabled,
        };
        
        console.log('✅ Session loaded successfully:', sessionData.title);
        setDetailedActiveSession(sessionData);
        
        // Update URL if needed
        if (sessionId !== sId) {
          navigate(`/assistant/${sId}`, { replace: true });
        }
        
      } catch (err) {
        console.error('❌ Failed to load detailed session:', err);
        toast({
          title: "Error Loading Session",
          description: err instanceof Error ? err.message : "Could not load session details.",
          variant: "destructive",
        });
        setDetailedActiveSession(null);
        // Navigate back to assistant root on error
        navigate('/assistant', { replace: true });
      } finally {
        setIsSessionLoading(false);
      }
    };

    if (activeSessionId) {
      // Check if session exists in the list
      const sessionExists = sessions.length === 0 || sessions.some(s => s.id === activeSessionId);
      if (sessionExists) {
        loadDetailedSession(activeSessionId);
      } else {
        // Session doesn't exist, navigate back
        navigate('/assistant', { replace: true });
        toast({
          title: "Session Not Found",
          description: "The requested session could not be found.",
          variant: "destructive",
        });
        setActiveSessionId(null);
      }
    } else {
      setDetailedActiveSession(null);
      if (sessionId) {
        navigate('/assistant', { replace: true });
      }
    }
  }, [activeSessionId, sessions.length]); // Minimal dependencies

  const createNewSession = useCallback((repoUrl: string, filePath?: string, newSessionId?: string) => {
    // Reload sessions and navigate to new session
    listAssistantSessions('repo_chat').then(response => {
      setSessions(response.sessions);
      if (newSessionId) {
        setActiveSessionId(newSessionId);
      }
    });
  }, []);
  
  const updateActiveSessionMessages = useCallback((updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => {
    setDetailedActiveSession(prev => {
      if (!prev) return null;
      return { ...prev, messages: updater(prev.messages) };
    });
  }, []);

  const handleResetMemory = async () => {
    if (!activeSessionId) return;
    try {
      await resetAgenticMemory(activeSessionId);
      toast({
        title: "Agent Memory Reset",
        description: "The agent's memory for this session has been cleared.",
      });
      const systemMessage: ChatMessage = {
        role: 'assistant', 
        content: "*Agent memory has been reset for this session.*",
        timestamp: Date.now(),
        type: 'status'
      };
      updateActiveSessionMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error("Failed to reset agent memory:", error);
      toast({
        title: "Error",
        description: "Failed to reset agent memory. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteSession = useCallback(async (sId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/assistant/sessions/${sId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.id !== sId));
        
        if (activeSessionId === sId) {
          setActiveSessionId(null);
          setDetailedActiveSession(null); 
          navigate('/assistant', { replace: true }); 
        }
        
        toast({
          title: "Session Deleted",
          description: "The session has been successfully deleted.",
        });
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    }
  }, [activeSessionId, navigate, toast]);

  const handleRefresh = useCallback(async () => {
    try {
      const response = await listAssistantSessions('repo_chat');
      setSessions(response.sessions);
      toast({
        title: "Sessions Refreshed",
        description: "Session list has been updated.",
      });
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
      toast({
        title: "Error",
        description: "Failed to refresh sessions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleAddIssueToContext = useCallback(async (issue: any) => {
    if (!detailedActiveSession) return;

    try {
      // First, call backend to store issue context in session metadata
      const response = await fetch(`http://localhost:8000/assistant/sessions/${detailedActiveSession.id}/add-issue-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issue })
      });

      if (!response.ok) {
        throw new Error('Failed to add issue to context');
      }

      // Create a compact issue card message for the chat
      const issueMessage: ChatMessage = {
        role: 'assistant',
        content: `📋 **Issue #${issue.number} Added to Context**

**${issue.title}**

*State:* ${issue.state} | *Created:* ${new Date(issue.created_at).toLocaleDateString()}

*This issue is now available in the conversation context. Ask me anything about it!*`,
        timestamp: Date.now(),
        type: 'status',
        // Store the full issue data for AI access
        issueContext: {
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          labels: issue.labels,
          assignees: issue.assignees,
          comments: issue.comments,
          created_at: issue.created_at,
          url: issue.url
        }
      };

      // Add the message to the chat
      updateActiveSessionMessages(prev => [...prev, issueMessage]);

      // Also update local session metadata
      if (detailedActiveSession) {
        detailedActiveSession.metadata = {
          ...detailedActiveSession.metadata,
          currentIssueContext: {
            number: issue.number,
            title: issue.title,
            url: issue.url
          }
        };
      }

      toast({
        title: "Issue Added",
        description: `Issue #${issue.number} has been added to the conversation context.`,
      });

    } catch (error) {
      console.error('Failed to add issue to context:', error);
      toast({
        title: "Error",
        description: "Failed to add issue to context. Please try again.",
        variant: "destructive",
      });
    }
  }, [detailedActiveSession, updateActiveSessionMessages, toast]);

  const handleAnalyzeIssue = useCallback((issue: any) => {
    setSelectedAnalysisIssue(issue);
    setShowAnalysisHub(true);
    setShowIssuesPane(false); // Close issues pane when opening analysis hub
    toast({
      title: "Analysis Starting",
      description: `Opening deep analysis for issue #${issue.number}`,
    });
  }, [toast]);

  const handleSyncRepository = async (forceFull: boolean = false) => {
    if (!activeSessionId) return;
    setIsSyncing(true);
    
    const syncType = forceFull ? "full rebuild" : "incremental sync";
    toast({
      title: `Starting ${syncType}`,
      description: forceFull 
        ? "Rebuilding entire repository index. This may take several minutes..." 
        : "Checking for new issues and PRs. This should be quick...",
    });
    
    try {
      const result = await syncRepository(activeSessionId, {
        force_full_sync: forceFull,
        max_new_issues: forceFull ? undefined : 5,
        max_new_prs: forceFull ? undefined : 5
      });
      
      toast({
        title: "Sync Started",
        description: result.message,
      });
      
      // Add a system message to the chat indicating sync started
      if (detailedActiveSession) {
        const syncMessage = {
          role: 'assistant' as const,
          content: `🔄 **Repository ${result.sync_type} started**\n\n${result.message}\n\n*Check back in a few minutes for updated context.*`,
          timestamp: Date.now(),
          type: 'status' as const
        };
        updateActiveSessionMessages(prev => [...prev, syncMessage]);
        
        // Update current context to show sync is happening
        setCurrentContext(prev => ({
          ...prev,
          activeThread: `Repository ${result.sync_type} in progress...`
        }));
      }
      
    } catch (error) {
      console.error("Failed to sync repository:", error);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Could not start repository sync.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Setup keyboard shortcuts
  const chatShortcuts = createChatShortcuts({
    toggleContextPanel: () => setShowUnifiedContext(!showUnifiedContext),
    focusInput: () => {
      // Find and focus the chat input
      const inputElement = document.querySelector('textarea[placeholder*="Ask anything"]') as HTMLTextAreaElement;
      if (inputElement) {
        inputElement.focus();
      }
    },
    openFileSearch: () => {
      // Trigger file search in SmartChatInput
      const event = new KeyboardEvent('keydown', { key: '@' });
      document.dispatchEvent(event);
    },
    newChat: () => setShowNewChatModal(true),
    clearContext: () => {
      if (detailedActiveSession) {
        handleResetMemory();
      }
    }
  });

  useKeyboardShortcuts({ shortcuts: chatShortcuts, enabled: true });

  if (isLoading && sessions.length === 0) { 
    return (
      <div className="flex h-screen bg-[hsl(var(--background))] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[hsl(var(--background))]">
      <AssistantSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewChat={() => setShowNewChatModal(true)}
        onDeleteSession={deleteSession}
        onRefresh={handleRefresh}
      />
      
      <div className="flex-1 flex bg-[hsl(var(--background))] min-h-0">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[hsl(var(--background))] min-w-0">
          {isSessionLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading session...</p>
              </div>
            </div>
          ) : detailedActiveSession ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowUnifiedContext(!showUnifiedContext)}
                      className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-[hsl(var(--accent))] transition-colors"
                      title="Toggle Context Panel"
                    >
                      <FolderTree className="h-4 w-4" />
                    </button>
                    <div>
                      <h1 className="text-base font-medium text-foreground truncate">
                        {detailedActiveSession.title || "Chat"}
                      </h1>
                      <p className="text-xs text-muted-foreground truncate">
                        {detailedActiveSession.repoUrl.replace('https://github.com/', '')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleResetMemory}
                      className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-xs transition-colors"
                      title="Reset Memory"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setShowIssuesPane(true)}
                      className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-xs transition-colors"
                      title="Issues"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Check for shift-click for full sync
                        const forceFull = e.shiftKey;
                        handleSyncRepository(forceFull);
                      }}
                      className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-xs transition-colors"
                      title="Sync Repository (Shift+Click for full rebuild)"
                      disabled={isSyncing || !detailedActiveSession?.metadata?.repo_url}
                    >
                      {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SyncIcon className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Analysis Toolbar */}
              <AnalysisToolbar
                sessionId={detailedActiveSession.id}
                onAnalysisSelect={(issueUrl) => {
                  // Extract issue info and open analysis hub
                  const match = issueUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
                  if (match) {
                    const [, owner, repo, number] = match;
                    const mockIssue = {
                      number: parseInt(number),
                      title: `Issue #${number}`,
                      body: '',
                      state: 'open',
                      created_at: new Date().toISOString(),
                      url: issueUrl,
                      labels: [],
                      assignees: [],
                      comments: []
                    };
                    setSelectedAnalysisIssue(mockIssue);
                    setShowAnalysisHub(true);
                  }
                }}
              />

              {/* Chat Content */}
              <div className="flex-1 overflow-hidden">
                <ChatSession
                  session={detailedActiveSession}
                  onUpdateSessionMessages={updateActiveSessionMessages}
                  selectedFile={selectedFile}
                  onCloseFileViewer={() => setSelectedFile(null)}
                  onFileSelect={(filePath) => setSelectedFile(filePath)}
                />
              </div>
            </>
          ) : activeSessionId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Session not found</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-muted to-muted-foreground/50 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">AI</span>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Repository Chat Assistant
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    Clone any GitHub repository and start chatting with your code. Enhanced with AgenticRAG for intelligent analysis and context-aware responses.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start New Chat
                </button>
                
                {sessions.length > 0 && (
                  <div className="mt-8">
                    <p className="text-sm text-muted-foreground mb-4">Or continue with an existing session</p>
                    <div className="space-y-2">
                      {sessions.slice(0, 3).map((session) => (
                        <button
                          key={session.id}
                          onClick={() => setActiveSessionId(session.id)}
                          className="w-full text-left p-3 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
                        >
                          <p className="text-foreground font-medium text-sm truncate">
                            {session.session_name || `${session.metadata?.owner}/${session.metadata?.repo}`}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {session.message_count} messages • {new Date(session.last_accessed).toLocaleDateString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Unified Context Panel */}
        {showUnifiedContext && detailedActiveSession && (
          <UnifiedContextPanel
            sessionId={detailedActiveSession.id}
            currentContext={currentContext}
            onFileSelect={(filePath) => {
              setSelectedFile(filePath);
              // Update context tracking
              setCurrentContext(prev => ({
                ...prev,
                discussingFiles: [...(prev.discussingFiles || []), filePath].slice(-3)
              }));
            }}
            onIssueSelect={(issue) => {
              handleAddIssueToContext(issue);
              setCurrentContext(prev => ({
                ...prev,
                relatedIssues: [...(prev.relatedIssues || []), issue.number].slice(-3)
              }));
            }}
            onPRSelect={(pr) => {
              console.log('PR selected:', pr);
              // Handle PR selection logic here
            }}
            repoUrl={detailedActiveSession.repoUrl}
          />
        )}
      </div>

      {/* FileViewer - Render as overlay when file is selected */}
      {selectedFile && detailedActiveSession && (
        <FileViewer
          filePath={selectedFile}
          sessionId={detailedActiveSession.id}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {/* Modal for creating new chat */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onCreateSession={createNewSession}
        />
      )}

      {/* Issues Pane */}
      {showIssuesPane && detailedActiveSession && (
        <IssuesPane
          open={showIssuesPane}
          sessionId={detailedActiveSession.id}
          repoUrl={detailedActiveSession.repoUrl}
          onClose={() => setShowIssuesPane(false)}
          onAddIssueToContext={handleAddIssueToContext}
          onAnalyzeIssue={handleAnalyzeIssue}
        />
      )}

      {/* Issue Analysis Hub */}
      {showAnalysisHub && detailedActiveSession && (
        <IssueAnalysisHub
          open={showAnalysisHub}
          onClose={() => setShowAnalysisHub(false)}
          selectedIssue={selectedAnalysisIssue}
          sessionId={detailedActiveSession.id}
          onFileSelect={(filePath: string) => {
            setSelectedFile(filePath);
            setShowCodebaseTree(true);
            setShowAnalysisHub(false);
          }}
        />
      )}
    </div>
  );
};

export default Assistant;
