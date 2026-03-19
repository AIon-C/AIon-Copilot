"use client";

import { useCallback, useState } from "react";
import { workspaceService } from "../api/workspace-service";
import type { InviteWorkspaceMemberInput } from "../model/workspace-types";

export function useInviteWorkspaceMember() {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteWorkspaceMember = useCallback(
    async (input: InviteWorkspaceMemberInput) => {
      setLoading(true);
      setError(null);

      try {
        const result = await workspaceService.inviteWorkspaceMember(input);
        setInviteToken(result);
        return result;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to invite workspace member";
        setError(message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    inviteToken,
    inviteWorkspaceMember,
    loading,
    error,
  };
}