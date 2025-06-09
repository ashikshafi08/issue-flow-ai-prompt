import React, { useState } from 'react';
import { Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import TimelineInvestigator from './TimelineInvestigator';

interface TimelineSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessionId: string;
  filePath?: string;
}

export const TimelineSidebar: React.FC<TimelineSidebarProps> = ({
  isOpen,
  onToggle,
  sessionId,
  filePath
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-white/70 hover:text-white hover:bg-black/90 transition-all duration-200 shadow-lg"
        title="Open Timeline"
      >
        <Clock className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div 
      className={`fixed right-0 top-0 bottom-0 z-50 bg-black/95 backdrop-blur-xl border-l border-white/10 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-96 xl:w-[28rem]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h2 className="text-[14px] font-semibold text-white/90">Timeline Inspector</h2>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg transition-all duration-200"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={onToggle}
            className="p-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg transition-all duration-200"
            title="Close Timeline"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          <TimelineInvestigator
            sessionId={sessionId}
            filePath={filePath}
            className="h-full"
          />
        </div>
      )}

      {/* Collapsed State Indicator */}
      {isCollapsed && (
        <div className="flex flex-col items-center justify-center h-32 mt-4">
          <Clock className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-[10px] text-white/60 text-center px-1 leading-tight">
            Timeline
          </div>
        </div>
      )}
    </div>
  );
}; 