"use client";

import { useCallback, useState } from "react";
import { workspaceService } from "../api/workspace-service";
import type {
  JoinWorkspaceByInviteInput,
  WorkspaceMemberModel,
} from "../model/workspace-types";

export function useJoinWorkspaceByInvite() {
  const [member, setMember] = useState<WorkspaceMemberModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinWorkspaceByInvite = useCallback(
    async (input: JoinWorkspaceByInviteInput) => {
      setLoading(true);
      setError(null);

      try {
        const result = await workspaceService.joinWorkspaceByInvite(input);
        setMember(result);
        return result;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to join workspace by invite";
        setError(message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    member,
    joinWorkspaceByInvite,
    loading,
    error,
  };
}