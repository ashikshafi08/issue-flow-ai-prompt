
import React from "react";
import { Button } from "@/components/ui/button";
import GithubIcon from "./GithubIcon";

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-md z-50 border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-brand-purple text-white p-1 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-terminal"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" x2="20" y1="19" y2="19" />
            </svg>
          </div>
          <span className="text-xl font-bold">GH Issue Prompt</span>
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
          <a href="https://github.com/yourusername/gh-issue-prompt" target="_blank" rel="noopener noreferrer">
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
