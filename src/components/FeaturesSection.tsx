import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brain, 
  Shield, 
  Code2, 
  Users, 
  Search,
  GitBranch,
  Zap,
  MessageSquare,
  Eye,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const features = [
  {
    title: "Persistent Memory",
    description: "Unlike other AI tools that forget everything after each conversation, our agent builds a growing understanding of your codebase that gets smarter over time.",
    icon: <Brain className="h-8 w-8 text-blue-400" />,
    highlight: "Remembers everything",
    color: "blue",
    gradient: "from-blue-500/10 to-blue-600/5"
  },
  {
    title: "Multi-Agent Intelligence",
    description: "Different specialized agents handle different aspects - one for security analysis, another for performance, another for code quality - all working together.",
    icon: <Users className="h-8 w-8 text-purple-400" />,
    highlight: "Specialized expertise",
    color: "purple",
    gradient: "from-purple-500/10 to-purple-600/5"
  },
  {
    title: "Deep Code Analysis",
    description: "Goes beyond surface-level analysis to understand architecture patterns, data flow, dependencies, and the reasoning behind design decisions.",
    icon: <Eye className="h-8 w-8 text-green-400" />,
    highlight: "Architectural understanding",
    color: "green",
    gradient: "from-green-500/10 to-green-600/5"
  },
  {
    title: "Legacy Code Expert",
    description: "Specifically trained to understand complex legacy systems, untangle technical debt, and explain code that even the original authors might struggle with.",
    icon: <Code2 className="h-8 w-8 text-yellow-400" />,
    highlight: "Legacy specialist",
    color: "yellow",
    gradient: "from-yellow-500/10 to-yellow-600/5"
  },
  {
    title: "Interactive Exploration",
    description: "Ask questions, explore codebases, trace through execution paths, and understand how changes will impact the system - all through natural conversation.",
    icon: <MessageSquare className="h-8 w-8 text-indigo-400" />,
    highlight: "Natural conversation",
    color: "indigo",
    gradient: "from-indigo-500/10 to-indigo-600/5"
  },
  {
    title: "Enterprise Security",
    description: "Your code never leaves your environment. Built with privacy-first architecture, audit trails, and enterprise-grade security from the ground up.",
    icon: <Shield className="h-8 w-8 text-cyan-400" />,
    highlight: "Privacy-first",
    color: "cyan",
    gradient: "from-cyan-500/10 to-cyan-600/5"
  },
];

