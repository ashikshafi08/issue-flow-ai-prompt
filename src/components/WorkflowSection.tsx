
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

const steps = [
  {
    title: "Paste GitHub Issue URL or Clone Repo",
    description: "Start by providing a GitHub issue URL or repository to analyze.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    ),
  },
  {
    title: "triage.flow Loads Latest Commit",
    description: "Automatically loads the latest commit and builds a code-aware vector index.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    ),
  },
  {
    title: "Chat with @file, @function, or Natural Language",
    description: "Use @mentions to scope questions to exact files or ask in natural language.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    title: "Hybrid RAG + Reranking",
    description: "Fetches precise code snippets using FAISS vector search + BM25 + LLM reranking.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    title: "LLM Generates Grounded Responses",
    description: "AI generates suggestions, explanations, or test cases grounded in your actual code.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="8" height="14" x="8" y="5" rx="1" />
        <path d="m4 12 4-2v4l-4-2Z" />
        <path d="m16 6 4-2v4l-4-2Z" />
        <path d="m16 18 4-2v4l-4-2Z" />
      </svg>
    ),
  },
  {
    title: "Agent Memory Keeps Context",
    description: "Session memory maintains context across multiple questions and file references.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </svg>
    ),
  },
  {
    title: "Coming Soon: Apply Changes via Code Actions",
    description: "Run AI-suggested fixes, tests, or refactorings automatically. Controlled, testable code edits.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

const WorkflowSection = () => {
  const [activeSteps, setActiveSteps] = useState([]);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      const activateSteps = () => {
        const timer = setInterval(() => {
          setActiveSteps((prevActiveSteps) => {
            if (prevActiveSteps.length < steps.length) {
              return [...prevActiveSteps, prevActiveSteps.length];
            } else {
              clearInterval(timer);
              return prevActiveSteps;
            }
          });
        }, 500);
        
        return () => clearInterval(timer);
      };
      
      const cleanup = activateSteps();
      return () => cleanup();
    }
  }, [inView]); 

  return (
    <section id="how-it-works" className="py-20 relative z-10" ref={ref}>
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMzQjgyRjYiIGZpbGwtb3BhY2l0eT0iLjAzIiBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTJoLTJ2LTJoMnYyem0tMi0yaC0ydjJoMnYtMnptMi0yaC0ydjJoMnYtMnoiLz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 inline-block border border-blue-500/20">
            Workflow
          </span>
          <h2 className="text-3xl font-bold tracking-tighter mb-2">Real-time Indexing → Retrieval → Chat Loop</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From GitHub issue to file-aware AI assistance in seconds.
          </p>
        </div>
        
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute top-0 bottom-0 left-8 w-0.5 neo-shadow-inset">
            <div 
              className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-b from-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
              style={{ 
                height: `${(activeSteps.length / steps.length) * 100}%`,
              }}
            ></div>
          </div>
          
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`workflow-item flex items-start mb-8 ${
                activeSteps.includes(index) ? 'active' : ''
              }`}
              style={{ 
                transitionDelay: `${index * 150}ms`,
              }}
            >
              <div 
                className={`relative z-10 flex items-center justify-center w-16 h-16 
                  ${activeSteps.includes(index) 
                    ? 'glass-card border-blue-500/40' 
                    : 'bg-transparent border-blue-500/10'
                  } 
                  border-2 rounded-full shadow-sm mr-4 transition-all duration-500`}
              >
                <div className={`${activeSteps.includes(index) ? 'text-blue-400 scale-110' : 'text-muted-foreground'} transition-all duration-500`}>
                  {step.icon}
                </div>
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-medium ${activeSteps.includes(index) ? 'text-blue-300' : 'text-muted-foreground'} transition-colors duration-500`}>
                  {step.title}
                </h3>
                <p className={`${activeSteps.includes(index) ? 'text-muted-foreground' : 'text-muted-foreground/70'} transition-colors duration-500`}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
