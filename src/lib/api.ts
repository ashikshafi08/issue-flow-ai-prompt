/**
 * API utilities for connecting to the triage.flow backend
 */
import type { ChatMessage, AgenticStep } from '@/pages/Assistant'; // Import shared types

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface RepoSessionRequest {
  repo_url: string;
  initial_file?: string;
  session_name?: string;
}

export interface RepoSessionResponse {
  session_id: string;
  repo_metadata: any; // Consider defining a more specific type
  status: string;
  message: string;
}

export interface SessionInfo {
  id: string;
  type: string;
  created_at: string;
  last_accessed: string;
  metadata: {
    repo_url?: string;
    owner?: string;
    repo?: string;
    session_name?: string;
    initial_file?: string;
    storage_path?: string;
    status?: string;
    core_status_achieved_at?: string | null;
    full_status_achieved_at?: string | null;
    patch_linkage_status?: string;
    patch_linkage_progress?: number;
    patch_linkage_message?: string;
    patch_linkage_error?: string;
    tools_ready?: string[];
    error?: string;
    [key: string]: any;
  };
  message_count: number;
  repo_url?: string;
  session_name?: string;
  issue_url?: string;
  prompt_type?: string;
}

export interface SessionListResponse {
  sessions: SessionInfo[];
  total: number;
}

export interface StreamedAgenticResponse {
    type: 'step' | 'final' | 'error' | 'status';
    step?: AgenticStep;
    final_answer?: string;
    steps?: AgenticStep[];
    suggestions?: string[];
    error?: string;
    content?: string; // For 'status' type
    final?: boolean;
}

// Repository chat session API functions
export const createRepoSession = async (request: RepoSessionRequest): Promise<RepoSessionResponse> => {
  console.log('Creating repo session with request:', request);
  
  const response = await fetch(`${API_BASE_URL}/assistant/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    try {
      const error = await response.json();
      console.error('API Error Response:', error);
      
      // Handle FastAPI validation errors (422)
      if (response.status === 422 && error.detail && Array.isArray(error.detail)) {
        const validationErrors = error.detail.map((err: any) => 
          `${err.loc?.join('.') || 'unknown'}: ${err.msg || 'validation error'}`
        ).join(', ');
        throw new Error(`Validation error: ${validationErrors}`);
      }
      
      throw new Error(error.detail || error.message || 'Failed to create repository session');
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error(`HTTP ${response.status}: Failed to create repository session`);
    }
  }

  return response.json();
};

export const listAssistantSessions = async (sessionType?: string): Promise<SessionListResponse> => {
  const url = new URL(`${API_BASE_URL}/assistant/sessions`);
  if (sessionType) {
    url.searchParams.append('session_type', sessionType);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch sessions');
  }

  return response.json();
};

export const getSessionStatus = async (sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}/status`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get session status');
  }

  return response.json();
};

export const deleteAssistantSession = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete session');
  }
};

export const getSessionMetadata = async (sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}/metadata`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get session metadata');
  }

  return response.json();
};

export const getSessionMessages = async (sessionId: string): Promise<{session_id: string, messages: ChatMessage[], total_messages: number}> => {
  const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}/messages`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get session messages');
  }

  return response.json();
};

// Existing chat session API functions (issue-based, might be deprecated or refactored)
export const createChatSession = async (issueUrl: string, promptType: string = "explain") => {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      issue_url: issueUrl,
      prompt_type: promptType,
      llm_config: {
        provider: "openrouter",
        name: "anthropic/claude-3.5-sonnet" // Consider making this configurable
      }
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create chat session');
  }

  return response.json();
};

