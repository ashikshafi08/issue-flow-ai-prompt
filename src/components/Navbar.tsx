
import React from "react";
import { Button } from "@/components/ui/button";
import GithubIcon from "./GithubIcon";

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-md z-50 border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/165ce146-5630-4e6f-963b-57a129e138cf.png" 
            alt="triage.flow logo" 
            className="w-8 h-8"
          />
          <span className="text-xl font-bold">triage.flow</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium hover:text-brand-purple transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium hover:text-brand-purple transition-colors">
            How It Works
          </a>
          <a href="#examples" className="text-sm font-medium hover:text-brand-purple transition-colors">
            Examples
          </a>
          <a href="#docs" className="text-sm font-medium hover:text-brand-purple transition-colors">
            Docs
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <a href="https://github.com/yourusername/triage.flow" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon" aria-label="GitHub">
              <GithubIcon />
            </Button>
          </a>
          <Button className="bg-brand-purple hover:bg-brand-lightPurple">Get Started</Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
