import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

interface LoadingArtifactProps {
  type: 'legacy' | 'agent' | 'memory';
}

export const LoadingArtifact: React.FC<LoadingArtifactProps> = ({ type }) => {
  const getTypeInfo = (type: string) => {
    switch(type) {
      case 'legacy':
        return {
          title: 'Analyzing Legacy Code',
          subtitle: 'Computing complexity and technical debt...',
          color: 'yellow'
        };
      case 'agent':
        return {
          title: 'Orchestrating Agents',
          subtitle: 'Coordinating multi-agent analysis...',
          color: 'blue'
        };
      case 'memory':
        return {
          title: 'Processing Memory',
          subtitle: 'Learning from interactions...',
          color: 'green'
        };
      default:
        return {
          title: 'Processing',
          subtitle: 'Analyzing repository data...',
          color: 'gray'
        };
    }
  };

  const typeInfo = getTypeInfo(type);

  return (
    <Card className="p-6 space-y-4 border-l-4 border-l-muted animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-muted-foreground animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-muted-foreground">{typeInfo.title}</h3>
            <p className="text-sm text-muted-foreground/70">{typeInfo.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse"></div>
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center pt-4">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </Card>
  );
};