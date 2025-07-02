import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, DollarSign, FileText, Package, Clock, Download, Eye } from 'lucide-react';
import { LegacyAnalysisData } from '@/types/canvas.types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface LegacyAnalysisArtifactProps {
  data: LegacyAnalysisData;
  onDrillDown: (section: string) => void;
}

export const LegacyAnalysisArtifact: React.FC<LegacyAnalysisArtifactProps> = ({ 
  data, 
  onDrillDown 
}) => {
  const { addToast } = useToast();
  
  const handleDrillDown = (section: string) => {
    // Mock detailed view functionality
    const sectionInfo = {
      'technical-debt': 'Technical Debt Analysis - 47 high-impact issues found',
      'full-analysis': 'Full Analysis Report - 234 files analyzed, 12 recommendations',
      'export': 'Legacy Analysis Report exported successfully',
    };
    
    const message = sectionInfo[section as keyof typeof sectionInfo] || `Viewing ${section} details`;
    
    addToast({
      message,
      type: section === 'export' ? 'success' : 'info'
    });
    
    if (section.startsWith('phase-')) {
      const phaseNum = parseInt(section.split('-')[1]) + 1;
      addToast({
        message: `Phase ${phaseNum} Modernization Plan - Estimated 3-6 months`,
        type: 'info'
      });
    }
    
    // Call the original onDrillDown for any additional handling
    onDrillDown(section);
  };
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-300 bg-red-900/30 border-red-600';
      case 'medium': return 'text-yellow-300 bg-yellow-900/30 border-yellow-600';
      case 'low': return 'text-green-300 bg-green-900/30 border-green-600';
      default: return 'text-slate-300 bg-slate-800/30 border-slate-600';
    }
  };

  const getComplexityColor = (score: number) => {
    if (score >= 8) return 'text-red-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card className="p-6 space-y-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 bg-gradient-to-br from-card to-card/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center shadow-sm">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Legacy Code Analysis
            </h3>
            <p className="text-sm text-muted-foreground">Real-time repository assessment</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">Complexity Score</span>
            <span className={cn("text-3xl font-bold tabular-nums", getComplexityColor(data.complexityScore))}>
              {data.complexityScore}/10
            </span>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "font-medium",
              data.complexityScore >= 8 ? 'border-red-600 bg-red-900/30 text-red-300' : 
              data.complexityScore >= 6 ? 'border-yellow-600 bg-yellow-900/30 text-yellow-300' : 
              'border-green-600 bg-green-900/30 text-green-300'
            )}
          >
            {data.complexityScore >= 8 ? 'High Risk' : data.complexityScore >= 6 ? 'Medium Risk' : 'Low Risk'}
          </Badge>
        </div>
      </div>

      {/* Technical Debt Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-yellow-500" />
          <span className="font-medium">Technical Debt Impact</span>
        </div>
        
        <div className="p-5 rounded-xl bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border border-yellow-200/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-1">
              <div className="text-4xl font-bold text-gray-900 tabular-nums tracking-tight">
                {data.technicalDebt.currency}{data.technicalDebt.amount.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Estimated maintenance cost
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDrillDown('technical-debt')}
              className="bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-sm border-slate-600"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Debt Level</span>
              <span>{Math.round((data.complexityScore / 10) * 100)}%</span>
            </div>
            <Progress 
              value={(data.complexityScore / 10) * 100} 
              className="h-2"
            />
          </div>
        </div>
      </div>

      {/* Code Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
              <FileText className="h-3 w-3 text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Lines of Code</span>
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{data.codeMetrics.loc.toLocaleString()}</p>
        </div>
        
        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
              <FileText className="h-3 w-3 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600">Files</span>
          </div>
          <p className="text-xl font-bold text-blue-900 tabular-nums">{data.codeMetrics.files}</p>
        </div>
        
        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200/50 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
              <Package className="h-3 w-3 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600">Dependencies</span>
          </div>
          <p className="text-xl font-bold text-purple-900 tabular-nums">{data.codeMetrics.dependencies}</p>
        </div>
        
        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/50 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-orange-600">Outdated</span>
          </div>
          <p className="text-xl font-bold text-orange-900 tabular-nums">{data.codeMetrics.outdatedDeps}</p>
        </div>
      </div>

      {/* Modernization Path */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <h4 className="font-medium">Modernization Roadmap</h4>
          </div>
          <Badge variant="outline" className="text-xs">
            {data.modernizationPath.phases.length} phases
          </Badge>
        </div>
        
        <div className="space-y-3">
          {data.modernizationPath.phases.map((phase, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={() => handleDrillDown(`phase-${index}`)}
              className="w-full h-auto p-4 justify-start hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4 w-full">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
                  {index + 1}
                </div>
                
                <div className="flex-1 text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{phase.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {phase.duration}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getRiskColor(phase.risk))}
                      >
                        {phase.risk} risk
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => handleDrillDown('full-analysis')}
          className="flex-1"
        >
          <Eye className="h-3 w-3 mr-1" />
          View Full Analysis
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleDrillDown('export')}
        >
          <Download className="h-3 w-3 mr-1" />
          Export Report
        </Button>
      </div>
    </Card>
  );
};