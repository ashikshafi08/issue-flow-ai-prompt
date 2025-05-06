
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="pt-28 pb-20 overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-10">
          <div className={`space-y-4 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="outline" className="border-brand-purple text-brand-purple px-3 py-1">
              AI-powered GitHub Issue Context & Prompt Generator with RAG
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Transform <span className="text-gradient">GitHub Issues</span> into AI-ready Prompts
            </h1>
            <p className="max-w-[700px] text-muted-foreground mx-auto text-lg">
              Instantly understand and triage GitHub issues with deep, code-aware context for 20+ programming languages.
            </p>
          </div>
          
          <div className={`flex flex-wrap justify-center gap-4 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <Button size="lg" className="bg-brand-purple hover:bg-brand-lightPurple">
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              View on GitHub
            </Button>
          </div>

          <div className={`w-full max-w-4xl mx-auto rounded-xl border bg-card p-4 shadow-lg transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <span>Terminal</span>
            </div>
            <div className="font-code bg-card text-sm text-left overflow-x-auto p-4 rounded">
              <div className="text-green-500">$ python examples/examples_complete_rag.py</div>
              <div className="mt-2">
                <span className="text-blue-400">Fetching issue</span>: https://github.com/huggingface/transformers/issues/12345
              </div>
              <div className="mt-1">
                <span className="text-blue-400">Cloning repository</span>: huggingface/transformers
              </div>
              <div className="mt-1">
                <span className="text-blue-400">Analyzing code</span>: 20 relevant files found
              </div>
              <div className="mt-1">
                <span className="text-blue-400">Building vector index</span>: FAISS + OpenAI embeddings
              </div>
              <div className="mt-1">
                <span className="text-blue-400">Generating prompt</span>...
              </div>
              <div className="mt-2 code-typing text-brand-purple">Prompt generated successfully! Ready for LLM response.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
