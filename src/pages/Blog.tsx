
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogList from "@/components/BlogList";

const Blog = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-grow relative pt-24 md:pt-28">
        <section className="py-10 md:py-16 relative overflow-hidden">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-3xl mx-auto mb-10 md:mb-16 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-gradient">The triage.flow Blog</h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
                Exploring the technical challenges and solutions behind building AI-powered GitHub issue analysis
              </p>
            </div>
            
            <BlogList />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
