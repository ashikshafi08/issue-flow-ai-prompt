
import React from "react";
import GithubIcon from "./GithubIcon";

const Footer = () => {
  return (
    <footer id="docs" className="border-t border-blue-500/20 py-16">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-1.5 rounded">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" x2="20" y1="19" y2="19" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gradient">triage.flow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered GitHub Issue Context & Prompt Generator with RAG
            </p>
            <div className="flex space-x-3">
              <a 
                href="https://github.com/yourusername/triage.flow"
                className="text-muted-foreground hover:text-blue-400 transition-colors" 
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <GithubIcon />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4 text-blue-300">Documentation</h3>
            <ul className="space-y-2">
              <li>
                <a href="docs/quickstart.md" className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
                  Quickstart Guide
                </a>
              </li>
              <li>
                <a href="docs/usage_cli.md" className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
                  CLI Usage
                </a>
              </li>
              <li>
                <a href="docs/advanced_usage.md" className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
                  Advanced Usage
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4 text-blue-300">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#examples" className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
                  Examples
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
                  Contributing
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4 text-blue-300">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="LICENSE" className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
                  MIT License
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-blue-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-blue-500/10 mt-12 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} triage.flow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
