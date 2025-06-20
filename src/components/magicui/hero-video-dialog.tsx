import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { X, Play } from "lucide-react";

interface HeroVideoDialogProps {
  className?: string;
  animationStyle?: "from-center" | "from-top" | "from-bottom" | "fade";
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt?: string;
  title?: string;
  description?: string;
}

export default function HeroVideoDialog({
  className,
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  title,
  description,
}: HeroVideoDialogProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const openVideo = () => setIsVideoOpen(true);
  const closeVideo = () => setIsVideoOpen(false);

  const getAnimationProps = () => {
    switch (animationStyle) {
      case "from-top":
        return {
          initial: { y: "-100%", opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: "-100%", opacity: 0 },
        };
      case "from-bottom":
        return {
          initial: { y: "100%", opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: "100%", opacity: 0 },
        };
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      default:
        return {
          initial: { scale: 0.5, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.5, opacity: 0 },
        };
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className="group relative cursor-pointer"
        onClick={openVideo}
      >
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          className="w-full rounded-2xl shadow-2xl transition-all duration-200 group-hover:brightness-[0.8] ease-out"
        />
        <div className="absolute inset-0 flex scale-[0.9] items-center justify-center rounded-2xl transition-all duration-200 group-hover:scale-100 ease-out">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 backdrop-blur-md">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-primary/30 to-primary shadow-md">
              <Play className="ml-1 h-8 w-8 text-white" fill="white" />
            </div>
          </div>
        </div>
        {(title || description) && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl">
            {title && (
              <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            )}
            {description && (
              <p className="text-white/80 text-sm">{description}</p>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeVideo}
          >
            <motion.div
              {...getAnimationProps()}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative mx-4 aspect-video w-full max-w-4xl md:mx-8"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                className="absolute -top-16 right-0 rounded-full bg-neutral-900/50 p-2 text-xl text-white ring-1 backdrop-blur-md"
                onClick={closeVideo}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
              <div className="h-full w-full overflow-hidden rounded-2xl border-2 border-white">
                <iframe
                  src={videoSrc}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 