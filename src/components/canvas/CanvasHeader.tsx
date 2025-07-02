import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutGrid, 
  MessageSquare, 
  PanelLeftClose, 
  PanelLeftOpen,
  Smartphone,
  Monitor
} from 'lucide-react';

interface CanvasHeaderProps {
  title: string;
  repoUrl: string;
  onToggleCollapse?: () => void;
  onToggleArtifacts?: () => void;
  isCollapsed?: boolean;
  showingArtifacts?: boolean;
  isMobile?: boolean;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  title,
  repoUrl,
  onToggleCollapse,
  onToggleArtifacts,
  isCollapsed = false,
  showingArtifacts = true,
  isMobile = false
}) => {
  const repoName = repoUrl.replace('https://github.com/', '');

  return (
    <div className="border-b border-border bg-gradient-to-r from-card to-card/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile ? (
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
              <Smartphone className="h-3 w-3 text-blue-600" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
              <Monitor className="h-3 w-3 text-blue-600" />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <LayoutGrid className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Repository Canvas
            </span>
          </div>
          
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            Beta
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <h1 className="text-sm font-medium text-foreground truncate max-w-[200px]">
              {title || "Repository Chat"}
            </h1>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {repoName}
            </p>
          </div>

          {isMobile ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleArtifacts}
              className="text-muted-foreground hover:text-foreground"
              title={showingArtifacts ? "Show Chat" : "Show Artifacts"}
            >
              {showingArtifacts ? (
                <MessageSquare className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-muted-foreground hover:text-foreground"
              title={isCollapsed ? "Expand Panels" : "Collapse Panels"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};