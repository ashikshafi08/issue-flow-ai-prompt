import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Updated blog data with full content
const blogPosts = {
  "multi-model-llm-orchestration": {
    id: "1",
    title: "Multi-Model LLM Orchestration: A Flexible Approach to AI-Powered Issue Analysis",
    date: "May 5, 2025",
    category: "Architecture",
    image: "/lovable-uploads/2ff5738a-5cf2-46c0-a103-fb6ab072c055.png",
    content: `
      <h2 class="text-xl font-semibold mb-3 mt-6">Introduction</h2>
      <p class="mb-4">In the ever-evolving world of artificial intelligence, flexibility is more than a feature—it's a necessity. When we began building our GitHub Issue Analysis tool, we quickly realized that no single large language model (LLM) could meet all our needs. The landscape was shifting, new models were emerging, and each brought its own strengths and quirks. Our challenge was clear: how could we design a system that not only kept up with this rapid innovation, but actually thrived on it?</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">The Journey</h2>
      <p class="mb-4">Our answer was to build a multi-model orchestration system—a kind of AI control tower that could seamlessly switch between different LLMs and providers. This wasn't just about technical abstraction; it was about giving our users the power to choose the right tool for every job, whether that meant leveraging the creative spark of one model or the precision of another. We wanted to make it effortless to experiment, optimize for cost, and always have a fallback when one provider hit a rate limit or went down.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Our Approach</h2>
      <p class="mb-4">We started by designing a provider-agnostic architecture. Instead of hard-coding logic for a single API, we built a unified interface that could talk to OpenAI, OpenRouter, and any other provider we might add in the future. This meant that switching models was as simple as changing a configuration—no rewrites, no headaches. Our system handled the messy details: prompt formatting, parameter tuning, error handling, and even tracking token usage across providers.</p>
      
      <pre class="bg-gray-800 text-gray-100 rounded-md p-4 my-6 overflow-x-auto">
# Provider switching and error handling
async def process_prompt(self, prompt, model):
    try:
        config = self._get_model_config(model)
        response = await self._call_provider(prompt, model, config)
        return response
    except ProviderError as e:
        # Fallback to default model if the chosen provider fails
        fallback_model = self.default_model
        fallback_config = self._get_model_config(fallback_model)
        return await self._call_provider(prompt, fallback_model, fallback_config)
      </pre>
      
      <p class="mb-4">One of the most rewarding aspects of this journey has been seeing how our orchestration system empowers real users. Teams can now choose the most cost-effective model for routine tasks, then switch to a more powerful (and expensive) model for complex analysis—all without changing their workflow. When a provider has an outage, our system automatically falls back to another, ensuring uninterrupted service. And as new models hit the market, we can integrate them in days, not weeks.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Real-World Impact</h2>
      <p class="mb-4">The impact has been profound. In one case, a customer was able to cut their LLM costs by 40% simply by routing different types of prompts to the most appropriate model. Another team used our system to experiment with cutting-edge models for code summarization, then quickly rolled back when they found a regression—no downtime, no lost productivity. Our orchestration layer has become the invisible engine that keeps everything running smoothly, adapting to the ever-changing world of AI.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Looking Ahead</h2>
      <p class="mb-4">We're just scratching the surface of what's possible. Our roadmap includes smarter model selection—imagine a system that learns which model works best for each type of prompt, automatically optimizing for speed, cost, and quality. We're also exploring deeper integrations with cost tracking, usage analytics, and even automated fallback strategies for when providers change their APIs.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Conclusion</h2>
      <p class="mb-4">Multi-model orchestration isn't just a technical achievement—it's a philosophy of resilience, adaptability, and user empowerment. By embracing the diversity of the AI ecosystem, we're helping teams move faster, spend smarter, and build with confidence. As the world of LLMs continues to evolve, we're excited to be at the forefront, turning complexity into opportunity for our users.</p>
    `
  },
  "intelligent-repository-context-extraction": {
    id: "2",
    title: "Intelligent Repository Context Extraction: Beyond Simple Code Search",
    date: "Apr 28, 2025",
    category: "Technical",
    image: "/lovable-uploads/165ce146-5630-4e6f-963b-57a129e138cf.png",
    content: `
      <h2 class="text-xl font-semibold mb-3 mt-6">Introduction</h2>
      <p class="mb-4">When we set out to build our GitHub Issue Analysis tool, we quickly realized that the real challenge wasn't just about parsing issues or searching for keywords. The true value—and the hardest problem—was understanding the full story behind every issue: how code, documentation, tests, and architecture all come together to shape the context of a problem. This realization led us to develop an intelligent repository context extraction system, one that goes far beyond simple code search and instead strives to capture the living, breathing ecosystem of a codebase.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">The Challenge</h2>
      <p class="mb-4">Every developer knows that a GitHub issue rarely exists in isolation. A bug report might reference a function in one file, but the root cause could be buried in a dependency two directories away. Documentation might hint at a workaround, while a forgotten test case quietly fails in the background. Our team faced the daunting task of surfacing all these connections—code relationships, documentation, test coverage, architectural patterns, and even the history of changes—so that anyone investigating an issue could see the bigger picture, not just a single snapshot.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Our Approach</h2>
      <p class="mb-4">To make this possible, we built a context extraction engine that acts like a seasoned team lead—someone who knows the codebase inside and out, remembers past bugs, and can point you to the right documentation or test with a knowing nod. At the heart of this system is a function that pulls together all the relevant context for a given issue:</p>
      
      <pre class="bg-gray-800 text-gray-100 rounded-md p-4 my-6 overflow-x-auto">
# Context extraction for a GitHub issue
async def extract_issue_context(issue_id, repo):
    """Gather code, docs, and test context for a given issue."""
    code_refs = find_code_references(issue_id, repo)
    docs = find_related_docs(code_refs, repo)
    tests = find_related_tests(code_refs, repo)
    history = get_issue_history(issue_id, repo)
    return {
        "code": code_refs,
        "docs": docs,
        "tests": tests,
        "history": history
    }
      </pre>
      
      <p class="mb-4">This approach means that when a developer opens an issue, they're not just looking at a title and description—they're presented with a curated map of the most relevant code, documentation, and tests. It's a leap beyond keyword search, surfacing the relationships and context that matter most.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Real-World Impact</h2>
      <p class="mb-4">The results have been transformative. Imagine opening a bug report and, instead of sifting through endless files, being greeted with a curated map of the most relevant code, documentation, and tests. Our users have told us that this context-first approach has cut their investigation time in half. In one case, a team used our tool to trace a performance issue across three microservices, quickly identifying a shared dependency that had been overlooked for months. In another, a new hire was able to ramp up on a legacy project by following the context trails our system provided, turning what would have been weeks of onboarding into just a few days.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">How It Changes the Way We Work</h2>
      <p class="mb-4">By weaving together all the threads of a codebase, our context extraction system has fundamentally changed how teams approach issue analysis, code reviews, and even feature planning. Developers no longer work in silos, guessing at the impact of their changes. Instead, they collaborate with a shared understanding of how everything fits together. Product managers and QA engineers use the same context maps to plan releases and test strategies, ensuring nothing falls through the cracks.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Looking Ahead</h2>
      <p class="mb-4">We're just getting started. Our vision is to make context as accessible and actionable as code itself. We're exploring new ways to visualize code relationships, surface architectural insights, and integrate with the tools teams already use. Imagine a future where, with a single click, you can see not just what changed, but why it matters—across your entire organization.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Conclusion</h2>
      <p class="mb-4">Intelligent repository context extraction isn't just a feature; it's a philosophy. It's about empowering every member of a team to see the whole picture, make better decisions, and move faster with confidence. As our system continues to evolve, we're excited to help more teams unlock the full potential of their codebases—one issue, one insight, and one connection at a time.</p>
    `
  },
  "language-aware-code-analysis": {
    id: "3",
    title: "Language-Aware Code Analysis: Understanding Code Across Multiple Languages",
    date: "Apr 21, 2025",
    category: "Development",
    image: "/lovable-uploads/2ff5738a-5cf2-46c0-a103-fb6ab072c055.png",
    content: `
      <h2 class="text-xl font-semibold mb-3 mt-6">Introduction</h2>
      <p class="mb-4">In the world of modern software, diversity is the norm. Rarely does a project stick to a single language—most real-world codebases are a tapestry of Python, JavaScript, TypeScript, Go, Rust, and more. When we set out to build our GitHub Issue Analyzer, we knew that understanding this polyglot reality was non-negotiable. The real challenge wasn't just reading code, but truly understanding it—no matter what language it was written in.</p>
      
      <p class="mb-4">Our language-aware analysis system was born from this need. It's the engine that powers our ability to generate meaningful LLM prompts, trace root causes across language boundaries, and extract actionable insights from even the most complex repositories. This isn't just a technical feature—it's the foundation that lets us treat every codebase as a living, interconnected whole.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">The Challenge</h2>
      <p class="mb-4">Every language brings its own quirks, conventions, and hidden gotchas. Python's docstrings, JavaScript's JSDoc, Rust's module system, Go's idiomatic imports—each one is a world unto itself. We quickly realized that a one-size-fits-all parser would never be enough. To truly help developers, we needed a system that could recognize, extract, and contextualize information in a way that felt native to each language, while still providing a unified experience for the user.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Our Approach</h2>
      <p class="mb-4">The first step was to create a flexible language configuration system. For every supported language, we define the patterns that matter: how documentation is written, how imports are structured, and what makes a file "important." Here's a glimpse of how we capture these rules:</p>
      
      <pre class="bg-gray-800 text-gray-100 rounded-md p-4 my-6 overflow-x-auto">
# Language configuration for multi-language support
LANGUAGE_CONFIG = {
    "python": {
        "display_name": "Python",
        "description": "A high-level, interpreted programming language",
        "doc_pattern": r'""".*?"""',
        "import_pattern": r'^(?:from|import)\\s+[\\w\\s,\\.]+$',
        "extensions": [".py"]
    },
    "javascript": {
        "display_name": "JavaScript",
        "description": "A high-level, interpreted programming language",
        "doc_pattern": r'/\\*\\*.*?\\*/',
        "import_pattern": r'^(?:import|require)\\s+[\\w\\s,\\.]+$',
        "extensions": [".js", ".jsx", ".ts", ".tsx"]
    }
    # ... other languages
}
      </pre>
      
      <p class="mb-4">Once we know how to recognize the important parts of each language, we process each file accordingly. This function turns a code file into structured input for downstream analysis, extracting documentation, imports, and more:</p>
      
      <pre class="bg-gray-800 text-gray-100 rounded-md p-4 my-6 overflow-x-auto">
# Content processing based on language-specific rules
def _process_file_content(self, content: str, metadata: dict) -> str:
    """Process file content based on language-specific patterns."""
    if metadata["language"] == "unknown":
        return content
    docs, imports = "", ""
    if metadata["doc_pattern"]:
        doc_matches = re.findall(metadata["doc_pattern"], content, re.DOTALL | re.MULTILINE)
        docs = "\\n".join(doc_matches)
    if metadata["import_pattern"]:
        import_matches = re.findall(metadata["import_pattern"], content, re.MULTILINE)
        imports = "\\n".join(import_matches)
    return f"""
Language: {metadata["display_name"]}
Description: {metadata["description"]}

Imports:
{imports}

Documentation:
{docs}

Code:
{content}
"""
      </pre>
      
      <p class="mb-4">Finally, to tie it all together, we use a language detection system that ensures every file is processed with the right rules. This is how we identify the language and retrieve its configuration:</p>
      
      <pre class="bg-gray-800 text-gray-100 rounded-md p-4 my-6 overflow-x-auto">
# Language detection for a given file
def get_language_metadata(filename: str) -> dict:
    ext = os.path.splitext(filename)[1].lower()
    for lang, config in LANGUAGE_CONFIG.items():
        if ext in config["extensions"]:
            return {
                "language": lang,
                "display_name": config["display_name"],
                "description": config["description"],
                "doc_pattern": config["doc_pattern"],
                "import_pattern": config["import_pattern"]
            }
    return {
        "language": "unknown",
        "display_name": "Unknown",
        "description": "Unknown language",
        "doc_pattern": None,
        "import_pattern": None
    }
      </pre>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Real-World Impact</h2>
      <p class="mb-4">The results have been nothing short of transformative. In one case, a team struggling with a cross-language bug—Python backend, JavaScript frontend—used our tool to trace the issue from a failing API endpoint all the way to a misnamed variable in a React component. In another, a new contributor was able to ramp up on a legacy monorepo by following the context trails our system provided, jumping seamlessly between Go services and TypeScript utilities.</p>
      
      <p class="mb-4">This isn't just about bug fixes. Our language-aware analysis has helped teams refactor with confidence, knowing that dependencies and documentation won't be lost in translation. It's enabled more effective code reviews, smarter onboarding, and even better test coverage, as hidden relationships are surfaced and made actionable.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">How It Changes the Way We Work</h2>
      <p class="mb-4">By treating every language as a first-class citizen, we've created a system that empowers developers to work across boundaries. No more guessing at what a cryptic import means, or missing crucial documentation because it's in a different format. Our users tell us that they feel more confident making changes, more connected to the codebase, and more productive as a team.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Looking Ahead</h2>
      <p class="mb-4">We're not stopping here. Our roadmap includes deeper support for emerging languages, smarter pattern recognition, and even more seamless integration with the rest of the developer workflow. Imagine a future where your tools not only understand your code, but anticipate your questions—surfacing the right context, in the right language, at exactly the right moment.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Conclusion</h2>
      <p class="mb-4">Language-aware code analysis isn't just a technical achievement—it's a new way of thinking about software. By embracing the diversity of modern codebases, we're helping teams move faster, collaborate better, and build with confidence. As our system continues to evolve, we're excited to see what new connections, insights, and breakthroughs it will unlock for developers everywhere.</p>
    `
  },
  "dynamic-prompt-engineering": {
    id: "4",
    title: "Dynamic Prompt Engineering: Adapting to Different Analysis Needs",
    date: "Apr 14, 2025",
    category: "AI",
    image: "/lovable-uploads/165ce146-5630-4e6f-963b-57a129e138cf.png",
    content: `
      <h2 class="text-xl font-semibold mb-3 mt-6">Introduction</h2>
      <p class="mb-4">If you've ever worked with large language models, you know that the difference between a mediocre answer and a brilliant one often comes down to the prompt. Early in our journey building the GitHub Issue Analysis tool, we learned this lesson the hard way. A single misplaced instruction or a poorly formatted context block could send even the smartest model off the rails. We realized that prompt engineering wasn't just a technical detail—it was the art and science at the heart of our product.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">The Challenge</h2>
      <p class="mb-4">Every issue, every code review, every feature request is unique. Some need a deep technical dive, others a high-level summary. Some require context from dozens of files, while others hinge on a single line of code. We needed a system that could adapt to all these scenarios, crafting prompts that were not only accurate and clear, but also flexible enough to evolve as our users' needs changed.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Our Approach</h2>
      <p class="mb-4">We started by building a library of prompt templates, each tailored to a specific task—explaining an issue, suggesting a fix, summarizing a discussion. Here's an example of how we define and use these templates:</p>
      
      <pre class="bg-gray-800 text-gray-100 rounded-md p-4 my-6 overflow-x-auto">
# Template management for prompt engineering
self.prompt_templates = {
    "explain": """Please explain the following GitHub issue:\\n\\nTitle: {title}\\nDescription: {description}\\n\\n{context}\\n\\nPlease provide:\\n1. A clear explanation of what the issue is about\\n2. The root cause of the problem\\n3. Any relevant technical details from the codebase\\n4. Potential impact if not addressed""",
    "fix": """Please provide a solution for the following GitHub issue:\\n..."""
    # ... other templates
}
      </pre>
      
      <p class="mb-4">But templates alone weren't enough. We needed to make sure that every prompt was clean, readable, and free of the markdown quirks and HTML artifacts that often sneak in from GitHub or other sources. To do this, we developed a robust markdown cleaning pipeline:</p>
      
      <pre class="bg-gray-800 text-gray-100 rounded-md p-4 my-6 overflow-x-auto">
# Markdown cleaning for prompt clarity
def _clean_markdown(self, text: str) -> str:
    """Clean up markdown formatting in text."""
    # Remove <details> and <summary> tags and their content
    text = re.sub(r'<details>.*?</details>', '', text, flags=re.DOTALL)
    # Remove other HTML-like tags
    text = re.sub(r'<[^>]+>', '', text)
    # Clean up multiple newlines
    text = re.sub(r'\\n{3,}', '\\n\\n', text)
    return text.strip()
      </pre>
      
      <p class="mb-4">Context integration was the next frontier. It's one thing to ask a model to "explain this bug," but it's another to give it the right context: the relevant code, the related documentation, the history of similar issues. Our system pulls in this context automatically, weaving it into the prompt in a way that feels natural and informative:</p>
      
      <pre class="bg-gray-800 text-gray-100 rounded-md p-4 my-6 overflow-x-auto">
# Context integration for prompt generation
def generate_prompt(self, request, issue):
    clean_description = self._clean_markdown(issue.body)
    context = request.context.get("repo_context", {})
    context_text = ""
    if context:
        context_text = "\\nRepository Context:\\n\\n"
        if context.get("sources"):
            context_text += "Relevant Files:\\n"
            for source in context["sources"]:
                context_text += f"- {source['file']}\\n"
            context_text += "\\n"
        if context.get("response"):
            context_text += f"Repository Context:\\n{context['response']}\\n"
    # ... assemble the final prompt using the template and context_text
      </pre>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Real-World Impact</h2>
      <p class="mb-4">The results have been remarkable. Teams using our tool have reported more accurate, actionable responses from LLMs, with less back-and-forth and fewer misunderstandings. In one case, a developer was able to resolve a complex issue in minutes, thanks to a prompt that surfaced the exact context needed—no more, no less. In another, a product manager used our system to generate high-level summaries for stakeholders, saving hours of manual work.</p>
      
      <p class="mb-4">But perhaps the most rewarding feedback has come from new users, who tell us that our prompts "just make sense." They don't have to learn a new language or wrestle with confusing instructions—the system adapts to them, not the other way around.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">How It Changes the Way We Work</h2>
      <p class="mb-4">Dynamic prompt engineering has fundamentally changed our workflow. Developers spend less time crafting and debugging prompts, and more time solving real problems. Product teams can experiment with new types of analysis, knowing that the system will adapt. And as new models and capabilities emerge, we can update our templates and context integration strategies without missing a beat.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Looking Ahead</h2>
      <p class="mb-4">We see prompt engineering as a living discipline—one that will only grow in importance as LLMs become more powerful and more deeply integrated into the developer workflow. Our roadmap includes smarter context selection, more adaptive templates, and even real-time prompt validation to catch issues before they reach the model. We're excited to push the boundaries of what's possible, making every interaction with an LLM as effective and insightful as it can be.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Conclusion</h2>
      <p class="mb-4">Dynamic prompt engineering isn't just about getting better answers—it's about building a bridge between human intent and machine intelligence. By treating prompts as first-class citizens, we're helping teams unlock the full potential of LLMs, one carefully crafted question at a time. As our system continues to evolve, we look forward to empowering more users to ask better questions, get better answers, and move faster than ever before.</p>
    `
  },
  "efficient-vector-search-with-faiss": {
    id: "5",
    title: "Efficient Vector Search with FAISS: Powering Smart Code Analysis",
    date: "Apr 7, 2025",
    category: "Performance",
    image: "/lovable-uploads/2ff5738a-5cf2-46c0-a103-fb6ab072c055.png",
    content: `
      <h2 class="text-xl font-semibold mb-3 mt-6">Introduction</h2>
      <p class="mb-4">Every developer has faced the frustration of searching for that one elusive code snippet or documentation buried deep within a sprawling codebase. As our team built the GitHub Issue Analysis tool, we knew that fast, accurate search wasn't just a nice-to-have—it was the backbone of any meaningful code analysis. But traditional search tools fell short, especially as our repositories grew in size and complexity. We needed something smarter, faster, and more context-aware. That's when we discovered the power of vector search with FAISS.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">The Challenge</h2>
      <p class="mb-4">Imagine trying to find all the places a certain bug might be lurking—not just by keyword, but by semantic similarity, architectural context, and even documentation references. Our early attempts with basic text search were slow and often missed the mark. We wanted a system that could surface relevant code, documentation, and even related tests in milliseconds, no matter how large the codebase grew.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Our Approach</h2>
      <p class="mb-4">We turned to Facebook AI Similarity Search (FAISS), a library designed for efficient similarity search and clustering of dense vectors. By representing code, documentation, and even architectural patterns as embeddings, we could compare them in a high-dimensional space—surfacing results that were truly relevant, not just textually similar.</p>
      
      <p class="mb-4">Setting up FAISS as the foundation of our search infrastructure was a game-changer. Here's how we laid the groundwork for blazing-fast, context-rich search:</p>
      
      <pre class="bg-gray-800 text-gray-100 rounded-md p-4 my-6 overflow-x-auto">
# Setup FAISS vector store
persist_dir = f".faiss_index_{owner}_{repo}_{branch}"
os.makedirs(persist_dir, exist_ok=True)
faiss_index = faiss.IndexFlatL2(d)
vector_store = FaissVectorStore(faiss_index=faiss_index)
storage_context = StorageContext.from_defaults(
    vector_store=vector_store,
    docstore=None,
    index_store=None
)
      </pre>
      
      <p class="mb-4">With this setup, we could index millions of code snippets, documentation blocks, and test cases—each represented as a vector. When a user submitted a query, our system would instantly retrieve the most relevant results, ranked by true semantic similarity rather than just keyword overlap.</p>
      
      <p class="mb-4">But search is only as good as the context it provides. That's why we built a pipeline that doesn't just return code—it brings along the surrounding documentation, related files, and even architectural notes. For example, when a developer investigates a bug, our system can surface not only the affected function, but also the tests that cover it and the documentation that explains its purpose.</p>
      
      <p class="mb-4">Here's a glimpse of how we retrieve and format this rich context for every query:</p>
      
      <pre class="bg-gray-800 text-gray-100 rounded-md p-4 my-6 overflow-x-auto">
async def get_relevant_context(self, query: str) -> Dict[str, Any]:
    """Get relevant context from repository for a given query."""
    if not self.query_engine:
        raise Exception("Repository not loaded. Call load_repository first.")
    
    try:
        # Get response from query engine
        response = self.query_engine.query(query)
        
        # Extract relevant information
        context = {
            "response": str(response),
            "sources": [
                {
                    "file": os.path.abspath(node.metadata.get("file_name", "unknown")),
                    "language": node.metadata.get("display_name", "unknown"),
                    "description": node.metadata.get("description", "No description available"),
                    "content": node.text
                }
                for node in response.source_nodes
            ]
        }
        
        return context
      </pre>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Real-World Impact</h2>
      <p class="mb-4">The difference has been dramatic. Teams using our tool have reported that what once took hours—tracing a bug across multiple services, finding all related documentation, or surfacing the right test—now takes minutes. In one case, a developer was able to identify a subtle performance bottleneck by following the context trail our system provided, jumping seamlessly from code to documentation to test and back again.</p>
      
      <p class="mb-4">Our FAISS-powered search isn't just about speed; it's about surfacing the right information at the right time. By combining semantic search with rich context, we've helped teams resolve issues faster, onboard new contributors more effectively, and even plan features with greater confidence.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">How It Changes the Way We Work</h2>
      <p class="mb-4">With efficient vector search at the core, our workflow has fundamentally changed. Developers no longer waste time sifting through irrelevant results or piecing together context from scattered files. Instead, they get a curated, context-rich view of the codebase—empowering them to make better decisions, move faster, and collaborate more effectively.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Looking Ahead</h2>
      <p class="mb-4">We're excited about the future of vector search. Our roadmap includes even smarter embeddings, deeper integration with architectural analysis, and real-time updates as code changes. We envision a world where every developer has instant access to the full context of their codebase, no matter how complex it becomes.</p>
      
      <h2 class="text-xl font-semibold mb-3 mt-6">Conclusion</h2>
      <p class="mb-4">Efficient vector search with FAISS isn't just a technical upgrade—it's a new way of working. By making search smarter, faster, and more context-aware, we're helping teams unlock the full potential of their codebases. As our system continues to evolve, we look forward to empowering more developers to find what they need, understand why it matters, and build with confidence.</p>
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
