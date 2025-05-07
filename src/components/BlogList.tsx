
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Tag } from "lucide-react";
import { Link } from "react-router-dom";

// Updated blog data with unique images
const blogPosts = [
  {
    id: "1",
    title: "Multi-Model LLM Orchestration: A Flexible Approach to AI-Powered Issue Analysis",
    excerpt: "Learn how our flexible multi-model orchestration system allows teams to choose the right LLM for every task and ensures uninterrupted service.",
    date: "May 5, 2025",
    category: "Architecture",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000",
    slug: "multi-model-llm-orchestration"
  },
  {
    id: "2",
    title: "Intelligent Repository Context Extraction: Beyond Simple Code Search",
    excerpt: "Discover how our context extraction engine pulls together relevant code, documentation, and tests to provide a complete picture of every issue.",
    date: "Apr 28, 2025",
    category: "Technical",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=1000",
    slug: "intelligent-repository-context-extraction"
  },
  {
    id: "3",
    title: "Language-Aware Code Analysis: Understanding Code Across Multiple Languages",
    excerpt: "How our system recognizes and processes code in Python, JavaScript, TypeScript, Go, Rust, and more to provide unified insights.",
    date: "Apr 21, 2025",
    category: "Development",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1000",
    slug: "language-aware-code-analysis"
  },
  {
    id: "4",
    title: "Dynamic Prompt Engineering: Adapting to Different Analysis Needs",
    excerpt: "Explore how our prompt engineering system adapts to different analysis needs, ensuring clear and useful responses from language models.",
    date: "Apr 14, 2025",
    category: "AI",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000",
    slug: "dynamic-prompt-engineering"
  },
  {
    id: "5",
    title: "Efficient Vector Search with FAISS: Powering Smart Code Analysis",
    excerpt: "How we use FAISS to represent code, documentation, and architecture as vectors for lightning-fast, context-rich search.",
    date: "Apr 7, 2025",
    category: "Performance",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000",
    slug: "efficient-vector-search-with-faiss"
  }
];

const BlogList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogPosts.map((post) => (
        <Card key={post.id} className="feature-card overflow-hidden flex flex-col h-full">
          {post.image && (
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          )}
          <CardContent className="flex flex-col flex-grow p-5">
            <div className="flex items-center mb-3 text-xs">
              <span className="text-blue-400 font-medium">{post.category}</span>
              <span className="mx-2 text-blue-500/30">•</span>
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {post.date}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 line-clamp-2">
              {post.title}
            </h3>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-grow">
              {post.excerpt}
            </p>
            <Button 
              variant="ghost" 
              className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10 p-0 h-auto justify-start gap-2"
              asChild
            >
              <Link to={`/blog/${post.slug}`} className="flex items-center">
                <span>Read more</span>
                <ArrowRight className="h-4 w-4 animate-float-arrow" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BlogList;
