
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [issueUrl, setIssueUrl] = useState("");
  const [promptType, setPromptType] = useState("explain");
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!issueUrl.trim()) return;
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  return (
    <section className="pt-28 pb-20 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Blue gradient orb top right */}
        <div className="absolute top-20 right-[10%] w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
        
        {/* Purple gradient orb bottom left */}
        <div className="absolute bottom-20 left-[5%] w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMzQjgyRjYiIGZpbGwtb3BhY2l0eT0iLjAzIiBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTJoLTJ2LTJoMnYyem0tMi0yaC0ydjJoMnYtMnptMi0yaC0ydjJoMnYtMnoiLz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-10">
          <div className={`space-y-4 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium px-3 py-1.5 rounded-full">
              AI-powered GitHub Issue Context & Prompt Generator with RAG
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Transform <span className="text-gradient">GitHub Issues</span> into AI-ready Prompts
            </h1>
            <p className="max-w-[700px] text-muted-foreground mx-auto text-lg">
              Instantly understand and triage GitHub issues with deep, code-aware context for 20+ programming languages.
            </p>
          </div>
          
          <div className={`w-full max-w-xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <form onSubmit={handleSubmit} className="glass-card p-6 shadow-lg">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="issueUrl" className="text-sm font-medium text-left block text-blue-300">
                    GitHub Issue URL
                  </label>
                  <Input
                    id="issueUrl"
                    type="url" 
                    placeholder="https://github.com/org/repo/issues/123"
                    value={issueUrl}
                    onChange={(e) => setIssueUrl(e.target.value)}
                    className="w-full bg-[rgba(30,41,59,0.5)] border-blue-500/20 focus:border-blue-500/50 focus:ring-blue-500/30"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="promptType" className="text-sm font-medium text-left block text-blue-300">
                    Prompt Type
                  </label>
                  <Select value={promptType} onValueChange={setPromptType}>
                    <SelectTrigger className="w-full bg-[rgba(30,41,59,0.5)] border-blue-500/20 focus:border-blue-500/50 focus:ring-blue-500/30">
                      <SelectValue placeholder="Select prompt type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[rgb(15,23,42)] border-blue-500/20">
                      <SelectItem value="explain">Explain</SelectItem>
                      <SelectItem value="fix">Fix</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="summarize">Summarize</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="submit" 
                  className={`w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all ${
                    isAnimating ? 'animate-pulse' : ''
                  }`}
                  disabled={isAnimating}
                >
                  Generate Prompt <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          <div className={`w-full max-w-4xl mx-auto glass-card p-4 shadow-lg transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center gap-2 mb-2 text-sm text-blue-300">
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
              </div>
              <span>Prompt Preview</span>
            </div>
            <div className="font-code bg-[rgba(15,23,42,0.6)] text-sm text-left overflow-x-auto p-6 rounded">
              <div className="text-blue-400 font-semibold mb-2">// Generated AI Prompt with RAG Context</div>
              <p className="text-gray-300 mb-3">
                Analyze the GitHub issue <span className="text-blue-400">#12345</span> regarding pagination in the API endpoints.
              </p>
              <p className="text-gray-300 mb-3">
                Based on the repository context:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-300">
                <li>The current pagination implementation in <span className="text-yellow-400">src/api/controllers/BaseController.ts</span> uses offset-based pagination.</li>
                <li>The reported issue describes cursor-based pagination as a preferred solution for performance.</li>
                <li>Relevant code sections show that changing to cursor-based pagination requires updates to the database queries and response format.</li>
              </ol>
              <p className="text-gray-300 mt-3">
                Please provide a detailed explanation of how to implement cursor-based pagination in this codebase, with code examples.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
