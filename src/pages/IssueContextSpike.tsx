import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

// Define interfaces for the API response (mirroring backend Pydantic models)
interface IssueDoc {
  id: number;
  title: string;
  state: string;
  labels: string[];
  patch_url?: string;
  // Add other fields from IssueDoc if needed for display
}

interface PatchDoc {
  pr_number: number;
  issue_id: number;
  files_changed: string[];
  diff_summary: string;
  // Add other fields from DiffDoc if needed
}

interface IssueSearchResult {
  issue: IssueDoc;
  similarity: number;
}

interface PatchSearchResult {
  patch: PatchDoc;
  similarity: number;
}

interface IssueContextApiResponse {
  related_issues: IssueSearchResult[];
  patches?: PatchSearchResult[] | null; // Patches can be null or undefined
  total_found: number;
  query_analysis: Record<string, any>;
  processing_time: number;
}

const IssueContextSpike: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState<string>('https://github.com/facebook/react');
  const [query, setQuery] = useState<string>('fix hooks bug');
  const [results, setResults] = useState<IssueContextApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/v1/issue_context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          query: query,
          max_issues: 5, // Requesting top 5 issues
          include_patches: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: IssueContextApiResponse = await response.json();
      setResults(data);
      toast.success(`Found ${data.total_found} items in ${data.processing_time.toFixed(2)}s`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Search failed: ${errorMessage}`);
      console.error("API call failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPatchesForIssue = (issueId: number): PatchSearchResult[] => {
    if (!results || !results.patches) {
      return [];
    }
    return results.patches.filter(p => p.patch.issue_id === issueId);
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-200">Issue Context Spike UI</h1>
        <p className="text-gray-400">Test the /api/v1/issue_context endpoint.</p>
      </header>

      <Card className="mb-8 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-200">Search Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-300 mb-1">
                Repository URL
              </label>
              <Input
                id="repoUrl"
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="e.g., https://github.com/owner/repo"
                className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                required
              />
            </div>
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-300 mb-1">
                Query
              </label>
              <Input
                id="query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., fix login bug"
                className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-4 bg-red-900 border-red-700">
          <CardHeader>
            <CardTitle className="text-red-200">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-200">
              Search Results ({results.total_found} items found in {results.processing_time.toFixed(2)}s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold mb-2 text-gray-300">Related Issues:</h3>
            {results.related_issues.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {results.related_issues.map((item, index) => {
                  const issuePatches = getPatchesForIssue(item.issue.id);
                  return (
                    <AccordionItem value={`issue-${index}`} key={item.issue.id} className="border-gray-700">
                      <AccordionTrigger className="text-gray-300 hover:text-blue-400">
                        <div className="flex justify-between w-full pr-2">
                          <span>#{item.issue.id}: {item.issue.title}</span>
                          <span className="text-sm text-gray-400">Similarity: {item.similarity.toFixed(3)}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-gray-750 p-4 rounded-md">
                        <p className="text-sm text-gray-400 mb-1">State: {item.issue.state}</p>
                        <p className="text-sm text-gray-400 mb-3">Labels: {item.issue.labels.join(', ') || 'None'}</p>
                        
                        {item.issue.patch_url && (
                           <p className="text-sm text-gray-400 mb-1">
                             Main Patch URL: <a href={item.issue.patch_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{item.issue.patch_url}</a>
                           </p>
                        )}

                        {issuePatches.length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold mt-3 mb-1 text-gray-300">Linked Patches ({issuePatches.length}):</h4>
                            <Accordion type="multiple" className="w-full space-y-1">
                              {issuePatches.map((patchResult, pIndex) => (
                                <AccordionItem value={`patch-${index}-${pIndex}`} key={patchResult.patch.pr_number} className="border-gray-600 bg-gray-700 rounded">
                                  <AccordionTrigger className="text-sm text-gray-300 hover:text-blue-400 px-3 py-2">
                                    <div className="flex justify-between w-full">
                                      <span>PR #{patchResult.patch.pr_number} (Similarity: {patchResult.similarity.toFixed(3)})</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="bg-gray-650 p-3 rounded-b-md">
                                    <p className="text-xs text-gray-400 mb-1">Files: {patchResult.patch.files_changed.join(', ')}</p>
                                    <h5 className="text-xs font-semibold mt-2 mb-1 text-gray-300">Diff Summary (first ~20 lines):</h5>
                                    <pre className="text-xs text-gray-300 whitespace-pre-wrap bg-gray-800 p-2 rounded overflow-x-auto max-h-60">
                                      {patchResult.patch.diff_summary.split('\n').slice(0, 20).join('\n')}
                                    </pre>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </div>
                        )}
                        {issuePatches.length === 0 && !item.issue.patch_url && (
                            <p className="text-sm text-gray-500 italic">No specific patches found directly linked via this search for this issue.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <p className="text-gray-400">No related issues found.</p>
            )}
            
            {/* Optionally display raw query_analysis */}
            {/* <details className="mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer">Query Analysis (raw)</summary>
              <pre className="text-xs text-gray-400 bg-gray-700 p-2 rounded mt-1 whitespace-pre-wrap">
                {JSON.stringify(results.query_analysis, null, 2)}
              </pre>
            </details> */}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IssueContextSpike;
