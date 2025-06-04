import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, FileText, RotateCcw, AlertTriangle, RefreshCw, Brain, Zap, Eye, MessageSquare, AlertCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Session, ChatMessage, AgenticStep } from '@/pages/Assistant'; // Import types from Assistant
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { sendMessage, resetAgenticMemory as apiResetAgenticMemory } from '@/lib/api'; // Import API functions
import { useToast } from '@/components/ui/use-toast';

interface ChatSessionProps {
  session: Session;
  onUpdateSessionMessages: (updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => void;
}

const AgenticStepDisplay: React.FC<{ step: AgenticStep }> = ({ step }) => {
  let icon: React.ReactNode = null;
  let title = '';
  let contentColor = 'text-gray-300';
  let borderColor = 'border-gray-700/50';
  let bgColor = 'bg-gray-800/30';

  switch (step.type) {
    case 'thought':
      icon = <Brain className="h-4 w-4 text-purple-400" />;
      title = 'Thought';
      contentColor = 'text-purple-300';
      borderColor = 'border-purple-500/30';
      bgColor = 'bg-purple-900/20';
      break;
    case 'action':
      icon = <Zap className="h-4 w-4 text-blue-400" />;
      title = 'Action';
      contentColor = 'text-blue-300';
      borderColor = 'border-blue-500/30';
      bgColor = 'bg-blue-900/20';
      break;
    case 'observation':
      icon = <Eye className="h-4 w-4 text-green-400" />;
      title = 'Observation';
      contentColor = 'text-green-300';
      borderColor = 'border-green-500/30';
      bgColor = 'bg-green-900/20';
      break;
    case 'answer':
      icon = <MessageSquare className="h-4 w-4 text-teal-400" />;
      title = 'Answer';
      contentColor = 'text-teal-300';
      borderColor = 'border-teal-500/30';
      bgColor = 'bg-teal-900/20';
      break;
    case 'status':
      icon = <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />;
      title = 'Status';
      contentColor = 'text-yellow-300';
      borderColor = 'border-yellow-500/30';
      bgColor = 'bg-yellow-900/20';
      break;
    case 'error':
      icon = <AlertCircleIcon className="h-4 w-4 text-red-400" />;
      title = 'Error';
      contentColor = 'text-red-300';
      borderColor = 'border-red-500/30';
      bgColor = 'bg-red-900/20';
      break;
    default:
      icon = '➡️';
  }

  let displayContent = step.content;
  if (step.type === 'observation' || step.type === 'action') {
    try {
      const parsedJson = JSON.parse(step.content);
      displayContent = `\`\`\`json\n${JSON.stringify(parsedJson, null, 2)}\n\`\`\``;
    } catch (e) {
      if (!step.content.includes('```')) { 
         displayContent = `\`\`\`plaintext\n${step.content}\n\`\`\``;
      }
    }
  }

  return (
    <div className={`text-xs my-1.5 p-2.5 border ${borderColor} rounded-lg ${bgColor} shadow-sm`}>
      <div className={`font-semibold text-gray-300 mb-1.5 flex items-center gap-2`}>
        {icon} {title}
      </div>
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                customStyle={{ background: 'transparent', padding: '0.5rem', fontSize: '0.75rem', margin: 0 }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`${className || ''} bg-gray-700/60 text-gray-300 px-1 py-0.5 rounded text-[0.9em]`} {...props}>
                {children}
              </code>
            );
          },
           p: ({node, ...props}) => <p className={`my-0.5 ${contentColor}`} {...props} />
        }}
        remarkPlugins={[remarkGfm]}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
};

