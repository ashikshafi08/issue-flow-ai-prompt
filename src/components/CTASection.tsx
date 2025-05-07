
import React from "react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-16 bg-brand-purple text-white relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}
      />
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tighter">Ready to supercharge your GitHub workflow?</h2>
          <p className="max-w-[600px] mx-auto">
            Save time on issue triage and get deep, context-aware prompts for 20+ programming languages with triage.flow
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-brand-purple hover:bg-gray-100">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              View on GitHub
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
