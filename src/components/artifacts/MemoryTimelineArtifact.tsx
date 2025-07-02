import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Clock, Zap, Target, Download, RotateCcw, Settings } from 'lucide-react';
import { MemoryData } from '@/types/canvas.types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useToast } from '@/hooks/useToast';

interface MemoryTimelineArtifactProps {
  data: MemoryData;
  onTimePointClick: (day: number) => void;
}

export const MemoryTimelineArtifact: React.FC<MemoryTimelineArtifactProps> = ({ 
  data, 
  onTimePointClick 
}) => {
  const { addToast } = useToast();
  const formatTooltip = (value: any, name: string) => {
    if (name === 'patterns') return [`${value.toLocaleString()} patterns`, 'Patterns Learned'];
    if (name === 'successRate') return [`${value}%`, 'Success Rate'];
    if (name === 'responseTime') return [`${value}s`, 'Response Time'];
    return [value, name];
  };

  const getPerformanceColor = (value: number, type: 'success' | 'speed') => {
    if (type === 'success') {
      if (value >= 90) return 'text-green-500';
      if (value >= 80) return 'text-yellow-500';
      return 'text-red-500';
    } else {
      if (value <= 1) return 'text-green-500';
      if (value <= 2) return 'text-yellow-500';
      return 'text-red-500';
    }
  };

  const improvementFromDay1 = data.timeline.length > 1 ? {
    successRate: data.currentStats.querySuccessRate - data.timeline[0].successRate,
    responseTime: ((data.timeline[0].responseTime - data.currentStats.avgResponseTime) / data.timeline[0].responseTime) * 100,
  } : { successRate: 0, responseTime: 0 };

  return (
    <Card className="p-6 space-y-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-card to-card/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-sm">
            <Brain className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Repository Memory
            </h3>
            <p className="text-sm text-muted-foreground">Learning progress and intelligence growth</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-600 tabular-nums">
            {data.currentStats.totalPatterns.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground font-medium">Total Patterns</p>
        </div>
      </div>

      {/* Learning Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Learning Timeline</h4>
          <Badge variant="outline" className="text-xs">
            {data.timeline.length} days tracked
          </Badge>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeline} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="patternsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="day" 
                label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                className="text-xs"
              />
              <YAxis 
                yAxisId="left" 
                label={{ value: 'Patterns', angle: -90, position: 'insideLeft' }}
                className="text-xs"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                label={{ value: 'Success Rate %', angle: 90, position: 'insideRight' }}
                className="text-xs"
              />
              <Tooltip formatter={formatTooltip} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="patterns"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#patternsGradient)"
                strokeWidth={2}
                name="patterns"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="successRate"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="successRate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Current Performance Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Learning Velocity</span>
          </div>
          <p className="text-xl font-bold text-blue-700">
            {data.currentStats.learningVelocity}
          </p>
          <p className="text-xs text-blue-600">patterns/day</p>
          <Progress value={75} className="h-2" />
        </div>
        
        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Success Rate</span>
          </div>
          <p className={`text-xl font-bold ${getPerformanceColor(data.currentStats.querySuccessRate, 'success')}`}>
            {data.currentStats.querySuccessRate}%
          </p>
          <p className="text-xs text-green-600">
            ▲ {improvementFromDay1.successRate.toFixed(1)}% vs Day 1
          </p>
          <Progress value={data.currentStats.querySuccessRate} className="h-2" />
        </div>
        
        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Response Time</span>
          </div>
          <p className={`text-xl font-bold ${getPerformanceColor(data.currentStats.avgResponseTime, 'speed')}`}>
            {data.currentStats.avgResponseTime}s
          </p>
          <p className="text-xs text-purple-600">
            ▼ {improvementFromDay1.responseTime.toFixed(0)}% faster
          </p>
          <Progress value={100 - (data.currentStats.avgResponseTime / 3 * 100)} className="h-2" />
        </div>
        
        <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Time to Value</span>
          </div>
          <p className="text-xl font-bold text-orange-700">
            &lt;5min
          </p>
          <p className="text-xs text-orange-600">first insight</p>
          <Progress value={90} className="h-2" />
        </div>
      </div>

      {/* Predictions Section */}
      <div className="space-y-4">
        <h4 className="font-medium">30-Day Projections</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Expected Patterns</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                Projection
              </Badge>
            </div>
            <p className="text-2xl font-bold text-blue-800">
              {data.predictions.day30Patterns.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {Math.round((data.predictions.day30Patterns - data.currentStats.totalPatterns) / 30)} patterns/day growth
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Success Rate Target</span>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                Goal
              </Badge>
            </div>
            <p className="text-2xl font-bold text-green-800">
              {data.predictions.day30SuccessRate}%
            </p>
            <p className="text-xs text-green-600 mt-1">
              +{data.predictions.day30SuccessRate - data.currentStats.querySuccessRate}% improvement target
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Timeline */}
      <div className="space-y-3">
        <h4 className="font-medium">Learning Milestones</h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {data.timeline.map((point, index) => (
            <Button
              key={point.day}
              variant="outline"
              size="sm"
              onClick={() => onTimePointClick(point.day)}
              className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <span className="text-xs font-medium">Day {point.day}</span>
              <span className="text-xs text-muted-foreground">
                {point.patterns.toLocaleString()}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1"
          onClick={() => {
            addToast({
              message: 'Preparing learning data export...',
              type: 'info'
            });
            // Mock export process
            setTimeout(() => {
              addToast({
                message: 'Learning data exported successfully (4,721 patterns)',
                type: 'success'
              });
            }, 2000);
          }}
        >
          <Download className="h-3 w-3 mr-1" />
          Export Learning Data
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            addToast({
              message: 'Are you sure? This will reset all learned patterns.',
              type: 'warning'
            });
            // Mock reset confirmation
            setTimeout(() => {
              addToast({
                message: 'Memory reset cancelled - patterns preserved',
                type: 'info'
              });
            }, 3000);
          }}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset Memory
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            addToast({
              message: 'Running memory optimization...',
              type: 'info'
            });
            // Mock optimization process
            setTimeout(() => {
              addToast({
                message: 'Memory optimized - 15% faster query processing',
                type: 'success'
              });
            }, 3000);
          }}
        >
          <Settings className="h-3 w-3 mr-1" />
          Optimize
        </Button>
      </div>
    </Card>
  );
};