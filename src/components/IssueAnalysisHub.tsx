import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Brain, Search, FileText, GitBranch, CheckCircle, AlertCircle, Loader2, Code, Bug, Settings, Zap, Eye, MessageSquare, Clock, Tag, ChevronRight, Play, Download, Copy, Check, ArrowRight, Lightbulb, Target, ListChecks, TestTube, Cpu, Database, Network, GitCommit, FileCode, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToast } from '@/components/ui/use-toast';
import { analyzeIssue, applyPatch } from '@/lib/api';
import { Diff, Hunk, parseDiff, getChangeKey } from 'react-diff-view';
import 'react-diff-view/style/index.css';

// Custom CSS for diff styling
const diffStyles = `
  .diff-gutter {
    background-color: #1f2937 !important;
    border-color: #374151 !important;
    color: #6b7280 !important;
  }
  .diff-gutter-normal {
    background-color: #1f2937 !important;
  }
  .diff-gutter-insert {
    background-color: #064e3b !important;
  }
  .diff-gutter-delete {
    background-color: #7f1d1d !important;
  }
  .diff-code {
    background-color: #111827 !important;
    color: #e5e7eb !important;
  }
  .diff-code-insert {
    background-color: #052e16 !important;
    color: #dcfce7 !important;
  }
  .diff-code-delete {
    background-color: #450a0a !important;
    color: #fecaca !important;
  }
  .diff-decoration {
    background-color: #374151 !important;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = diffStyles;
  document.head.appendChild(styleElement);
}

interface Issue {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  url: string;
  labels: string[];
  assignees: string[];
  comments: Array<{
    body: string;
    user: string;
    created_at: string;
  }>;
}

interface AnalysisResult {
  status: 'completed' | 'skipped' | 'error';
  classification?: {
    label: string;
    confidence: number;
  };
  plan_markdown?: string;
  explorer?: {
    related_files: any;
    react_analysis: any;
    agentic_insights?: any;
  };
  rag?: any;
  reason?: string;
  pr_info?: any;
  error?: string;
  pr_detection?: {
    has_existing_prs: boolean;
    pr_state?: string;
    pr_number?: number;
    pr_url?: string;
    related_merged_prs?: Array<{
      pr_number: number;
      pr_url: string;
      pr_title: string;
      merged_at: string;
    }>;
    related_open_prs?: Array<{
      pr_number: number;
      title: string;
      author: string;
      url: string;
      draft: boolean;
      review_decision?: string;
    }>;
    message: string;
    error?: string;
  };
}

interface IssueAnalysisHubProps {
  open: boolean;
  onClose: () => void;
  selectedIssue: Issue | null;
  sessionId?: string;
  onFileSelect?: (filePath: string) => void;
}

// Enhanced Solution Planning Progress Component
const SolutionPlanningProgress: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  
  // These are the actual steps from the backend agentic analysis
  const phases = [
    { label: "Analyzing GitHub issue metadata", icon: <Search className="h-4 w-4" /> },
    { label: "Finding related files in codebase", icon: <Code className="h-4 w-4" /> },
    { label: "Searching for similar past issues", icon: <MessageSquare className="h-4 w-4" /> },
    { label: "Examining file implementation details", icon: <Eye className="h-4 w-4" /> },
    { label: "Checking for regressions", icon: <AlertCircle className="h-4 w-4" /> },
    { label: "Generating solution strategy", icon: <Target className="h-4 w-4" /> },
    { label: "Creating remediation plan", icon: <ListChecks className="h-4 w-4" /> }
  ];

  useEffect(() => {
    if (!isActive) {
      setCurrentPhase(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentPhase(prev => {
        if (prev < phases.length - 1) {
          return prev + 1;
        }
        return 0; // Loop back to keep showing progress
      });
    }, 2500); // Slightly slower for readability

    return () => clearInterval(interval);
  }, [isActive, phases.length]);

  if (!isActive) return null;

  return (
    <div className="space-y-2">
      {phases.map((phase, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 text-sm transition-all duration-500 ${
            index === currentPhase 
              ? 'text-white' 
              : index < currentPhase 
                ? 'text-gray-400' 
                : 'text-gray-600'
          }`}
        >
          <div className={`transition-all duration-300 ${
            index === currentPhase ? 'text-blue-400' : 'text-gray-500'
          }`}>
            {index === currentPhase ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : index < currentPhase ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              phase.icon
            )}
          </div>
          <span className={`transition-all duration-300 ${
            index === currentPhase ? 'font-medium' : ''
          }`}>
            {phase.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Simplified Analysis Step Component
const AnalysisStep: React.FC<{
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon: React.ReactNode;
  showProgress?: boolean;
}> = ({ step, title, description, status, icon, showProgress = false }) => {
  const getStepIcon = () => {
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'error') return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (status === 'active') return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    return <div className="h-5 w-5 border-2 border-gray-600 rounded-full" />;
  };

  return (
    <div className={`transition-all duration-300 ${
      status === 'active' ? 'bg-blue-50/5 border-blue-500/20' :
      status === 'completed' ? 'bg-green-50/5 border-green-500/20' :
      status === 'error' ? 'bg-red-50/5 border-red-500/20' :
      'border-gray-800'
    } border rounded-lg p-4`}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {getStepIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Step {step}</span>
            <h3 className="font-medium text-white">{title}</h3>
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      
      {showProgress && status === 'active' && (
        <div className="mt-4 pl-9">
          <SolutionPlanningProgress isActive={true} />
        </div>
      )}
    </div>
  );
};

// Classification Badge Component
const ClassificationBadge: React.FC<{ label: string; confidence: number }> = ({ label, confidence }) => {
  const getClassificationColor = (label: string) => {
    const colors: { [key: string]: string } = {
      'bug-code': 'bg-red-500/10 text-red-400 border-red-500/20',
      'bug-test': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'documentation': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'build/CI': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'dependency': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'refactor': 'bg-green-500/10 text-green-400 border-green-500/20',
      'question': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colors[label] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${getClassificationColor(label)}`}>
      <span className="font-medium">{label}</span>
      <span className="text-xs opacity-75">
        {Math.round(confidence * 100)}%
      </span>
    </div>
  );
};

// PR Detection Results Component
const PRDetectionResults: React.FC<{ prDetection: NonNullable<AnalysisResult['pr_detection']> }> = ({ prDetection }) => {
  if (!prDetection.has_existing_prs) {
    return (
      <div className="border border-gray-800 rounded-lg p-4">
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          PR Detection
        </h3>
        <p className="text-sm text-gray-300">{prDetection.message}</p>
        <div className="mt-2 text-xs text-gray-500">
          ✅ No existing work found - safe to proceed with new implementation
        </div>
      </div>
    );
  }

  return (
    <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-4">
      <h3 className="font-medium text-white mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        PR Detection - Existing Work Found
      </h3>
      <p className="text-sm text-yellow-200 mb-3">{prDetection.message}</p>
      
      {/* Existing Direct PR */}
      {prDetection.pr_number && (
        <div className="mb-3">
          <div className="text-xs text-yellow-300 font-medium mb-1">Direct PR Link:</div>
          <div className="bg-yellow-900/20 rounded p-2">
            <a 
              href={prDetection.pr_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-yellow-200 hover:text-yellow-100 text-sm flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              PR #{prDetection.pr_number} ({prDetection.pr_state})
            </a>
          </div>
        </div>
      )}

      {/* Related Merged PRs */}
      {prDetection.related_merged_prs && prDetection.related_merged_prs.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-yellow-300 font-medium mb-1">Related Merged PRs:</div>
          <div className="space-y-1">
            {prDetection.related_merged_prs.map((pr) => (
              <div key={pr.pr_number} className="bg-green-900/20 rounded p-2">
                <a 
                  href={pr.pr_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-200 hover:text-green-100 text-sm flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  PR #{pr.pr_number}: {pr.pr_title}
                </a>
                <div className="text-xs text-green-300 mt-1">
                  Merged: {new Date(pr.merged_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Open PRs */}
      {prDetection.related_open_prs && prDetection.related_open_prs.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-yellow-300 font-medium mb-1">Related Open PRs:</div>
          <div className="space-y-1">
            {prDetection.related_open_prs.map((pr) => (
              <div key={pr.pr_number} className="bg-blue-900/20 rounded p-2">
                <a 
                  href={pr.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-200 hover:text-blue-100 text-sm flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  PR #{pr.pr_number}: {pr.title}
                </a>
                <div className="text-xs text-blue-300 mt-1 flex items-center gap-2">
                  <span>By: {pr.author}</span>
                  {pr.draft && <Badge variant="outline" className="text-xs">Draft</Badge>}
                  {pr.review_decision && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        pr.review_decision === 'APPROVED' ? 'text-green-400 border-green-400' :
                        pr.review_decision === 'CHANGES_REQUESTED' ? 'text-red-400 border-red-400' :
                        'text-yellow-400 border-yellow-400'
                      }`}
                    >
                      {pr.review_decision.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-yellow-400 bg-yellow-900/20 rounded p-2">
        ⚠️ Consider coordinating with existing work or reviewing these PRs before proceeding
      </div>
    </div>
  );
};

// Diff Modal Component
const DiffModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  diffContent: string;
  fileName?: string;
  sessionId?: string;
}> = ({ isOpen, onClose, diffContent, fileName, sessionId }) => {
  const [copiedHunk, setCopiedHunk] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  const files = useMemo(() => {
    try {
      return parseDiff(diffContent);
    } catch (error) {
      console.error('Failed to parse diff:', error);
      return [];
    }
  }, [diffContent]);

  const copyDiff = useCallback(async () => {
    await navigator.clipboard.writeText(diffContent);
    setCopiedHunk('full-diff');
    setTimeout(() => setCopiedHunk(null), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Full diff copied",
    });
  }, [diffContent, toast]);

  const applyPatchHandler = useCallback(async () => {
    if (!sessionId) {
      toast({
        title: "Cannot apply patch",
        description: "No session available for applying changes",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);
    try {
      const result = await applyPatch({
        patch_content: diffContent,
        session_id: sessionId
      });

      if (result.success) {
        toast({
          title: "Patch applied successfully",
          description: `${result.modified_files?.length || 0} file(s) modified`,
        });
        onClose(); // Close modal after successful application
      } else {
        toast({
          title: "Failed to apply patch",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error applying patch",
        description: error instanceof Error ? error.message : "Failed to apply patch",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  }, [sessionId, diffContent, toast, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-y-4 left-4 right-4 bg-gray-950 border border-gray-700 rounded-lg shadow-2xl z-50 max-w-6xl mx-auto">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileCode className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Code Diff</h3>
                <p className="text-sm text-gray-400">
                  {fileName || `${files.length} file(s) changed`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyDiff}
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                {copiedHunk === 'full-diff' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copiedHunk === 'full-diff' ? 'Copied' : 'Copy Diff'}
              </Button>
              {sessionId && (
                <Button
                  onClick={applyPatchHandler}
                  disabled={applying}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {applying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GitCommit className="h-4 w-4 mr-2" />
                  )}
                  {applying ? 'Applying...' : 'Apply Patch'}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Diff Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                {files.length > 0 ? (
                  <div className="space-y-4">
                    {files.map((file, fileIndex) => (
                      <div key={fileIndex} className="border border-gray-700 rounded-lg overflow-hidden">
                        {/* File Header */}
                        <div className="bg-gray-800/50 border-b border-gray-700 p-3">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-gray-400" />
                            <span className="font-mono text-sm text-gray-300">
                              {file.oldPath === file.newPath ? file.newPath : `${file.oldPath} → ${file.newPath}`}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {file.type}
                            </Badge>
                          </div>
                        </div>

                        {/* Diff Content */}
                        <div className="bg-gray-950/50">
                          <Diff 
                            viewType="unified" 
                            diffType={file.type}
                            hunks={file.hunks}
                          >
                            {(hunks) => hunks.map((hunk) => (
                              <Hunk key={`${file.oldPath}-${hunk.oldStart}-${hunk.newStart}`} hunk={hunk} />
                            ))}
                          </Diff>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">Failed to parse diff content</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
};

// Diff Preview Component for inline display
const DiffPreview: React.FC<{
  diffContent: string;
  onOpenFull: () => void;
}> = ({ diffContent, onOpenFull }) => {
  const files = useMemo(() => {
    try {
      const parsed = parseDiff(diffContent);
      return parsed.slice(0, 1); // Show only first file as preview
    } catch (error) {
      return [];
    }
  }, [diffContent]);

  const stats = useMemo(() => {
    const lines = diffContent.split('\n');
    const additions = lines.filter(line => line.startsWith('+')).length;
    const deletions = lines.filter(line => line.startsWith('-')).length;
    return { additions, deletions };
  }, [diffContent]);

  return (
    <div className="my-4 border border-gray-700 rounded-lg overflow-hidden">
      {/* Preview Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Code Changes</span>
            <Badge variant="outline" className="text-xs">
              +{stats.additions} -{stats.deletions}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenFull}
            className="text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Full Diff
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="bg-gray-950/50 p-3">
        {files.length > 0 ? (
          <div className="space-y-2">
            <div className="font-mono text-xs text-gray-400">
              {files[0].oldPath === files[0].newPath ? files[0].newPath : `${files[0].oldPath} → ${files[0].newPath}`}
            </div>
            <div className="text-xs text-gray-500">
              Click "View Full Diff" to see complete changes and apply patch
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">Invalid diff format</div>
        )}
      </div>
    </div>
  );
};

// Enhanced Markdown Components
const PlanMarkdownComponents = (sessionId?: string, onOpenDiff?: (content: string) => void) => ({
  h1: ({ children }: any) => (
    <h1 className="text-xl font-semibold text-white mt-6 mb-4 pb-2 border-b border-gray-800">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-lg font-medium text-white mt-5 mb-3">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-base font-medium text-white mt-4 mb-2">
      {children}
    </h3>
  ),
  ul: ({ children }: any) => (
    <ul className="space-y-1 my-3">{children}</ul>
  ),
  li: ({ children }: any) => (
    <li className="flex items-start gap-2 text-gray-300 text-sm">
      <div className="flex-shrink-0 w-1 h-1 bg-gray-500 rounded-full mt-2"></div>
      <div className="flex-1">{children}</div>
    </li>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const content = String(children).replace(/\n$/, '');
    
    // Check if this is a diff block
    if (!inline && match && (match[1] === 'diff' || content.startsWith('---') || content.startsWith('+++'))) {
      return (
        <DiffPreview 
          diffContent={content} 
          onOpenFull={() => onOpenDiff?.(content)}
        />
      );
    }
    
    return !inline && match ? (
      <div className="my-4 rounded-md overflow-hidden border border-gray-800 bg-gray-950/50">
        <div className="flex items-center justify-between bg-gray-900 px-3 py-2 border-b border-gray-800">
          <span className="text-gray-400 font-mono text-xs">{match[1]}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(content)}
            className="text-gray-500 hover:text-gray-300 h-6 px-2"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
          {...props}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className="bg-gray-800/60 text-blue-300 px-1 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    );
  },
  p: ({ children }: any) => (
    <p className="mb-3 leading-relaxed text-gray-300 text-sm">{children}</p>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-blue-500/50 pl-3 py-1 my-3 bg-blue-950/10 text-blue-200 text-sm">
      {children}
    </blockquote>
  ),
});

const IssueAnalysisHub: React.FC<IssueAnalysisHubProps> = ({
  open,
  onClose,
  selectedIssue,
  sessionId,
  onFileSelect
}) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [diffModal, setDiffModal] = useState<{ isOpen: boolean; content: string; fileName?: string }>({
    isOpen: false,
    content: '',
    fileName: undefined
  });
  const { toast } = useToast();

  const steps = [
    {
      title: 'PR Detection',
      description: 'Checking for existing pull requests',
      icon: <Search className="h-5 w-5" />
    },
    {
      title: 'Classification',
      description: 'Categorizing issue type and complexity',
      icon: <Tag className="h-5 w-5" />
    },
    {
      title: 'Solution Planning',
      description: 'Performing deep analysis and generating plan',
      icon: <Brain className="h-5 w-5" />,
      showProgress: true
    }
  ];

  const runAnalysis = useCallback(async () => {
    if (!selectedIssue) return;

    setIsAnalyzing(true);
    setCurrentStep(0);
    setAnalysisResult(null);

    try {
      // Simulate step progression with realistic timing
      const stepTimings = [1000, 1500, 0]; // Last step runs during actual API call
      
      for (let i = 0; i < steps.length - 1; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, stepTimings[i]));
      }
      
      // Start final step and API call
      setCurrentStep(steps.length - 1);

      const apiResult = await analyzeIssue({
        issue_url: selectedIssue.url,
        session_id: sessionId
      });

      // Transform API response to match component expectations
      const result: AnalysisResult = {
        status: apiResult.status === 'completed' ? 'completed' : 
                apiResult.status === 'error' ? 'error' : 'completed'
      };
      
      // Add optional properties
      if (apiResult.final_result?.classification) {
        result.classification = {
          label: apiResult.final_result.classification.category,
          confidence: apiResult.final_result.classification.confidence
        };
      }
      
      if (apiResult.final_result?.remediation_plan) {
        result.plan_markdown = apiResult.final_result.remediation_plan;
      }
      
      result.explorer = {
        related_files: apiResult.final_result?.related_files ? { 
          files: apiResult.final_result.related_files 
        } : null,
        react_analysis: null,
        agentic_insights: apiResult.steps?.find((step: any) => step.step === "Codebase Analysis")?.result || null
      };
      
      if (apiResult.error) {
        result.error = apiResult.error;
      }
      
      // Add PR detection results
      const prDetectionStep = apiResult.steps?.find((step: any) => step.step === "PR Detection");
      if (prDetectionStep?.result) {
        result.pr_detection = prDetectionStep.result;
      }
      
      setAnalysisResult(result);

      if (result.status === 'completed') {
        toast({
          title: "Analysis complete",
          description: `Issue #${selectedIssue.number} analyzed successfully`,
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Analysis failed'
      } as AnalysisResult);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : 'Failed to analyze issue',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedIssue, sessionId, toast]);

  const copyPlan = useCallback(async () => {
    if (analysisResult?.plan_markdown) {
      await navigator.clipboard.writeText(analysisResult.plan_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Remediation plan copied",
      });
    }
  }, [analysisResult?.plan_markdown, toast]);

  const downloadPlan = useCallback(() => {
    if (analysisResult?.plan_markdown && selectedIssue) {
      const blob = new Blob([analysisResult.plan_markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `issue-${selectedIssue.number}-analysis.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Downloaded",
        description: "Remediation plan saved as markdown",
      });
    }
  }, [analysisResult?.plan_markdown, selectedIssue, toast]);

  const openDiffModal = useCallback((content: string, fileName?: string) => {
    setDiffModal({ isOpen: true, content, fileName });
  }, []);

  const closeDiffModal = useCallback(() => {
    setDiffModal({ isOpen: false, content: '', fileName: undefined });
  }, []);

  // Reset state when issue changes
  useEffect(() => {
    if (selectedIssue) {
      setAnalysisResult(null);
      setCurrentStep(0);
      setIsAnalyzing(false);
    }
  }, [selectedIssue]);

  const getStepStatus = (stepIndex: number) => {
    if (!isAnalyzing && !analysisResult) return 'pending';
    if (isAnalyzing) {
      if (stepIndex < currentStep) return 'completed';
      if (stepIndex === currentStep) return 'active';
      return 'pending';
    }
    if (analysisResult) {
      if (analysisResult.status === 'error') {
        return stepIndex <= currentStep ? 'error' : 'pending';
      }
      return 'completed';
    }
    return 'pending';
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      
      {/* Main Panel */}
      <div className="fixed inset-y-0 right-0 w-[800px] bg-gray-950/95 backdrop-blur-xl border-l border-gray-800 z-50">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Issue Analysis</h2>
                <p className="text-sm text-gray-400">AI-powered analysis and solution planning</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Selected Issue */}
                {selectedIssue && (
                  <div className="border border-gray-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-center justify-center">
                        <Bug className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white truncate">{selectedIssue.title}</h3>
                          <Badge variant="outline" className="text-xs shrink-0">
                            #{selectedIssue.number}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {selectedIssue.body || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(selectedIssue.created_at).toLocaleDateString()}
                          </div>
                          {selectedIssue.labels.length > 0 && (
                            <div className="flex items-center gap-1">
                              {selectedIssue.labels.slice(0, 2).map(label => (
                                <Badge key={label} variant="secondary" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Start Analysis Button */}
                {selectedIssue && !isAnalyzing && !analysisResult && (
                  <div className="text-center py-12">
                    <Button
                      onClick={runAnalysis}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze Issue
                    </Button>
                    <p className="text-sm text-gray-500 mt-3">
                      Deep analysis typically takes 1-2 minutes
                    </p>
                  </div>
                )}

                {/* Analysis Steps */}
                {(isAnalyzing || analysisResult) && (
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <AnalysisStep
                        key={index}
                        step={index + 1}
                        title={step.title}
                        description={step.description}
                        status={getStepStatus(index)}
                        icon={step.icon}
                        showProgress={step.showProgress}
                      />
                    ))}
                  </div>
                )}

                {/* Analysis Results */}
                {analysisResult && (
                  <div className="space-y-4">
                    {/* Status */}
                    {analysisResult.status !== 'completed' && (
                      <div className={`border rounded-lg p-4 ${
                        analysisResult.status === 'skipped' ? 'border-yellow-500/20 bg-yellow-500/5' :
                        'border-red-500/20 bg-red-500/5'
                      }`}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className={`h-4 w-4 ${
                            analysisResult.status === 'skipped' ? 'text-yellow-500' : 'text-red-500'
                          }`} />
                          <h3 className="font-medium text-white">
                            Analysis {analysisResult.status === 'skipped' ? 'Skipped' : 'Failed'}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          {analysisResult.status === 'skipped' 
                            ? analysisResult.reason === 'pr_exists' 
                              ? 'This issue already has related pull requests in progress.'
                              : analysisResult.reason || 'Analysis was skipped.'
                            : analysisResult.error || 'An error occurred during analysis.'
                          }
                        </p>
                      </div>
                    )}

                    {/* Classification */}
                    {analysisResult.classification && (
                      <div className="border border-gray-800 rounded-lg p-4">
                        <h3 className="font-medium text-white mb-3">Classification</h3>
                        <ClassificationBadge 
                          label={analysisResult.classification.label}
                          confidence={analysisResult.classification.confidence}
                        />
                      </div>
                    )}

                    {/* PR Detection */}
                    {analysisResult.pr_detection && (
                      <PRDetectionResults prDetection={analysisResult.pr_detection} />
                    )}

                    {/* Remediation Plan */}
                    {analysisResult.plan_markdown && (
                      <div className="border border-gray-800 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
                          <h3 className="font-medium text-white">Solution Plan</h3>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={copyPlan}
                              className="text-gray-400 hover:text-white h-8"
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={downloadPlan}
                              className="text-gray-400 hover:text-white h-8"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                          <div className="p-4">
                            <ReactMarkdown
                              components={PlanMarkdownComponents(sessionId, openDiffModal)}
                              remarkPlugins={[remarkGfm]}
                            >
                              {analysisResult.plan_markdown}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!selectedIssue && (
                  <div className="text-center py-24">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Brain className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-white mb-2">
                      Select an Issue
                    </h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Choose an issue from the Issues pane to start analysis and get a comprehensive solution plan.
                    </p>
                  </div>
                )}

                {/* Tips Section - Only show when no analysis is running and no results */}
                {!isAnalyzing && !analysisResult && selectedIssue && (
                  <div className="border border-gray-800 rounded-lg p-4 mt-8">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">What happens during analysis?</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                        <span>AI examines issue details and searches for similar problems</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                        <span>Deep codebase analysis to find relevant files and patterns</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                        <span>Generates step-by-step solution with code examples</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Diff Modal */}
      <DiffModal
        isOpen={diffModal.isOpen}
        onClose={closeDiffModal}
        diffContent={diffModal.content}
        fileName={diffModal.fileName}
        sessionId={sessionId}
      />
    </>
  );
};

export default IssueAnalysisHub; 