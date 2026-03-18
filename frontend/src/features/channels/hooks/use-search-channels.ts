"use client";

import { useCallback, useState } from "react";
import { channelService } from "../api/channel-service";
import type {
  ChannelModel,
  SearchChannelsInput,
} from "../model/channel-types";

export function useSearchChannels() {
  const [channels, setChannels] = useState<ChannelModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchChannels = useCallback(async (input: SearchChannelsInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await channelService.searchChannels(input);
      setChannels(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to search channels";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearchResult = useCallback(() => {
    setChannels([]);
    setError(null);
  }, []);

  return {
    channels,
    searchChannels,
    clearSearchResult,
    loading,
    error,
  };
}