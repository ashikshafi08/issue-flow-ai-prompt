import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { WebSocketMessage } from '@/types/canvas.types';

interface WebSocketOptions {
  onAnalysisUpdate?: (data: any) => void;
  onNewArtifact?: (artifact: any) => void;
  onAgentStatus?: (status: any) => void;
  onMemoryUpdate?: (memory: any) => void;
}

export const useWebSocket = (sessionId: string, options: WebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      try {
        // Use existing WebSocket endpoint
        ws.current = new WebSocket(`ws://localhost:8000/ws/${sessionId}`);

        ws.current.onopen = () => {
          setIsConnected(true);
          console.log('Canvas WebSocket connected');
        };

        ws.current.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            
            switch(data.type) {
              case 'analysis_update':
                options.onAnalysisUpdate?.(data.payload);
                break;
              case 'new_artifact':
                options.onNewArtifact?.(data.payload);
                break;
              case 'agent_status':
                options.onAgentStatus?.(data.payload);
                break;
              case 'memory_update':
                options.onMemoryUpdate?.(data.payload);
                break;
              default:
                console.log('Unknown Canvas WebSocket message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.current.onerror = (error) => {
          console.error('Canvas WebSocket error:', error);
          toast({
            title: "Connection Error",
            description: "Lost connection to server. Reconnecting...",
            variant: "destructive",
          });
        };

        ws.current.onclose = () => {
          setIsConnected(false);
          // Attempt to reconnect after 3 seconds
          reconnectTimeout.current = setTimeout(connect, 3000);
        };
      } catch (error) {
        console.error('Canvas WebSocket connection failed:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      ws.current?.close();
    };
  }, [sessionId]);

  const sendMessage = (type: string, payload: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    }
  };

  return { isConnected, sendMessage };
};