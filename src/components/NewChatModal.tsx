import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Github, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createRepoSession, getSessionStatus, enableAgenticMode } from '@/lib/api';

interface NewChatModalProps {
  onClose: () => void;
  onCreateSession: (repoUrl: string, filePath?: string, newSessionId?: string) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onCreateSession }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [filePath, setFilePath] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{
    status: string;
    message: string;
    error?: string;
  } | null>(null);
  const { toast } = useToast();

  const validateRepoUrl = (url: string): boolean => {
    const githubRepoPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+(?:\.git)?(?:\/.*)?$/;
    return githubRepoPattern.test(url.trim());
  };

  const pollSessionStatus = async (sessionId: string): Promise<void> => {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max wait time
    
    while (attempts < maxAttempts) {
      try {
        const status = await getSessionStatus(sessionId);
        
        setProgress({
          status: status.status,
          message: getStatusMessage(status.status),
          error: status.error
        });

        if (status.status === 'ready') {
          try {
            await enableAgenticMode(sessionId);
          } catch (e) {
            console.warn('Failed to enable agentic mode:', e);
          }
          setTimeout(() => {
            onCreateSession(repoUrl, filePath, sessionId); // Pass sessionId here
            onClose();
          }, 1000);
          return;
        } else if (status.status === 'error') {
          throw new Error(status.error || 'Repository initialization failed');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.error('Error polling session status:', error);
        setProgress({
          status: 'error',
          message: 'Failed to check repository status',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        break;
      }
    }

    if (attempts >= maxAttempts) {
      setProgress({
        status: 'error',
        message: 'Repository initialization timed out',
        error: 'Please try again with a smaller repository'
      });
    }
  };

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case 'initializing':
        return 'Preparing to clone repository...';
      case 'cloning':
        return 'Cloning repository from GitHub...';
      case 'indexing':
        return 'Building search index...';
      case 'ready':
        return 'Repository ready! Starting chat...';
      case 'error':
        return 'Failed to initialize repository';
      default:
        return 'Processing repository...';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a repository URL",
        variant: "destructive",
      });
      return;
    }

    if (!validateRepoUrl(repoUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid GitHub repository URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress({
      status: 'initializing',
      message: 'Starting repository setup...'
    });

    try {
      const response = await createRepoSession({
        repo_url: repoUrl.trim(),
        initial_file: filePath.trim() || undefined,
        session_name: sessionName.trim() || undefined
      });

      toast({
        title: "Repository Session Created",
        description: "Cloning and indexing repository...",
      });

      await pollSessionStatus(response.session_id);

    } catch (error) {
      console.error('Error creating repository session:', error);
      
      setProgress({
        status: 'error',
        message: 'Failed to create repository session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create repository session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
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
            <Label htmlFor="repoUrl" className="text-gray-300">
              GitHub Repository URL
            </Label>
            <Input
              id="repoUrl"
              type="url"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500">
              Enter any public GitHub repository URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filePath" className="text-gray-300">
              Initial File (Optional)
            </Label>
            <Input
              id="filePath"
              type="text"
              placeholder="src/components/Button.tsx"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Leave empty to chat with the entire repository
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionName" className="text-gray-300">
              Session Name (Optional)
            </Label>
            <Input
              id="sessionName"
              type="text"
              placeholder="Custom session name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              disabled={isLoading}
            />
          </div>

          {progress && (
            <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className="flex items-center gap-3">
                {progress.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                ) : progress.status === 'ready' ? (
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                ) : (
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {progress.message}
                  </p>
                  {progress.error && (
                    <p className="text-xs text-red-400 mt-1">
                      {progress.error}
                    </p>
                  )}
                </div>
              </div>
              
              {!progress.error && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${
                    ['cloning', 'indexing', 'ready'].includes(progress.status) 
                      ? 'bg-green-400' 
                      : progress.status === 'initializing' 
                        ? 'bg-blue-400 animate-pulse' 
                        : 'bg-gray-600'
                  }`} />
                  <span>Clone</span>
                  
                  <div className={`w-2 h-2 rounded-full ${
                    ['indexing', 'ready'].includes(progress.status) 
                      ? 'bg-green-400' 
                      : progress.status === 'cloning' 
                        ? 'bg-blue-400 animate-pulse' 
                        : 'bg-gray-600'
                  }`} />
                  <span>Index</span>
                  
                  <div className={`w-2 h-2 rounded-full ${
                    progress.status === 'ready' 
                      ? 'bg-green-400' 
                      : ['cloning', 'indexing'].includes(progress.status)
                        ? 'bg-blue-400 animate-pulse' 
                        : 'bg-gray-600'
                  }`} />
                  <span>Ready</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || progress?.status === 'ready'}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : progress?.status === 'ready' ? (
                'Starting Chat...'
              ) : (
                'Start Chat'
              )}
            </Button>
          </div>
        </form>

        <div className="border-t border-gray-700 pt-4 mt-4">
          <p className="text-xs text-gray-500 text-center">
            Examples: 
            <br />
            <span className="text-blue-400">https://github.com/facebook/react</span>
            <br />
            <span className="text-blue-400">https://github.com/vercel/next.js</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal;
