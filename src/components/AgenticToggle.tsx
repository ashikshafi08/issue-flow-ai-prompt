import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Brain, Settings, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AgenticToggleProps {
  sessionId: string;
  onAgenticModeChange?: (enabled: boolean) => void;
}

interface AgenticStatus {
  agentic_enabled: boolean;
  explorer_initialized: boolean;
  tools_available: string[];
}

export default function AgenticToggle({ sessionId, onAgenticModeChange }: AgenticToggleProps) {
  const [agenticStatus, setAgenticStatus] = useState<AgenticStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  // Check agentic status on component mount
  useEffect(() => {
    checkAgenticStatus();
  }, [sessionId]);

  const checkAgenticStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}/agentic-status`);
      if (response.ok) {
        const status = await response.json();
        setAgenticStatus(status);
        onAgenticModeChange?.(status.agentic_enabled);
      }
    } catch (error) {
      console.error('Error checking agentic status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enableAgenticMode = async () => {
    try {
      setIsInitializing(true);
      const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}/enable-agentic`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        setAgenticStatus(result);
        onAgenticModeChange?.(true);
        toast({
          title: "🤖 Agentic Mode Enabled",
          description: "AI can now autonomously explore your codebase using advanced tools.",
        });
      } else {
        throw new Error('Failed to enable agentic mode');
      }
    } catch (error) {
      console.error('Error enabling agentic mode:', error);
      toast({
        title: "Error",
        description: "Failed to enable agentic mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const resetAgenticMemory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}/reset-agentic-memory`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: "🧠 Memory Reset",
          description: "Agentic system memory has been cleared.",
        });
      }
    } catch (error) {
      console.error('Error resetting agentic memory:', error);
      toast({
        title: "Error",
        description: "Failed to reset agentic memory.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
        <span className="text-sm text-gray-400">Checking agentic status...</span>
      </div>
    );
  }

  const isEnabled = agenticStatus?.agentic_enabled || false;
  const isInitialized = agenticStatus?.explorer_initialized || false;

  return (
    <div className="space-y-4">
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-900/70 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors">
        <div className="flex items-center gap-3">
          <Brain className={`h-5 w-5 ${isEnabled ? 'text-blue-400' : 'text-gray-500'}`} />
          <div>
            <h3 className="font-semibold text-white">Agentic Mode</h3>
            <p className="text-sm text-gray-400">
              {isEnabled 
                ? "AI can autonomously explore and analyze your codebase" 
                : "Enable deeper AI analysis with autonomous exploration"
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEnabled && (
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
          {!isEnabled && (
            <Button
              onClick={enableAgenticMode}
              disabled={isInitializing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Status and Controls */}
      {isEnabled && (
        <div className="space-y-3">
          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-300">Mode: {isEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-sm text-gray-300">Tools: {isInitialized ? 'Ready' : 'Initializing'}</span>
            </div>
          </div>

          {/* Available Tools */}
          {agenticStatus?.tools_available && (
            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Available Tools
              </h4>
              <div className="flex flex-wrap gap-1">
                {agenticStatus.tools_available.map((tool) => (
                  <Badge
                    key={tool}
                    variant="secondary"
                    className="text-xs bg-gray-700/50 text-gray-300 border-gray-600/50"
                  >
                    {tool.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Memory Control */}
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div>
              <h4 className="text-sm font-medium text-gray-300">Agent Memory</h4>
              <p className="text-xs text-gray-500">Clear conversation context for fresh analysis</p>
            </div>
            <Button
              onClick={resetAgenticMemory}
              variant="outline"
              size="sm"
              className="text-gray-400 border-gray-600 hover:bg-gray-700/50"
            >
              Reset Memory
            </Button>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
            <AlertTriangle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-200 font-medium">Agentic Mode Benefits:</p>
              <ul className="text-blue-300/80 text-xs mt-1 space-y-1">
                <li>• Autonomous code exploration and analysis</li>
                <li>• Multi-step reasoning with tool usage</li>
                <li>• Deeper insights through file relationships</li>
                <li>• Context-aware directory traversal</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 