
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import GithubIcon from "./GithubIcon";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [scroll, setScroll] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const handleScroll = () => {
      setScroll(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scroll || isMenuOpen ? "header-blur py-3" : "py-3 md:py-5 bg-transparent"
    }`}>
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 md:gap-3">
          <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden blue-glow">
            <img 
              src="/lovable-uploads/165ce146-5630-4e6f-963b-57a129e138cf.png" 
              alt="triage.flow logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-lg md:text-xl font-semibold text-gradient">triage.flow</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-blue-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-500 after:scale-x-0 hover:after:scale-x-100 after:origin-bottom-left after:transition-transform">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-blue-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-500 after:scale-x-0 hover:after:scale-x-100 after:origin-bottom-left after:transition-transform">
            How It Works
          </a>
          <a href="#examples" className="text-sm font-medium text-muted-foreground hover:text-blue-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-500 after:scale-x-0 hover:after:scale-x-100 after:origin-bottom-left after:transition-transform">
            Examples
          </a>
          <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-blue-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-500 after:scale-x-0 hover:after:scale-x-100 after:origin-bottom-left after:transition-transform">
            Blog
          </Link>
          <a href="#docs" className="text-sm font-medium text-muted-foreground hover:text-blue-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-500 after:scale-x-0 hover:after:scale-x-100 after:origin-bottom-left after:transition-transform">
            Docs
          </a>
        </nav>
        
        <div className="flex items-center gap-2 md:gap-4">
          <a href="https://github.com/yourusername/triage.flow" target="_blank" rel="noopener noreferrer" className="glow-border">
            <Button variant="outline" size="icon" aria-label="GitHub" className="border-blue-500/20 bg-transparent hover:bg-blue-500/10">
              <GithubIcon />
            </Button>
          </a>
          <Button className="text-xs md:text-sm bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">Get Started</Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="md:hidden border-blue-500/20 bg-transparent hover:bg-blue-500/10"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5 text-blue-400" /> : <Menu className="h-5 w-5 text-blue-400" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute w-full bg-[rgba(15,23,42,0.95)] backdrop-blur-lg border-t border-blue-500/10 shadow-lg animate-fade-in">
          <nav className="container py-4 flex flex-col gap-2">
            <a 
              href="#features" 
              className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </a>
            <a 
              href="#examples" 
              className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Examples
            </a>
            <Link 
              to="/blog" 
              className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <a 
              href="#docs" 
              className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Docs
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
