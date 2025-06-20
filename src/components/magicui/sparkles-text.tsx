import { motion, Variants } from "framer-motion";
import { CSSProperties, ReactElement } from "react";

import { cn } from "@/lib/utils";

interface SparklesTextProps {
  className?: string;
  text: string;
  sparklesCount?: number;
  colors?: {
    first: string;
    second: string;
  };
}

const sparklesVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      repeat: Infinity,
      repeatType: "reverse",
      repeatDelay: 2,
    },
  }),
};

const SparklesText = ({
  text,
  colors = { first: "#9E7AFF", second: "#FE8BBB" },
  className,
  sparklesCount = 10,
}: SparklesTextProps): ReactElement => {
  return (
    <div className={cn("relative inline-block", className)}>
      <span className="relative z-10 bg-gradient-to-r from-[#9E7AFF] to-[#FE8BBB] bg-clip-text text-transparent font-bold">
        {text}
      </span>
      <div className="absolute inset-0">
        {[...Array(sparklesCount)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            variants={sparklesVariants}
            initial="hidden"
            animate="visible"
            custom={i}
          >
            <div
              className="h-1 w-1 rounded-full"
              style={{
                background: i % 2 === 0 ? colors.first : colors.second,
                boxShadow: `0 0 6px ${i % 2 === 0 ? colors.first : colors.second}`,
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SparklesText; 