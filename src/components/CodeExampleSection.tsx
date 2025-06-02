
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CodeExampleSection = () => {
  const [activeTab, setActiveTab] = useState("python");

  const pythonCode = `from src.github_client import GitHubIssueClient
from src.local_rag import LocalRepoContextExtractor
from src.prompt_generator import PromptGenerator
import asyncio

async def main():
    issue_url = "https://github.com/huggingface/smolagents/issues/1292"
    github_client = GitHubIssueClient()
    issue_response = await github_client.get_issue(issue_url)
    if issue_response.status != "success":
        print("Failed to fetch issue")
        return
    repo_extractor = LocalRepoContextExtractor()
    await repo_extractor.load_repository("https://github.com/huggingface/smolagents.git")
    context = await repo_extractor.get_issue_context(issue_response.data.title, issue_response.data.body)
    prompt_generator = PromptGenerator()
    prompt = await prompt_generator.generate_prompt(
        request=None,  # Fill in as needed
        issue=issue_response.data
    )
    print(prompt)

asyncio.run(main())`;

  const cliCode = `# Install triage.flow
$ pip install triage-flow

# Analyze a GitHub issue
$ triage-flow --issue https://github.com/huggingface/transformers/issues/12345

Fetching issue from GitHub...
Issue title: "Model fails to load with CUDA out of memory error"
Issue description: "When trying to load the model on GPU with 8GB of memory..."

Cloning repository...
Analyzing code and documentation...
Found 20 relevant files.

Building vector index...
Running semantic search...
Generating prompt with context...

Generated prompt:
"""
You are a helpful AI assistant for the Hugging Face Transformers library.
ISSUE TITLE: Model fails to load with CUDA out of memory error
...
"""

# Or use for any repository
$ triage-flow --repo https://github.com/myorg/myrepo.git --type fix`;

  const apiCode = `# REST API Usage
curl -X POST http://localhost:8000/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/huggingface/transformers.git",
    "issue_id": 12345,
    "prompt_type": "explain"
  }'

# Response
{
  "session_id": "abc123",
  "prompt": "You are a helpful AI assistant...",
  "context_files": [
    "src/transformers/models/bert/modeling_bert.py",
    "src/transformers/trainer.py"
  ]
}

# Start a chat session
curl -X POST http://localhost:8000/sessions \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/myorg/myrepo.git"
  }'`;

  return (
    <section id="examples" className="py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tighter mb-2">Code Examples</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Use triage.flow as a Python library, CLI tool, or API service — integrate however works best for your workflow.
          </p>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-lg max-w-4xl mx-auto">
          <Tabs defaultValue="python" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="python">🐍 Python Library</TabsTrigger>
              <TabsTrigger value="cli">🔧 CLI Tool</TabsTrigger>
              <TabsTrigger value="api">🧪 API Usage</TabsTrigger>
            </TabsList>
            <TabsContent value="python" className="rounded-md bg-muted p-4">
              <pre className="font-code text-sm overflow-x-auto">
                <code>{pythonCode}</code>
              </pre>
            </TabsContent>
            <TabsContent value="cli" className="rounded-md bg-muted p-4">
              <pre className="font-code text-sm overflow-x-auto">
                <code>{cliCode}</code>
              </pre>
            </TabsContent>
            <TabsContent value="api" className="rounded-md bg-muted p-4">
              <pre className="font-code text-sm overflow-x-auto">
                <code>{apiCode}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default CodeExampleSection;
