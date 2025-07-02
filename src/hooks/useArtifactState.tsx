import { useState, useCallback } from 'react';
import { Artifact } from '@/types/canvas.types';

export const useArtifactState = (_sessionId: string) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  const addArtifact = useCallback((artifact: Omit<Artifact, 'createdAt' | 'updatedAt'>) => {
    const newArtifact: Artifact = {
      ...artifact,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setArtifacts(prev => [...prev, newArtifact]);
  }, []);

  const updateArtifact = useCallback((artifactId: string, updates: Partial<Artifact>) => {
    setArtifacts(prev => prev.map(artifact => 
      artifact.id === artifactId 
        ? { ...artifact, ...updates, updatedAt: new Date() }
        : artifact
    ));
  }, []);

  const removeArtifact = useCallback((artifactId: string) => {
    setArtifacts(prev => prev.filter(artifact => artifact.id !== artifactId));
  }, []);

  const getArtifactsByType = useCallback((type: Artifact['type']) => {
    return artifacts.filter(artifact => artifact.type === type);
  }, [artifacts]);

  return {
    artifacts,
    addArtifact,
    updateArtifact,
    removeArtifact,
    getArtifactsByType,
  };
};