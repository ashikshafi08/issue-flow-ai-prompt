/**
 * OnboardAI API Client
 * 
 * TypeScript client library for integrating with the OnboardAI backend APIs.
 * Provides type-safe methods for all onboarding operations.
 */

// Types
export interface DeveloperProfile {
  name?: string;
  email?: string;
  experience_level: 'junior' | 'mid' | 'senior' | 'lead';
  role: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'devops' | 'data' | 'qa';
  years_of_experience: number;
  programming_languages: string[];
  frameworks: string[];
  learning_style: 'visual' | 'hands_on' | 'reading' | 'auditory' | 'mixed';
  preferred_pace: 'slow' | 'normal' | 'fast';
  goals: string[];
  github_username?: string;
  timezone: string;
  prefers_mentorship: boolean;
  comfortable_with_ambiguity: boolean;
  prefers_structured_learning: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  step_type: string;
  estimated_time: number;
  difficulty_level?: string;
  dependencies?: string[];
  resources: Resource[];
}

export interface Resource {
  type: 'guide' | 'video' | 'ai_chat' | 'markdown' | 'interactive';
  title: string;
  url?: string;
  path?: string;
  prompt?: string;
}

export interface OnboardingWorkflow {
  id: string;
  steps: OnboardingStep[];
  personalization: {
    experience_level: string;
    role: string;
    estimated_total_time: number;
  };
}

export interface ProgressSummary {
  current_step: number;
  total_steps: number;
  completion_percentage: number;
  time_spent_hours: number;
  estimated_time_remaining: number;
  achievements: string[];
  current_phase: string;
  strengths: string[];
  areas_for_improvement: string[];
}

export interface ChatMessage {
  message: string;
  context?: {
    current_step?: OnboardingStep;
    workspace_id?: string;
    difficulty_feedback?: 'too_easy' | 'just_right' | 'too_hard';
  };
}

export interface ChatResponse {
  content: string;
  structured_response?: {
    type: string;
    data: any;
  };
  learning_points?: string[];
  suggested_next_actions?: string[];
}

export interface SkillGapAnalysis {
  gaps: Array<{
    skill: string;
    importance: 'high' | 'medium' | 'low';
    current_level: number;
    target_level: number;
    learning_resources: Resource[];
  }>;
  learning_path: Array<{
    phase: string;
    skills: string[];
    estimated_time: number;
  }>;
  personalized_recommendations: string[];
}

// API Client Class
export class OnboardingAPIClient {
  private baseURL: string;
  private headers: HeadersInit;
  private userId: string;
  private workspaceId: string;
  private repoPath: string;

