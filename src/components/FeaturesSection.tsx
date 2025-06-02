
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Code, 
  Database, 
  FileSearch, 
  Globe, 
  MessageSquare, 
  Terminal 
} from "lucide-react";

const features = [
  {
    title: "Multi-Language Support",
    description: "Supports 20+ languages with language-aware parsing and semantic chunking.",
    icon: <Globe className="h-10 w-10 text-blue-400" />,
    highlight: "Language-aware parsing"
  },
  {
    title: "Local-First Repo Analysis",
    description: "Local-first, session-aware repo embedding. No rate limits. Always up-to-date.",
    icon: <FileSearch className="h-10 w-10 text-blue-400" />,
    highlight: "Session-aware embedding"
  },
  {
    title: "Hybrid RAG Engine",
    description: "FAISS + BM25 with LLM reranking. Built for precise issue resolution.",
    icon: <Database className="h-10 w-10 text-blue-400" />,
    highlight: "FAISS + BM25 + reranking"
  },
  {
    title: "Multi-Provider LLM Support",
    description: "Plug into OpenAI, Claude, Mistral, or any LLM via OpenRouter or API keys.",
    icon: <Terminal className="h-10 w-10 text-blue-400" />,
    highlight: "OpenRouter compatible"
  },
  {
    title: "Full Discussion Context",
    description: "Parse GitHub issues, comments, and references for complete discussion context.",
    icon: <MessageSquare className="h-10 w-10 text-blue-400" />,
    highlight: "Issues + comments + refs"
  },
  {
    title: "File-Aware Chat",
    description: "Use @file to scope questions to exact files or functions, and get accurate, grounded answers.",
    icon: <Code className="h-10 w-10 text-blue-400" />,
    highlight: "@file scoped queries"
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMzQjgyRjYiIGZpbGwtb3BhY2l0eT0iLjAzIiBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTJoLTJ2LTJoMnYyem0tMi0yaC0ydjJoMnYtMnptMi0yaC0ydjJoMnYtMnoiLz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 inline-block border border-blue-500/20">
            Features
          </span>
          <h2 className="text-4xl font-bold tracking-tighter mb-4">Powerful Repo-Grounded AI Assistant</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Save time on issue triage with file-aware chat, hybrid RAG retrieval, and session memory for continuous understanding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="feature-card border-blue-500/10 hover:border-blue-500/30 overflow-hidden backdrop-blur-lg"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/5 -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors"></div>
              
              <CardHeader className="pb-2 relative z-10">
                <div className="mb-6 p-3 rounded-lg bg-blue-500/10 w-fit group-hover:bg-blue-500/15 transition-colors border border-blue-500/20">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-white">{feature.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <div className="bg-blue-500/10 text-blue-300 text-sm px-3 py-1 rounded-full inline-block border border-blue-500/20">
                  {feature.highlight}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto p-6 border border-dashed border-blue-500/30 rounded-lg glass-card">
            <h3 className="text-xl font-semibold mb-3 text-white">Who is triage.flow for?</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-300">Open source maintainers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-300">Devs triaging issues in large unfamiliar codebases</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-300">AI agents that need code context</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-300">Product engineers needing fast issue understanding</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-300">LLM app builders looking for precise repo retrieval</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
