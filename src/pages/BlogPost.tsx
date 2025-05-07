
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Sample blog data - in a real app, this would come from an API or CMS
const blogPosts = {
  "optimizing-github-issue-context": {
    id: "1",
    title: "Optimizing GitHub Issue Context for AI Prompting",
    date: "May 5, 2025",
    category: "Tutorials",
    image: "/lovable-uploads/2ff5738a-5cf2-46c0-a103-fb6ab072c055.png",
    content: `
      <p class="mb-4">When working with AI tools and GitHub issues, context is key. In this tutorial, we'll explore how to structure your GitHub issues to get the most effective AI responses using triage.flow.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">The Importance of Context</h2>
      <p class="mb-4">AI models like those powering triage.flow need sufficient context to provide useful responses. This includes not just the immediate issue details, but related code, error messages, and system configuration information.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Best Practices for Issue Creation</h2>
      <p class="mb-4">Here are some tips for creating issues that will result in more effective AI-generated solutions:</p>
      <ul class="list-disc pl-5 mb-4 space-y-2">
        <li>Include complete error messages and stack traces</li>
        <li>Reference specific files and line numbers</li>
        <li>Describe expected behavior vs. actual behavior</li>
        <li>Add relevant environment information</li>
        <li>Link to related issues or pull requests</li>
      </ul>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Using triage.flow Efficiently</h2>
      <p class="mb-4">triage.flow analyzes your repository's context automatically, but you can help it by following these strategies...</p>
    `
  },
  "building-rag-systems-for-code": {
    id: "2",
    title: "Building RAG Systems for Code Repositories",
    date: "Apr 28, 2025",
    category: "Technical",
    image: "/lovable-uploads/165ce146-5630-4e6f-963b-57a129e138cf.png",
    content: `
      <p class="mb-4">Retrieval Augmented Generation (RAG) systems have become increasingly important for enhancing AI models with custom knowledge. In this post, we'll dive deep into building RAG systems specifically optimized for code repositories.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Understanding RAG for Code</h2>
      <p class="mb-4">Unlike general-purpose RAG systems dealing with natural language documents, code repositories have unique characteristics:</p>
      <ul class="list-disc pl-5 mb-4 space-y-2">
        <li>Hierarchical structure (projects, folders, files, functions)</li>
        <li>Cross-references and dependencies</li>
        <li>Multiple programming languages</li>
        <li>Specialized syntax and semantics</li>
      </ul>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Vector Embeddings for Code</h2>
      <p class="mb-4">Effective code embeddings need to capture both syntactic structure and semantic meaning...</p>
    `
  },
  "future-of-ai-assisted-development": {
    id: "3",
    title: "The Future of AI-Assisted Software Development",
    date: "Apr 21, 2025",
    category: "Insights",
    content: `
      <p class="mb-4">AI is rapidly transforming software development workflows. In this article, we share our predictions for how these tools will evolve over the next five years.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">From Autocomplete to Auto-Architecture</h2>
      <p class="mb-4">Today's AI coding assistants excel at completing lines and suggesting functions, but the next generation will help design entire systems and architectures.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Continuous Learning from Codebases</h2>
      <p class="mb-4">Future AI systems will continuously learn from your codebase, understanding patterns, conventions, and business logic specific to your organization.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">AI-Powered Testing and Quality Assurance</h2>
      <p class="mb-4">We predict a significant shift in how testing is approached, with AI systems automatically generating comprehensive test suites and identifying edge cases that humans might miss.</p>
    `
  }
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? blogPosts[slug as keyof typeof blogPosts] : null;

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <Navbar />
        <main className="flex-grow relative pt-24 md:pt-28">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
              <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist.</p>
              <Button asChild>
                <Link to="/blog">Back to Blog</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-grow relative pt-24 md:pt-28">
        <article className="container px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto">
            <Button 
              variant="ghost" 
              className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10 mb-6 -ml-2 h-auto pl-2 pr-4 py-2"
              asChild
            >
              <Link to="/blog" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Blog</span>
              </Link>
            </Button>

            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-medium">
                {post.category}
              </span>
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {post.date}
              </span>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-bold mb-6 tracking-tight">{post.title}</h1>
            
            {post.image && (
              <div className="aspect-[16/9] w-full overflow-hidden rounded-lg mb-8">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div 
              className="prose prose-blue dark:prose-invert max-w-none text-muted-foreground" 
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <Separator className="my-8 bg-blue-500/20" />

            <div className="flex justify-between items-center">
              <Button 
                variant="ghost" 
                className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10"
                asChild
              >
                <Link to="/blog">Back to all posts</Link>
              </Button>
              
              {/* Share buttons could go here in the future */}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
