import React from 'react';
import { Plus, MessageSquare, Trash2, Github, RefreshCw } from 'lucide-react';
import { SessionInfo } from '@/lib/api';

interface AssistantSidebarProps {
  sessions: SessionInfo[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRefresh: () => void;
}

const AssistantSidebar: React.FC<AssistantSidebarProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onRefresh
}) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getSessionTitle = (session: SessionInfo): string => {
    if (session.session_name) return session.session_name;
    if (session.metadata?.owner && session.metadata?.repo) {
      return `${session.metadata.owner}/${session.metadata.repo}`;
    }
    if (session.repo_url) {
      const urlParts = session.repo_url.split('/');
      return urlParts.slice(-2).join('/');
    }
    return 'Unknown Repository';
  };

  const getSessionUrl = (session: SessionInfo): string => {
    if (session.repo_url) return session.repo_url;
    if (session.metadata?.owner && session.metadata?.repo) {
      return `${session.metadata.owner}/${session.metadata.repo}`;
    }
    return 'Unknown URL';
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-1.5 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" x2="20" y1="19" y2="19" />
            </svg>
          </div>
          <span className="text-white font-semibold">triage.flow</span>
          <button
            onClick={onRefresh}
            className="ml-auto text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
            title="Refresh sessions"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <p className="text-gray-600 text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative rounded-lg transition-colors duration-200 ${
                    activeSessionId === session.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <button
                    onClick={() => onSessionSelect(session.id)}
                    className="w-full text-left px-3 py-2 pr-8"
                  >
                    <div className="flex items-start gap-2">
                      <Github className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{getSessionTitle(session)}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {getSessionUrl(session).replace('https://github.com/', '')}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span>{session.message_count} messages</span>
                          <span>•</span>
                          <span>{formatDate(session.last_accessed)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-600 rounded"
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          AI-powered repository assistant
        </p>
      </div>
    </div>
  );
};

export default AssistantSidebar;
