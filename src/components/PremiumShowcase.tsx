import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { 
  Code2, 
  GitBranch, 
  Shield, 
  Zap, 
  Brain, 
  Search,
  FileText,
  GitCommit,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Database,
  Cpu,
  Lock,
  Target,
  TrendingUp,
  Workflow,
  Eye,
  Settings,
  Terminal,
  Layers,
  Network,
  History,
  Gauge
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PremiumShowcase = () => {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const [selectedFeature, setSelectedFeature] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setAnalysisProgress(prev => (prev >= 100 ? 0 : prev + 1));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const coreFeatures = [
    {
      title: "Memory-First Intelligence",
      subtitle: "Unlike stateless tools, triage.flow learns and remembers your codebase patterns, improving with every interaction.",
      demo: "memory",
      stats: [
        { label: "Files Analyzed", value: "12,847" },
        { label: "Patterns Learned", value: "3,291" },
        { label: "Dependencies Mapped", value: "8,456" }
      ]
    },
    {
      title: "Multi-Agent Architecture", 
      subtitle: "Specialized agents for security, quality, performance, and legacy modernization work together to provide comprehensive repository intelligence.",
      demo: "agents",
      agents: [
        { name: "Security Agent", status: "active", color: "bg-red-500", task: "Scanning for vulnerabilities" },
        { name: "Quality Agent", status: "analyzing", color: "bg-yellow-500", task: "Code quality assessment" },
        { name: "Performance Agent", status: "idle", color: "bg-green-500", task: "Performance optimization" },
        { name: "Legacy Agent", status: "active", color: "bg-purple-500", task: "Modernization planning" },
        { name: "Grounding Agent", status: "monitoring", color: "bg-blue-500", task: "Fact verification" }
      ]
    },
    {
      title: "Autonomous Legacy Modernization",
      subtitle: "End-to-end legacy code analysis and modernization with risk assessment and automated refactoring recommendations.",
      demo: "legacy",
      modernization: [
        { phase: "Analysis", progress: 100, status: "complete", color: "text-green-400" },
        { phase: "Risk Assessment", progress: 85, status: "active", color: "text-blue-400" },
        { phase: "Migration Planning", progress: 60, status: "active", color: "text-yellow-400" },
        { phase: "Implementation", progress: 0, status: "pending", color: "text-gray-400" }
      ]
    },
    {
      title: "Enterprise Security & Privacy",
      subtitle: "Privacy-preserving Merkle tree indexing with enterprise-grade security, audit trails, and air-gapped deployment options.",
      demo: "security",
      security: [
        { feature: "SOC 2 Compliance", status: "certified", icon: Shield },
        { feature: "Merkle Tree Indexing", status: "active", icon: Network },
        { feature: "Audit Trails", status: "logging", icon: History },
        { feature: "Air-Gapped Deployment", status: "available", icon: Lock }
      ]
    }
  ];

  const roadmapPhases = [
    {
      title: "Phase 1: Foundation",
      subtitle: "Memory-First Autonomous Intelligence",
      timeline: "Months 1-6",
      features: [
        "Autonomous repository memory system with persistent learning",
        "Multi-agent architecture (security, quality, performance agents)",
        "Senior engineer experience with advanced command palette",
        "Legacy code understanding with modernization recommendations",
        "Privacy-preserving Merkle tree indexing",
        "Enterprise-grade security from day one"
      ],
      status: "In Development"
    },
    {
      title: "Phase 2: Enterprise Expansion", 
      subtitle: "Autonomous Operations",
      timeline: "Months 7-12",
      features: [
        "Enterprise memory management with cross-repository learning",
        "Autonomous modernization agents with risk assessment",
        "Advanced multi-agent workflows and orchestration",
        "FedRAMP compliance and air-gapped deployment",
        "Government and enterprise audit trails"
      ],
      status: "Planned"
    },
    {
      title: "Phase 3: Market Leadership",
      subtitle: "Repository Evolution",
      timeline: "Months 13-24", 
      features: [
        "Predictive repository evolution and autonomous tech debt management",
        "Cross-organization intelligence with privacy preservation",
        "Advanced agent ecosystem and marketplace",
        "Complete legacy modernization platform"
      ],
      status: "Vision"
    }
  ];

  const intelligenceCapabilities = [
    {
      title: "Senior Engineer/Architect Agent",
      description: "Instant codebase understanding, advanced command palette, and autonomous modernization planning",
      metrics: "10x faster onboarding, 55% faster debugging",
      icon: Eye,
      color: "blue",
      persona: "Staff+ Engineers"
    },
    {
      title: "Team Lead Intelligence",
      description: "Real-time repository health monitoring and technical debt assessment with risk analysis",
      metrics: "40% reduction in production incidents",
      icon: Users,
      color: "purple",
      persona: "Team Leads"
    },
    {
      title: "Engineering Manager Insights",
      description: "Data-driven team productivity insights, delivery velocity tracking, and resource optimization",
      metrics: "30% improvement in delivery velocity",
      icon: TrendingUp,
      color: "green",
      persona: "Engineering Managers"
    },
    {
      title: "Executive Dashboard",
      description: "Strategic decision-making with executive dashboards, trend analysis, and resource allocation insights",
      metrics: "25% better resource allocation",
      icon: Gauge,
      color: "yellow",
      persona: "CTOs/VPs Engineering"
    },
    {
      title: "Security Intelligence",
      description: "Automated vulnerability detection, AI-generated code validation, and continuous security monitoring",
      metrics: "60% faster vulnerability detection",
      icon: Shield,
      color: "red",
      persona: "Security Teams"
    },
    {
      title: "Cross-Repository Learning",
      description: "Organization-wide pattern recognition, best practices sharing, and institutional knowledge capture",
      metrics: "3x better pattern recognition",
      icon: Network,
      color: "cyan",
      persona: "Entire Organization"
    }
  ];

  return (
    <div className="space-y-32">
      {/* Core Features Showcase */}
      <section className="py-20 relative overflow-hidden bg-black" ref={ref}>
        {/* Animated background */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>

        <div className="container px-4 md:px-6 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Core Features
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              The security-first autonomous agent that understands your legacy code better than you do
            </p>
          </motion.div>

          {/* Main Feature Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left side - Feature description */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.h3 
                className="text-3xl md:text-4xl font-bold text-white mb-6"
                layoutId="feature-title"
              >
                {coreFeatures[selectedFeature].title}
              </motion.h3>
              <motion.p 
                className="text-gray-300 text-lg mb-8 leading-relaxed"
                layoutId="feature-subtitle"
              >
                {coreFeatures[selectedFeature].subtitle}
              </motion.p>

              {/* Dynamic content based on selected feature */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Memory Stats */}
                  {coreFeatures[selectedFeature].stats && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {coreFeatures[selectedFeature].stats.map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                        >
                          <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
                          <div className="text-sm text-gray-400">{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Multi-Agent Status */}
                  {coreFeatures[selectedFeature].agents && (
                    <div className="space-y-3 mb-8">
                      {coreFeatures[selectedFeature].agents.map((agent, index) => (
                        <motion.div
                          key={agent.name}
                          className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                        >
                          <div className={`w-3 h-3 rounded-full ${agent.color} ${agent.status === 'analyzing' || agent.status === 'monitoring' ? 'animate-pulse' : ''}`}></div>
                          <div className="flex-1">
                            <span className="text-white font-medium block">{agent.name}</span>
                            <span className="text-xs text-gray-400">{agent.task}</span>
                          </div>
                          <span className="text-sm text-gray-400 capitalize">{agent.status}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Modernization Progress */}
                  {coreFeatures[selectedFeature].modernization && (
                    <div className="space-y-4 mb-8">
                      {coreFeatures[selectedFeature].modernization.map((phase, index) => (
                        <motion.div
                          key={phase.phase}
                          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">{phase.phase}</span>
                            <span className={`text-sm ${phase.color} capitalize`}>{phase.status}</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <motion.div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              initial={{ width: "0%" }}
                              animate={{ width: `${phase.progress}%` }}
                              transition={{ duration: 1, delay: index * 0.2 }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Security Features */}
                  {coreFeatures[selectedFeature].security && (
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {coreFeatures[selectedFeature].security.map((item, index) => (
                        <motion.div
                          key={item.feature}
                          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-3"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <item.icon className="h-4 w-4 text-green-400" />
                            <span className="text-white text-sm font-medium">{item.feature}</span>
                          </div>
                          <span className="text-xs text-green-400 capitalize">{item.status}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Feature Navigation */}
              <div className="flex gap-2">
                {coreFeatures.map((_, index) => (
                  <motion.button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      selectedFeature === index ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                    onClick={() => setSelectedFeature(index)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Right side - Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedFeature}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Repository Analysis Interface */}
                  <Card className="bg-gray-800/80 backdrop-blur-xl border-gray-700 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header */}
                      <div className="bg-gray-900/50 p-4 flex items-center justify-between border-b border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <span className="text-white text-sm font-medium">triage.flow - Repository Analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.div 
                            className="w-2 h-2 rounded-full bg-blue-500"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <span className="text-blue-400 text-xs">AI Active</span>
                        </div>
                      </div>

                      {/* Analysis Content */}
                      <div className="p-6">
                        {selectedFeature === 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <Brain className="h-5 w-5 text-blue-400" />
                              <span className="text-white font-medium">Memory Analysis</span>
                            </div>
                            <div className="space-y-3">
                              <div className="bg-gray-700/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4 text-green-400" />
                                  <span className="text-sm text-white">Learning codebase patterns...</span>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-2">
                                  <motion.div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${analysisProgress}%` }}
                                    transition={{ duration: 0.1 }}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-700/30 rounded p-2 text-center">
                                  <div className="text-blue-400 font-bold">87%</div>
                                  <div className="text-xs text-gray-400">Pattern Recognition</div>
                                </div>
                                <div className="bg-gray-700/30 rounded p-2 text-center">
                                  <div className="text-purple-400 font-bold">92%</div>
                                  <div className="text-xs text-gray-400">Memory Retention</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedFeature === 1 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <Users className="h-5 w-5 text-purple-400" />
                              <span className="text-white font-medium">Agent Coordination</span>
                            </div>
                            <div className="space-y-2">
                              {coreFeatures[1].agents.map((agent, index) => (
                                <motion.div
                                  key={agent.name}
                                  className="flex items-center justify-between bg-gray-700/30 rounded-lg p-3"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${agent.color} ${agent.status === 'analyzing' || agent.status === 'monitoring' ? 'animate-pulse' : ''}`}></div>
                                    <span className="text-white text-sm">{agent.name}</span>
                                  </div>
                                  <span className="text-xs text-gray-400 capitalize">{agent.status}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedFeature === 2 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <Code2 className="h-5 w-5 text-yellow-400" />
                              <span className="text-white font-medium">Legacy Modernization</span>
                            </div>
                            <div className="space-y-3">
                              {coreFeatures[2].modernization.map((phase, index) => (
                                <div key={phase.phase} className="bg-gray-700/30 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-white">{phase.phase}</span>
                                    <span className={`text-xs ${phase.color}`}>{phase.progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-600 rounded-full h-1">
                                    <div 
                                      className="bg-gradient-to-r from-yellow-500 to-green-500 h-1 rounded-full transition-all duration-1000"
                                      style={{ width: `${phase.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedFeature === 3 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <Shield className="h-5 w-5 text-green-400" />
                              <span className="text-white font-medium">Security & Compliance</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {coreFeatures[3].security.map((item, index) => (
                                <div key={item.feature} className="bg-gray-700/30 rounded p-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <item.icon className="h-3 w-3 text-green-400" />
                                    <span className="text-xs text-white">{item.feature}</span>
                                  </div>
                                  <span className="text-xs text-green-400">{item.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Floating AI Status */}
              <motion.div
                className="absolute -top-4 -right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-xl"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  <span className="text-sm font-medium">AI Learning</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

             {/* Intelligence Capabilities */}
       <section className="py-20 bg-gray-900/50">
         <div className="container px-4 md:px-6">
           <motion.div 
             className="text-center mb-16"
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             viewport={{ once: true }}
           >
             <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
               Autonomous Repository Intelligence
             </h2>
             <p className="text-gray-300 text-lg max-w-3xl mx-auto">
               One AI agent that serves every role in your organization - from senior engineers to executives, 
               providing specialized intelligence for each persona's unique needs
             </p>
           </motion.div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {intelligenceCapabilities.map((capability, index) => (
                             <motion.div
                 key={index}
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: index * 0.2 }}
                 viewport={{ once: true }}
               >
                 <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700 hover:bg-gray-800/70 transition-all duration-300 group h-full">
                   <CardContent className="p-6">
                     <motion.div
                       className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all ${
                         capability.color === 'blue' ? 'bg-white/10 group-hover:bg-white/20' :
                         capability.color === 'purple' ? 'bg-white/10 group-hover:bg-white/20' :
                         capability.color === 'green' ? 'bg-white/10 group-hover:bg-white/20' :
                         capability.color === 'yellow' ? 'bg-white/10 group-hover:bg-white/20' :
                         capability.color === 'red' ? 'bg-white/10 group-hover:bg-white/20' :
                         capability.color === 'cyan' ? 'bg-white/10 group-hover:bg-white/20' :
                         'bg-white/10 group-hover:bg-white/20'
                       }`}
                       whileHover={{ scale: 1.1, rotate: 5 }}
                     >
                       <capability.icon className="h-6 w-6 text-white/80" />
                     </motion.div>
                     <div className="mb-3">
                       <h3 className="text-white font-semibold text-xl mb-1">{capability.title}</h3>
                       <span className="text-xs px-2 py-1 rounded-full font-medium bg-white/10 text-white/70">
                         {capability.persona}
                       </span>
                     </div>
                     <p className="text-white/60 mb-4 leading-relaxed">{capability.description}</p>
                     <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white/80">
                       {capability.metrics}
                     </div>
                   </CardContent>
                 </Card>
               </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Roadmap */}
      <section className="py-20 bg-black">
        <div className="container px-4 md:px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Development Roadmap
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Our path to becoming the market leader in autonomous repository intelligence
            </p>
          </motion.div>

          {/* Phase Navigation */}
          <div className="flex justify-center mb-12">
            <div className="flex gap-2 bg-gray-800/50 rounded-full p-2">
              {roadmapPhases.map((_, index) => (
                <motion.button
                  key={index}
                  className={`px-6 py-2 rounded-full transition-all ${
                    selectedPhase === index 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setSelectedPhase(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Phase {index + 1}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Phase Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPhase}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {roadmapPhases[selectedPhase].title}
                    </h3>
                    <p className="text-xl text-blue-400 mb-2">
                      {roadmapPhases[selectedPhase].subtitle}
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-gray-400">{roadmapPhases[selectedPhase].timeline}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        roadmapPhases[selectedPhase].status === 'In Development' 
                          ? 'bg-green-500/20 text-green-400'
                          : roadmapPhases[selectedPhase].status === 'Planned'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {roadmapPhases[selectedPhase].status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roadmapPhases[selectedPhase].features.map((feature, index) => (
                      <motion.div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-gray-700/30 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>


    </div>
  );
};

export default PremiumShowcase; 