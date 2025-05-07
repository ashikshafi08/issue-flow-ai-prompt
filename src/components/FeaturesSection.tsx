
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
    description: "Auto-detect and analyze 20+ programming languages from any repository.",
    icon: <Globe className="h-10 w-10 text-brand-purple" />,
    highlight: "20+ languages, auto-detected"
  },
  {
    title: "Local Repo Analysis",
    description: "Fast, privacy-friendly code analysis without API rate limits.",
    icon: <FileSearch className="h-10 w-10 text-brand-purple" />,
    highlight: "No API rate limits"
  },
  {
    title: "FAISS Vector Store",
    description: "Efficient, scalable code and document search using advanced vector embeddings.",
    icon: <Database className="h-10 w-10 text-brand-purple" />,
    highlight: "Efficient semantic search"
  },
  {
    title: "Multi-Provider LLM Support",
    description: "Use OpenAI, OpenRouter, Claude, Mistral, and more for your AI responses.",
    icon: <Terminal className="h-10 w-10 text-brand-purple" />,
    highlight: "Multiple AI providers"
  },
  {
    title: "Issue + Comments Extraction",
    description: "Full context from GitHub issues and all related discussions.",
    icon: <MessageSquare className="h-10 w-10 text-brand-purple" />,
    highlight: "Complete discussion context"
  },
  {
    title: "Contextual Prompt Generation",
    description: "Explain, fix, test, summarize, or customize your prompts based on real code.",
    icon: <Code className="h-10 w-10 text-brand-purple" />,
    highlight: "Customizable prompts"
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-accent relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-brand-purple"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-brand-blue"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="bg-brand-purple/10 text-brand-purple px-4 py-1.5 rounded-full text-sm font-medium mb-4 inline-block">
            Features
          </span>
          <h2 className="text-4xl font-bold tracking-tighter mb-4">Powerful GitHub Issue Analysis</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Save time on issue triage with powerful tools for understanding, analyzing, and responding to GitHub issues with AI-powered context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-card border hover:shadow-lg transition-all hover:border-brand-purple/40 group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand-purple/5 -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-purple/10 transition-colors"></div>
              
              <CardHeader className="pb-2 relative z-10">
                <div className="mb-6 p-2 rounded-lg bg-brand-purple/5 w-fit group-hover:bg-brand-purple/10 transition-colors">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <div className="bg-muted text-muted-foreground text-sm px-3 py-1 rounded-full inline-block">
                  {feature.highlight}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto p-6 border border-dashed border-brand-purple/30 rounded-lg bg-card">
            <h3 className="text-xl font-semibold mb-3">Who is triage.flow for?</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-purple"></span>
                <span>Open source maintainers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-purple"></span>
                <span>Contributors to unfamiliar codebases</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-purple"></span>
                <span>AI agents & automation bots</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-purple"></span>
                <span>GitHub issue workflow optimization</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
