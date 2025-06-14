
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, 
  Search, 
  GitPullRequest, 
  Brain, 
  Smartphone,
  Zap
} from "lucide-react";

const features = [
  {
    title: "AI Agentic Chat",
    description: "Ask anything about your repo—architecture, bugs, PRs, code patterns—and get deep, actionable answers.",
    icon: <MessageSquare className="h-8 w-8 text-gray-400" />,
    highlight: "Deep insights"
  },
  {
    title: "Smart File Explorer",
    description: "Instantly preview, search, and cross-link files and folders with intelligent context awareness.",
    icon: <Search className="h-8 w-8 text-gray-400" />,
    highlight: "Instant navigation"
  },
  {
    title: "PR & Diff Insights",
    description: "Visualize pull request changes and code diffs inline with smart analysis and suggestions.",
    icon: <GitPullRequest className="h-8 w-8 text-gray-400" />,
    highlight: "Visual diffs"
  },
  {
    title: "Live Reasoning",
    description: "Watch the AI think, plan, and act in real time. See the decision-making process unfold.",
    icon: <Brain className="h-8 w-8 text-gray-400" />,
    highlight: "Real-time thinking"
  },
  {
    title: "Modern UI",
    description: "Beautiful, responsive, and fast—works on any repo, any size. Optimized for mobile and desktop.",
    icon: <Smartphone className="h-8 w-8 text-gray-400" />,
    highlight: "Mobile-first design"
  },
  {
    title: "Lightning Fast",
    description: "Optimized performance with <3s load times, smooth animations, and 60fps scrolling.",
    icon: <Zap className="h-8 w-8 text-gray-400" />,
    highlight: "Sub-3s loading"
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 md:py-24 relative overflow-hidden">
      {/* Optimized background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gray-500/3 blur-3xl"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <span className="bg-gray-500/10 text-gray-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 inline-block border border-gray-500/20">
            Why triage.flow?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Everything You Need for Repo Understanding
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A complete AI-powered toolkit for developers working with any codebase, any size.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="feature-card border-gray-500/10 hover:border-gray-500/30 overflow-hidden backdrop-blur-lg group transition-all duration-300 hover:translate-y-[-4px]"
            >
              <CardHeader className="pb-3">
                <div className="mb-4 p-3 rounded-lg bg-gray-500/10 w-fit group-hover:bg-gray-500/15 transition-colors border border-gray-500/20">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg md:text-xl font-semibold text-white">{feature.title}</CardTitle>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground mb-4 leading-relaxed">{feature.description}</p>
                <div className="bg-gray-500/10 text-gray-300 text-sm px-3 py-1.5 rounded-full inline-block border border-gray-500/20">
                  {feature.highlight}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 md:mt-16 text-center">
          <div className="max-w-3xl mx-auto p-6 md:p-8 border border-dashed border-gray-500/30 rounded-lg glass-card">
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-white">Perfect for Modern Development Teams</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-gray-500 flex-shrink-0"></span>
                  <span className="text-gray-300">Open source maintainers</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-gray-500 flex-shrink-0"></span>
                  <span className="text-gray-300">Product engineers</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-gray-500 flex-shrink-0"></span>
                  <span className="text-gray-300">AI agent builders</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-gray-500 flex-shrink-0"></span>
                  <span className="text-gray-300">Large codebase teams</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-gray-500 flex-shrink-0"></span>
                  <span className="text-gray-300">Code reviewers</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-gray-500 flex-shrink-0"></span>
                  <span className="text-gray-300">DevOps engineers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
