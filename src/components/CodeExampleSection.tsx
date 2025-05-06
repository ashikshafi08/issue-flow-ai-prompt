
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

  const cliCode = `$ python examples/examples_complete_rag.py

Enter GitHub issue URL: https://github.com/huggingface/transformers/issues/12345

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
"""`;

  const apiCode = `from fastapi import FastAPI
from src.github_client import GitHubIssueClient
from src.local_rag import LocalRepoContextExtractor
from src.prompt_generator import PromptGenerator
import asyncio

app = FastAPI()

@app.get("/generate-prompt/")
async def generate_prompt(issue_url: str, prompt_type: str = "explain"):
    github_client = GitHubIssueClient()
    issue_response = await github_client.get_issue(issue_url)
    if issue_response.status != "success":
        return {"error": "Failed to fetch issue"}
    repo_extractor = LocalRepoContextExtractor()
    await repo_extractor.load_repository(issue_url.rsplit("/issues/", 1)[0] + ".git")
    context = await repo_extractor.get_issue_context(issue_response.data.title, issue_response.data.body)
    prompt_generator = PromptGenerator()
    prompt = await prompt_generator.generate_prompt(
        request=None,  # Fill in as needed
        issue=issue_response.data
    )
    return {"prompt": prompt}`;

  return (
    <section id="examples" className="py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tighter mb-2">Code Examples</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Use GH Issue Prompt as a Python library, CLI tool, or API service.
          </p>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-lg max-w-4xl mx-auto">
          <Tabs defaultValue="python" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="python">Python Library</TabsTrigger>
              <TabsTrigger value="cli">CLI Tool</TabsTrigger>
              <TabsTrigger value="api">API Service</TabsTrigger>
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
