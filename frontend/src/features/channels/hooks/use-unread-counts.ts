'use client';

import { useCallback, useState } from 'react';

import { channelService } from '../api/channel-service';
import { UnreadCountModel } from '../model/channel-types';

export function useUnreadCounts() {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCountModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCounts = useCallback(async (workspaceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await channelService.getUnreadCounts(workspaceId);
      setUnreadCounts(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch unread counts';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    unreadCounts,
    fetchUnreadCounts,
    loading,
    error,
  };
}
