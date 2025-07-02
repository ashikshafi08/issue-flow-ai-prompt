import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { cn } from '@/lib/utils';

const AnimatedEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.isActive || false;
  const label = data?.label || '';
  const confidence = data?.confidence || 0;

  // Generate unique gradient ID
  const gradientId = `gradient-${id}`;
  const glowId = `glow-${id}`;

  return (
    <>
      {/* Define gradients and filters */}
      <defs>
        {/* Animated gradient for active edges */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isActive ? '#3B82F6' : '#94A3B8'} stopOpacity="0.8">
            {isActive && (
              <animate
                attributeName="stop-opacity"
                values="0.8;0.3;0.8"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </stop>
          <stop offset="50%" stopColor={isActive ? '#1D4ED8' : '#64748B'} stopOpacity="1" />
          <stop offset="100%" stopColor={isActive ? '#3B82F6' : '#94A3B8'} stopOpacity="0.8">
            {isActive && (
              <animate
                attributeName="stop-opacity"
                values="0.8;0.3;0.8"
                dur="2s"
                repeatCount="indefinite"
                begin="1s"
              />
            )}
          </stop>
        </linearGradient>

        {/* Glow effect for active edges */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background path for better clickability */}
      <path
        id={`${id}-bg`}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={12}
        stroke="transparent"
        fill="none"
      />
      
      {/* Glow effect layer */}
      {isActive && (
        <path
          className="react-flow__edge-path"
          d={edgePath}
          strokeWidth={4}
          stroke={`url(#${gradientId})`}
          fill="none"
          filter={`url(#${glowId})`}
          opacity="0.6"
        />
      )}
      
      {/* Main edge path */}
      <path
        id={id}
        style={style}
        className={cn(
          "react-flow__edge-path transition-all duration-300",
          isActive && "drop-shadow-sm"
        )}
        d={edgePath}
        markerEnd={markerEnd}
        strokeWidth={isActive ? 3 : 2}
        stroke={isActive ? `url(#${gradientId})` : '#94A3B8'}
        fill="none"
        strokeDasharray={isActive ? "5,5" : "none"}
      />
      
      {/* Animated dots for data flow */}
      {isActive && (
        <>
          {/* Primary data flow dot */}
          <circle r="4" fill="#3B82F6" opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite">
              <mpath xlinkHref={`#${id}`} />
            </animateMotion>
          </circle>
          
          {/* Secondary dot with delay */}
          <circle r="3" fill="#60A5FA" opacity="0.7">
            <animateMotion dur="2s" repeatCount="indefinite" begin="0.5s">
              <mpath xlinkHref={`#${id}`} />
            </animateMotion>
          </circle>
          
          {/* Tertiary dot with more delay */}
          <circle r="2" fill="#93C5FD" opacity="0.5">
            <animateMotion dur="2s" repeatCount="indefinite" begin="1s">
              <mpath xlinkHref={`#${id}`} />
            </animateMotion>
          </circle>
        </>
      )}
      
      {/* Edge label */}
      {label && (
        <foreignObject
          width="200"
          height="30"
          x={labelX - 100}
          y={labelY - 15}
          className="overflow-visible"
        >
          <div className="flex justify-center">
            <div
              className={cn(
                "px-2 py-1 text-xs rounded-full border transition-all duration-300",
                isActive 
                  ? "bg-blue-900/30 dark:bg-blue-950/50 border-blue-600 dark:border-blue-800 text-blue-300 dark:text-blue-300"
                  : "bg-slate-800/50 dark:bg-slate-900/50 border-slate-600 dark:border-slate-700 text-slate-300 dark:text-slate-400"
              )}
            >
              {label}
              {confidence > 0 && (
                <span className="ml-1 font-semibold">
                  {Math.round(confidence * 100)}%
                </span>
              )}
            </div>
          </div>
        </foreignObject>
      )}

      {/* Confidence indicator */}
      {isActive && confidence > 0 && (
        <circle
          cx={labelX}
          cy={labelY + 25}
          r="8"
          fill={confidence > 0.8 ? '#10B981' : confidence > 0.6 ? '#F59E0B' : '#EF4444'}
          opacity="0.8"
          className="animate-pulse"
        >
          <title>{`Confidence: ${Math.round(confidence * 100)}%`}</title>
        </circle>
      )}
    </>
  );
};

export default AnimatedEdge; 