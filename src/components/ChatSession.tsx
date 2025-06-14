
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import EnhancedChatMessage from './EnhancedChatMessage';
import SmartChatInput from './SmartChatInput';
import { useQuery } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  contextCards?: any[];
  agenticSteps?: any[];
  sessionId?: string;
}

const ChatSession = () => {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock data for demonstration
  useEffect(() => {
    if (sessionId) {
      setMessages([
        {
          id: '1',
          role: 'user',
          content: 'Can you help me understand the file structure of this project?',
          timestamp: Date.now() - 60000,
          sessionId
        },
        {
          id: '2',
          role: 'assistant',
          content: 'I\'d be happy to help you understand the project structure. Let me analyze the codebase and provide you with a comprehensive overview.\n\nBased on my analysis, this appears to be a React-based application with the following key components:\n\n## Main Structure\n- `src/components/` - Contains all React components\n- `src/pages/` - Page-level components and routing\n- `src/lib/` - Utility functions and API helpers\n- `src/hooks/` - Custom React hooks\n\n## Key Features\n- **Chat Interface**: Modern chat system with AI assistance\n- **File Analysis**: Ability to analyze and preview code files\n- **Agentic Reasoning**: Step-by-step AI thought process display\n- **Context Management**: Smart context handling for conversations\n\nThe application uses modern React patterns with TypeScript, Tailwind CSS for styling, and includes advanced features like real-time code analysis and intelligent chat interactions.',
          timestamp: Date.now() - 30000,
          sessionId,
          agenticSteps: [
            {
              step: 1,
              type: 'thought',
              content: 'I need to analyze the project structure to provide a comprehensive overview.'
            },
            {
              step: 2,
              type: 'action',
              content: 'Scanning the src/ directory for main components and organization patterns.'
            },
            {
              step: 3,
              type: 'observation',
              content: 'Found React components organized by feature, with clear separation of concerns.'
            }
          ]
        }
      ]);
    }
  }, [sessionId]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
      sessionId
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about: "${message}"\n\nLet me help you with that. This is a simulated response to demonstrate the new chat interface design with proper spacing and formatting.\n\n## Key Points:\n- Improved message presentation\n- Better spacing between elements\n- Enhanced readability\n\nIs there anything specific you'd like me to elaborate on?`,
        timestamp: Date.now(),
        sessionId,
        agenticSteps: [
          {
            step: 1,
            type: 'thought',
            content: 'Analyzing the user\'s question to provide the most helpful response.'
          },
          {
            step: 2,
            type: 'action',
            content: 'Formulating a comprehensive answer with proper structure.'
          }
        ]
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
              <p className="text-sm text-gray-400">Ready to help with your code</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : ''}`}>
              <EnhancedChatMessage
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                contextCards={message.contextCards}
                agenticSteps={message.agenticSteps}
                sessionId={message.sessionId}
              />
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center order-3">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/30 rounded-2xl rounded-tl-md px-6 py-4 max-w-xs">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-300 ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <SmartChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            onFileSelect={() => {}}
            sessionId={sessionId}
            disabled={isLoading}
            placeholder="Ask me anything about your code..."
          />
        </div>
      </div>
    </div>
  );
};

export default ChatSession;
