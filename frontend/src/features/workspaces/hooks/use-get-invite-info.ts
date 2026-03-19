'use client';

import { useCallback, useState } from 'react';

import { workspaceService } from '../api/workspace-service';
import type { InviteInfoModel } from '../model/workspace-types';

export function useGetInviteInfo() {
  const [inviteInfo, setInviteInfo] = useState<InviteInfoModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInviteInfo = useCallback(async (inviteCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await workspaceService.getInviteInfo(inviteCode);
      setInviteInfo(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to get invite info';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    inviteInfo,
    fetchInviteInfo,
    loading,
    error,
  };
}
