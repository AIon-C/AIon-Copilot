"use client";

import { useCallback, useState } from "react";
import { workspaceService } from "../api/workspace-service";
import type {
  UpdateWorkspaceInput,
  WorkspaceModel,
} from "../model/workspace-types";

export function useUpdateWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateWorkspace = useCallback(async (input: UpdateWorkspaceInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await workspaceService.updateWorkspace(input);
      setWorkspace(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to update workspace";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    workspace,
    updateWorkspace,
    loading,
    error,
  };
}