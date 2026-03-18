'use client';

import { useCallback, useState } from 'react';

import { channelService } from '../api/channel-service';
import type { LeaveChannelInput } from '../model/channel-types';

export function useLeaveChannel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leaveChannel = useCallback(async (input: LeaveChannelInput) => {
    setLoading(true);
    setError(null);

    try {
      await channelService.leaveChannel(input);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to leave channel';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    leaveChannel,
    loading,
    error,
  };
}
