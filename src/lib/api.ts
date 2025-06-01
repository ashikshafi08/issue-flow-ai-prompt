/**
 * API utilities for connecting to the triage.flow backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Creates a new chat session for a GitHub issue URL with the specified prompt type
 */
export const createChatSession = async (issueUrl: string, promptType: string) => {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      issue_url: issueUrl,
      prompt_type: promptType,
      llm_config: { // Matches PromptRequest model in the backend
        provider: "openrouter", // Default provider
        name: "openai/o4-mini-high"  // Default model
      },
      context: {} // Optional, can be empty for now
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create session and parse error' }));
    throw new Error(errorData.detail || 'Failed to create session');
  }

  return response.json(); // Expects { session_id: string, initial_message: string }
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
