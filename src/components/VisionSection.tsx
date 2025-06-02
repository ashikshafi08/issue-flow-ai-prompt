
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const VisionSection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMzQjgyRjYiIGZpbGwtb3BhY2l0eT0iLjAzIiBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTJoLTJ2LTJoMnYyem0tMi0yaC0ydjJoMnYtMnptMi0yaC0ydjJoMnYtMnoiLz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 inline-block border border-blue-500/20">
            Vision
          </span>
          <h2 className="text-3xl font-bold tracking-tighter mb-4">Why Now? The AI-Native Repository Layer</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="glass-card border-red-500/20 hover:border-red-500/40 transition-colors">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-red-400 font-bold text-lg">⚠️</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-3 text-red-300">The Problem</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                GitHub Issues lack structured, actionable, contextual AI support. Developers waste hours understanding unfamiliar codebases and triaging issues without proper context.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-blue-400 font-bold text-lg">💡</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-3 text-blue-300">The Solution</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                <span className="text-blue-400 font-medium">triage.flow</span> turns any codebase into an AI-chat-ready system with local vector search, hybrid retrieval, and file-aware prompting.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-green-500/20 hover:border-green-500/40 transition-colors">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-green-400 font-bold text-lg">🚀</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-3 text-green-300">The Future</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                AI-native repos will be continuously searchable, explainable, and self-maintaining — <span className="text-green-400 font-medium">triage.flow</span> is building that layer.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <div className="max-w-3xl mx-auto p-8 border border-dashed border-blue-500/30 rounded-lg glass-card">
            <h3 className="text-2xl font-semibold mb-6 text-white">Coming Soon: Repo Agent API</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="text-lg font-medium text-blue-300 mb-3">🔌 Agent Framework Integration</h4>
                <p className="text-gray-300 text-sm">
                  Expose vector search, prompt generation, and file memory context as API endpoints. For use in agent frameworks like smol, E2B, LangGraph.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium text-green-300 mb-3">⚡ Code Actions</h4>
                <p className="text-gray-300 text-sm">
                  Run AI-suggested fixes, tests, or refactorings automatically. Controlled, testable code edits with proper review flows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisionSection;
