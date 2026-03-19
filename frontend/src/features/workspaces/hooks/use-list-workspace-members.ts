"use client";

import { useCallback, useState } from "react";
import { workspaceService } from "../api/workspace-service";
import type {
  ListWorkspaceMembersInput,
  WorkspaceMemberModel,
} from "../model/workspace-types";

export function useListWorkspaceMembers() {
  const [members, setMembers] = useState<WorkspaceMemberModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (input: ListWorkspaceMembersInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await workspaceService.listWorkspaceMembers(input);
      setMembers(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to list workspace members";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    members,
    fetchMembers,
    loading,
    error,
  };
}