const FeaturesSection = () => {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
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
    <section id="features" className="py-16 md:py-24 relative overflow-hidden" ref={ref}>
      {/* Enhanced animated background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-blue-500/3 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/2 blur-3xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-green-500/2 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
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
            className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 inline-block border border-blue-500/20"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <Brain className="h-3 w-3 inline mr-1" />
            </motion.div>
            How It Works
          </motion.span>
          <motion.h2 
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            An AI Agent That Actually Understands Code
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-3xl mx-auto text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Built specifically for developers who work with complex codebases. Our agent doesn't just generate code - 
            it understands your existing code, learns your patterns, and helps you navigate complexity.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className={`feature-card border-${feature.color}-500/20 hover:border-${feature.color}-500/40 overflow-hidden backdrop-blur-lg group transition-all duration-500 bg-gradient-to-br ${feature.gradient} hover:shadow-xl hover:shadow-${feature.color}-500/10`}>
                <CardHeader className="pb-3">
                  <motion.div 
                    className={`mb-4 p-3 rounded-lg bg-${feature.color}-500/10 w-fit group-hover:bg-${feature.color}-500/20 transition-all duration-300 border border-${feature.color}-500/20`}
                    whileHover={{ 
                      rotate: [0, -5, 5, 0],
                      scale: 1.1
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <CardTitle className="text-lg md:text-xl font-semibold text-white group-hover:text-white/90 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <motion.p 
                    className="text-muted-foreground mb-4 leading-relaxed group-hover:text-gray-300 transition-colors"
                    initial={{ opacity: 0.8 }}
                    whileHover={{ opacity: 1 }}
                  >
                    {feature.description}
                  </motion.p>
                  <motion.div 
                    className={`bg-${feature.color}-500/10 text-${feature.color}-300 text-sm px-3 py-1.5 rounded-full inline-block border border-${feature.color}-500/20 group-hover:bg-${feature.color}-500/20 transition-all duration-300`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {feature.highlight}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* What makes it different - Enhanced animations */}
        <motion.div 
          className="mt-12 md:mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Use Cases */}
            <motion.div 
              className="p-6 md:p-8 border border-dashed border-blue-500/30 rounded-lg glass-card hover:border-blue-500/50 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <motion.h3 
                className="text-xl md:text-2xl font-semibold mb-4 text-blue-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Target className="h-6 w-6" />
                </motion.div>
                Perfect For
              </motion.h3>
              <div className="grid grid-cols-1 gap-4 text-left">
                <div className="space-y-3">
                  {[
                    "Understanding unfamiliar codebases quickly",
                    "Onboarding new team members to complex systems", 
                    "Debugging issues across large codebases",
                    "Planning refactoring and modernization efforts",
                    "Code reviews and architectural decisions",
                    "Documentation and knowledge sharing"
                  ].map((item, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: 1.0 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <motion.span 
                        className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"
                        whileHover={{ scale: 1.5 }}
                      />
                      <span className="text-gray-300">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* How it's different */}
            <motion.div 
              className="p-6 md:p-8 border border-dashed border-green-500/30 rounded-lg glass-card hover:border-green-500/50 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <motion.h3 
                className="text-xl md:text-2xl font-semibold mb-4 text-green-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Zap className="h-6 w-6" />
                </motion.div>
                What Makes It Different
              </motion.h3>
              <div className="space-y-4">
                {[
                  { icon: Brain, title: "Memory vs. Stateless", desc: "Builds understanding over time instead of forgetting everything" },
                  { icon: Eye, title: "Understanding vs. Generation", desc: "Focuses on comprehending existing code, not just writing new code" },
                  { icon: GitBranch, title: "Repository-Wide vs. File-Level", desc: "Understands entire systems and their relationships, not just individual files" },
                  { icon: Shield, title: "Privacy-First vs. Cloud-Dependent", desc: "Your code stays in your environment, not sent to external services" }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <motion.div 
                      className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.3 }}
                    >
                      <item.icon className="h-3 w-3 text-green-400" />
                    </motion.div>
                    <div>
                      <div className="text-green-300 font-medium">{item.title}</div>
                      <div className="text-gray-400 text-sm">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Simple demo section - Enhanced */}
        <motion.div 
          className="mt-12 md:mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.4 }}
        >
          <motion.div 
            className="max-w-4xl mx-auto p-6 md:p-8 border border-dashed border-purple-500/30 rounded-lg glass-card hover:border-purple-500/50 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
          >
            <motion.h3 
              className="text-xl md:text-2xl font-semibold mb-6 text-purple-300"
              whileHover={{ scale: 1.05 }}
            >
              See It In Action
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { emoji: "🔍", title: "Explore", desc: '"Show me how user authentication works in this codebase"' },
                { emoji: "🧠", title: "Understand", desc: '"Why was this architecture decision made?"' },
                { emoji: "🚀", title: "Improve", desc: '"What would happen if we refactor this module?"' }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 1.6 + index * 0.2 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div 
                    className="text-2xl mb-3"
                    whileHover={{ 
                      scale: 1.2,
                      rotate: [0, -10, 10, 0]
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {item.emoji}
                  </motion.div>
                  <div className="text-white font-medium mb-1">{item.title}</div>
                  <div className="text-gray-400 text-sm">{item.desc}</div>
                </motion.div>
              ))}
            </div>
            <motion.div 
              className="mt-6 pt-6 border-t border-purple-500/20"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 2.2 }}
            >
              <p className="text-gray-300 text-sm">
                <span className="text-purple-300 font-medium">Try it yourself:</span> Point our agent at any GitHub repository and start asking questions about the code.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
