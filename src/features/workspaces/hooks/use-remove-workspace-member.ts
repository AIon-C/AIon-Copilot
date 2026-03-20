'use client';

import { useCallback, useState } from 'react';

import { workspaceService } from '../api/workspace-service';
import type { RemoveWorkspaceMemberInput } from '../model/workspace-types';

export function useRemoveWorkspaceMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeWorkspaceMember = useCallback(async (input: RemoveWorkspaceMemberInput) => {
    setLoading(true);
    setError(null);

    try {
      await workspaceService.removeMember(input);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to remove workspace member';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    removeWorkspaceMember,
    loading,
    error,
  };
}
