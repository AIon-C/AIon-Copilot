'use client';

import { useCallback, useState } from 'react';

import { channelService } from '../api/channel-service';
import type { ChannelModel, GetChannelInput } from '../model/channel-types';

export function useGetChannel() {
  const [channel, setChannel] = useState<ChannelModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannel = useCallback(async (input: GetChannelInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await channelService.getChannel(input);
      setChannel(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to get channel';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearChannel = useCallback(() => {
    setChannel(null);
    setError(null);
  }, []);

  return {
    channel,
    fetchChannel,
    clearChannel,
    loading,
    error,
  };
}
