
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssistantSidebar from '@/components/AssistantSidebar';
import ChatSession from '@/components/ChatSession';
import NewChatModal from '@/components/NewChatModal';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Session {
  id: string;
  title: string;
  repoUrl: string;
  filePath?: string;
  messages: ChatMessage[];
  createdAt: number;
  lastModified: number;
}

const Assistant = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId || null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('triage_sessions');
    if (stored) {
      try {
        const parsedSessions = JSON.parse(stored);
        setSessions(parsedSessions);
        // If no active session and we have sessions, don't auto-select
      } catch (error) {
        console.error('Failed to parse stored sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('triage_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

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
      }
    }
  }, [sessionId, sessions]);

  const createNewSession = (repoUrl: string, filePath?: string) => {
    const sessionId = Date.now().toString();
    const title = filePath 
      ? `${repoUrl.split('/').pop()}/${filePath.split('/').pop()}`
      : repoUrl.split('/').pop() || 'New Chat';
    
    const newSession: Session = {
      id: sessionId,
      title,
      repoUrl,
      filePath,
      messages: [],
      createdAt: Date.now(),
      lastModified: Date.now()
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(sessionId);
    setShowNewChatModal(false);
  };

  const updateSession = (sessionId: string, updates: Partial<Session>) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, ...updates, lastModified: Date.now() }
        : session
    ));
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  };

  const activeSession = sessions.find(session => session.id === activeSessionId);

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <AssistantSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewChat={() => setShowNewChatModal(true)}
        onDeleteSession={deleteSession}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <ChatSession
            session={activeSession}
            onUpdateSession={(updates) => updateSession(activeSession.id, updates)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">AI</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Your AI-Powered Dev Assistant
                </h1>
                <p className="text-gray-400 mb-6">
                  Chat with files, issues, or functions. Switch between codebases. Stay in context.
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start New Chat
              </button>
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
