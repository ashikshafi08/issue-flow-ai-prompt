import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'message' | 'context-card' | 'file-tree' | 'suggestion' | 'text';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  className = '', 
  variant = 'text',
  count = 1 
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} className={getSkeletonClasses(variant)}>
      {renderSkeletonContent(variant)}
    </div>
  ));

  return count === 1 ? skeletons[0] : <div className={className}>{skeletons}</div>;
};

const getSkeletonClasses = (variant: string): string => {
  const baseClasses = "animate-pulse";
  
  switch (variant) {
    case 'message':
      return `${baseClasses} flex gap-3 mb-6`;
    case 'context-card':
      return `${baseClasses} flex items-center gap-3 p-3 bg-gray-800/20 border border-gray-700/20 rounded-lg`;
    case 'file-tree':
      return `${baseClasses} flex items-center gap-2 px-2 py-1.5 rounded-md`;
    case 'suggestion':
      return `${baseClasses} flex items-center gap-2 p-3 rounded-lg border border-gray-700/20`;
    case 'text':
    default:
      return `${baseClasses} bg-gray-700/30 rounded`;
  }
};

const renderSkeletonContent = (variant: string) => {
  switch (variant) {
    case 'message':
      return (
        <>
          <div className="flex-shrink-0 w-8 h-8 bg-gray-700/50 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-1/4"></div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-700/30 rounded w-full"></div>
              <div className="h-3 bg-gray-700/30 rounded w-5/6"></div>
              <div className="h-3 bg-gray-700/30 rounded w-4/6"></div>
            </div>
          </div>
        </>
      );
    
    case 'context-card':
      return (
        <>
          <div className="flex-shrink-0 w-4 h-4 bg-gray-700/50 rounded"></div>
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-700/50 rounded w-3/4"></div>
            <div className="h-2 bg-gray-700/30 rounded w-1/2"></div>
          </div>
        </>
      );
    
    case 'file-tree':
      return (
        <>
          <div className="w-3 h-3 bg-gray-700/50 rounded"></div>
          <div className="w-4 h-4 bg-gray-700/50 rounded"></div>
          <div className="h-2 bg-gray-700/30 rounded flex-1"></div>
        </>
      );
    
    case 'suggestion':
      return (
        <>
          <div className="flex-shrink-0 w-3 h-3 bg-gray-700/50 rounded"></div>
          <div className="h-3 bg-gray-700/30 rounded flex-1"></div>
        </>
      );
    
    case 'text':
    default:
      return <div className="h-4 w-full"></div>;
  }
};

export default LoadingSkeleton; 