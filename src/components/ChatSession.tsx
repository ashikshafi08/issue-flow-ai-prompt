import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Session, ChatMessage } from '@/pages/Assistant';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatSessionProps {
  session: Session;
  onUpdateSession: (updates: Partial<Session>) => void;
}

// Custom components for React Markdown with enhanced styling
const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'plaintext';
    
    if (!inline) {
      return (
        <div className="my-4 rounded-md overflow-hidden">
          <div className="bg-gray-800 px-4 py-1 text-xs font-mono text-gray-300 flex justify-between items-center border-b border-gray-700">
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
              background: '#1a1a1a',
              fontSize: '0.875rem',
            }}
            codeTagProps={{ 
              style: { 
                fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
                lineHeight: 1.5
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
      <code className="bg-gray-800/60 border border-gray-700/40 px-2 py-1 rounded-md text-sm font-mono text-gray-200" {...props}>
        {children}
      </code>
    );
  },
  h1: ({ node, children, ...props }: any) => (
    <h1 className="text-xl font-bold text-white my-4 pb-2 border-b border-gray-700/50" {...props}>
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }: any) => (
    <h2 className="text-lg font-semibold text-white my-3 pb-1" {...props}>
      {children}
    </h2>
  ),
  h3: ({ node, children, ...props }: any) => (
    <h3 className="text-base font-semibold text-white my-3" {...props}>
      {children}
    </h3>
  ),
  h4: ({ node, children, ...props }: any) => (
    <h4 className="text-sm font-semibold text-white my-2" {...props}>
      {children}
    </h4>
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc list-inside my-3 space-y-1 text-gray-200 ml-4" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-inside my-3 space-y-1 text-gray-200 ml-4" {...props} />
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
    <blockquote className="my-4 border-l-4 border-gray-500/50 bg-gray-500/10 pl-4 py-3 rounded-r-lg text-gray-100 italic" {...props}>
      {children}
    </blockquote>
  ),
  a: ({ node, ...props }: any) => (
    <a 
      className="text-gray-400 hover:text-gray-300 underline underline-offset-2 transition-colors" 
      target="_blank" 
      rel="noopener noreferrer" 
      {...props} 
    />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-700/50">
      <table className="min-w-full divide-y divide-gray-700 bg-gray-900/50" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-gray-700/50" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-gray-600" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-gray-700/30" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-3 py-2 text-sm text-gray-200" {...props} />,
  pre: ({ node, ...props }: any) => <pre className="overflow-auto p-0 bg-transparent" {...props} />,
  hr: ({ node, ...props }: any) => (
    <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-6" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  em: ({ node, ...props }: any) => <em className="italic text-gray-300" {...props} />,
};

const ChatSession: React.FC<ChatSessionProps> = ({ session, onUpdateSession }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    const updatedMessages = [...session.messages, userMessage];
    onUpdateSession({ messages: updatedMessages });

    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Mock AI response for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: `I understand you're asking about: "${currentInput}"\n\nBased on the repository **${session.repoUrl}**${session.filePath ? ` and file **${session.filePath}**` : ''}, here's what I found:\n\n\`\`\`typescript\n// This is a mock response\n// In a real implementation, this would be generated by your AI backend\n// using the repo context and file-aware RAG system\n\`\`\`\n\nWould you like me to analyze a specific file or function?`,
        timestamp: Date.now()
      };

      onUpdateSession({ 
        messages: [...updatedMessages, aiMessage]
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: Date.now()
      };
      onUpdateSession({ 
        messages: [...updatedMessages, errorMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const highlightMentions = (text: string) => {
    return text.split(/(@[\w\-/\\.]+)/g).map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="bg-gray-600/30 text-gray-300 px-1.5 py-0.5 rounded-md font-medium">{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white truncate">
              {session.title}
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
          <Button
            variant="outline"
            size="sm"
            className="text-gray-400 border-gray-600 hover:bg-gray-700"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Re-index
          </Button>
        </div>
      </div>

      {/* Messages */}
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
                    <p>• <span className="text-gray-300">"What does this function do?"</span></p>
                    <p>• <span className="text-gray-400">"Show me the API endpoints"</span></p>
                  </div>
                </div>
              ) : (
                session.messages.map((message, index) => (
                  <div 
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-gray-700 text-white px-4 py-3' 
                          : 'bg-gray-800/60 text-gray-100 border border-gray-700/30'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="px-4 py-3 border-b border-gray-700/30 flex items-center">
                          <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gray-500 to-gray-600">
                            <span className="text-xs font-semibold">AI</span>
                          </div>
                          <span className="text-sm font-medium">Assistant</span>
                        </div>
                      )}
                      
                      <div className={`${message.role === 'assistant' ? 'px-4 py-4' : ''}`}>
                        {message.role === 'assistant' ? (
                          <div className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-200 prose-a:text-gray-400 prose-code:text-gray-400 prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-li:my-0 prose-ul:my-2 prose-ol:my-2">
                            <ReactMarkdown 
                              components={MarkdownComponents}
                              remarkPlugins={[remarkGfm]}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="leading-relaxed">{highlightMentions(message.content)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
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

      {/* Input Area */}
      <div className="border-t border-gray-700 bg-gray-800/50 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-xl bg-gray-700/50 border border-gray-600/50 p-3 focus-within:border-gray-500/50 focus-within:ring-1 focus-within:ring-gray-500/20 transition-all duration-200">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the code... Use @filename to scope your question"
              className="flex-1 min-h-[20px] max-h-[120px] bg-transparent border-0 resize-none text-gray-100 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
              rows={1}
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600"
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
