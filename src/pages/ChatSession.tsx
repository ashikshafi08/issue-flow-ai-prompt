import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, FileText, Search, Copy, Check, FolderTree } from 'lucide-react';
import CodebaseTree from '@/components/CodebaseTree';
// @ts-ignore
import Fuse from 'fuse.js';

interface ChatMessage {
  role: string;
  content: string;
}

// Helper functions for enhanced markdown rendering
const getHeaderEmoji = (text: string, level: number): string => {
  const lowerText = text.toLowerCase();
  
  // Context-aware emoji mapping
  if (lowerText.includes('bug') || lowerText.includes('issue') || lowerText.includes('problem')) return '🐛';
  if (lowerText.includes('fix') || lowerText.includes('solution') || lowerText.includes('resolve')) return '🔧';
  if (lowerText.includes('summary') || lowerText.includes('overview')) return '📋';
  if (lowerText.includes('analysis') || lowerText.includes('investigation')) return '🔍';
  if (lowerText.includes('code') || lowerText.includes('implementation')) return '💻';
  if (lowerText.includes('test') || lowerText.includes('testing')) return '🧪';
  if (lowerText.includes('step') || lowerText.includes('action')) return '⚡';
  if (lowerText.includes('result') || lowerText.includes('outcome')) return '✅';
  if (lowerText.includes('error') || lowerText.includes('failure')) return '❌';
  if (lowerText.includes('warning') || lowerText.includes('caution')) return '⚠️';
  if (lowerText.includes('recommendation') || lowerText.includes('suggestion')) return '💡';
  if (lowerText.includes('impact') || lowerText.includes('effect')) return '💥';
  if (lowerText.includes('root cause') || lowerText.includes('cause')) return '🎯';
  if (lowerText.includes('timeline') || lowerText.includes('schedule')) return '📅';
  if (lowerText.includes('priority') || lowerText.includes('urgent')) return '🚨';
  
  // Fallback based on header level
  const levelEmojis = ['🎯', '📌', '🔸', '▪️'];
  return levelEmojis[level - 1] || '•';
};

const getBulletIcon = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('error') || lowerText.includes('fail') || lowerText.includes('wrong')) return '❌';
  if (lowerText.includes('success') || lowerText.includes('work') || lowerText.includes('correct')) return '✅';
  if (lowerText.includes('warning') || lowerText.includes('careful') || lowerText.includes('note')) return '⚠️';
  if (lowerText.includes('important') || lowerText.includes('critical') || lowerText.includes('key')) return '🔥';
  if (lowerText.includes('idea') || lowerText.includes('suggestion') || lowerText.includes('tip')) return '💡';
  if (lowerText.includes('file') || lowerText.includes('code') || lowerText.includes('.py') || lowerText.includes('.js')) return '📄';
  if (lowerText.includes('link') || lowerText.includes('reference') || lowerText.includes('see')) return '🔗';
  if (lowerText.includes('example') || lowerText.includes('demo') || lowerText.includes('sample')) return '📝';
  
  return '▶️';
};

const knownFiles = [
  'agents.py', 'vision_web_browser.py', 'llm_client.py', 'local_rag.py', 
  'new_rag.py', 'language_config.py', 'main.py', 'local_repo_loader.py',
  'session_manager.py', 'conversation_memory.py', 'models.py', 
  'prompt_generator.py', 'repo_context.py', 'config.py', 'github_client.py'
];

