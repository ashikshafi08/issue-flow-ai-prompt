
import React from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import WorkflowSection from "@/components/WorkflowSection";
import ExampleOutputSection from "@/components/ExampleOutputSection";
import CodeExampleSection from "@/components/CodeExampleSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-grow relative z-0">
        <HeroSection />
        <FeaturesSection />
        <div className="relative z-10">
          <WorkflowSection />
        </div>
        <ExampleOutputSection />
        <CodeExampleSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
