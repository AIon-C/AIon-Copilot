"use client";

import { useCallback, useState } from "react";
import { channelService } from "../api/channel-service";
import type {
  ChannelModel,
  CreateChannelInput,
} from "../model/channel-types";

export function useCreateChannel() {
  const [createdChannel, setCreatedChannel] = useState<ChannelModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChannel = useCallback(async (input: CreateChannelInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await channelService.createChannel(input);
      setCreatedChannel(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to create channel";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCreatedChannel = useCallback(() => {
    setCreatedChannel(null);
    setError(null);
  }, []);

  return {
    createdChannel,
    createChannel,
    clearCreatedChannel,
    loading,
    error,
  };
}