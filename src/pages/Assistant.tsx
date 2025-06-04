import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssistantSidebar from '@/components/AssistantSidebar';
import ChatSession from '@/pages/ChatSession';
import NewChatModal from '@/components/NewChatModal';
import { listAssistantSessions, SessionInfo } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const Assistant = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId || null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load sessions from backend on mount
  useEffect(() => {
    loadSessions();
  }, []);

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

  // Update URL when active session changes
  useEffect(() => {
    if (activeSessionId) {
      navigate(`/assistant/${activeSessionId}`, { replace: true });
    } else {
      navigate('/assistant', { replace: true });
    }
  }, [activeSessionId, navigate]);

  // Set active session from URL parameter
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setActiveSessionId(sessionId);
      } else {
        // Session not found, redirect to assistant home
        navigate('/assistant', { replace: true });
        toast({
          title: "Session Not Found",
          description: "The requested session could not be found.",
          variant: "destructive",
        });
      }
    }
  }, [sessionId, sessions, navigate, toast]);

  const createNewSession = (repoUrl: string, filePath?: string) => {
    // The NewChatModal now handles the backend session creation
    // and navigation, so we just need to reload sessions
    loadSessions();
  };

  const deleteSession = async (sessionId: string) => {
    try {
      // Import deleteAssistantSession here to avoid circular dependency
      const { deleteAssistantSession } = await import('@/lib/api');
      await deleteAssistantSession(sessionId);
      
      // Remove from local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // If this was the active session, clear it
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
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

  const activeSession = sessions.find(session => session.id === activeSessionId);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Sessions</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadSessions}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <AssistantSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewChat={() => setShowNewChatModal(true)}
        onDeleteSession={deleteSession}
        onRefresh={loadSessions}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <ChatSession />
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

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onCreateSession={createNewSession}
        />
      )}
    </div>
  );
};

export default Assistant;
