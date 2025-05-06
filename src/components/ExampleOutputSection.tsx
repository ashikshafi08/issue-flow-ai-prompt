
import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal, Code, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const ExampleOutputSection = () => {
  const [activeTab, setActiveTab] = useState("issue");
  const [animationComplete, setAnimationComplete] = useState(false);
  const [issueVisible, setIssueVisible] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [responseVisible, setResponseVisible] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  
  const { ref: sectionRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const responseRef = useRef<HTMLDivElement>(null);

  // Trigger animations when section is in view
  useEffect(() => {
    if (inView && !issueVisible) {
      setTimeout(() => setIssueVisible(true), 500);
    }
  }, [inView, issueVisible]);

  // Trigger prompt animation after issue is visible
  useEffect(() => {
    if (issueVisible && !promptVisible) {
      setTimeout(() => setPromptVisible(true), 1000);
    }
  }, [issueVisible, promptVisible]);

  // Trigger response animation after prompt is visible
  useEffect(() => {
    if (promptVisible && !responseVisible) {
      setTimeout(() => setResponseVisible(true), 1500);
      setTimeout(() => setAnimationComplete(true), 2000);
    }
  }, [promptVisible, responseVisible]);

  // Lines of terminal output
  const terminalLines = [
    "$ python examples/examples_complete_rag.py",
    "Running example for explain prompt type with Local RAG...",
    "Issue URL: https://github.com/huggingface/smolagents/issues/1295",
    "Model: o4-mini",
    "Error fetching comments: 'GitHubIssuesClient' object has no attribute 'get_issue_comments'",
    "Extracting context from repository: huggingface/smolagents (via local clone)...",
    "Cloned repository to: /var/folders/r1/1_x09nv93xl5cr0f9p5t4x_h0000gn/T/tmp9ihe8e2i",
    "Loaded 65 documents from repository",
    "Found 10 relevant files in the repository",
    "Generated Prompt with RAG context:",
    "================================================================================",
    "LLM Response:",
    "status='success' prompt='1. What the issue is about..."
  ];

  // Animate terminal output
  useEffect(() => {
    if (activeTab === 'terminal' && animationComplete) {
      const timer = setInterval(() => {
        setCurrentLine((prev) => {
          if (prev < terminalLines.length - 1) {
            return prev + 1;
          } else {
            clearInterval(timer);
            return prev;
          }
        });
      }, 200);
      
      return () => clearInterval(timer);
    }
  }, [activeTab, animationComplete, terminalLines.length]);

  // Auto-scroll the response section
  useEffect(() => {
    if (responseRef.current && responseVisible) {
      const scrollInterval = setInterval(() => {
        if (responseRef.current) {
          if (responseRef.current.scrollTop < responseRef.current.scrollHeight - responseRef.current.clientHeight) {
            responseRef.current.scrollTop += 1;
          } else {
            clearInterval(scrollInterval);
          }
        }
      }, 30);
      
      return () => clearInterval(scrollInterval);
    }
  }, [responseVisible]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.2 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Tab transition variants
  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2
      }
    }
  };

  // Arrow animation variants
  const arrowVariants = {
    initial: { x: 0 },
    animate: { 
      x: [0, 5, 0], 
      transition: { 
        repeat: Infinity, 
        duration: 1.5,
        ease: "easeInOut" 
      }
    }
  };

  // Step indicator item variants
  const stepItemVariants = {
    inactive: { 
      scale: 1,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", 
      transition: { duration: 0.3 }
    },
    active: { 
      scale: 1.05,
      boxShadow: "0 4px 15px rgba(110, 89, 165, 0.35)",
      transition: { duration: 0.3 }
    },
    hover: { 
      scale: 1.03,
      boxShadow: "0 4px 12px rgba(110, 89, 165, 0.25)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <section id="example-output" className="py-20 bg-accent/30" ref={sectionRef}>
      <div className="container px-4 md:px-6">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <motion.h2 
            className="text-3xl font-bold tracking-tighter mb-2"
            variants={itemVariants}
          >
            🧠 Example Output
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            variants={itemVariants}
          >
            See how our tool analyzes GitHub issues and generates AI-ready prompts
          </motion.p>
        </motion.div>

        <motion.div 
          className="flex flex-col lg:flex-row gap-8 items-stretch max-w-7xl mx-auto"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <motion.div 
            className="flex-1 flex flex-col"
            variants={itemVariants}
          >
            <Tabs defaultValue="issue" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-8">
                {/* New Step Indicator */}
                <div className="w-full">
                  <div className="flex items-center justify-between gap-2 relative">
                    {/* Step 1 */}
                    <motion.div 
                      className={`flex-1 z-10`}
                      initial="inactive"
                      animate={activeTab === "issue" ? "active" : "inactive"}
                      whileHover={activeTab !== "issue" ? "hover" : "active"}
                      variants={stepItemVariants}
                    >
                      <Button 
                        onClick={() => setActiveTab("issue")}
                        className={`w-full relative bg-accent border-0 dark:bg-accent/60 rounded-xl flex flex-col items-center py-4 gap-3 group transition-all duration-300 
                          ${activeTab === "issue" ? 
                            "shadow-[0_0_15px_rgba(110,89,165,0.5)] dark:shadow-[0_0_15px_rgba(155,135,245,0.3)] bg-gradient-to-r from-accent to-accent/80 text-brand-purple" : 
                            "hover:bg-gradient-to-r hover:from-accent hover:to-accent/70"
                          }`}
                      >
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center 
                          ${activeTab === "issue" ? 
                            "bg-gradient-to-r from-brand-purple to-brand-blue text-white" : 
                            "bg-background/70 group-hover:bg-brand-purple/10"}`}
                        >
                          <Code size={22} className={activeTab === "issue" ? "text-white" : "text-brand-purple"} />
                        </div>
                        <span className="text-sm font-medium">What the agent sees</span>
                        {activeTab === "issue" && (
                          <motion.div 
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-purple to-brand-blue rounded-full"
                            layoutId="activeIndicator"
                          />
                        )}
                      </Button>
                    </motion.div>

                    {/* Arrow 1 */}
                    <motion.div 
                      className="hidden md:flex items-center mx-1"
                      animate={activeTab === "issue" ? "animate" : "initial"}
                      variants={arrowVariants}
                    >
                      <ArrowRight className={`text-muted-foreground ${activeTab === "issue" ? "text-brand-purple" : ""}`} />
                    </motion.div>

                    {/* Step 2 */}
                    <motion.div 
                      className={`flex-1 z-10`}
                      initial="inactive"
                      animate={activeTab === "terminal" ? "active" : "inactive"}
                      whileHover={activeTab !== "terminal" ? "hover" : "active"}
                      variants={stepItemVariants}
                    >
                      <Button 
                        onClick={() => setActiveTab("terminal")}
                        className={`w-full relative bg-accent border-0 dark:bg-accent/60 rounded-xl flex flex-col items-center py-4 gap-3 group transition-all duration-300
                          ${activeTab === "terminal" ? 
                            "shadow-[0_0_15px_rgba(110,89,165,0.5)] dark:shadow-[0_0_15px_rgba(155,135,245,0.3)] bg-gradient-to-r from-accent to-accent/80 text-brand-purple" : 
                            "hover:bg-gradient-to-r hover:from-accent hover:to-accent/70"
                          }`}
                      >
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center 
                          ${activeTab === "terminal" ? 
                            "bg-gradient-to-r from-brand-purple to-brand-blue text-white" : 
                            "bg-background/70 group-hover:bg-brand-purple/10"}`}
                        >
                          <Terminal size={22} className={activeTab === "terminal" ? "text-white" : "text-brand-purple"} />
                        </div>
                        <span className="text-sm font-medium">What the prompt looks like</span>
                        {activeTab === "terminal" && (
                          <motion.div 
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-purple to-brand-blue rounded-full"
                            layoutId="activeIndicator"
                          />
                        )}
                      </Button>
                    </motion.div>

                    {/* Arrow 2 */}
                    <motion.div 
                      className="hidden md:flex items-center mx-1"
                      animate={activeTab === "terminal" ? "animate" : "initial"}
                      variants={arrowVariants}
                    >
                      <ArrowRight className={`text-muted-foreground ${activeTab === "terminal" ? "text-brand-purple" : ""}`} />
                    </motion.div>

                    {/* Step 3 */}
                    <motion.div 
                      className={`flex-1 z-10`}
                      initial="inactive"
                      animate={activeTab === "prompt" ? "active" : "inactive"}
                      whileHover={activeTab !== "prompt" ? "hover" : "active"}
                      variants={stepItemVariants}
                    >
                      <Button 
                        onClick={() => setActiveTab("prompt")}
                        className={`w-full relative bg-accent border-0 dark:bg-accent/60 rounded-xl flex flex-col items-center py-4 gap-3 group transition-all duration-300
                          ${activeTab === "prompt" ? 
                            "shadow-[0_0_15px_rgba(110,89,165,0.5)] dark:shadow-[0_0_15px_rgba(155,135,245,0.3)] bg-gradient-to-r from-accent to-accent/80 text-brand-purple" : 
                            "hover:bg-gradient-to-r hover:from-accent hover:to-accent/70"
                          }`}
                      >
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center 
                          ${activeTab === "prompt" ? 
                            "bg-gradient-to-r from-brand-purple to-brand-blue text-white" : 
                            "bg-background/70 group-hover:bg-brand-purple/10"}`}
                        >
                          <MessageSquare size={22} className={activeTab === "prompt" ? "text-white" : "text-brand-purple"} />
                        </div>
                        <span className="text-sm font-medium">What your LLM can do with it</span>
                        {activeTab === "prompt" && (
                          <motion.div 
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-purple to-brand-blue rounded-full"
                            layoutId="activeIndicator"
                          />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <TabsContent value="issue" key="issue">
                  <motion.div
                    className="border rounded-lg shadow-sm overflow-hidden"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={tabContentVariants}
                  >
                    <div className={`bg-card transition-all duration-700 ${issueVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      <div className="flex items-center justify-center border-b bg-muted/40 p-3">
                        <img 
                          src="/lovable-uploads/2ff5738a-5cf2-46c0-a103-fb6ab072c055.png" 
                          alt="GitHub Issue Screenshot" 
                          className="w-full h-auto rounded max-w-full object-contain max-h-[500px]" 
                        />
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="terminal" key="terminal">
                  <motion.div
                    className="min-h-[500px] border rounded-lg shadow-sm bg-card p-4"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={tabContentVariants}
                  >
                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                      <div className="flex gap-1">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      </div>
                      <span>Terminal</span>
                    </div>
                    <div className="font-code bg-card text-sm text-left overflow-x-auto p-4 rounded min-h-[460px]">
                      {terminalLines.slice(0, currentLine + 1).map((line, index) => (
                        <div key={index} className={`${index > 0 ? "mt-1" : ""}`}>
                          {line.includes("LLM Response:") || line.includes("Generated Prompt") || line.includes("==========") ? (
                            <span className="text-brand-purple font-bold">{line}</span>
                          ) : line.startsWith("$") ? (
                            <span className="text-green-500">{line}</span>
                          ) : line.includes("Error") ? (
                            <span className="text-yellow-500">{line}</span>
                          ) : line.startsWith("status=") ? (
                            <span className="text-blue-400">{line.substring(0, 50)}...</span>
                          ) : (
                            <span>{line}</span>
                          )}
                          {index === currentLine && <span className="animate-pulse">|</span>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="prompt" key="prompt">
                  <motion.div
                    className="min-h-[500px] border rounded-lg shadow-sm bg-card"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={tabContentVariants}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between border-b p-3 bg-muted/40">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Success</Badge>
                          <span className="text-sm font-medium">LLM Response</span>
                        </div>
                      </div>
                      <div 
                        ref={responseRef}
                        className={`flex-1 p-4 overflow-auto text-left max-h-[460px] transition-all duration-1000 ${
                          responseVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <h3 className="font-bold mb-2">1. What the issue is about</h3>
                        <p className="mb-4">
                          The discussion stems from PR #1271 in the smolagents repo, which removed the third-party
                          <code className="bg-muted px-1 rounded text-sm mx-1">duckduckgo-search</code> 
                          package from the base installation. As a result, any example or built-in "duckduckgo" search 
                          tool now silently fails (or can't even be imported) unless users manually install exactly 
                          the right version of <code className="bg-muted px-1 rounded text-sm">duckduckgo-search</code>. 
                          That extra step (and the attendant version-pinning) is friction for anyone who just wants to clone 
                          the repo, run the examples, and play with the agents.
                        </p>
                        
                        <h3 className="font-bold mb-2">2. Root cause</h3>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                          <li>In an effort to trim down dependencies, the maintainers removed <code className="bg-muted px-1 rounded text-sm">duckduckgo-search</code> from <code className="bg-muted px-1 rounded text-sm">install_requires</code>.</li>
                          <li>However, parts of the codebase (notably the DuckDuckGoSearchTool) still assume that package is available, and there was no fallback or "vendorized" implementation embedded in the repo itself.</li>
                          <li>Consequently, default examples that spin up a DDG search tool instantly break unless you pip-install the exact same <code className="bg-muted px-1 rounded text-sm">duckduckgo-search</code> version the tests were written against.</li>
                        </ul>

                        <h3 className="font-bold mb-2">3. Relevant technical details</h3>
                        <p className="mb-2">In <code className="bg-muted px-1 rounded text-sm">default_tools.py</code> there is a class like:</p>
                        <pre className="bg-muted p-3 rounded-md mb-4 overflow-x-auto">
                          <code>{`class DuckDuckGoSearchTool(Tool):
    name = "duckduckgo_search"
    inputs = {"query": {"type": "string"}}
    output_type = "string"

    def forward(self, query: str) -> str:
        # currently does something like \`from duckduckgo_search import ddg\`
        results = ddg(query, max_results=5)
        return format_results(results)`}</code>
                        </pre>

                        <p className="mb-4">
                          The removed dependency provided that <code className="bg-muted px-1 rounded text-sm">ddg()</code> helper; without it the above import fails.
                          An alternative (illustrated in deedy5's upstream code) is to re-implement the HTTP handshake yourself:
                        </p>

                        <ol className="list-decimal pl-6 mb-4 space-y-1">
                          <li>Request a DuckDuckGo "token" (<code className="bg-muted px-1 rounded text-sm">vqd</code>) by scraping the HTML.</li>
                          <li>Call the JSON API endpoint <code className="bg-muted px-1 rounded text-sm">https://duckduckgo.com/d.js?l=wt-wt&o=json&q=…&vqd=…</code>.</li>
                          <li>Parse and return the snippet/title/URL fields.</li>
                        </ol>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ExampleOutputSection;
