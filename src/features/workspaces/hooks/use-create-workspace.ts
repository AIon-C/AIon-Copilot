'use client';

import { useCallback, useState } from 'react';

import { workspaceService } from '../api/workspace-service';
import type { CreateWorkspaceInput, WorkspaceModel } from '../model/workspace-types';

export function useCreateWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkspace = useCallback(async (input: CreateWorkspaceInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await workspaceService.createWorkspace(input);
      setWorkspace(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create workspace';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearWorkspace = useCallback(() => {
    setWorkspace(null);
    setError(null);
  }, []);

  return {
    workspace,
    createWorkspace,
    clearWorkspace,
    loading,
    error,
  };
}