export const enableAgenticMode = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}/enable-agentic`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to enable agentic mode');
  }
};

export async function* sendMessage(
  sessionId: string,
  content: string,
  agentic: boolean = true,
  contextFiles?: string[]
): AsyncGenerator<StreamedAgenticResponse> {
  const url = `${API_BASE_URL}/assistant/sessions/${sessionId}/agentic-query?stream=true`;
  const payload: any = { role: 'user', content };
  
  if (contextFiles && contextFiles.length > 0) {
    payload.context_files = contextFiles;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown API error' }));
      yield { type: 'error', error: errorData.detail || `API Error: ${response.status}`, final: true };
      return;
    }

    if (!response.body) {
      yield { type: 'error', error: 'Response body is null.', final: true };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) {
          try {
            const jsonChunk = JSON.parse(buffer.trim());
            yield jsonChunk as StreamedAgenticResponse;
          } catch (e) {
            console.error('Error parsing final JSON chunk:', e, buffer);
            yield { type: 'error', error: `Error parsing final JSON: ${e instanceof Error ? e.message : String(e)}`, final: true };
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      let eolIndex;
      while ((eolIndex = buffer.indexOf('\n\n')) >= 0) {
        const line = buffer.substring(0, eolIndex).trim();
        buffer = buffer.substring(eolIndex + 2);

        if (line.startsWith('data: ')) {
          const jsonData = line.substring(6);
          if (jsonData === '[DONE]') {
            continue;
          }
          try {
            const parsedChunk = JSON.parse(jsonData);
            yield parsedChunk as StreamedAgenticResponse;
            if (parsedChunk.type === 'final' || (parsedChunk.type === 'error' && parsedChunk.final)) {
              return;
            }
          } catch (e) {
            console.error('Error parsing JSON chunk:', e, jsonData);
            yield { type: 'error', error: `Error parsing JSON: ${e instanceof Error ? e.message : String(e)}`, final: true };
            return;
          }
        }
      }
    }
  } catch (error) {
    console.error('sendMessage stream error:', error);
    yield { type: 'error', error: error instanceof Error ? error.message : 'Network or unknown error during streaming.', final: true };
  }
}

export const resetAgenticMemory = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}/reset-agentic-memory`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to reset agent memory' }));
    throw new Error(errorData.detail || 'Failed to reset agent memory');
  }
  // No explicit return here, but it's a Promise<void>
};

export const syncRepository = async (sessionId: string): Promise<{ session_id: string; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}/sync-repository`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to start repository sync' }));
    throw new Error(errorData.detail || 'Failed to start repository sync');
  }
  return response.json();
};

export interface PullRequestInfo {
  number: number;
  title: string;
  merged_at?: string | null; // Merged PRs will have this
  files_changed: string[];
  issue_id?: number | null; // PRs might be linked to issues
  // Add other relevant PR fields as needed by the UI
  url?: string; // Optional: URL to the PR on GitHub
  user?: { login: string }; // Optional: User who created the PR
  body?: string; // Optional: PR description
}

export const listPullRequests = async (repoUrl: string, sessionId?: string, state: string = "merged"): Promise<PullRequestInfo[]> => {
  const url = new URL(`${API_BASE_URL}/api/prs`);
  url.searchParams.append('repo_url', repoUrl);
  url.searchParams.append('state', state);
  if (sessionId) {
    url.searchParams.append('session_id', sessionId);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `Failed to fetch ${state} pull requests` }));
    throw new Error(errorData.detail || `Failed to fetch ${state} pull requests`);
  }
  return response.json();
};

// Issue Analysis API

export interface IssueAnalysisRequest {
  issue_url: string;
  session_id?: string;
}

export interface IssueAnalysisStep {
  step: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  result?: any;
  error?: string;
}

export interface IssueAnalysisResponse {
  session_id: string;
  steps: IssueAnalysisStep[];
  final_result?: {
    classification?: {
      category: string;
      confidence: number;
      reasoning: string;
    };
    related_files?: string[];
    remediation_plan?: string;
  };
  status: 'in_progress' | 'completed' | 'error';
  error?: string;
}

export const analyzeIssue = async (request: IssueAnalysisRequest): Promise<IssueAnalysisResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/analyze-issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to analyze issue');
  }

  return response.json();
};

export interface ApplyPatchRequest {
  patch_content: string;
  session_id: string;
}

export interface ApplyPatchResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  modified_files?: Array<{
    file: string;
    status: string;
  }>;
}

export const applyPatch = async (request: ApplyPatchRequest): Promise<ApplyPatchResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/apply-patch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to apply patch');
  }

  return response.json();
};