const enhanceTextWithLinks = (children: React.ReactNode): React.ReactNode => {
  if (typeof children === 'string') {
    // Enhanced file detection regex
    const fileRegex = /(\b[\w-]+\.(?:py|js|tsx?|json|yaml|yml|md|txt|config)\b)/g;
    const parts = children.split(fileRegex);
    
    return parts.map((part, index) => {
      if (fileRegex.test(part)) {
        const isKnownFile = knownFiles.some(file => part.includes(file));
        return (
          <span
            key={index}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-xs border transition-all cursor-pointer ${
              isKnownFile 
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30' 
                : 'bg-gray-700/50 text-gray-300 border-gray-600/30 hover:bg-gray-700/70'
            }`}
            title={isKnownFile ? 'Click to reference this file' : 'File reference'}
          >
            <span className="text-xs">📄</span>
            {part}
            {isKnownFile && <span className="text-xs opacity-70">→</span>}
          </span>
        );
      }
      return part;
    });
  }
  
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      key: (children as React.ReactElement).key,
      children: enhanceTextWithLinks((children as React.ReactElement).props.children)
    });
  }
  
  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement, {
          key: child.key || index,
          children: enhanceTextWithLinks((child as React.ReactElement).props.children)
        });
      }
      return enhanceTextWithLinks(child);
    });
  }
  
  return children;
};

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
  h1: ({ node, children, ...props }: any) => {
    const text = String(children);
    const emoji = getHeaderEmoji(text, 1);
    return (
      <h1 className="text-2xl font-bold text-white my-6 pb-3 border-b-2 border-blue-500/30 flex items-center gap-3" {...props}>
        <span className="text-2xl">{emoji}</span>
        <span>{children}</span>
      </h1>
    );
  },
  h2: ({ node, children, ...props }: any) => {
    const text = String(children);
    const emoji = getHeaderEmoji(text, 2);
    return (
      <h2 className="text-xl font-semibold text-white my-5 pb-2 border-b border-gray-700 flex items-center gap-2 group" {...props}>
        <span className="text-lg">{emoji}</span>
        <span>{children}</span>
        <span className="ml-auto text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          #{Math.random().toString(36).substring(2, 8)}
        </span>
      </h2>
    );
  },
  h3: ({ node, children, ...props }: any) => {
    const text = String(children);
    const emoji = getHeaderEmoji(text, 3);
    return (
      <h3 className="text-lg font-semibold text-white my-4 flex items-center gap-2" {...props}>
        <span className="text-base">{emoji}</span>
        <span>{children}</span>
      </h3>
    );
  },
  h4: ({ node, children, ...props }: any) => {
    const text = String(children);
    const isNumbered = /^\d+\./.test(text);
    return (
      <h4 className="text-base font-semibold text-white my-3 flex items-center gap-2" {...props}>
        {isNumbered && <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {text.match(/^\d+/)?.[0]}
        </span>}
        <span>{isNumbered ? text.replace(/^\d+\.\s*/, '') : children}</span>
      </h4>
    );
  },
  ul: ({ node, ...props }: any) => <ul className="list-none pl-0 my-4 space-y-3 text-gray-200" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-none pl-0 my-4 space-y-3 text-gray-200" {...props} />,
  li: ({ node, children, ...props }: any) => {
    const text = String(children);
    const bullet = getBulletIcon(text);
    return (
      <li className="flex items-start gap-3 leading-relaxed pl-2" {...props}>
        <span className="text-blue-400 mt-1 flex-shrink-0">{bullet}</span>
        <span className="flex-1">{children}</span>
      </li>
    );
  },
  p: ({ node, children, ...props }: any) => {
    const hasBlockChild = React.Children.toArray(children).some(
      (child: any) => {
        if (typeof child === 'object' && child !== null && 'type' in child) {
          // Check for block-level elements that shouldn't be in paragraphs
          const blockElements = ['pre', 'blockquote', 'div', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
          return blockElements.includes(child.type);
        }
        return false;
      }
    );
    
    if (hasBlockChild) {
      return <div className="my-4 leading-relaxed text-gray-200" {...props}>{enhanceTextWithLinks(children)}</div>;
    }
    return <p className="my-4 leading-relaxed text-gray-200" {...props}>{enhanceTextWithLinks(children)}</p>;
  },
  blockquote: ({ node, children, ...props }: any) => (
    <blockquote className="border-l-4 border-yellow-500 bg-yellow-500/10 pl-4 py-3 my-4 rounded-r relative" {...props}>
      <div className="absolute -left-2 top-3 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
        <span className="text-xs">💡</span>
      </div>
      <div className="text-gray-300 italic pl-2">{children}</div>
    </blockquote>
  ),
  a: ({ node, ...props }: any) => (
    <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2 hover:bg-blue-400/10 px-1 py-0.5 rounded transition-all" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-gray-700 shadow-lg">
      <table className="min-w-full divide-y divide-gray-700 bg-gray-900/50" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-gray-800/50" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-gray-700" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-gray-800/30 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-4 py-3 text-sm text-gray-200" {...props} />,
  pre: ({ node, ...props }: any) => <pre className="overflow-auto p-0 bg-transparent" {...props} />,
  hr: ({ node, ...props }: any) => (
    <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-8" {...props} />
  ),
  img: ({ node, ...props }: any) => <img className="max-w-full h-auto rounded-lg my-4 shadow-lg border border-gray-700" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-semibold text-white bg-gray-800/30 px-1 py-0.5 rounded" {...props} />,
  em: ({ node, ...props }: any) => <em className="italic text-gray-300" {...props} />,
};

const AppSidebar = ({ sessionId }: { sessionId: string }) => {
  const handleFileSelect = (filePath: string) => {
    // You can implement file selection logic here
    console.log('Selected file:', filePath);
  };

  return (
    <Sidebar className="border-r border-gray-700/50">
      <SidebarContent className="bg-gray-800/50">
        <CodebaseTree sessionId={sessionId} onFileSelect={handleFileSelect} />
      </SidebarContent>
    </Sidebar>
  );
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
      console.warn('ChatSession loaded without initial message in state. SessionId:', sessionId);
      setIsLoading(false);
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
        <span key={i} className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 px-2 py-1 rounded-md font-medium border border-blue-500/30 hover:bg-blue-600/30 transition-all cursor-pointer" title="File attachment">
          <span className="text-xs">📎</span>
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Session ID</h1>
          <p className="text-gray-400">Please provide a valid session ID to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-900 text-white">
        <AppSidebar sessionId={sessionId} />
        
        <div className="flex flex-col flex-1">
          {/* Enhanced Header with Sidebar Toggle */}
          <div className="border-b border-gray-700/50 bg-gradient-to-r from-gray-800/90 to-gray-800/80 backdrop-blur-sm px-6 py-4 shadow-lg">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-gray-400 hover:text-white transition-colors">
                <FolderTree className="h-5 w-5" />
              </SidebarTrigger>
              <div>
                <h1 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                  <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">AI</span>
                  Chat Session
                </h1>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  AI Assistant - Enhanced Analysis Mode
                </p>
              </div>
            </div>
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
      </div>
    </SidebarProvider>
  );
}
