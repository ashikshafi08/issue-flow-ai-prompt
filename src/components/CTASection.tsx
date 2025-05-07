
import React from "react";
import { Button } from "@/components/ui/button";
import { Github, Code } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%233b82f6\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="glass-card p-8 md:p-12 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">Ready to supercharge your GitHub workflow?</h2>
            <p className="max-w-[700px] text-muted-foreground mx-auto">
              Save time on issue triage and get deep, context-aware prompts for 20+ programming languages with triage.flow
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center gap-2">
              <Code className="h-5 w-5" />
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 text-blue-400 flex items-center gap-2">
              <Github className="h-5 w-5" />
              View on GitHub
            </Button>
          </div>
          
          <div className="mt-8 border-t border-blue-500/20 pt-8">
            <h3 className="text-xl font-semibold text-center mb-4">Coming Soon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-2">MCP Server</h4>
                <p className="text-sm text-muted-foreground">Expose repo context, vector index, and prompt/LLM APIs for agentic workflows</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-2">Custom Prompt Types</h4>
                <p className="text-sm text-muted-foreground">Easily add new prompt types or LLM actions</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-2">Code Actions</h4>
                <p className="text-sm text-muted-foreground">Suggest, review, or apply code changes via API</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-2">Session Management</h4>
                <p className="text-sm text-muted-foreground">Multi-user and agent support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
