import React, { useState, useEffect } from 'react';
import { getAgenticInitializationStatus } from '../lib/api';

interface AgenticStatusProps {
  sessionId: string;
  onReady?: () => void;
}

interface AgenticStatus {
  status: 'not_started' | 'initializing' | 'ready' | 'error';
  message: string;
  agentic_rag_ready: boolean;
  agentic_rag_initializing: boolean;
  error?: string;
}

export const AgenticStatus: React.FC<AgenticStatusProps> = ({ sessionId, onReady }) => {
  const [status, setStatus] = useState<AgenticStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const statusData = await getAgenticInitializationStatus(sessionId);
        setStatus(statusData);
        setLoading(false);

        // If ready, call onReady callback
        if (statusData.status === 'ready' && onReady) {
          onReady();
        }

        // Continue polling if still initializing
        if (statusData.status === 'initializing') {
          interval = setTimeout(checkStatus, 3000); // Poll every 3 seconds
        }
      } catch (error) {
        console.error('Error checking AgenticRAG status:', error);
        setLoading(false);
      }
    };

    checkStatus();

    return () => {
      if (interval) {
        clearTimeout(interval);
      }
    };
  }, [sessionId, onReady]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-blue-900/30 border border-blue-600 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
        <span className="text-sm text-blue-300">Checking AgenticRAG status...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'ready':
        return 'bg-green-900/30 border-green-600 text-green-300';
      case 'initializing':
        return 'bg-yellow-900/30 border-yellow-600 text-yellow-300';
      case 'error':
        return 'bg-red-900/30 border-red-600 text-red-300';
      default:
        return 'bg-slate-800/30 border-slate-600 text-slate-300';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'ready':
        return '✅';
      case 'initializing':
        return '⏳';
      case 'error':
        return '❌';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`flex items-center space-x-2 p-3 border rounded-lg ${getStatusColor()}`}>
      <span className="text-lg">{getStatusIcon()}</span>
      <div className="flex-1">
        <div className="text-sm font-medium">
          AgenticRAG Status: {status.status.replace('_', ' ').toUpperCase()}
        </div>
        <div className="text-xs mt-1">{status.message}</div>
        {status.error && (
          <div className="text-xs mt-1 text-red-600">Error: {status.error}</div>
        )}
      </div>
      {status.status === 'initializing' && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
      )}
    </div>
  );
}; 