
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronRight, Loader2, Sparkles, Zap, Code2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createChatSession } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [issueUrl, setIssueUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueUrl.trim()) return;
    
    setIsLoading(true);
    
    try {
      const { session_id, initial_message } = await createChatSession(issueUrl, "explain");
      
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Chat session created successfully!",
      });
      navigate(`/chat/${session_id}`, { state: { initialMessage: initial_message } });

    } catch (error) {
      console.error('Error creating chat session:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to start processing",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="pt-20 md:pt-24 pb-16 md:pb-20 overflow-hidden relative min-h-screen flex items-center">
      {/* Optimized background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-[10%] w-48 md:w-72 h-48 md:h-72 rounded-full bg-gray-500/5 blur-3xl"></div>
        <div className="absolute bottom-1/4 left-[5%] w-40 md:w-64 h-40 md:h-64 rounded-full bg-gray-400/5 blur-3xl"></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10 w-full">
        <div className="flex flex-col items-center text-center space-y-8 md:space-y-12 max-w-5xl mx-auto">
          {/* Hero content */}
          <div className={`space-y-4 md:space-y-6 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="outline" className="border-gray-500/30 bg-gray-500/10 text-gray-300 font-medium px-3 py-1.5 rounded-full text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Agentic Chat • Smart File Explorer • Live Reasoning
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Your AI Repo Assistant
              <br />
              <span className="text-gradient bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent">
                Understand Any Codebase
              </span>
            </h1>
            
            <p className="max-w-3xl text-muted-foreground mx-auto text-lg md:text-xl leading-relaxed">
              Ask anything about your repo—architecture, bugs, PRs, code patterns—and get deep, actionable answers with live reasoning and smart file exploration.
            </p>
          </div>

          {/* Feature highlights */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <div className="glass-card p-4 md:p-6 text-center">
              <Code2 className="h-8 w-8 mx-auto mb-3 text-gray-400" />
              <h3 className="font-semibold mb-2 text-white">AI Agentic Chat</h3>
              <p className="text-sm text-gray-400">Deep, actionable answers about your codebase</p>
            </div>
            <div className="glass-card p-4 md:p-6 text-center">
              <Zap className="h-8 w-8 mx-auto mb-3 text-gray-400" />
              <h3 className="font-semibold mb-2 text-white">Live Reasoning</h3>
              <p className="text-sm text-gray-400">Watch the AI think, plan, and act in real time</p>
            </div>
            <div className="glass-card p-4 md:p-6 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-3 text-gray-400" />
              <h3 className="font-semibold mb-2 text-white">Modern UI</h3>
              <p className="text-sm text-gray-400">Beautiful, responsive, works on any repo size</p>
            </div>
          </div>
          
          {/* CTA Form */}
          <div className={`w-full max-w-2xl mx-auto transition-all duration-700 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 shadow-2xl">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="issueUrl" className="text-sm font-medium text-left block text-gray-300">
                    GitHub Issue URL or Repository
                  </label>
                  <Input
                    id="issueUrl"
                    type="url" 
                    placeholder="https://github.com/org/repo/issues/123"
                    value={issueUrl}
                    onChange={(e) => setIssueUrl(e.target.value)}
                    className="w-full bg-[rgba(30,41,59,0.5)] border-gray-500/20 focus:border-gray-500/50 focus:ring-gray-500/30 text-base"
                    required
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-gray-500/20 hover:shadow-gray-500/40 transition-all py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Setting up chat...
                      </>
                    ) : (
                      <>
                        Start AI Chat <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => navigate('/assistant')}
                    variant="outline"
                    className="px-6 py-3 border-gray-500/30 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 hover:border-gray-500/50 transition-all"
                  >
                    Launch Assistant ↗
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Demo preview */}
          <div className={`w-full max-w-4xl mx-auto transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <div className="glass-card p-4 md:p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                </div>
                <span>Live AI Assistant</span>
                <div className="ml-auto text-xs">
                  Use <code className="bg-gray-900/50 px-1 py-0.5 rounded">@filename</code> to scope questions
                </div>
              </div>
              <div className="font-code bg-[rgba(15,23,42,0.8)] text-sm text-left overflow-x-auto p-4 md:p-6 rounded-lg">
                <div className="text-gray-400 font-semibold mb-3">// Ask anything about your codebase:</div>
                <p className="text-green-400 mb-2">
                  <span className="text-yellow-400">@utils/logger.ts</span> why is this error happening?
                </p>
                <p className="text-green-400 mb-2">
                  What files should I check for issue <span className="text-blue-400">#1234</span>?
                </p>
                <p className="text-green-400 mb-4">
                  How does the authentication flow work?
                </p>
                <div className="border-t border-gray-700 pt-3">
                  <div className="text-gray-400 font-semibold mb-2">// AI Response with Live Reasoning</div>
                  <p className="text-gray-300">
                    🔍 Analyzing authentication flow across 4 files...
                  </p>
                  <p className="text-gray-300 mt-1">
                    Found issue in <span className="text-yellow-400">`auth.middleware.ts`</span> line 23 - token validation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
