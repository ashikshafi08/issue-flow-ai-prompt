/**
 * API utilities for connecting to the triage.flow backend
 */

const API_BASE_URL = 'http://localhost:8000';

export interface RepoSessionRequest {
  repo_url: string;
  initial_file?: string;
  session_name?: string;
}

export interface RepoSessionResponse {
  session_id: string;
  repo_metadata: {
    repo_url: string;
    owner: string;
    repo: string;
    session_name: string;
    initial_file?: string;
    status: string;
    error?: string;
  };
  status: string;
  message?: string;
}

export interface SessionInfo {
  id: string;
  type: string;
  created_at: string;
  last_accessed: string;
  metadata: any;
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

// Repository chat session API functions
export const createRepoSession = async (request: RepoSessionRequest): Promise<RepoSessionResponse> => {
  const response = await fetch(`${API_BASE_URL}/assistant/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create repository session');
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

export const getSessionMessages = async (sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/assistant/sessions/${sessionId}/messages`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get session messages');
  }

  return response.json();
};

// Existing chat session API functions
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
        name: "anthropic/claude-3.5-sonnet"
      }
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create chat session');
  }

  return response.json();
};

// The getJobStatus function is no longer needed with the new session-based backend.
// It can be removed or commented out if there's no other part of the app using it.
/*
export const getJobStatus = async (jobId: string) => {
  const response = await fetch(`${API_BASE_URL}/job_status/${jobId}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to get job status');
  }
  
  return response.json();
};
*/
