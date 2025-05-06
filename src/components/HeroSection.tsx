
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [terminalStep, setTerminalStep] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const terminalSteps = [
    { text: "$ python examples/examples_complete_rag.py", type: "command" },
    { text: "Fetching issue: https://github.com/huggingface/transformers/issues/12345", type: "output" },
    { text: "Cloning repository: huggingface/transformers", type: "output" },
    { text: "Analyzing code: 20 relevant files found", type: "output" },
    { text: "Building vector index: FAISS + OpenAI embeddings", type: "output" },
    { text: "Generating prompt...", type: "output" },
    { text: "Prompt generated successfully! Ready for LLM response.", type: "success" }
  ];

  useEffect(() => {
    setIsVisible(true);
    
    // Start terminal animation after hero section becomes visible
    const terminalTimer = setTimeout(() => {
      const intervalId = setInterval(() => {
        setTerminalStep(prev => {
          if (prev < terminalSteps.length - 1) {
            return prev + 1;
          } else {
            clearInterval(intervalId);
            return prev;
          }
        });
      }, 1000);
      
      return () => clearInterval(intervalId);
    }, 1200);
    
    return () => clearTimeout(terminalTimer);
  }, []);

  // Typing effect for the last line
  useEffect(() => {
    if (terminalStep === terminalSteps.length - 1) {
      const lastStep = terminalSteps[terminalSteps.length - 1];
      const typingSpeed = 50; // milliseconds per character
      
      if (cursorPosition < lastStep.text.length) {
        const typingTimer = setTimeout(() => {
          setCursorPosition(prev => prev + 1);
        }, typingSpeed);
        
        return () => clearTimeout(typingTimer);
      }
    }
  }, [terminalStep, cursorPosition, terminalSteps]);

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
              {terminalSteps.slice(0, terminalStep + 1).map((step, index) => {
                // For the last step (success message) with typing animation
                if (index === terminalSteps.length - 1 && index === terminalStep) {
                  return (
                    <div key={index} className="mt-2">
                      <span className="text-brand-purple">
                        {step.text.substring(0, cursorPosition)}
                        {cursorPosition < step.text.length && (
                          <span className="animate-pulse">|</span>
                        )}
                      </span>
                    </div>
                  );
                }
                
                // For other terminal outputs
                return (
                  <div key={index} className={index > 0 ? "mt-1" : ""}>
                    {step.type === "command" ? (
                      <span className="text-green-500">{step.text}</span>
                    ) : step.type === "output" ? (
                      <span>
                        <span className="text-blue-400">{step.text.split(":")[0]}</span>
                        {step.text.includes(":") && ": " + step.text.split(":").slice(1).join(":")}
                      </span>
                    ) : (
                      <span className="text-brand-purple">{step.text}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
