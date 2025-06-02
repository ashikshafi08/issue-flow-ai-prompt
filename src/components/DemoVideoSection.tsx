import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink } from "lucide-react";

const DemoVideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = "JO_4wjsqLGc";
  const youtubeUrl = `https://youtu.be/${videoId}`;

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-[15%] w-40 md:w-60 h-40 md:h-60 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute bottom-10 right-[10%] w-50 md:w-80 h-50 md:h-80 rounded-full bg-blue-500/10 blur-3xl"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-4">
            <Play className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Live Demo</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter mb-4">
            See <span className="text-gradient">triage.flow</span> in Action
          </h2>
          
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Watch how triage.flow transforms GitHub issues into interactive coding sessions with file-aware AI assistance
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            {/* Video Container */}
            <div className="glass-card p-3 md:p-6 shadow-2xl">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {!isPlaying ? (
                  // Preview thumbnail with play button
                  <div className="absolute inset-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50">
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                      alt="triage.flow Demo Video"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <button
                        onClick={handlePlayClick}
                        className="group flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/20 hover:scale-110 transition-all duration-300"
                        aria-label="Play demo video"
                      >
                        <Play className="h-6 w-6 md:h-8 md:w-8 text-white ml-1 group-hover:text-blue-300" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                      <span className="text-white text-sm font-medium">▶ Demo Video</span>
                    </div>
                  </div>
                ) : (
                  // Embedded YouTube player
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title="triage.flow Demo Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                asChild
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
              >
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Watch on YouTube
                </a>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  document.querySelector('#hero-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all"
              >
                Try It Now
              </Button>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 md:mt-12">
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-400 text-lg">🚀</span>
              </div>
              <h3 className="font-semibold text-white mb-2">File-Aware AI</h3>
              <p className="text-sm text-gray-400">Reference specific files with @ mentions for contextual assistance</p>
            </div>
            
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 text-lg">💬</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Interactive Chat</h3>
              <p className="text-sm text-gray-400">Real-time streaming conversations with your codebase</p>
            </div>
            
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-400 text-lg">🔍</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Code Explorer</h3>
              <p className="text-sm text-gray-400">Browse and view files directly in the interface</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoVideoSection; 