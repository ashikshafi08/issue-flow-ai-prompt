import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
// @ts-ignore
import Fuse from 'fuse.js';

interface ChatMessage {
  role: string;
  content: string;
}

// Custom components for React Markdown with enhanced styling for better formatting
import { Send } from 'lucide-react';

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
      child.type !== React.Fragment && child.type !== 'span' && child.type !== 'a' && 
      child.type !== 'em' && child.type !== 'strong' && child.type !== 'code' && child.type !== 'del'
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
  pre: ({ node, ...props }: any) => <pre className="overflow-auto p-0 bg-transparent" {...props} />, // Wrapper for SyntaxHighlighter
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  // Open file picker on @
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const cursor = e.target.selectionStart || 0;
    if (e.target.value[cursor - 1] === '@') {
      setShowFilePicker(true);
      setFileQuery('');
      setHighlight(0);
    }
  };

  // Keyboard navigation for file picker
  const handleFilePickerKeyDown = (e: React.KeyboardEvent) => {
    if (!showFilePicker) return;
    if (e.key === 'ArrowDown') setHighlight(h => Math.min(h + 1, fileResults.length - 1));
    else if (e.key === 'ArrowUp') setHighlight(h => Math.max(h - 1, 0));
    else if (e.key === 'Enter' && fileResults[highlight]) {
      handleFileSelect(fileResults[highlight]);
    } else if (e.key === 'Escape') setShowFilePicker(false);
  };

  // Add file to selection
  const handleFileSelect = (file: { path: string }) => {
    if (inputRef.current) {
      const textarea = inputRef.current;
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
        <span key={i} className="bg-blue-900 text-blue-300 px-1 rounded">{part}</span>
      ) : (
        part
      )
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="border-b border-gray-800 bg-gray-800 px-4 py-3">
        <h1 className="text-lg font-medium">Chat Session</h1>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`relative max-w-[85%] rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white px-4 py-3' 
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  <div className={`${msg.role === 'assistant' ? 'px-4 py-2 border-b border-gray-700' : 'mb-2'} flex items-center`}>
                    <div className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full ${
                      msg.role === 'user' ? 'bg-blue-700' : 'bg-gray-700'
                    }`}>
                      {msg.role === 'user' ? 'U' : 'A'}
                    </div>
                    <span className="text-sm font-medium">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                  </div>
                  
                  <div className={`${msg.role === 'assistant' ? 'px-4 py-3' : ''}`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-200 prose-a:text-blue-400 prose-code:text-green-400 prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-li:my-0 prose-ul:my-2 prose-ol:my-2">
                        <ReactMarkdown
                          components={MarkdownComponents}
                          remarkPlugins={[remarkGfm]}
                        >
                          {msg.content}
                        </ReactMarkdown>
                        {/* Show cursor during streaming for the last message */}
                        {isStreaming && index === messages.length - 1 && (
                          <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse" />
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-100">{highlightMentions(msg.content)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Show loading indicator only when waiting to start, not during streaming */}
            {isLoading && !isStreaming && (
              <div className="flex justify-start">
                <div className="relative max-w-[85%] rounded-lg bg-gray-800">
                  <div className="px-4 py-2 border-b border-gray-700 flex items-center">
                    <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700">
                      A
                    </div>
                    <span className="text-sm font-medium">Assistant</span>
                  </div>
                  <div className="px-4 py-4 flex items-center">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400"></div>
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
        </ScrollArea>
      </div>
      
      <div className="border-t border-gray-800 bg-gray-800 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center rounded-lg bg-gray-700 p-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                placeholder="Type your message... Use @ to select files."
                className="flex-1 border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading || isStreaming}
              />
              <Button 
                onClick={handleSend} 
                className="ml-1 rounded-md bg-blue-600 px-3 py-2 hover:bg-blue-700"
                disabled={isLoading || isStreaming}
              >
                Send
              </Button>
            </div>
            {/* File picker modal */}
            {showFilePicker && (
              <div className="file-picker-modal absolute z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg mt-2 w-[400px] max-h-[300px] overflow-y-auto">
                <input
                  autoFocus
                  value={fileQuery}
                  onChange={e => { setFileQuery(e.target.value); setHighlight(0); }}
                  onKeyDown={handleFilePickerKeyDown}
                  placeholder="Type to search files..."
                  className="w-full p-2 bg-gray-800 text-white border-0 rounded-t-lg"
                />
                <ul className="max-h-[240px] overflow-y-auto">
                  {fileResults.map((file, idx) => (
                    <li
                      key={file.path}
                      className={`px-4 py-2 cursor-pointer ${highlight === idx ? 'bg-blue-700 text-white' : 'hover:bg-gray-700'}`}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => handleFileSelect(file)}
                    >
                      {file.path}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
