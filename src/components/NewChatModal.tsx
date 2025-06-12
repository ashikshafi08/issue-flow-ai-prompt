import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Github, Loader2, AlertCircle, CheckCircle, Zap, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createRepoSession, getSessionStatus, enableAgenticMode } from '@/lib/api';

interface NewChatModalProps {
  onClose: () => void;
  onCreateSession: (repoUrl: string, filePath?: string, newSessionId?: string) => void;
}

interface ProgressState {
  status: string;
  message: string;
  error?: string;
  owner?: string;
  repo?: string;
  patch_linkage_status?: string;
  patch_linkage_message?: string;
  patch_linkage_progress?: number;
  // New detailed progress fields
  progress_stage?: string;
  progress_step?: string;
  progress_percentage?: number;
  progress_items_processed?: number;
  progress_total_items?: number;
  progress_current_item?: string;
  progress_estimated_time?: number;
  progress_details?: any;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onCreateSession }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [filePath, setFilePath] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const { toast } = useToast();
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPollingSessionId, setCurrentPollingSessionId] = useState<string | null>(null);

  const validateRepoUrl = (url: string): boolean => {
    const githubRepoPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+(?:\.git)?(?:\/.*)?$/;
    return githubRepoPattern.test(url.trim());
  };

  const getDisplayMessage = (currentProgress: ProgressState | null): string => {
    if (!currentProgress) return 'Initializing...';

    // Use backend message directly if it's specific and relevant
    if (currentProgress.message && 
        ['core_ready', 'issue_linking', 'cloning', 'initializing', 'warning_issue_rag_failed', 'ready', 'error'].includes(currentProgress.status)) {
      // Let backend messages for these specific statuses take precedence if they exist
      if (currentProgress.status === 'core_ready' && currentProgress.message.includes("Issue context loading")) return currentProgress.message;
      if (currentProgress.status === 'issue_linking') return currentProgress.message;
      if (currentProgress.status === 'warning_issue_rag_failed') return currentProgress.message;
      if (currentProgress.status === 'ready' && currentProgress.message) return currentProgress.message;
      if (currentProgress.status === 'error' && currentProgress.error) return currentProgress.error; // Show error message
    }
    
    // Fallback messages
    const repoId = currentProgress.owner && currentProgress.repo ? `${currentProgress.owner}/${currentProgress.repo}` : 'repository';
    switch (currentProgress.status) {
      case 'initializing': return 'Preparing repository setup...';
      case 'cloning': return `Cloning ${repoId}...`;
      case 'indexing': return `Indexing ${repoId}...`; // Added case for indexing
      case 'core_ready': return `Core context ready for ${repoId}. Linking issues...`;
      case 'issue_linking': return currentProgress.patch_linkage_message || `Linking issues & PRs for ${repoId}...`;
      case 'ready': return `Repository ${repoId} fully processed!`;
      case 'error': return currentProgress.error || 'Failed to initialize repository';
      case 'warning_issue_rag_failed': return `Core ready for ${repoId}. Issue context failed.`;
      default: return `Processing ${repoId} (${currentProgress.status})...`;
    }
  };
  
  // Effect to handle terminal states from polling
  useEffect(() => {
    if (progress && currentPollingSessionId && ['core_ready', 'ready', 'warning_issue_rag_failed', 'error'].includes(progress.status)) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }

      if (progress.status !== 'error') {
        enableAgenticMode(currentPollingSessionId)
          .catch(e => console.warn('Error enabling agentic mode:', e))
          .finally(() => {
            setTimeout(() => {
              onCreateSession(repoUrl, filePath, currentPollingSessionId);
              onClose();
            }, 500);
          });
      } else {
        setIsLoading(false); // Keep modal open on error
      }
      setCurrentPollingSessionId(null); // Reset polling session ID
    }
  }, [progress, currentPollingSessionId, repoUrl, filePath, onCreateSession, onClose]);

  // Effect for unmount cleanup
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);


  const pollSessionStatus = async (sessionId: string): Promise<void> => {
    setCurrentPollingSessionId(sessionId);
    let attempts = 0;
    const maxAttempts = 360; // Poll for up to 12 minutes (360 * 2s)

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current); // Clear any existing interval
    }
    
    intervalIdRef.current = setInterval(async () => {
      if (attempts >= maxAttempts) {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
        setProgress(prev => ({
          ...(prev || { status: 'timeout', message: 'Repository setup timed out.', error: undefined }),
          status: 'error',
          message: 'Repository initialization timed out.',
          error: 'Please try again. If the issue persists, the repository might be too large or there could be a network problem.'
        }));
        setIsLoading(false);
        setCurrentPollingSessionId(null);
        return;
      }

      try {
        const statusDataFromApi = await getSessionStatus(sessionId);
        const sessionMetadata = (statusDataFromApi as any).metadata || {};
        const repoInfo = statusDataFromApi.repo_info || {};

        setProgress(prevProgress => {
          const statusFromServer = statusDataFromApi.status || 'unknown';
          const currentFrontendStatusInCallback = prevProgress?.status;

          const effectiveStatus = (currentFrontendStatusInCallback === 'cloning' && statusFromServer === 'initializing')
                                  ? 'cloning'
                                  : statusFromServer;

          const newResolvedProgressState: ProgressState = {
            status: effectiveStatus,
            message: '', // Will be set by getDisplayMessage
            error: statusDataFromApi.error || sessionMetadata.error,
            owner: sessionMetadata.owner || repoInfo.owner,
            repo: sessionMetadata.repo || repoInfo.repo,
            patch_linkage_status: sessionMetadata.patch_linkage_status,
            patch_linkage_message: sessionMetadata.patch_linkage_message,
            patch_linkage_progress: sessionMetadata.patch_linkage_progress,
            progress_stage: sessionMetadata.progress_stage,
            progress_step: sessionMetadata.progress_step,
            progress_percentage: sessionMetadata.progress_percentage,
            progress_items_processed: sessionMetadata.progress_items_processed,
            progress_total_items: sessionMetadata.progress_total_items,
            progress_current_item: sessionMetadata.progress_current_item,
            progress_estimated_time: sessionMetadata.progress_estimated_time,
            progress_details: sessionMetadata.progress_details,
          };
          newResolvedProgressState.message = getDisplayMessage(newResolvedProgressState);
          
          // The terminal state check is now handled by the useEffect hook watching 'progress'
          // If newResolvedProgressState.status is terminal, useEffect will clear the interval.
          return newResolvedProgressState;
        });
        attempts++;
      } catch (error) {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
        console.error('Error polling session status:', error);
        const pollErrorMsg = error instanceof Error ? error.message : 'Unknown polling error';
        setProgress({
          status: 'error',
          message: 'Failed to check repository status.',
          error: pollErrorMsg
        });
        setIsLoading(false);
        setCurrentPollingSessionId(null);
      }
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      toast({ title: "Error", description: "Please enter a repository URL", variant: "destructive" });
      return;
    }
    if (!validateRepoUrl(repoUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid GitHub repository URL", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setProgress({ status: 'initializing', message: getDisplayMessage({ status: 'initializing', message: '' }) });

    try {
      const response = await createRepoSession({
        repo_url: repoUrl.trim(),
        initial_file: filePath.trim() || undefined,
        session_name: sessionName.trim() || undefined
      });
      
      // Update progress explicitly after session creation call
      const ownerFromMeta = response.repo_metadata?.owner;
      const repoFromMeta = response.repo_metadata?.repo;
      const initialCloningMessage = getDisplayMessage({
        status: 'cloning',
        message: '', // Message is determined by getDisplayMessage based on status
        owner: ownerFromMeta,
        repo: repoFromMeta
      });

      setProgress({
        status: 'cloning',
        message: initialCloningMessage,
        error: undefined, // Clear any previous error
        owner: ownerFromMeta,
        repo: repoFromMeta,
        // Initialize other progress fields to undefined or default
        patch_linkage_status: undefined,
        patch_linkage_message: undefined,
        patch_linkage_progress: undefined,
        progress_stage: undefined,
        progress_step: undefined,
        progress_percentage: undefined,
        progress_items_processed: undefined,
        progress_total_items: undefined,
        progress_current_item: undefined,
        progress_estimated_time: undefined,
        progress_details: undefined,
      });
      
      await pollSessionStatus(response.session_id);
    } catch (error) {
      console.error('Error creating repository session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during session creation';
      setProgress({ status: 'error', message: 'Failed to create repository session', error: errorMessage });
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading || (progress && ['error', 'core_ready', 'ready', 'warning_issue_rag_failed'].includes(progress.status))) {
      onClose();
    }
  };
  
  const isSubmitDisabled = isLoading && !(progress?.status === 'error');

  const renderStep = (label: string, currentMainStatus: string | undefined, activeStatuses: string[], completedStatuses: string[], iconOverride?: React.ReactNode) => {
    const isActive = currentMainStatus && activeStatuses.includes(currentMainStatus);
    const isCompleted = currentMainStatus && completedStatuses.includes(currentMainStatus);
    let color = 'bg-gray-600';
    if (isActive) color = 'bg-blue-400 animate-pulse';
    if (isCompleted) color = 'bg-green-400';
    
    let displayIcon = iconOverride;
    if (currentMainStatus === 'warning_issue_rag_failed' && label === "Issue Linking") {
        displayIcon = <AlertTriangle className="inline h-3 w-3 mr-1 text-yellow-400" />;
        color = 'bg-yellow-400'; // Show warning color for the dot too
    }


    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className={isCompleted ? 'text-green-400' : isActive ? 'text-blue-300' : 'text-gray-400'}>
          {displayIcon && React.isValidElement(displayIcon) ? React.cloneElement(displayIcon as React.ReactElement<{ className?: string }>, { className: `inline h-3 w-3 mr-1 ${ (currentMainStatus === 'warning_issue_rag_failed' && label === "Issue Linking") ? 'text-yellow-500' : ''}` }) : null}
          {label}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Github className="h-5 w-5 text-blue-400" />
            Start New Chat
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repoUrl" className="text-gray-300">GitHub Repository URL</Label>
            <Input id="repoUrl" type="url" placeholder="https://github.com/owner/repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" disabled={isLoading} required />
            <p className="text-xs text-gray-500">Enter any public GitHub repository URL</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filePath" className="text-gray-300">Initial File (Optional)</Label>
            <Input id="filePath" type="text" placeholder="src/components/Button.tsx" value={filePath} onChange={(e) => setFilePath(e.target.value)} className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" disabled={isLoading} />
            <p className="text-xs text-gray-500">Leave empty to chat with the entire repository</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessionName" className="text-gray-300">Session Name (Optional)</Label>
            <Input id="sessionName" type="text" placeholder="Custom session name" value={sessionName} onChange={(e) => setSessionName(e.target.value)} className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" disabled={isLoading} />
          </div>

          {progress && (
            <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className="flex items-center gap-3">
                {progress.status === 'error' ? <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  : (progress.status === 'ready' || progress.status === 'core_ready' || progress.status === 'warning_issue_rag_failed') ? <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  : <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{getDisplayMessage(progress)}</p>
                  {progress.error && progress.status === 'error' && <p className="text-xs text-red-400 mt-1">{progress.error}</p>}
                </div>
              </div>

              {/* Enhanced Progress Bar for Issue Linking */}
              {progress.status === 'issue_linking' && progress.progress_percentage !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{progress.progress_stage ? progress.progress_stage.replace('_', ' ') : 'Processing'}</span>
                    <span>{Math.round(progress.progress_percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0, progress.progress_percentage))}%` }}
                    />
                  </div>
                  {progress.progress_current_item && (
                    <div className="text-xs text-gray-400 truncate">
                      <span className="inline-block animate-pulse mr-1">•</span>
                      {progress.progress_current_item}
                    </div>
                  )}
                  {progress.progress_items_processed !== undefined && progress.progress_total_items !== undefined && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{progress.progress_items_processed} / {progress.progress_total_items} items</span>
                      {progress.progress_estimated_time && progress.progress_estimated_time > 0 && (
                        <span className="animate-pulse">
                          {progress.progress_estimated_time >= 60 
                            ? `~${Math.floor(progress.progress_estimated_time / 60)}m ${progress.progress_estimated_time % 60}s` 
                            : `~${progress.progress_estimated_time}s`} remaining
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {!progress.error && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mt-2 pl-1">
                  {renderStep("Clone", progress.status, 
                    ["initializing", "cloning"], 
                    ["indexing", "core_ready", "issue_linking", "ready", "warning_issue_rag_failed"]
                  )}
                  {renderStep("Core Index", progress.status, 
                    ["cloning", "indexing"], 
                    ["core_ready", "issue_linking", "ready", "warning_issue_rag_failed"]
                  )}
                  {renderStep("Chat Ready", progress.status, 
                    ["core_ready"], // Active when core is ready but not yet linking or fully ready
                    ["linking_issues", "ready", "warning_issue_rag_failed"]
                  )}
                  {renderStep("Issue Linking", progress.status, 
                    ["linking_issues", ...(progress.status === 'core_ready' && progress.patch_linkage_status === 'in_progress' ? ['core_ready'] : [])], 
                    ["ready", "warning_issue_rag_failed"], // Completed if ready or warning (linking attempted)
                    (progress.status === 'warning_issue_rag_failed') ? <AlertTriangle /> : undefined
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} 
              disabled={isLoading && !['error', 'core_ready', 'ready', 'warning_issue_rag_failed'].includes(progress?.status || '')}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
              {(isLoading && !['error', 'core_ready', 'ready', 'warning_issue_rag_failed'].includes(progress?.status || '')) ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (['core_ready', 'ready', 'warning_issue_rag_failed'].includes(progress?.status || '')) ? (
                'Open Chat'
              ) : (
                'Start Chat'
              )}
            </Button>
          </div>
        </form>

        <div className="border-t border-gray-700 pt-4 mt-4">
          <p className="text-xs text-gray-500 text-center">
            Examples: <br />
            <span className="text-blue-400">https://github.com/facebook/react</span><br />
            <span className="text-blue-400">https://github.com/vercel/next.js</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal;
