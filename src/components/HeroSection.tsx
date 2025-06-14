
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronRight, Loader2, Sparkles, Github } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createChatSession } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [issueUrl, setIssueUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueUrl.trim()) return;
    
    setIsLoading(true);
    setError("");
    
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
      setError(error instanceof Error ? error.message : 'Unknown error creating session');
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to start processing",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="pt-32 pb-20 overflow-hidden relative min-h-screen flex items-center">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 right-[10%] w-96 h-96 rounded-full bg-gray-500/5 blur-3xl"></div>
        <div className="absolute bottom-20 left-[5%] w-80 h-80 rounded-full bg-gray-600/5 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiM2NjY2NjYiIGZpbGwtb3BhY2l0eT0iLjAzIiBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTJoLTJ2LTJoMnYyem0tMi0yaC0ydjJoMnYtMnptMi0yaC0ydjJoMnYtMnoiLz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">
          <div className={`space-y-6 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="outline" className="border-gray-500/30 bg-gray-500/10 text-gray-300 font-medium px-4 py-2 rounded-full text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Code Intelligence
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Why <span className="text-gradient bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent">triage.flow</span>?
            </h1>
            
            <p className="max-w-3xl text-lg md:text-xl text-gray-400 leading-relaxed">
              Transform how you understand and debug code. Chat with your entire repository, 
              visualize changes, and get instant insights—all powered by AI that actually understands your codebase.
            </p>
          </div>

          {/* Key Benefits Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl transition-all duration-700 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <div className="glass-card p-6 text-left">
              <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Agentic Chat</h3>
              <p className="text-gray-400 text-sm">Ask anything about your repo—architecture, bugs, PRs, code patterns—and get deep, actionable answers.</p>
            </div>
            
            <div className="glass-card p-6 text-left">
              <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart File Explorer</h3>
              <p className="text-gray-400 text-sm">Instantly preview, search, and cross-link files and folders with intelligent code understanding.</p>
            </div>
            
            <div className="glass-card p-6 text-left">
              <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">PR & Diff Insights</h3>
              <p className="text-gray-400 text-sm">Visualize pull request changes and code diffs inline with context-aware analysis.</p>
            </div>
            
            <div className="glass-card p-6 text-left">
              <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Reasoning</h3>
              <p className="text-gray-400 text-sm">Watch the AI think, plan, and act in real time as it analyzes your code.</p>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className={`w-full max-w-2xl transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <form onSubmit={handleSubmit} className="glass-card p-6 shadow-xl" id="hero-form">
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
                    className="w-full bg-gray-900/50 border-gray-500/20 focus:border-gray-400/50 focus:ring-gray-400/30"
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Setting up chat...
                      </>
                    ) : (
                      <>
                        Start Chatting <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => navigate('/assistant')}
                    variant="outline"
                    className="px-6 border-gray-500/30 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 hover:border-gray-400/50 transition-all"
                  >
                    Try Assistant ↗
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Social Proof */}
          <div className={`text-center transition-all duration-700 delay-700 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <p className="text-gray-500 text-sm mb-4">Works with any repository, any size</p>
            <div className="flex items-center justify-center gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span className="text-sm">GitHub</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🚀</span>
                <span className="text-sm">Fast & Responsive</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🔒</span>
                <span className="text-sm">Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
