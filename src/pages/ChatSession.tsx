import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, FileText, Search, Copy, Check } from 'lucide-react';
// @ts-ignore
import Fuse from 'fuse.js';

interface ChatMessage {
  role: string;
  content: string;
}

// Enhanced markdown components with ChatGPT-style appearance
const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    
    const copyToClipboard = () => {
      navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    
    if (!inline) {
      return (
        <div className="my-6 rounded-lg overflow-hidden border border-gray-700/50 bg-gray-950/80">
          <div className="flex items-center justify-between bg-gray-800/80 px-4 py-2 text-xs">
            <span className="text-gray-400 font-mono">{language}</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            showLineNumbers
            wrapLines
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
            codeTagProps={{ 
              style: { 
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace"
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
      <code className="bg-gray-800/60 border border-gray-700/30 px-1.5 py-0.5 rounded text-sm font-mono text-amber-300" {...props}>
        {children}
      </code>
    );
  },
  h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-white my-4 pb-2 border-b border-gray-700" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-xl font-semibold text-white my-3 pb-1 border-b border-gray-800" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-lg font-semibold text-white my-3" {...props} />,
  h4: ({ node, ...props }: any) => <h4 className="text-base font-semibold text-white my-2" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-6 my-4 space-y-2 text-gray-200" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-6 my-4 space-y-2 text-gray-200" {...props} />,
  li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
  p: ({ node, children, ...props }: any) => {
    const hasBlockChild = React.Children.toArray(children).some(
      (child: any) => typeof child === 'object' && child !== null && 'type' in child && 
      ['pre', 'blockquote', 'div', 'ul', 'ol'].includes(child.type)
    );
    if (hasBlockChild) {
      return <div className="my-3 leading-relaxed text-gray-200" {...props}>{children}</div>;
    }
    return <p className="my-3 leading-relaxed text-gray-200" {...props}>{children}</p>;
  },
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="border-l-4 border-blue-500 bg-gray-800/30 pl-4 py-3 my-4 italic text-gray-300 rounded-r" {...props} />
  ),
  a: ({ node, ...props }: any) => (
    <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-700">
      <table className="min-w-full divide-y divide-gray-700 bg-gray-900/50" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-gray-800/50" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-gray-700" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-gray-800/30 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-4 py-3 text-sm text-gray-200" {...props} />,
  pre: ({ node, ...props }: any) => <pre className="overflow-auto p-0 bg-transparent" {...props} />,
  hr: ({ node, ...props }: any) => <hr className="border-gray-600 my-6" {...props} />,
  img: ({ node, ...props }: any) => <img className="max-w-full h-auto rounded-lg my-4 shadow-lg" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-semibold text-white" {...props} />,
  em: ({ node, ...props }: any) => <em className="italic text-gray-300" {...props} />,
};

export default function ChatSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [allFiles, setAllFiles] = useState<{ path: string }[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [fileQuery, setFileQuery] = useState('');
  const [fileResults, setFileResults] = useState<{ path: string }[]>([]);
  const [highlight, setHighlight] = useState(0);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();

  // Fetch file list when sessionId is available
  useEffect(() => {
    if (!sessionId) return; // Don't fetch until sessionId is set
    fetch(`http://localhost:8000/api/files?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => setAllFiles(data));
  }, [sessionId]);

  // Fuzzy search files when fileQuery changes
  useEffect(() => {
    if (!fileQuery) setFileResults(allFiles);
    else {
      const fuse = new Fuse(allFiles, { keys: ['path'], threshold: 0.3 });
      setFileResults(fuse.search(fileQuery).map(r => r.item));
    }
  }, [fileQuery, allFiles]);

  // Handle input changes and detect @ for file picker
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const cursor = e.target.selectionStart || 0;
    if (e.target.value[cursor - 1] === '@') {
      setShowFilePicker(true);
      setFileQuery('');
      setHighlight(0);
    } else {
      setShowFilePicker(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Keyboard navigation for file picker
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showFilePicker) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight(h => Math.min(h + 1, fileResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight(h => Math.max(h - 1, 0));
      } else if (e.key === 'Enter' && fileResults[highlight]) {
        e.preventDefault();
        handleFileSelect(fileResults[highlight]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowFilePicker(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Add file to selection
  const handleFileSelect = (file: { path: string }) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = input.slice(0, start);
      const after = input.slice(end);
      const mention = `@${file.path}`;
      const newValue = before + mention + after;
      setInput(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + mention.length;
      }, 0);
    } else {
      setInput(prev => prev + `@${file.path}`);
    }
    setShowFilePicker(false);
    setFileQuery('');
  };

  // Set initial message from route state
  useEffect(() => {
    const initialMessageFromState = location.state?.initialMessage;
    if (initialMessageFromState) {
      setMessages([{ role: 'assistant', content: initialMessageFromState }]);
      setIsLoading(false);
    } else if (sessionId) {
      // Fallback or error if no initial message is passed and we are on this page
      // This part might indicate a flow issue if reached often.
      // For now, let's assume initialMessageFromState will be provided.
      // If not, we could try to fetch, but that's what we are moving away from.
      console.warn('ChatSession loaded without initial message in state. SessionId:', sessionId);
      // Potentially set an error message or a default loading state.
      // setIsLoading(true); // if we were to implement a fallback fetch
      setIsLoading(false); // For now, just stop loading if no message
    }
  }, [sessionId, location.state]);

  // Scroll to bottom of messages - enhanced for streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Enhanced send message with real-time streaming
  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Add empty assistant message for streaming
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setIsStreaming(true);
      setIsLoading(false);
      
      const response = await fetch(`http://localhost:8000/sessions/${sessionId}/messages?stream=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: currentInput })
      });
      
      if (!response.body) throw new Error('Response body is null');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponseContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();
              if (data === '[DONE]') { 
                setIsStreaming(false); 
                return; 
              }
              if (data) {
                try {
                  const json = JSON.parse(data);
                  if (json.error) throw new Error(json.error);
                  
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    assistantResponseContent += content;
                    // Real-time update without delay
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessageIndex = newMessages.length - 1;
                      if (lastMessageIndex >= 0 && newMessages[lastMessageIndex].role === 'assistant') {
                        newMessages[lastMessageIndex] = {
                          ...newMessages[lastMessageIndex],
                          content: assistantResponseContent
                        };
                      }
                      return newMessages;
                    });
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming chunk:', data, parseError);
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Failed to send message or stream response', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessageIndex = newMessages.length - 1;
        if (lastMessageIndex >= 0 && newMessages[lastMessageIndex].role === 'assistant') {
          newMessages[lastMessageIndex] = {
            ...newMessages[lastMessageIndex],
            content: `Error: Failed to get response. ${error instanceof Error ? error.message : String(error)}`
          };
        } else {
          newMessages.push({ role: 'assistant', content: `Error: Failed to get response. ${error instanceof Error ? error.message : String(error)}` });
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  function highlightMentions(text: string) {
    return text.split(/(@[\w\-/\\.]+)/g).map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded-md font-medium border border-blue-500/30">{part}</span>
      ) : (
        part
      )
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Enhanced Header */}
      <div className="border-b border-gray-700/50 bg-gray-800/80 backdrop-blur-sm px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-100">Chat Session</h1>
        <p className="text-sm text-gray-400 mt-1">AI Assistant</p>
      </div>
      
      {/* Enhanced Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-8">
              {messages.map((msg, index) => (
                <div key={index} className="group">
                  {msg.role === 'user' ? (
                    /* User Message - ChatGPT Style */
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-br-md shadow-lg">
                        <div className="text-[15px] leading-relaxed">
                          {highlightMentions(msg.content)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message - ChatGPT Style */
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                        AI
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-code:text-amber-300 prose-pre:bg-transparent prose-pre:p-0">
                          <ReactMarkdown
                            components={MarkdownComponents}
                            remarkPlugins={[remarkGfm]}
                          >
                            {msg.content}
                          </ReactMarkdown>
                          {isStreaming && index === messages.length - 1 && (
                            <span className="inline-block w-2 h-5 bg-green-400 ml-1 animate-pulse rounded-sm" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && !isStreaming && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                    AI
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-gray-400 text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      </div>
      
      {/* Enhanced Input Area with Inline File Picker */}
      <div className="border-t border-gray-700/50 bg-gray-800/80 backdrop-blur-sm p-4">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            {/* File Picker - positioned above input */}
            {showFilePicker && (
              <div className="absolute bottom-full left-0 right-0 mb-2 z-10">
                <div className="bg-gray-800/95 backdrop-blur-md border border-gray-600/50 rounded-xl shadow-xl overflow-hidden">
                  <div className="border-b border-gray-600/50 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                      <FileText className="h-4 w-4" />
                      Attach Files
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        autoFocus
                        value={fileQuery}
                        onChange={e => { setFileQuery(e.target.value); setHighlight(0); }}
                        placeholder="Search files..."
                        className="w-full pl-10 pr-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-gray-100 placeholder:text-gray-400 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                  <ScrollArea className="max-h-64">
                    <div className="p-1">
                      {fileResults.length > 0 ? (
                        fileResults.map((file, idx) => (
                          <div
                            key={file.path}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-colors duration-150 ${
                              highlight === idx ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-gray-700/50 text-gray-300'
                            }`}
                            onMouseEnter={() => setHighlight(idx)}
                            onClick={() => handleFileSelect(file)}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{file.path}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-gray-400">
                          No files found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
            
            {/* Input Field */}
            <div className="flex items-end gap-3 rounded-2xl bg-gray-700/50 border border-gray-600/50 p-3 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all duration-200">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Message AI... Use @ to mention files"
                className="flex-1 min-h-[20px] max-h-[120px] bg-transparent border-0 resize-none text-gray-100 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-6"
                disabled={isLoading || isStreaming}
                rows={1}
              />
              <Button 
                onClick={handleSend} 
                className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 transition-colors duration-200 px-4 py-2"
                disabled={isLoading || isStreaming || !input.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
