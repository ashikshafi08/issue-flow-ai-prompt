
import React from "react";
import { Button } from "@/components/ui/button";
import { Github, Code } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%233b82f6%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="glass-card p-8 md:p-12 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">Turn GitHub issues into LLM-ready prompts with deep repo context</h2>
            <p className="max-w-[700px] text-muted-foreground mx-auto">
              AI-powered GitHub Issue Context & Prompt Generator with RAG and Multi-Model LLM Support
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
