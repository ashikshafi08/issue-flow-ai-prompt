import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronRight, Loader2, Shield, Brain, Zap, Lock, GitBranch, Code2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createChatSession } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Particles from "react-particles";
import { loadSlim } from "tsparticles-slim";



const FloatingCodeElement = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: [0.3, 0.7, 0.3],
      y: [-10, 10, -10],
      rotate: [-1, 1, -1]
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
    className="absolute text-gray-500 font-mono text-sm pointer-events-none select-none"
    {...props}
  >
    {children}
  </motion.div>
);

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [issueUrl, setIssueUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueUrl.trim()) return;
    
    setIsLoading(true);
    
    try {
      const { session_id, initial_message } = await createChatSession(issueUrl, "explain");
      
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Autonomous agent initialized successfully!",
      });
      navigate(`/chat/${session_id}`, { state: { initialMessage: initial_message } });

    } catch (error) {
      console.error('Error creating chat session:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to initialize autonomous agent",
        variant: "destructive",
      });
    }
  };

  return (
    <section ref={ref} className="pt-20 md:pt-24 pb-16 md:pb-20 overflow-hidden relative min-h-screen flex items-center">
      {/* Animated Particle Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 z-0"
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 120,
          particles: {
            color: { value: ["#3B82F6", "#8B5CF6", "#10B981"] },
            links: {
              color: "#3B82F6",
              distance: 150,
              enable: true,
              opacity: 0.1,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: { default: "bounce" },
              random: false,
              speed: 0.5,
              straight: false,
            },
            number: { density: { enable: true, area: 2000 }, value: 50 },
            opacity: { value: 0.2 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
      />

      {/* Enhanced background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 right-[10%] w-48 md:w-72 h-48 md:h-72 rounded-full bg-blue-500/10 blur-3xl"
        />
        <motion.div 
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute bottom-1/4 left-[5%] w-40 md:w-64 h-40 md:h-64 rounded-full bg-green-500/10 blur-3xl"
        />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl"
        />

        {/* Floating Code Elements */}
        <FloatingCodeElement style={{ top: '20%', left: '10%' }} delay={0}>
          const agent = new RepositoryIntelligence();
        </FloatingCodeElement>
        <FloatingCodeElement style={{ top: '60%', right: '15%' }} delay={1}>
          agent.learn(codebase);
        </FloatingCodeElement>
        <FloatingCodeElement style={{ top: '40%', left: '70%' }} delay={2}>
          if (legacy.complex) memory.persist();
        </FloatingCodeElement>
        <FloatingCodeElement style={{ bottom: '30%', left: '20%' }} delay={3}>
          // Understanding grows over time
        </FloatingCodeElement>
        <FloatingCodeElement style={{ top: '15%', right: '40%' }} delay={4}>
          agent.analyze().remember().improve();
        </FloatingCodeElement>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10 w-full">
        <div className="flex flex-col items-center text-center space-y-8 md:space-y-12 max-w-6xl mx-auto">
          
          {/* Hero content with staggered animations */}
          <motion.div 
            className="space-y-4 md:space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300 font-medium px-4 py-2 rounded-full text-sm">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Shield className="h-3 w-3 mr-1" />
                </motion.div>
                Autonomous Repository Intelligence Agent
              </Badge>
            </motion.div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                The AI Agent That
              </motion.div>
              <br />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-gradient bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent"
              >
                Understands Your Codebase
              </motion.div>
              <br />
              <motion.span 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-300 font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 1.5 }}
              >
                Better Than You Do
              </motion.span>
            </h1>
            
            <motion.p 
              className="max-w-4xl text-muted-foreground mx-auto text-lg md:text-xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <span className="text-white font-semibold">triage.flow</span> is an autonomous agent that learns your entire codebase with every interaction. 
              It remembers patterns, understands legacy systems, and helps you navigate complex code with the intelligence of your most experienced engineer.
            </motion.p>
          </motion.div>

          {/* What it does - Staggered Card Animations */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            {[
              { icon: Brain, title: "Learns Your Code", desc: "Persistent memory that gets smarter about your specific codebase with every question, every interaction, every exploration.", color: "blue" },
              { icon: Lock, title: "Enterprise Ready", desc: "Built with privacy and security from day one. Your code stays yours, with enterprise-grade protection and audit trails.", color: "green" },
              { icon: Code2, title: "Understands Legacy", desc: "Specialized in making sense of complex, legacy codebases. Untangles years of technical debt and architectural decisions.", color: "purple" }
            ].map((item, index) => (
              <motion.div
                key={index}
                className={`glass-card p-6 md:p-8 text-center border border-${item.color}-500/20 hover:border-${item.color}-500/40 transition-all duration-300 group`}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <item.icon className={`h-10 w-10 mx-auto mb-4 text-${item.color}-400 group-hover:scale-110 transition-transform`} />
                </motion.div>
                <h3 className="font-semibold mb-3 text-white text-lg">{item.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* How it works - Enhanced Animation */}
          <motion.div 
            className="w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.8 }}
          >
            <div className="glass-card p-6 md:p-8 border border-yellow-500/20 hover:border-yellow-500/30 transition-all duration-300">
              <div className="text-center mb-6">
                <motion.h3 
                  className="text-xl font-semibold mb-3 text-yellow-300"
                  whileHover={{ scale: 1.05 }}
                >
                  How It Works
                </motion.h3>
                <p className="text-gray-300 text-sm">
                  Unlike tools that forget after each conversation, our agent builds a persistent understanding of your codebase that improves over time.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: "1", title: "Analyzes Your Code", desc: "Understands architecture, patterns, and dependencies across your entire repository", color: "blue" },
                  { step: "2", title: "Builds Memory", desc: "Creates persistent knowledge that grows smarter with every interaction", color: "green" },
                  { step: "3", title: "Provides Insights", desc: "Answers questions, explains code, and guides modernization efforts", color: "purple" }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 2.0 + index * 0.2 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div 
                      className={`h-8 w-8 rounded-full bg-${item.color}-500/20 flex items-center justify-center mx-auto mb-3`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <span className={`text-${item.color}-400 font-bold`}>{item.step}</span>
                    </motion.div>
                    <h4 className="text-white font-medium mb-2">{item.title}</h4>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* CTA Form - Enhanced with Animations */}
          <motion.div 
            className="w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 2.4 }}
          >
            <motion.form 
              onSubmit={handleSubmit} 
              className="glass-card p-6 md:p-8 shadow-2xl border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <motion.h3 
                    className="text-lg font-semibold text-white mb-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    Try It On Your Codebase
                  </motion.h3>
                  <p className="text-sm text-gray-400">See how our agent understands your code in minutes</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="issueUrl" className="text-sm font-medium text-left block text-gray-300">
                    GitHub Repository or Issue URL
                  </label>
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                  >
                    <Input
                      id="issueUrl"
                      type="url" 
                      placeholder="https://github.com/org/repo or https://github.com/org/repo/issues/123"
                      value={issueUrl}
                      onChange={(e) => setIssueUrl(e.target.value)}
                      className="w-full bg-[rgba(30,41,59,0.5)] border-gray-500/20 focus:border-blue-500/50 focus:ring-blue-500/30 text-base transition-all duration-300"
                      required
                    />
                  </motion.div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.div className="flex-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all py-3"
                      disabled={isLoading}
                    >
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing Code...
                          </motion.div>
                        ) : (
                          <motion.div
                            key="ready"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <GitBranch className="h-4 w-4" />
                            Start Understanding <ChevronRight className="h-4 w-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="button"
                      onClick={() => navigate('/assistant')}
                      variant="outline"
                      className="px-6 py-3 border-gray-500/30 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 hover:border-gray-500/50 transition-all"
                    >
                      Live Demo ↗
                    </Button>
                  </motion.div>
                </div>
                
                <motion.div 
                  className="text-center pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3.0 }}
                >
                  <p className="text-xs text-gray-500">
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <Shield className="h-3 w-3 inline mr-1" />
                    </motion.span>
                    Your code stays private • No data leaves your environment
                  </p>
                </motion.div>
              </div>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