const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'plaintext';
    
    if (!inline) {
      return (
        <div className="my-4 rounded-md overflow-hidden shadow-lg">
          <div className="bg-gray-800 px-4 py-1.5 text-xs font-mono text-gray-300 flex justify-between items-center border-b border-gray-700">
            {language !== 'plaintext' && <span>{language}</span>}
          </div>
          <SyntaxHighlighter
            style={atomDark}
            language={language}
            PreTag="div"
            showLineNumbers
            wrapLines
            wrapLongLines
            customStyle={{
              margin: 0,
              padding: '1rem',
              borderRadius: '0 0 0.375rem 0.375rem',
              background: '#1f2937',
              fontSize: '0.875rem',
            }}
            codeTagProps={{ 
              style: { 
                fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
                lineHeight: 1.6
              } 
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }
    
    return (
      <code className="bg-gray-700/60 border border-gray-600/50 px-1.5 py-0.5 rounded-md text-sm font-mono text-pink-400" {...props}>
        {children}
      </code>
    );
  },
  h1: ({ node, children, ...props }: any) => (
    <h1 className="text-2xl font-bold text-white my-5 pb-2 border-b border-gray-700" {...props}>
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }: any) => (
    <h2 className="text-xl font-semibold text-white my-4 pb-1 border-b border-gray-700/70" {...props}>
      {children}
    </h2>
  ),
  h3: ({ node, children, ...props }: any) => (
    <h3 className="text-lg font-semibold text-white my-3" {...props}>
      {children}
    </h3>
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc list-outside my-3 pl-6 space-y-1.5 text-gray-200" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-outside my-3 pl-6 space-y-1.5 text-gray-200" {...props} />
  ),
  li: ({ node, children, ...props }: any) => (
    <li className="leading-relaxed text-gray-200" {...props}>
      {children}
    </li>
  ),
  p: ({ node, children, ...props }: any) => (
    <p className="my-3 leading-relaxed text-gray-200" {...props}>
      {children}
    </p>
  ),
  blockquote: ({ node, children, ...props }: any) => (
    <blockquote className="my-4 border-l-4 border-blue-500/70 bg-blue-900/20 pl-4 pr-2 py-3 rounded-r-lg text-blue-100 italic" {...props}>
      {children}
    </blockquote>
  ),
  a: ({ node, ...props }: any) => (
    <a 
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors" 
      target="_blank" 
      rel="noopener noreferrer" 
      {...props} 
    />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-700 shadow-md">
      <table className="min-w-full divide-y divide-gray-600 bg-gray-800/70" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-gray-700/60" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-gray-700/50" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-gray-700/40 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-300" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-4 py-2.5 text-sm text-gray-200" {...props} />,
  pre: ({ node, ...props }: any) => <pre className="overflow-auto p-0 bg-transparent m-0" {...props} />,
  hr: ({ node, ...props }: any) => (
    <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-6" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  em: ({ node, ...props }: any) => <em className="italic text-gray-300" {...props} />,
};

const ChatSession: React.FC<ChatSessionProps> = ({ session, onUpdateSessionMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !session?.id) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    // Add user message immediately
    onUpdateSessionMessages(prevSessionMessages => [...prevSessionMessages, userMessage]);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // Create a placeholder for the assistant's response
    const assistantMessagePlaceholder: ChatMessage = {
      role: 'assistant',
      content: '', // Initially empty
      timestamp: Date.now(),
      isStreaming: true,
      agenticSteps: [],
    };
    
    // Add placeholder to the UI
    onUpdateSessionMessages(prevSessionMessages => [...prevSessionMessages, assistantMessagePlaceholder]);
    
    try {
      const stream = sendMessage(session.id, currentInput, true); 
      let accumulatedContent = ""; // To accumulate content from 'answer' type steps
      let finalAnswerFromStream: string | null = null;
      let allSteps: AgenticStep[] = [];

      for await (const chunk of stream) {
        let updatedMessagePart: Partial<ChatMessage> = { agenticSteps: [...allSteps] }; // Start with current steps

        if (chunk.type === 'error') {
          updatedMessagePart.content = chunk.error || 'An unknown error occurred during streaming.';
          updatedMessagePart.error = chunk.error || 'An unknown error occurred';
          updatedMessagePart.isStreaming = false;
          toast({ title: "Stream Error", description: chunk.error, variant: "destructive" });
        } else if (chunk.type === 'final') {
          finalAnswerFromStream = chunk.final_answer || null;
          allSteps = chunk.steps || allSteps; // Update with all steps from final chunk
          updatedMessagePart.agenticSteps = [...allSteps];
          updatedMessagePart.content = finalAnswerFromStream || accumulatedContent || "Agentic analysis complete.";
          updatedMessagePart.isStreaming = false;
        } else if (chunk.step) { 
          allSteps.push(chunk.step);
          updatedMessagePart.agenticSteps = [...allSteps];
          if (chunk.step.type === 'answer') {
            accumulatedContent += chunk.step.content + "\n";
            // Display accumulated answer content as it comes, if no final_answer is set yet
            if (!finalAnswerFromStream) {
                 updatedMessagePart.content = accumulatedContent;
            }
          }
          updatedMessagePart.isStreaming = true; 
        } else if (chunk.type === 'status' && chunk.content) {
           allSteps.push({type: 'status', content: chunk.content, step: allSteps.length});
           updatedMessagePart.agenticSteps = [...allSteps];
        }
        
        onUpdateSessionMessages(prevSessionMessages => 
          prevSessionMessages.map(msg => 
            msg.timestamp === assistantMessagePlaceholder.timestamp 
              ? { ...msg, ...updatedMessagePart } 
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message or processing stream:', error);
      onUpdateSessionMessages(prevSessionMessages => 
        prevSessionMessages.map(msg => 
          msg.timestamp === assistantMessagePlaceholder.timestamp 
            ? { 
                ...msg,
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                error: error instanceof Error ? error.message : 'Unknown streaming error',
                isStreaming: false,
              }
            : msg
        )
      );
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
       onUpdateSessionMessages(prevSessionMessages => 
        prevSessionMessages.map(msg => 
          msg.timestamp === assistantMessagePlaceholder.timestamp && msg.isStreaming
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );
    }
  }, [input, session, onUpdateSessionMessages, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetMemory = async () => {
    if (!session?.id) return;
    try {
      await apiResetAgenticMemory(session.id);
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
      onUpdateSessionMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error("Failed to reset agent memory:", error);
      toast({
        title: "Error",
        description: "Could not reset agent memory.",
        variant: "destructive",
      });
    }
  };

  const highlightMentions = (text: string) => {
    return text.split(/(@(?:folder\/)?[\w\-/\\.]+)/g).map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="bg-gray-600/40 text-blue-300 px-1.5 py-0.5 rounded-md font-medium text-sm">
          {part.startsWith('@folder/') ? '📁' : '📄'} {part.substring(part.startsWith('@folder/') ? 8 : 1)}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      <div className="border-b border-gray-700 bg-gray-800/60 px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white truncate">
              {session.title || "Chat"}
            </h1>
            <p className="text-sm text-gray-400 truncate">
              {session.repoUrl.replace('https://github.com/', '')}
            </p>
            {session.filePath && (
              <p className="text-xs text-gray-400 mt-1">
                Scoped to: {session.filePath}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetMemory}
              className="text-gray-400 border-gray-600 hover:bg-gray-700 hover:text-gray-200"
              title="Reset Agent Memory"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {session.messages.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Ready to chat!</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Ask questions about the code, files, or repository structure.
                  </p>
                  <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600">
                    <p>• <span className="text-gray-400">@filename.ts</span> - Ask about specific files</p>
                    <p>• <span className="text-gray-400">@folder/path</span> - Explore a directory</p>
                    <p>• <span className="text-gray-300">"What does this function do?"</span></p>
                  </div>
                </div>
              ) : (
                session.messages.map((message, index) => (
                  <div 
                    key={`${session.id}-msg-${index}-${message.timestamp}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl shadow-md ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-4 py-3' 
                          : 'bg-gray-800 text-gray-100 border border-gray-700/60'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="px-4 py-3 border-b border-gray-700/50 flex items-center">
                          <div className="mr-3 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 shadow-inner">
                            <span className="text-sm font-semibold">AI</span>
                          </div>
                          <span className="text-sm font-medium text-gray-200">Assistant</span>
                        </div>
                      )}
                      
                      <div className={`${message.role === 'assistant' ? 'px-4 py-3' : ''}`}>
                        {message.error && (
                          <div className="my-2 p-2 bg-red-900/30 border border-red-700/50 rounded-md text-red-300 text-sm">
                            <AlertTriangle className="inline h-4 w-4 mr-1" /> Error: {message.error}
                          </div>
                        )}
                        {!message.error && message.content && (
                           <div className="prose prose-sm prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-200 prose-a:text-blue-400 prose-code:text-pink-400 prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2">
                            <ReactMarkdown 
                              components={MarkdownComponents}
                              remarkPlugins={[remarkGfm]}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        {message.isStreaming && !message.content && !message.error && (
                           <div className="flex items-center py-2">
                             <div className="flex space-x-1">
                               <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-0"></div>
                               <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100"></div>
                               <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200"></div>
                             </div>
                             <span className="ml-3 text-sm text-gray-400">Generating response...</span>
                           </div>
                        )}
                        {message.agenticSteps && message.agenticSteps.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-1.5">
                            {message.agenticSteps.map((step, idx) => (
                              <AgenticStepDisplay key={`${session.id}-step-${index}-${idx}`} step={step} />
                            ))}
                          </div>
                        )}
                         {message.role === 'user' && (
                          <div className="leading-relaxed">{highlightMentions(message.content)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && !session.messages.some(m => m.isStreaming) && ( // Show general loading only if not already streaming
                <div className="flex justify-start">
                  <div className="bg-gray-800/60 border border-gray-700/30 rounded-2xl">
                    <div className="px-4 py-3 border-b border-gray-700/30 flex items-center">
                      <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gray-500 to-gray-600">
                        <span className="text-xs font-semibold">AI</span>
                      </div>
                      <span className="text-sm font-medium text-gray-200">Assistant</span>
                    </div>
                    <div className="px-4 py-4 flex items-center">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-0"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200"></div>
                      </div>
                      <span className="ml-3 text-sm text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="border-t border-gray-700 bg-gray-800/60 p-4 shadow-inner">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-xl bg-gray-700/60 border border-gray-600/70 p-3 focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all duration-200 shadow-md">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the code... Use @filename or @folder/path"
              className="flex-1 min-h-[24px] max-h-[120px] bg-transparent border-0 resize-none text-gray-100 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              disabled={isLoading}
              rows={1}
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              size="sm"
              className="bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white disabled:opacity-60 disabled:bg-gray-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSession;
