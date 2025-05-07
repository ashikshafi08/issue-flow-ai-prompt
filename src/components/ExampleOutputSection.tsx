
import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, MessageSquare } from "lucide-react";
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
                {/* Improved Step Indicator */}
                <div className="w-full">
                  <div className="flex items-center justify-between gap-1 relative">
                    {/* Line connector for step indicator */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-accent/70 -translate-y-1/2 z-0"></div>
                    
                    {/* Step 1 */}
                    <div className="relative z-10 flex-1">
                      <motion.button
                        onClick={() => setActiveTab("issue")}
                        className={`w-full relative flex flex-col items-center gap-3 group transition-all duration-300`}
                        whileHover={{ scale: activeTab !== "issue" ? 1.02 : 1 }}
                      >
                        <div 
                          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-sm transition-all duration-300
                            ${activeTab === "issue" 
                              ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-[0_0_12px_rgba(110,89,165,0.5)]" 
                              : "bg-card border border-border hover:border-brand-purple/30 hover:bg-accent/50"
                            }`}
                        >
                          <Code size={22} className={`${activeTab === "issue" ? "text-white" : "text-brand-purple"}`} />
                        </div>
                        <span className={`text-sm font-medium mt-2 transition-colors duration-300 
                          ${activeTab === "issue" ? "text-brand-purple" : "text-muted-foreground"}`}
                        >
                          What the agent sees
                        </span>
                        {activeTab === "issue" && (
                          <motion.div 
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-purple to-brand-blue"
                            layoutId="activeIndicator"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </motion.button>
                    </div>

                    {/* Arrow 1 */}
                    <motion.div 
                      className="z-10 flex items-center justify-center w-8 h-8 bg-card rounded-full border border-border shadow-sm"
                      animate={activeTab === "issue" ? "animate" : "initial"}
                      variants={arrowVariants}
                    >
                      <ArrowRight className={`w-4 h-4 ${activeTab === "issue" ? "text-brand-purple" : "text-muted-foreground"}`} />
                    </motion.div>

                    {/* Step 2 - We're directly going to step 2 as prompt now (skip terminal) */}
                    <div className="relative z-10 flex-1">
                      <motion.button
                        onClick={() => setActiveTab("prompt")}
                        className={`w-full relative flex flex-col items-center gap-3 group transition-all duration-300`}
                        whileHover={{ scale: activeTab !== "prompt" ? 1.02 : 1 }}
                      >
                        <div 
                          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-sm transition-all duration-300
                            ${activeTab === "prompt" 
                              ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-[0_0_12px_rgba(110,89,165,0.5)]" 
                              : "bg-card border border-border hover:border-brand-purple/30 hover:bg-accent/50"
                            }`}
                        >
                          <MessageSquare size={22} className={`${activeTab === "prompt" ? "text-white" : "text-brand-purple"}`} />
                        </div>
                        <span className={`text-sm font-medium mt-2 transition-colors duration-300
                          ${activeTab === "prompt" ? "text-brand-purple" : "text-muted-foreground"}`}
                        >
                          What your LLM can do with it
                        </span>
                        {activeTab === "prompt" && (
                          <motion.div 
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-purple to-brand-blue"
                            layoutId="activeIndicator"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </motion.button>
                    </div>
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
