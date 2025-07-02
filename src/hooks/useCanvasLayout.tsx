import { useState, useEffect, useCallback } from 'react';
import { CanvasLayoutConfig } from '@/types/canvas.types';

export const useCanvasLayout = () => {
  const [layout, setLayout] = useState<CanvasLayoutConfig>({
    chatWidth: 25,
    artifactWidth: 75,
    isCollapsed: false,
    isMobile: false,
  });

  // Detect mobile/tablet breakpoints
  useEffect(() => {
    const checkBreakpoint = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      setLayout(prev => ({
        ...prev,
        isMobile,
        chatWidth: isMobile ? 100 : isTablet ? 40 : 25,
        artifactWidth: isMobile ? 0 : isTablet ? 60 : 75,
      }));
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  const toggleCollapse = useCallback(() => {
    setLayout(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed,
    }));
  }, []);

  const setSplitRatio = useCallback((chatWidth: number) => {
    setLayout(prev => ({
      ...prev,
      chatWidth,
      artifactWidth: 100 - chatWidth,
    }));
  }, []);

  return {
    layout,
    toggleCollapse,
    setSplitRatio,
  };
};