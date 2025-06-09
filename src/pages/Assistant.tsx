import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssistantSidebar from '@/components/AssistantSidebar';
import ChatSession from '@/components/ChatSession';
import CodebaseTree from '@/components/CodebaseTree';
import NewChatModal from '@/components/NewChatModal';
import IssuesPane from '@/components/IssuesPane';
import FileViewer from '@/components/FileViewer';
import UnifiedContextPanel from '@/components/UnifiedContextPanel';
import { listAssistantSessions, SessionInfo, getSessionMessages, getSessionMetadata, resetAgenticMemory, syncRepository } from '@/lib/api'; // Added syncRepository
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

  const handleSyncRepository = async () => {
    if (!activeSessionId) return;
    setIsSyncing(true);
    toast({
      title: "Syncing Repository",
      description: "Starting full data synchronization with GitHub. This may take a few minutes...",
    });
    try {
      const result = await syncRepository(activeSessionId);
      toast({
        title: "Sync Started",
        description: result.message,
      });
      // Optionally, you could add a system message to the chat here
      // Or update session metadata display if it shows sync status
    } catch (error) {
      console.error("Failed to sync repository:", error);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Could not start repository sync.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      // After a sync, you might want to re-fetch session status or even messages
      // to reflect any changes, or wait for polling to update.
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
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      <AssistantSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewChat={() => setShowNewChatModal(true)}
        onDeleteSession={deleteSession}
        onRefresh={handleRefresh}
      />
      
      <div className="flex-1 flex bg-black min-h-0">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-black min-w-0">
          {isSessionLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading session...</p>
              </div>
            </div>
          ) : detailedActiveSession ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-700 bg-gray-800/60 px-4 py-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUnifiedContext(!showUnifiedContext)}
                      className="text-gray-400 border-gray-600 hover:bg-gray-700 hover:text-gray-200"
                      title="Toggle Context Panel"
                    >
                      <FolderTree className="h-4 w-4" />
                    </Button>
                    <div>
                      <h1 className="text-lg font-semibold text-white truncate">
                        {detailedActiveSession.title || "Chat"}
                      </h1>
                      <p className="text-sm text-gray-400 truncate">
                        {detailedActiveSession.repoUrl.replace('https://github.com/', '')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <KeyboardShortcutsIndicator />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetMemory}
                      className="text-gray-400 border-gray-600 hover:bg-gray-700 hover:text-gray-200"
                      title="Reset Agent Memory"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowIssuesPane(true)}
                      className="text-gray-400 border-gray-600 hover:bg-gray-700 hover:text-gray-200"
                      title="View Repository Issues"
                    >
                      <GitBranch className="h-4 w-4" />
                      Issues
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncRepository}
                      className="text-gray-400 border-gray-600 hover:bg-gray-700 hover:text-gray-200"
                      title="Sync Repository Data"
                      disabled={isSyncing || !detailedActiveSession?.metadata?.repo_url} // Disable if no repo_url or already syncing
                    >
                      {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SyncIcon className="h-4 w-4 mr-2" />}
                      {isSyncing ? 'Syncing...' : 'Sync Repo'}
                    </Button>
                  </div>
                </div>
              </div>

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
                <p className="text-gray-400">Session not found</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">AI</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Repository Chat Assistant
                  </h1>
                  <p className="text-gray-400 mb-6">
                    Clone any GitHub repository and start chatting with your code. Enhanced with AgenticRAG for intelligent analysis and context-aware responses.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start New Chat
                </button>
                
                {sessions.length > 0 && (
                  <div className="mt-8">
                    <p className="text-sm text-gray-500 mb-4">Or continue with an existing session</p>
                    <div className="space-y-2">
                      {sessions.slice(0, 3).map((session) => (
                        <button
                          key={session.id}
                          onClick={() => setActiveSessionId(session.id)}
                          className="w-full text-left p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 transition-colors"
                        >
                          <p className="text-white font-medium text-sm truncate">
                            {session.session_name || `${session.metadata?.owner}/${session.metadata?.repo}`}
                          </p>
                          <p className="text-gray-400 text-xs">
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
        />
      )}
    </div>
  );
};

export default Assistant;
