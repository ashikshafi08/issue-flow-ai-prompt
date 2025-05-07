
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

// Sample blog data - in a real app, this would come from an API or CMS
const blogPosts = [
  {
    id: "1",
    title: "Optimizing GitHub Issue Context for AI Prompting",
    excerpt: "Learn how to structure your GitHub issues to get the most effective AI responses with triage.flow.",
    date: "May 5, 2025",
    category: "Tutorials",
    image: "/lovable-uploads/2ff5738a-5cf2-46c0-a103-fb6ab072c055.png",
    slug: "optimizing-github-issue-context"
  },
  {
    id: "2",
    title: "Building RAG Systems for Code Repositories",
    excerpt: "Deep dive into building Retrieval Augmented Generation systems specifically for code repositories.",
    date: "Apr 28, 2025",
    category: "Technical",
    image: "/lovable-uploads/165ce146-5630-4e6f-963b-57a129e138cf.png",
    slug: "building-rag-systems-for-code"
  },
  {
    id: "3",
    title: "The Future of AI-Assisted Software Development",
    excerpt: "Our predictions for how AI will transform software development workflows over the next five years.",
    date: "Apr 21, 2025",
    category: "Insights",
    slug: "future-of-ai-assisted-development"
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
