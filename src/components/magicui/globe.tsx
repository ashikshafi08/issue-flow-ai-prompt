import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface GlobeProps {
  className?: string;
  width?: number;
  height?: number;
  pointsCount?: number;
  globeColor?: string;
  pointColor?: string;
  autoRotate?: boolean;
  rotateSpeed?: number;
}

interface Point {
  x: number;
  y: number;
  z: number;
  opacity: number;
  rotatedX: number;
  rotatedY: number;
  rotatedZ: number;
}

export default function Globe({
  className,
  width = 400,
  height = 400,
  pointsCount = 300,
  globeColor = "#1E293B",
  pointColor = "#3B82F6",
  autoRotate = true,
  rotateSpeed = 0.01,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [points, setPoints] = useState<Point[]>([]);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Generate points on sphere surface
  useEffect(() => {
    const newPoints: Point[] = [];
    const radius = Math.min(width, height) / 3;

    for (let i = 0; i < pointsCount; i++) {
      // Use spherical coordinates for even distribution
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u; // longitude
      const phi = Math.acos(2 * v - 1); // latitude

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      newPoints.push({
        x,
        y,
        z,
        opacity: Math.random() * 0.8 + 0.2,
        rotatedX: x,
        rotatedY: y,
        rotatedZ: z,
      });
    }

    setPoints(newPoints);
  }, [pointsCount, width, height]);

  // Rotation functions
  const rotateX = (point: { x: number; y: number; z: number }, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x,
      y: point.y * cos - point.z * sin,
      z: point.y * sin + point.z * cos,
    };
  };

  const rotateY = (point: { x: number; y: number; z: number }, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x * cos + point.z * sin,
      y: point.y,
      z: -point.x * sin + point.z * cos,
    };
  };

  // Drawing function
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Update rotation
    if (autoRotate) {
      setRotation(prev => ({
        x: prev.x + rotateSpeed,
        y: prev.y + rotateSpeed * 0.5,
      }));
    }

    // Draw globe outline
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 3, 0, 2 * Math.PI);
    ctx.strokeStyle = globeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points
    const rotatedPoints = points.map(point => {
      // Apply rotations
      let rotated = rotateY(point, rotation.y);
      rotated = rotateX(rotated, rotation.x);

      return {
        ...point,
        rotatedX: rotated.x,
        rotatedY: rotated.y,
        rotatedZ: rotated.z,
      };
    });

    // Sort by z-depth for proper rendering
    rotatedPoints.sort((a, b) => b.rotatedZ - a.rotatedZ);

    rotatedPoints.forEach(point => {
      // Only draw points on the front half of the sphere
      if (point.rotatedZ >= 0) {
        const screenX = point.rotatedX + width / 2;
        const screenY = point.rotatedY + height / 2;

        // Calculate opacity based on distance from center
        const distanceFromCenter = Math.sqrt(
          Math.pow(point.rotatedX, 2) + Math.pow(point.rotatedY, 2)
        );
        const maxDistance = Math.min(width, height) / 3;
        const distanceOpacity = 1 - (distanceFromCenter / maxDistance) * 0.5;

        // Calculate size based on z-depth
        const depthFactor = (point.rotatedZ + Math.min(width, height) / 3) / (Math.min(width, height) / 1.5);
        const pointSize = 1 + depthFactor * 2;

        ctx.beginPath();
        ctx.arc(screenX, screenY, pointSize, 0, 2 * Math.PI);
        ctx.fillStyle = `${pointColor}${Math.floor(point.opacity * distanceOpacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      }
    });

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    draw();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [points, rotation, autoRotate]);

  // Mouse interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    mouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || autoRotate) return;

    const deltaX = e.clientX - mouseRef.current.x;
    const deltaY = e.clientY - mouseRef.current.y;

    setRotation(prev => ({
      x: prev.x + deltaY * 0.01,
      y: prev.y + deltaX * 0.01,
    }));

    mouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  return (
    <motion.div
      className={cn("relative flex items-center justify-center", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          "cursor-grab active:cursor-grabbing",
          !autoRotate && "select-none"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))",
        }}
      />
      
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${pointColor}20 0%, transparent 70%)`,
          filter: "blur(20px)",
          transform: "scale(1.2)",
        }}
      />
      
      {/* Connection lines effect */}
      <motion.div
        className="absolute inset-0"
        animate={{
          rotate: autoRotate ? 360 : 0,
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div
          className="w-full h-full rounded-full border border-blue-500/20"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${pointColor}30, transparent)`,
          }}
        />
      </motion.div>
    </motion.div>
  );
} 