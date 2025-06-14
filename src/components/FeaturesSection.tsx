
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, 
  Search, 
  GitPullRequest, 
  Zap, 
  Smartphone, 
  Brain 
} from "lucide-react";

const features = [
  {
    title: "AI Agentic Chat",
    description: "Ask anything about your repo—architecture, bugs, PRs, code patterns—and get deep, actionable answers with full context understanding.",
    icon: <MessageSquare className="h-10 w-10 text-gray-400" />,
    highlight: "Deep repo understanding"
  },
  {
    title: "Smart File Explorer",
    description: "Instantly preview, search, and cross-link files and folders. Navigate your codebase with intelligent suggestions and semantic search.",
    icon: <Search className="h-10 w-10 text-gray-400" />,
    highlight: "Intelligent navigation"
  },
  {
    title: "PR & Diff Insights",
    description: "Visualize pull request changes and code diffs inline. Understand the impact of changes with context-aware analysis and suggestions.",
    icon: <GitPullRequest className="h-10 w-10 text-gray-400" />,
    highlight: "Visual change analysis"
  },
  {
    title: "Live Reasoning",
    description: "Watch the AI think, plan, and act in real time. See the reasoning process as it analyzes your code and formulates responses.",
    icon: <Brain className="h-10 w-10 text-gray-400" />,
    highlight: "Transparent AI thinking"
  },
  {
    title: "Modern UI",
    description: "Beautiful, responsive, and fast interface that works seamlessly across devices. Optimized for developer productivity and ease of use.",
    icon: <Smartphone className="h-10 w-10 text-gray-400" />,
    highlight: "Developer-first design"
  },
  {
    title: "Universal Compatibility",
    description: "Works on any repo, any size, any language. From small projects to enterprise codebases, triage.flow scales with your needs.",
    icon: <Zap className="h-10 w-10 text-gray-400" />,
    highlight: "Works everywhere"
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gray-500/3 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiM2NjY2NjYiIGZpbGwtb3BhY2l0eT0iLjAzIiBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTJoLTJ2LTJoMnYyem0tMi0yaC0ydjJoMnYtMnptMi0yaC0ydjJoMnYtMnoiLz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="bg-gray-500/10 text-gray-300 px-4 py-2 rounded-full text-sm font-medium mb-6 inline-block border border-gray-500/20">
            Core Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Everything you need to understand code
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
            triage.flow combines AI intelligence with modern developer tools to give you unprecedented insight into your codebase. 
            No more guessing—get real answers about your code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="feature-card border-gray-500/10 hover:border-gray-400/30 overflow-hidden backdrop-blur-lg group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gray-500/5 -translate-y-1/2 translate-x-1/2 group-hover:bg-gray-500/10 transition-colors"></div>
              
              <CardHeader className="pb-4 relative z-10">
                <div className="mb-6 p-3 rounded-lg bg-gray-500/10 w-fit group-hover:bg-gray-500/15 transition-colors border border-gray-500/20">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-white">{feature.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <p className="text-gray-400 mb-4 leading-relaxed">{feature.description}</p>
                <div className="bg-gray-500/10 text-gray-300 text-sm px-3 py-1.5 rounded-full inline-block border border-gray-500/20">
                  {feature.highlight}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced CTA */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              Ready to transform how you work with code?
            </h3>
            <p className="text-gray-400 mb-8 text-lg">
              Join developers who are already using AI to understand, debug, and improve their codebases faster than ever before.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">10x</div>
                <div className="text-gray-400 text-sm">Faster debugging</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">Any</div>
                <div className="text-gray-400 text-sm">Repository size</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">Real-time</div>
                <div className="text-gray-400 text-sm">AI responses</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => document.querySelector('#hero-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Get Started Now
              </button>
              <button className="border border-gray-500/30 hover:bg-gray-500/10 text-gray-300 px-8 py-3 rounded-lg font-medium transition-all">
                View Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
