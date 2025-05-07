
import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Code, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";

const ExampleOutputSection = () => {
  const [activeTab, setActiveTab] = useState("issue");
  const [animationComplete, setAnimationComplete] = useState(false);
  const [issueVisible, setIssueVisible] = useState(false);
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

  // Trigger response animation after issue is visible
  useEffect(() => {
    if (issueVisible && !responseVisible) {
      setTimeout(() => setResponseVisible(true), 1500);
      setTimeout(() => setAnimationComplete(true), 2000);
    }
  }, [issueVisible, responseVisible]);

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
    <section id="example-output" className="py-20 relative" ref={sectionRef}>
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Blue gradient orb left */}
        <div className="absolute top-1/3 left-[5%] w-80 h-80 rounded-full bg-blue-500/5 blur-3xl"></div>
        
        {/* Purple gradient orb right */}
        <div className="absolute bottom-1/3 right-[5%] w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMzQjgyRjYiIGZpbGwtb3BhY2l0eT0iLjAzIiBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTJoLTJ2LTJoMnYyem0tMi0yaC0ydjJoMnYtMnptMi0yaC0ydjJoMnYtMnoiLz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <motion.span
            variants={itemVariants}
            className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 inline-block border border-blue-500/20"
          >
            Examples
          </motion.span>
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
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-900/50 -translate-y-1/2 z-0"></div>
                    
                    {/* Step 1 */}
                    <div className="relative z-10 flex-1">
                      <motion.button
                        onClick={() => setActiveTab("issue")}
                        className={`w-full relative flex flex-col items-center gap-3 group transition-all duration-300`}
                        whileHover={{ scale: activeTab !== "issue" ? 1.02 : 1 }}
                      >
                        <div 
                          className={`h-16 w-16 rounded-full flex items-center justify-center shadow-sm transition-all duration-300
                            ${activeTab === "issue" 
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white animate-glow-pulse" 
                              : "glass-card border-blue-500/20 hover:border-blue-500/40"
                            }`}
                        >
                          <Code size={24} className={`${activeTab === "issue" ? "text-white" : "text-blue-400"}`} />
                        </div>
                        <span className={`text-sm font-medium mt-2 transition-colors duration-300 
                          ${activeTab === "issue" ? "text-blue-400" : "text-muted-foreground"}`}
                        >
                          What the agent sees
                        </span>
                        {activeTab === "issue" && (
                          <motion.div 
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"
                            layoutId="activeIndicator"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </motion.button>
                    </div>

                    {/* Arrow */}
                    <motion.div 
                      className="z-10 flex items-center justify-center w-10 h-10 glass-card rounded-full border border-blue-500/20 shadow-sm"
                      animate={activeTab === "issue" ? "animate" : "initial"}
                      variants={arrowVariants}
                    >
                      <ArrowRight className={`w-5 h-5 ${activeTab === "issue" ? "text-blue-400" : "text-muted-foreground"}`} />
                    </motion.div>

                    {/* Step 2 */}
                    <div className="relative z-10 flex-1">
                      <motion.button
                        onClick={() => setActiveTab("prompt")}
                        className={`w-full relative flex flex-col items-center gap-3 group transition-all duration-300`}
                        whileHover={{ scale: activeTab !== "prompt" ? 1.02 : 1 }}
                      >
                        <div 
                          className={`h-16 w-16 rounded-full flex items-center justify-center shadow-sm transition-all duration-300
                            ${activeTab === "prompt" 
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white animate-glow-pulse" 
                              : "glass-card border-blue-500/20 hover:border-blue-500/40"
                            }`}
                        >
                          <MessageSquare size={24} className={`${activeTab === "prompt" ? "text-white" : "text-blue-400"}`} />
                        </div>
                        <span className={`text-sm font-medium mt-2 transition-colors duration-300
                          ${activeTab === "prompt" ? "text-blue-400" : "text-muted-foreground"}`}
                        >
                          What your LLM can do with it
                        </span>
                        {activeTab === "prompt" && (
                          <motion.div 
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"
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
                    className="border border-blue-500/20 rounded-lg shadow-lg overflow-hidden glass-card"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={tabContentVariants}
                  >
                    <div className={`transition-all duration-700 ${issueVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      <div className="flex items-center justify-center border-b border-blue-500/20 bg-blue-900/10 p-3">
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
                    className="min-h-[500px] border border-blue-500/20 rounded-lg shadow-lg glass-card"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={tabContentVariants}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between border-b border-blue-500/20 p-3 bg-blue-900/10">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Success</Badge>
                          <span className="text-sm font-medium text-blue-300">LLM Response</span>
                        </div>
                      </div>
                      <div 
                        ref={responseRef}
                        className={`flex-1 p-6 overflow-auto text-left max-h-[460px] transition-all duration-1000 ${
                          responseVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <h3 className="font-bold mb-2 text-blue-300">1. What the issue is about</h3>
                        <p className="mb-4 text-gray-300">
                          The discussion stems from PR #1271 in the smolagents repo, which removed the third-party
                          <code className="bg-blue-900/30 px-1.5 py-0.5 rounded text-sm mx-1 border border-blue-500/20">duckduckgo-search</code> 
                          package from the base installation. As a result, any example or built-in "duckduckgo" search 
                          tool now silently fails (or can't even be imported) unless users manually install exactly 
                          the right version of <code className="bg-blue-900/30 px-1.5 py-0.5 rounded text-sm border border-blue-500/20">duckduckgo-search</code>. 
                          That extra step (and the attendant version-pinning) is friction for anyone who just wants to clone 
                          the repo, run the examples, and play with the agents.
                        </p>
                        
                        <h3 className="font-bold mb-2 text-blue-300">2. Root cause</h3>
                        <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
                          <li>In an effort to trim down dependencies, the maintainers removed <code className="bg-blue-900/30 px-1.5 py-0.5 rounded text-sm border border-blue-500/20">duckduckgo-search</code> from <code className="bg-blue-900/30 px-1.5 py-0.5 rounded text-sm border border-blue-500/20">install_requires</code>.</li>
                          <li>However, parts of the codebase (notably the DuckDuckGoSearchTool) still assume that package is available, and there was no fallback or "vendorized" implementation embedded in the repo itself.</li>
                          <li>Consequently, default examples that spin up a DDG search tool instantly break unless you pip-install the exact same <code className="bg-blue-900/30 px-1.5 py-0.5 rounded text-sm border border-blue-500/20">duckduckgo-search</code> version the tests were written against.</li>
                        </ul>

                        <h3 className="font-bold mb-2 text-blue-300">3. Relevant technical details</h3>
                        <p className="mb-2 text-gray-300">In <code className="bg-blue-900/30 px-1.5 py-0.5 rounded text-sm border border-blue-500/20">default_tools.py</code> there is a class like:</p>
                        <pre className="bg-blue-900/20 p-4 rounded-md mb-4 overflow-x-auto border border-blue-500/20">
                          <code className="text-gray-300">{`class DuckDuckGoSearchTool(Tool):
    name = "duckduckgo_search"
    inputs = {"query": {"type": "string"}}
    output_type = "string"

    def forward(self, query: str) -> str:
        # currently does something like \`from duckduckgo_search import ddg\`
        results = ddg(query, max_results=5)
        return format_results(results)`}</code>
                        </pre>

                        <p className="mb-4 text-gray-300">
                          The removed dependency provided that <code className="bg-blue-900/30 px-1.5 py-0.5 rounded text-sm border border-blue-500/20">ddg()</code> helper; without it the above import fails.
                          An alternative (illustrated in deedy5's upstream code) is to re-implement the HTTP handshake yourself:
                        </p>

                        <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-300">
                          <li>Request a DuckDuckGo "token" (<code className="bg-blue-900/30 px-1.5 py-0.5 rounded text-sm border border-blue-500/20">vqd</code>) by scraping the HTML.</li>
                          <li>Call the JSON API endpoint <code className="bg-blue-900/30 px-1.5 py-0.5 rounded text-sm border border-blue-500/20">https://duckduckgo.com/d.js?l=wt-wt&o=json&q=…&vqd=…</code>.</li>
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
