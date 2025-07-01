import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Code2, Users, Building2, Zap, Target, MessageSquare, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const VisionSection = () => {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-20 relative overflow-hidden" ref={ref}>
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-blue-500/3 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/2 blur-3xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-green-500/2 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.35, 0.15]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div 
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.span 
            className="bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 inline-block border border-purple-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <Brain className="h-3 w-3 inline mr-1" />
            </motion.div>
            Our Vision
          </motion.span>
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Making Complex Code
            <br />
            <motion.span 
              className="text-gradient bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Simple to Understand
            </motion.span>
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-4xl mx-auto text-lg md:text-xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            We believe every developer should have an AI agent that truly understands their codebase. 
            Not just an autocomplete tool, but an intelligent partner that learns, remembers, and helps navigate complexity.
          </motion.p>
        </motion.div>

        {/* The Problem - Enhanced with animations */}
        <motion.div 
          className="mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="text-center mb-8"
              whileHover={{ scale: 1.02 }}
            >
              <motion.h3 
                className="text-2xl md:text-3xl font-semibold mb-4 text-red-300"
                whileHover={{ scale: 1.05 }}
              >
                The Problem We're Solving
              </motion.h3>
              <p className="text-gray-300 text-lg">
                Modern software development faces a fundamental challenge: <motion.span 
                  className="text-red-400 font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  complexity is growing faster than our ability to understand it
                </motion.span>.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-red-500/5 border-red-500/20 p-6 hover:bg-red-500/10 transition-all duration-300 group">
                  <CardContent className="p-0">
                    <div className="text-center">
                      <motion.div 
                        className="text-4xl mb-4"
                        whileHover={{ 
                          scale: 1.2,
                          rotate: [0, -10, 10, 0]
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        🤯
                      </motion.div>
                      <h4 className="text-lg font-semibold text-red-300 mb-3 group-hover:text-red-200 transition-colors">Codebase Overwhelm</h4>
                      <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                        Developers spend 60% of their time trying to understand existing code rather than writing new features. 
                        Onboarding to a new codebase takes weeks or months.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Card className="bg-red-500/5 border-red-500/20 p-6 hover:bg-red-500/10 transition-all duration-300 group">
                  <CardContent className="p-0">
                    <div className="text-center">
                      <motion.div 
                        className="text-4xl mb-4"
                        whileHover={{ 
                          scale: 1.2,
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        🧠
                      </motion.div>
                      <h4 className="text-lg font-semibold text-red-300 mb-3 group-hover:text-red-200 transition-colors">Knowledge Silos</h4>
                      <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                        Critical knowledge about why code was written a certain way lives only in developers' heads. 
                        When they leave, that knowledge is lost forever.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Our Solution - Enhanced with animations */}
        <motion.div 
          className="mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="text-center mb-8"
              whileHover={{ scale: 1.02 }}
            >
              <motion.h3 
                className="text-2xl md:text-3xl font-semibold mb-4 text-green-300"
                whileHover={{ scale: 1.05 }}
              >
                Our Solution
              </motion.h3>
              <p className="text-gray-300 text-lg">
                An AI agent that builds a <motion.span 
                  className="text-green-400 font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  persistent, growing understanding
                </motion.span> of your codebase, 
                becoming the institutional memory your team has always needed.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-green-500/5 border-green-500/20 p-6 text-center hover:bg-green-500/10 transition-all duration-300 group">
                  <CardContent className="p-0">
                    <motion.div
                      whileHover={{ 
                        rotate: [0, -10, 10, 0],
                        scale: 1.1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <Brain className="h-12 w-12 mx-auto mb-4 text-green-400 group-hover:text-green-300 transition-colors" />
                    </motion.div>
                    <h4 className="text-lg font-semibold text-green-300 mb-3 group-hover:text-green-200 transition-colors">Learns Continuously</h4>
                    <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                      Every interaction teaches the agent more about your code patterns, architecture decisions, and team conventions.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Card className="bg-blue-500/5 border-blue-500/20 p-6 text-center hover:bg-blue-500/10 transition-all duration-300 group">
                  <CardContent className="p-0">
                    <motion.div
                      whileHover={{ 
                        rotate: [0, 10, -10, 0],
                        scale: 1.1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    </motion.div>
                    <h4 className="text-lg font-semibold text-blue-300 mb-3 group-hover:text-blue-200 transition-colors">Natural Conversation</h4>
                    <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                      Ask questions in plain English. "How does authentication work?" "What would break if I change this?"
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Card className="bg-purple-500/5 border-purple-500/20 p-6 text-center hover:bg-purple-500/10 transition-all duration-300 group">
                  <CardContent className="p-0">
                    <motion.div
                      whileHover={{ 
                        rotate: [0, -10, 10, 0],
                        scale: 1.1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <Code2 className="h-12 w-12 mx-auto mb-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    </motion.div>
                    <h4 className="text-lg font-semibold text-purple-300 mb-3 group-hover:text-purple-200 transition-colors">Deep Understanding</h4>
                    <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                      Goes beyond syntax to understand architecture, data flow, business logic, and the reasoning behind decisions.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Why This Matters - Enhanced with animations */}
        <motion.div 
          className="mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="text-center mb-8"
              whileHover={{ scale: 1.02 }}
            >
              <motion.h3 
                className="text-2xl md:text-3xl font-semibold mb-4 text-yellow-300"
                whileHover={{ scale: 1.05 }}
              >
                Why This Matters
              </motion.h3>
              <p className="text-gray-300 text-lg">
                We're not just building another coding assistant. We're creating the foundation for how developers will work with complex systems in the future.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              <div className="space-y-6">
                {[
                  { icon: Zap, title: "Faster Onboarding", desc: "New team members understand complex codebases in days, not months. The agent becomes their experienced mentor.", color: "yellow" },
                  { icon: Target, title: "Better Decisions", desc: "Understand the full impact of changes before making them. See how your code fits into the bigger picture.", color: "blue" }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-start gap-4"
                    variants={itemVariants}
                    whileHover={{ x: 5 }}
                  >
                    <motion.div 
                      className={`h-10 w-10 rounded-full bg-${item.color}-500/20 flex items-center justify-center flex-shrink-0`}
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <item.icon className={`h-5 w-5 text-${item.color}-400`} />
                    </motion.div>
                    <div>
                      <h4 className={`text-lg font-semibold text-${item.color}-300 mb-2`}>{item.title}</h4>
                      <p className="text-gray-300 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="space-y-6">
                {[
                  { icon: Users, title: "Preserved Knowledge", desc: "Critical architectural knowledge doesn't walk out the door when senior developers leave.", color: "green" },
                  { icon: Shield, title: "Safer Refactoring", desc: "Modernize legacy systems with confidence, understanding all dependencies and potential impacts.", color: "purple" }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-start gap-4"
                    variants={itemVariants}
                    whileHover={{ x: 5 }}
                  >
                    <motion.div 
                      className={`h-10 w-10 rounded-full bg-${item.color}-500/20 flex items-center justify-center flex-shrink-0`}
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <item.icon className={`h-5 w-5 text-${item.color}-400`} />
                    </motion.div>
                    <div>
                      <h4 className={`text-lg font-semibold text-${item.color}-300 mb-2`}>{item.title}</h4>
                      <p className="text-gray-300 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* The Future - Enhanced with animations */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 2.0 }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              className="p-8 md:p-12 border border-dashed border-blue-500/30 rounded-lg glass-card hover:border-blue-500/50 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <motion.h3 
                className="text-2xl md:text-3xl font-semibold mb-6 text-blue-300"
                whileHover={{ scale: 1.05 }}
              >
                The Future of Development
              </motion.h3>
              <motion.p 
                className="text-gray-300 text-lg leading-relaxed mb-6"
                initial={{ opacity: 0.8 }}
                whileHover={{ opacity: 1 }}
              >
                Imagine a world where every developer has an AI partner that truly understands their code. 
                Where onboarding is measured in hours, not weeks. Where legacy systems become assets, not liabilities.
              </motion.p>
              <motion.p 
                className="text-blue-300 text-lg font-medium"
                whileHover={{ scale: 1.05 }}
              >
                That's the future we're building, one codebase at a time.
              </motion.p>
              
              <motion.div 
                className="mt-8 pt-8 border-t border-blue-500/20"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 2.4 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  {[
                    { emoji: "🚀", title: "Ship Faster", desc: "Spend time building, not understanding" },
                    { emoji: "🧠", title: "Learn Smarter", desc: "AI that grows with your team" },
                    { emoji: "🔒", title: "Stay Secure", desc: "Your code never leaves your environment" }
                  ].map((item, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.5, delay: 2.6 + index * 0.2 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <motion.div 
                        className="text-2xl mb-2"
                        whileHover={{ 
                          scale: 1.3,
                          rotate: [0, -15, 15, 0]
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {item.emoji}
                      </motion.div>
                      <div className="text-white font-medium">{item.title}</div>
                      <div className="text-gray-400 text-sm">{item.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VisionSection;
