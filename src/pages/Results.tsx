import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
// import { getJobStatus } from "@/lib/api"; // Commented out: part of old flow
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

interface JobResult {
  status: string;
  result: string | null;
  error: string | null;
  progress_log: Array<string | { timestamp: string; message: string }>;
}

// Custom components for React Markdown
const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    return !inline && match ? (
      <SyntaxHighlighter
        style={atomDark}
        language={language}
        PreTag="div"
        showLineNumbers
        wrapLines
        wrapLongLines
        customStyle={{
          margin: '1rem 0',
          borderRadius: '0.5rem',
          background: 'rgba(15, 23, 42, 0.8)',
        }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className="bg-gray-800/50 px-2 py-1 rounded font-mono text-green-300" {...props}>
        {children}
      </code>
    );
  },
  h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-white my-4" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold text-blue-400 my-3" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold text-blue-300 my-2" {...props} />,
  h4: ({ node, ...props }: any) => <h4 className="text-md font-semibold text-yellow-400 my-2" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
  li: ({ node, ...props }: any) => <li className="text-gray-200 my-1" {...props} />,
  p: ({ node, ...props }: any) => <p className="text-gray-200 my-2 leading-relaxed" {...props} />,
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="border-l-4 border-blue-500/50 pl-4 italic text-gray-300 my-4" {...props} />
  ),
  a: ({ node, ...props }: any) => (
    <a className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-gray-700" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-gray-800/50" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-gray-700" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-gray-800/30" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-4 py-2 text-left text-sm font-medium text-gray-300" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-4 py-2 text-sm text-gray-200" {...props} />,
  pre: ({ node, ...props }: any) => <pre className="overflow-auto" {...props} />,
  hr: ({ node, ...props }: any) => <hr className="border-gray-700 my-4" {...props} />,
  img: ({ node, ...props }: any) => <img className="max-w-full h-auto rounded-lg my-4" {...props} />,
};

const Results = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [result, setResult] = useState<JobResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // The following logic is based on the old job polling mechanism
    // and getJobStatus, which has been removed from api.ts.
    // This page might need to be refactored or removed if it's
    // made redundant by the new /chat/:sessionId flow.
    // For now, just setting isLoading to false and showing a placeholder.
    setIsLoading(false);
    setResult({
      status: "info",
      result: "This page is for displaying job results. The chat functionality has moved to a new interactive session.",
      error: null,
      progress_log: []
    });
    // Original fetching and polling logic commented out:
    /*
    const fetchResult = async () => {
      if (!jobId) return;
      
      try {
        // const data = await getJobStatus(jobId); // getJobStatus is removed
        // setResult(data);
        setIsLoading(false); // Placeholder
      } catch (error) {
        console.error('Error fetching results:', error);
        toast({
          title: "Error",
          description: "Failed to fetch results. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchResult();
    
    const interval = setInterval(async () => {
      if (!jobId) return;
      
      try {
        // const data = await getJobStatus(jobId); // getJobStatus is removed
        // setResult(data);
        
        // if (data.status !== 'processing') {
        //   clearInterval(interval);
        //   setIsLoading(false);
        // }
      } catch (error) {
        console.error('Error polling job status:', error);
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 3000);

    return () => clearInterval(interval);
    */
  }, [jobId, toast]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 relative z-10">
        <Card className="glass-card p-6 shadow-lg border border-gray-700/50 bg-gradient-to-b from-gray-900/80 to-gray-950/90">
          <div className="flex items-center mb-6">
            <Link to="/">
              <Button variant="outline" className="mr-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Generated Prompt</h1>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
              <p className="text-blue-300">Processing your request...</p>
            </div>
          ) : !result ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-bold mb-4">No results found</h2>
              <p className="text-muted-foreground mb-6">The requested job could not be found or has expired.</p>
            </div>
          ) : result.status === 'failed' ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-400 mb-4">Processing Failed</h2>
              <p className="text-muted-foreground mb-4">{result.error || "An unknown error occurred"}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="prose prose-invert prose-sm max-w-none bg-[rgba(15,23,42,0.6)] p-6 rounded-lg border border-gray-700 shadow-md">
                {result.result && (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {result.result}
                  </ReactMarkdown>
                )}
              </div>
              
              {result.progress_log && result.progress_log.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3 text-blue-300">Processing Log</h3>
                  <div className="bg-[rgba(15,23,42,0.4)] rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-700/50">
                    <ul className="space-y-1">
                      {result.progress_log.map((log, index) => (
                        <li key={index} className="text-sm text-gray-300 py-1 border-b border-gray-700/30 last:border-0">
                          {typeof log === 'string' 
                            ? log 
                            : log.message ? log.message : JSON.stringify(log)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Results;
