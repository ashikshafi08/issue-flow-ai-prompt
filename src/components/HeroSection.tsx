
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
import { ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createChatSession } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [issueUrl, setIssueUrl] = useState("");
  const [promptType, setPromptType] = useState("explain");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
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
    setResult(null);
    
    try {
      const { session_id, initial_message } = await createChatSession(issueUrl, promptType);
      
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
    <section className="pt-24 md:pt-28 pb-12 md:pb-20 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 right-[10%] w-60 md:w-96 h-60 md:h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-20 left-[5%] w-60 md:w-80 h-60 md:h-80 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMzQjgyRjYiIGZpbGwtb3BhY2l0eT0iLjAzIiBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTJoLTJ2LTJoMnYyem0tMi0yaC0ydjJoMnYtMnptMi0yaC0ydjJoMnYtMnoiLz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6 md:space-y-10">
          <div className={`space-y-3 md:space-y-4 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm">
              File-aware • RAG-enhanced • Session memory
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter px-1">
              Chat with Your <span className="text-gradient">Repo</span>. Debug, Fix, and Understand Issues — Fast.
            </h1>
            <p className="max-w-[700px] text-muted-foreground mx-auto text-sm sm:text-base md:text-lg px-2">
              <span className="highlight-text">triage.flow</span> gives you a file-aware, RAG-enhanced coding assistant that understands your GitHub issues and codebase contextually — in real time.
            </p>
          </div>
          
          <div className={`w-full max-w-xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <form onSubmit={handleSubmit} className="glass-card p-4 md:p-6 shadow-lg">
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1 md:space-y-2">
                  <label htmlFor="issueUrl" className="text-xs md:text-sm font-medium text-left block text-blue-300">
                    GitHub Issue URL or Repository
                  </label>
                  <Input
                    id="issueUrl"
                    type="url" 
                    placeholder="https://github.com/org/repo/issues/123"
                    value={issueUrl}
                    onChange={(e) => setIssueUrl(e.target.value)}
                    className="w-full bg-[rgba(30,41,59,0.5)] border-blue-500/20 focus:border-blue-500/50 focus:ring-blue-500/30 text-sm md:text-base"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className={`w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all text-sm md:text-base py-3`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      Setting up chat...
                    </>
                  ) : (
                    <>
                      Start Chatting <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className={`w-full max-w-4xl mx-auto glass-card p-3 md:p-4 shadow-lg transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center gap-2 mb-1 md:mb-2 text-xs md:text-sm text-blue-300">
              <div className="flex gap-1">
                <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-red-500/80"></div>
                <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-yellow-500/80"></div>
                <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-green-500/80"></div>
              </div>
              <span>Live Chat Preview</span>
            </div>
            <div className="font-code bg-[rgba(15,23,42,0.6)] text-xs md:text-sm text-left overflow-x-auto p-3 md:p-6 rounded">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                  <p className="text-blue-300">Building repo index...</p>
                </div>
              ) : error ? (
                <div className="text-red-400">
                  <div className="font-semibold mb-2">// Error</div>
                  <p>{error}</p>
                </div>
              ) : result ? (
                <pre className="whitespace-pre-wrap text-gray-300">{result}</pre>
              ) : (
                <>
                  <div className="text-blue-400 font-semibold mb-2">// Ask something like:</div>
                  <p className="text-green-400 mb-3">
                    <span className="text-yellow-400">@utils/logger.ts</span> why is this panic triggered?
                  </p>
                  <p className="text-green-400 mb-3">
                    What do I need to fix issue <span className="text-blue-400">#1234</span>?
                  </p>
                  <p className="text-green-400 mb-3">
                    <span className="text-yellow-400">@src/components/Modal.tsx</span> — how does close animation work?
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <div className="text-blue-400 font-semibold mb-2">// AI Response with File Context</div>
                    <p className="text-gray-300">
                      Found function <span className="text-yellow-400">`handleClose()`</span> in Modal.tsx, line 48–62
                    </p>
                    <p className="text-gray-300 mt-2">
                      This function triggers <span className="text-green-400">`setVisible(false)`</span> which starts the fade-out animation using Framer Motion.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
