
import React from "react";
import GithubIcon from "./GithubIcon";

const Footer = () => {
  return (
    <footer id="docs" className="bg-background border-t py-12">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-brand-purple text-white p-1 rounded">
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
              <span className="text-lg font-bold">GH Issue Prompt</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered GitHub Issue Context & Prompt Generator with RAG
            </p>
            <div className="flex space-x-3">
              <a 
                href="https://github.com/yourusername/gh-issue-prompt"
                className="text-muted-foreground hover:text-brand-purple" 
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <GithubIcon />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Documentation</h3>
            <ul className="space-y-2">
              <li>
                <a href="docs/quickstart.md" className="text-sm text-muted-foreground hover:text-brand-purple">
                  Quickstart Guide
                </a>
              </li>
              <li>
                <a href="docs/usage_cli.md" className="text-sm text-muted-foreground hover:text-brand-purple">
                  CLI Usage
                </a>
              </li>
              <li>
                <a href="docs/advanced_usage.md" className="text-sm text-muted-foreground hover:text-brand-purple">
                  Advanced Usage
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#examples" className="text-sm text-muted-foreground hover:text-brand-purple">
                  Examples
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-brand-purple">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-brand-purple">
                  Contributing
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="LICENSE" className="text-sm text-muted-foreground hover:text-brand-purple">
                  MIT License
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-brand-purple">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GH Issue Prompt. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
