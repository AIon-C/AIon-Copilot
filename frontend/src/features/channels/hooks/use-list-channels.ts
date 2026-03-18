'use client';

import { useCallback, useState } from 'react';

import { channelService } from '../api/channel-service';
import { ChannelModel, ListChannelsInput } from '../model/channel-types';

export function useListChannels() {
  const [channels, setChannels] = useState<ChannelModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async (input: ListChannelsInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await channelService.listChannels(input);
      setChannels(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to list channels';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    channels,
    fetchChannels,
    loading,
    error,
  };
}
