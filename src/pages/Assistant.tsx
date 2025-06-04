import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssistantSidebar from '@/components/AssistantSidebar';
import ChatSession from '@/pages/ChatSession';
import NewChatModal from '@/components/NewChatModal';
import { listAssistantSessions, SessionInfo, getSessionMessages, getSessionMetadata } from '@/lib/api'; // Added getSessionMessages, getSessionMetadata
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// Define a more detailed Session type that ChatSessionComponent will use
export interface AgenticStep {
  type: 'thought' | 'action' | 'observation' | 'answer' | 'status' | 'error';
  content: string;
  step?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agenticSteps?: AgenticStep[];
  isStreaming?: boolean;
  error?: string;
  type?: 'thought' | 'action' | 'observation' | 'answer' | 'status' | 'error' | 'final_answer_chunk';
}

export interface Session {
  id: string;
  title: string;
  repoUrl: string;
  filePath?: string;
  messages: ChatMessage[];
  type?: string; // 'repo_chat' or 'issue_analysis'
  created_at?: string;
  last_accessed?: string;
  metadata?: any; // Contains owner, repo, session_name, initial_file, storage_path, status
  message_count?: number;
  session_name?: string;
  agentic_enabled?: boolean;
}

const Assistant = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId || null);
  const [detailedActiveSession, setDetailedActiveSession] = useState<Session | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadDetailedSession = useCallback(async (sId: string | null) => {
    if (!sId) {
      setDetailedActiveSession(null);
      return;
    }
    setIsSessionLoading(true);
    try {
      const metadata = await getSessionMetadata(sId);
      const messagesData = await getSessionMessages(sId);
      
      const summarySession = sessions.find(s => s.id === sId);

      setDetailedActiveSession({
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
        })),
        type: metadata.type,
        created_at: metadata.created_at,
        last_accessed: metadata.last_accessed,
        metadata: metadata.metadata,
        message_count: messagesData.total_messages,
        session_name: metadata.session_name,
        agentic_enabled: metadata.metadata?.agentic_enabled,
      });
    } catch (err) {
      console.error('Failed to load detailed session:', err);
      toast({
        title: "Error Loading Session",
        description: err instanceof Error ? err.message : "Could not load session details.",
        variant: "destructive",
      });
      setDetailedActiveSession(null);
    } finally {
      setIsSessionLoading(false);
    }
  }, [toast, sessions]);

  const loadSessions = useCallback(async (selectSessionId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listAssistantSessions('repo_chat');
      setSessions(response.sessions);
      if (selectSessionId) {
        setActiveSessionId(selectSessionId);
      } else if (sessionId && response.sessions.some(s => s.id === sessionId)) {
        setActiveSessionId(sessionId);
      } else if (response.sessions.length > 0 && !activeSessionId) {
        // Optionally select the first session if none is active and no specific ID in URL
        // setActiveSessionId(response.sessions[0].id); 
      }
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
  }, [toast, sessionId, activeSessionId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (activeSessionId) {
      if (sessionId !== activeSessionId) {
        navigate(`/assistant/${activeSessionId}`, { replace: true });
      }
      loadDetailedSession(activeSessionId);
    } else {
      setDetailedActiveSession(null);
      if (sessionId) { 
         navigate('/assistant', { replace: true });
      }
    }
  }, [activeSessionId, navigate, loadDetailedSession, sessionId]);

  useEffect(() => {
    if (!isLoading && sessions.length > 0) {
      if (sessionId && sessions.some(s => s.id === sessionId)) {
        if (activeSessionId !== sessionId) { 
          setActiveSessionId(sessionId);
        }
      } else if (!activeSessionId && sessions.length > 0) {
        const sessionExists = sessionId && sessions.some(s => s.id === sessionId);
        if (sessionId && !sessionExists) {
            navigate('/assistant', { replace: true });
            toast({
              title: "Session Not Found",
              description: "The requested session could not be found.",
              variant: "destructive",
            });
        }
      }
    } else if (!isLoading && sessionId && sessions.length === 0) {
        navigate('/assistant', { replace: true });
        toast({
            title: "No Sessions Found",
            description: "The requested session does not exist.",
            variant: "destructive",
        });
    }
  }, [sessionId, sessions, isLoading, activeSessionId, navigate, toast]);

  const createNewSession = (repoUrl: string, filePath?: string, newSessionId?: string) => {
    loadSessions(newSessionId); 
  };
  
  const updateActiveSessionMessages = (updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => {
    setDetailedActiveSession(prev => {
      if (!prev) return null;
      return { ...prev, messages: updater(prev.messages) };
    });
  };

  const deleteSession = async (sId: string) => {
    try {
      const { deleteAssistantSession } = await import('@/lib/api');
      await deleteAssistantSession(sId);
      
      setSessions(prev => prev.filter(session => session.id !== sId));
      
      if (activeSessionId === sId) {
        setActiveSessionId(null);
        setDetailedActiveSession(null); 
        navigate('/assistant', { replace: true }); 
      }

      toast({
        title: "Session Deleted",
        description: "The session has been deleted successfully.",
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  if (error && sessions.length === 0) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Sessions</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => loadSessions()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            Try Again
          </button>
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
        onRefresh={() => loadSessions(activeSessionId)} 
      />

      <div className="flex-1 flex flex-col bg-black">
        {isSessionLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        {!isSessionLoading && detailedActiveSession ? (
          <ChatSession />
        ) : !isSessionLoading && !detailedActiveSession && activeSessionId ? (
           <div className="flex-1 flex items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
             <p className="text-gray-400 ml-2">Loading session details...</p>
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
                  Clone any GitHub repository and start chatting with your code. Use @file mentions to reference specific files or @folder/ for directories.
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

      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onCreateSession={(repoUrl, filePath, newSessionId) => createNewSession(repoUrl, filePath, newSessionId)}
        />
      )}
    </div>
  );
};

export default Assistant;