  constructor(
    userId: string,
    workspaceId: string, 
    repoPath: string,
    baseURL = '/api',
    apiKey?: string
  ) {
    this.baseURL = baseURL;
    this.userId = userId;
    this.workspaceId = workspaceId;
    this.repoPath = repoPath;
    this.headers = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
    };
  }

  // Profile Management
  async createProfile(surveyData: Partial<DeveloperProfile>): Promise<DeveloperProfile> {
    const response = await fetch(`${this.baseURL}/onboarding/profile/survey`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(surveyData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create profile: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  }

  async getProfile(): Promise<DeveloperProfile> {
    const response = await fetch(`${this.baseURL}/onboarding/profile/${this.userId}`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get profile: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  }

  async updateProfile(updates: Partial<DeveloperProfile>): Promise<DeveloperProfile> {
    const response = await fetch(`${this.baseURL}/onboarding/profile/${this.userId}/update`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  }

  // Onboarding Session Management
  async startOnboarding(): Promise<{ session_id: string; message: string }> {
    const response = await fetch(`${this.baseURL}/onboarding/session/start`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ 
        user_id: this.userId,
        workspace_id: this.workspaceId,
        repo_path: this.repoPath
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to start onboarding: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  }

  async getWorkflow(): Promise<OnboardingWorkflow> {
    const params = new URLSearchParams({
      user_id: this.userId,
      workspace_id: this.workspaceId,
      repo_path: this.repoPath
    });
    
    const response = await fetch(`${this.baseURL}/onboarding/workflow?${params}`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get workflow: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  }

  // Progress Tracking
  async getProgress(): Promise<ProgressSummary> {
    const params = new URLSearchParams({
      user_id: this.userId,
      workspace_id: this.workspaceId,
      repo_path: this.repoPath
    });
    
    const response = await fetch(`${this.baseURL}/onboarding/summary?${params}`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get progress: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  }

  async completeStep(stepId: string, timeSpent: number, feedback?: string): Promise<{ next_step?: OnboardingStep }> {
    const params = new URLSearchParams({
      user_id: this.userId,
      workspace_id: this.workspaceId,
      repo_path: this.repoPath
    });
    
    const response = await fetch(`${this.baseURL}/onboarding/progress/update?${params}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        step_id: stepId,
        time_spent_minutes: timeSpent,
        feedback: feedback
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to complete step: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  }

  async provideDifficultyFeedback(
    stepId: string, 
    feedback: 'too_easy' | 'just_right' | 'too_hard'
  ): Promise<void> {
    const response = await fetch(`${this.baseURL}/onboarding/feedback/difficulty`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ 
        step_id: stepId,
        difficulty_feedback: feedback 
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to provide feedback: ${response.statusText}`);
    }
  }

  // AI Chat Interface
  async sendChatMessage(message: ChatMessage): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/onboarding/chat`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send chat message: ${response.statusText}`);
    }
    
    return response.json();
  }

  async explainConcept(concept: string, context?: string): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/onboarding/explain`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ 
        concept,
        context 
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to explain concept: ${response.statusText}`);
    }
    
    return response.json();
  }

  async generateCodebaseTour(): Promise<{
    tour_steps: Array<{
      step: number;
      title: string;
      description: string;
      files_to_explore: string[];
      key_concepts: string[];
    }>;
  }> {
    const response = await fetch(`${this.baseURL}/onboarding/codebase-tour`, {
      method: 'POST',
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate codebase tour: ${response.statusText}`);
    }
    
    return response.json();
  }

  async suggestFirstTasks(): Promise<{
    suggested_tasks: Array<{
      id: string;
      title: string;
      description: string;
      difficulty: string;
      estimated_time: number;
      files_involved: string[];
      learning_objectives: string[];
    }>;
  }> {
    const response = await fetch(`${this.baseURL}/onboarding/suggest-tasks`, {
      method: 'POST',
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to suggest tasks: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Advanced AI Features
  async analyzeSkillGaps(): Promise<SkillGapAnalysis> {
    const response = await fetch(`${this.baseURL}/advanced-onboarding/skill-gap-analysis`, {
      method: 'POST',
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to analyze skill gaps: ${response.statusText}`);
    }
    
    return response.json();
  }

  async generatePersonalizedLearningPath(targetSkills: string[]): Promise<{
    learning_path: Array<{
      phase: string;
      duration_weeks: number;
      skills: string[];
      resources: Resource[];
      milestones: string[];
    }>;
    personalization_notes: string[];
  }> {
    const response = await fetch(`${this.baseURL}/advanced-onboarding/personalized-learning-path`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ target_skills: targetSkills })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate learning path: ${response.statusText}`);
    }
    
    return response.json();
  }

  async optimizeWorkflow(): Promise<{
    optimized_workflow: OnboardingWorkflow;
    optimization_notes: string[];
    improvement_metrics: {
      estimated_time_reduction: number;
      difficulty_balance_score: number;
      personalization_score: number;
    };
  }> {
    const response = await fetch(`${this.baseURL}/advanced-onboarding/optimize-workflow`, {
      method: 'POST',
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to optimize workflow: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Error handling helper
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Factory function to create API client instances
export function createOnboardingAPI(userId: string, workspaceId: string, repoPath: string) {
  return new OnboardingAPIClient(userId, workspaceId, repoPath);
}

// React hooks for easy integration
export function useOnboardingAPI(userId: string, workspaceId: string, repoPath: string) {
  return createOnboardingAPI(userId, workspaceId, repoPath);
}

// Helper functions
export async function initializeOnboarding(
  userId: string,
  workspaceId: string,
  repoPath: string
): Promise<{
  sessionId: string;
  profile: DeveloperProfile;
  workflow: OnboardingWorkflow;
}> {
  const api = createOnboardingAPI(userId, workspaceId, repoPath);
  const startResponse = await api.startOnboarding();
  const profile = await api.getProfile();
  const workflow = await api.getWorkflow();
  
  return {
    sessionId: startResponse.session_id,
    profile,
    workflow
  };
}

export async function completeOnboardingStep(
  userId: string,
  workspaceId: string,
  repoPath: string,
  stepId: string, 
  timeSpent: number,
  feedback?: string
): Promise<boolean> {
  try {
    const api = createOnboardingAPI(userId, workspaceId, repoPath);
    await api.completeStep(stepId, timeSpent, feedback);
    return true;
  } catch (error) {
    console.error('Failed to complete step:', error);
    return false;
  }
}

export async function getChatResponse(
  userId: string,
  workspaceId: string,
  repoPath: string,
  message: string,
  context?: any
): Promise<ChatResponse | null> {
  try {
    const api = createOnboardingAPI(userId, workspaceId, repoPath);
    return await api.sendChatMessage({
      message,
      context
    });
  } catch (error) {
    console.error('Failed to get chat response:', error);
    return null;
  }
}

// Default export
export default OnboardingAPIClient; 