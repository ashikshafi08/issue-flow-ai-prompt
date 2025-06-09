import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Bug, 
  FileText, 
  GitCommit, 
  User, 
  Calendar, 
  ExternalLink,
  Loader2,
  Plus,
  X
} from 'lucide-react';
import type { TimelineCommit } from './TimelineScrubber';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  commit: TimelineCommit | null;
  filePath: string;
  sessionId: string;
  onIssueCreated?: (issueUrl: string) => void;
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  commit,
  filePath,
  sessionId,
  onIssueCreated
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    nextSteps: '',
    labels: [] as string[]
  });
  const [newLabel, setNewLabel] = useState('');
  const { toast } = useToast();

  // Initialize form with commit data
  React.useEffect(() => {
    if (commit && isOpen) {
      setFormData({
        title: `Investigation: ${filePath} changes in ${commit.sha.substring(0, 8)}`,
        description: `Investigating changes made to \`${filePath}\` in commit ${commit.sha.substring(0, 8)}.

**Commit Details:**
- Message: ${commit.message}
- Author: ${commit.author}
- Date: ${new Date(commit.ts).toLocaleDateString()}
- Changes: +${commit.loc_added} -${commit.loc_removed}
${commit.pr_number ? `- PR: #${commit.pr_number}` : ''}

**Context:**
This investigation was triggered by timeline analysis showing significant changes in this commit.`,
        nextSteps: `1. Review the changes made in commit ${commit.sha.substring(0, 8)}
2. Analyze the impact of these changes on the codebase
3. Determine if the changes introduced any issues or regressions
4. Check if additional testing or validation is needed
5. Document findings and any necessary follow-up actions`,
        labels: ['investigation', 'timeline-generated']
      });
    }
  }, [commit, filePath, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commit) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/timeline/create-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          commit_sha: commit.sha,
          file_path: filePath,
          title: formData.title,
          description: formData.description,
          next_steps: formData.nextSteps,
          author: commit.author,
          date: commit.ts,
          labels: formData.labels
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "Issue Created Successfully!",
        description: "Your investigation issue has been created on GitHub.",
      });

      onIssueCreated?.(result.url);
      onClose();
      
    } catch (error) {
      console.error('Error creating issue:', error);
      toast({
        title: "Failed to Create Issue",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, newLabel.trim()]
      }));
      setNewLabel('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      addLabel();
    }
  };

  if (!commit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bug className="w-5 h-5" />
            <span>Create Investigation Issue</span>
          </DialogTitle>
          <DialogDescription>
            Create a GitHub issue to track your investigation of this commit
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Commit Context Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border"
          >
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <GitCommit className="w-4 h-4" />
              <span>Commit Context</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">File:</span>
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                    {filePath}
                  </code>
                </div>
                
                <div className="flex items-center space-x-2">
                  <GitCommit className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Commit:</span>
                  <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                    {commit.sha.substring(0, 8)}
                  </code>
                </div>

                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Author:</span>
                  <span>{commit.author}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{new Date(commit.ts).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-medium">Changes:</span>
                  <span className="text-green-600">+{commit.loc_added}</span>
                  <span className="text-red-600">-{commit.loc_removed}</span>
                </div>

                {commit.pr_number && (
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">PR:</span>
                    <Badge variant="outline">#{commit.pr_number}</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3">
              <span className="font-medium">Message:</span>
              <div className="text-sm text-muted-foreground mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                {commit.message}
              </div>
            </div>
          </motion.div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter issue title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the investigation context..."
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextSteps">Next Steps</Label>
              <Textarea
                id="nextSteps"
                value={formData.nextSteps}
                onChange={(e) => setFormData(prev => ({ ...prev, nextSteps: e.target.value }))}
                placeholder="What should be investigated next?"
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="flex items-center space-x-1">
                    <span>{label}</span>
                    <button
                      type="button"
                      onClick={() => removeLabel(label)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add label..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLabel}
                  disabled={!newLabel.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4 mr-2" />
                  Create Issue
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIssueModal; 