import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, FileText, Search } from 'lucide-react';
// @ts-ignore
import Fuse from 'fuse.js';

interface ChatMessage {
  role: string;
  content: string;
}

// Custom components for React Markdown with enhanced styling for better formatting
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
              background: '#1a1a2e',
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
      <code className="bg-gray-800 px-1.5 py-0.5 rounded-sm font-mono text-sm text-green-400" {...props}>
        {children}
      </code>
    );
  },
  h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold my-4 pb-1 border-b border-gray-700" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-lg font-bold my-3 pb-1 border-b border-gray-800" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-md font-semibold my-3" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-6 my-3 space-y-2" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-6 my-3 space-y-2" {...props} />,
  li: ({ node, ...props }: any) => <li className="my-1" {...props} />,
  p: ({ node, children, ...props }: any) => {
    const hasBlockChild = React.Children.toArray(children).some(
      (child: any) => typeof child === 'object' && child !== null && 'type' in child && 
      child.type !== React.Fragment && child.type !== 'span' && 
      child.type !== 'a' && child.type !== 'em' && child.type !== 'strong' && child.type !== 'code' && child.type !== 'del'
    );
    if (hasBlockChild) {
      return <div className="my-3 leading-relaxed" {...props}>{children}</div>;
    }
    return <p className="my-3 leading-relaxed" {...props}>{children}</p>;
  },
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="border-l-4 border-blue-500 bg-gray-800/50 pl-4 py-2 italic text-gray-300 my-4 rounded-r-md" {...props} />
  ),
  a: ({ node, ...props }: any) => (
    <a className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 rounded-md border border-gray-700">
      <table className="min-w-full divide-y divide-gray-700" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-gray-700/50" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-gray-600" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-gray-700/30" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-3 py-2 text-sm" {...props} />,
  pre: ({ node, ...props }: any) => <pre className="overflow-auto p-0 bg-transparent" {...props} />,
  hr: ({ node, ...props }: any) => <hr className="border-gray-600 my-3" {...props} />,
  img: ({ node, ...props }: any) => <img className="max-w-full h-auto rounded-md my-3" {...props} />,
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

  // Send message with selected files
  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setIsStreaming(true);
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
              if (data === '[DONE]') { setIsStreaming(false); return; }
              if (data) {
                try {
                  const json = JSON.parse(data);
                  if (json.error) throw new Error(json.error);
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    assistantResponseContent += content;
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
        <span key={i} className="bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded-md font-medium">{part}</span>
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
      
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 py-6">
            <div className="mx-auto max-w-4xl space-y-6">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`relative max-w-[85%] rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white px-4 py-3 rounded-br-lg' 
                        : 'bg-gray-800/60 text-gray-100 backdrop-blur-sm border border-gray-700/30'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="px-4 py-3 border-b border-gray-700/30 flex items-center">
                        <div className="mr-3 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                          <span className="text-xs font-semibold">AI</span>
                        </div>
                        <span className="text-sm font-medium text-gray-200">Assistant</span>
                      </div>
                    )}
                    
                    <div className={`${msg.role === 'assistant' ? 'px-4 py-4' : ''}`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-200 prose-a:text-blue-400 prose-code:text-green-400 prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-li:my-0 prose-ul:my-2 prose-ol:my-2">
                          <ReactMarkdown
                            components={MarkdownComponents}
                            remarkPlugins={[remarkGfm]}
                          >
                            {msg.content}
                          </ReactMarkdown>
                          {isStreaming && index === messages.length - 1 && (
                            <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse rounded-sm" />
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-100 leading-relaxed">{highlightMentions(msg.content)}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Enhanced Loading Indicator */}
              {isLoading && !isStreaming && (
                <div className="flex justify-start">
                  <div className="relative max-w-[85%] rounded-2xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/30">
                    <div className="px-4 py-3 border-b border-gray-700/30 flex items-center">
                      <div className="mr-3 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                        <span className="text-xs font-semibold">AI</span>
                      </div>
                      <span className="text-sm font-medium text-gray-200">Assistant</span>
                    </div>
                    <div className="px-4 py-5 flex items-center">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400 delay-0"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400 delay-100"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400 delay-200"></div>
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
                        onKeyDown={handleKeyDown}
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
                              highlight === idx ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-700/50 text-gray-300'
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
