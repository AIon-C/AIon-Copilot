"use client";

import { useCallback, useState } from "react";
import { workspaceService } from "../api/workspace-service";
import type {
  ListWorkspacesInput,
  WorkspaceModel,
} from "../model/workspace-types";

export function useListWorkspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async (input?: ListWorkspacesInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await workspaceService.listWorkspaces(input);
      setWorkspaces(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to list workspaces";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    workspaces,
    fetchWorkspaces,
    loading,
    error,
  };
}