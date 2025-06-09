import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import TimelineInvestigator from '@/components/TimelineInvestigator';
import { 
  Clock, 
  GitBranch,
  FileText,
  Zap,
  Github,
  ArrowRight,
  Info
} from 'lucide-react';

const TimelineDemo: React.FC = () => {
  const [sessionId, setSessionId] = useState('');
  const [filePath, setFilePath] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    if (!sessionId.trim()) {
      toast({
        title: "Session ID Required",
        description: "Please enter a session ID to connect",
        variant: "destructive",
      });
      return;
    }
    setIsConnected(true);
    toast({
      title: "🔗 Connected!",
      description: "Timeline investigation is ready",
    });
  };

  const handleFilePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilePath(e.target.value);
  };

  const demoMetrics = [
    { label: 'Cold-sync Speed', value: '<120s', icon: Clock },
    { label: 'Timeline Load', value: '<300ms', icon: Zap },
    { label: 'Diff Retrieval', value: '<20ms', icon: FileText },
    { label: 'Navigation', value: '⚡ Instant', icon: ArrowRight }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">Timeline Investigation Demo</h1>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                Live Demo
              </Badge>
            </div>
            <Button variant="outline" asChild>
              <a href="/assistant" className="flex items-center space-x-2">
                <ArrowRight className="w-4 h-4" />
                <span>Back to Assistant</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Time-Scrub Timeline
          </h2>
          <p className="text-xl text-gray-400 mb-6 max-w-3xl mx-auto">
            Drag timeline → Jump to commit → Find the bug in &lt;300ms. 
            The fastest way to answer "when/why did this change?"
          </p>
          
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            {demoMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center"
              >
                <metric.icon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <div className="text-lg font-bold text-white">{metric.value}</div>
                <div className="text-sm text-gray-400">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Connection Setup */}
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GitBranch className="w-5 h-5" />
                  <span>Connect to Repository Session</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Session ID
                  </label>
                  <Input
                    placeholder="Enter your repository session ID..."
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                </div>
                
                <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-200">
                      <div className="font-medium mb-1">How to get a session ID:</div>
                      <ol className="list-decimal list-inside space-y-1 text-blue-300">
                        <li>Go to the Assistant page</li>
                        <li>Create or select a repository session</li>
                        <li>Copy the session ID from the URL</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleConnect}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={!sessionId.trim()}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Connect & Start Timeline
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Timeline Interface */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* File Path Input */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Enter file path (e.g., src/main.py, components/App.tsx)..."
                    value={filePath}
                    onChange={handleFilePathChange}
                    className="flex-1 bg-gray-900/50 border-gray-600 text-white"
                  />
                  <Badge variant={filePath ? 'default' : 'secondary'}>
                    {filePath ? 'Ready' : 'Enter path'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Component */}
            <TimelineInvestigator
              sessionId={sessionId}
              filePath={filePath || undefined}
              className="bg-gray-800/30 border border-gray-700 rounded-lg"
            />

            {/* Demo Features */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">🎯 Interactive Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Drag timeline bars to navigate commits</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Color-coded churn visualization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>One-click issue creation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>Keyboard navigation (← →)</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">⚡ Performance Targets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Timeline load</span>
                    <Badge variant="outline" className="text-green-400 border-green-500">
                      &lt; 300ms
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Commit navigation</span>
                    <Badge variant="outline" className="text-blue-400 border-blue-500">
                      &lt; 100ms
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Diff retrieval</span>
                    <Badge variant="outline" className="text-purple-400 border-purple-500">
                      &lt; 20ms
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Issue creation</span>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-500">
                      &lt; 2s
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TimelineDemo; 