
import React, { useState } from 'react';
import { X, Github, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewChatModalProps {
  onClose: () => void;
  onCreateSession: (repoUrl: string, filePath?: string) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onCreateSession }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [filePath, setFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsLoading(true);
    try {
      // Basic URL validation
      const url = repoUrl.trim();
      if (!url.includes('github.com') && !url.startsWith('http')) {
        throw new Error('Please enter a valid GitHub repository URL');
      }

      onCreateSession(url, filePath.trim() || undefined);
    } catch (error) {
      console.error('Error creating session:', error);
      alert(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Start New Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-300 mb-2">
              <Github className="inline h-4 w-4 mr-1" />
              GitHub Repository URL
            </label>
            <Input
              id="repoUrl"
              type="url"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="filePath" className="block text-sm font-medium text-gray-300 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Initial File (Optional)
            </label>
            <Input
              id="filePath"
              type="text"
              placeholder="src/components/Button.tsx"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to chat with the entire repository
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !repoUrl.trim()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {isLoading ? 'Creating...' : 'Start Chat'}
            </Button>
          </div>
        </form>

        {/* Examples */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-2">Examples:</p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setRepoUrl('https://github.com/facebook/react')}
              className="text-xs text-blue-400 hover:text-blue-300 block"
            >
              https://github.com/facebook/react
            </button>
            <button
              type="button"
              onClick={() => setRepoUrl('https://github.com/vercel/next.js')}
              className="text-xs text-blue-400 hover:text-blue-300 block"
            >
              https://github.com/vercel/next.js
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
