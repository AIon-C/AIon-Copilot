"use client";

import { useCallback, useState } from "react";
import { workspaceService } from "../api/workspace-service";
import type {
  GetWorkspaceInput,
  WorkspaceModel,
} from "../model/workspace-types";

export function useGetWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async (input: GetWorkspaceInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await workspaceService.getWorkspace(input);
      setWorkspace(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to get workspace";
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
    fetchWorkspace,
    clearWorkspace,
    loading,
    error,
  };
}