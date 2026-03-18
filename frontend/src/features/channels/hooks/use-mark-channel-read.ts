"use client";

import { useCallback, useState } from "react";
import { channelService } from "../api/channel-service";
import type { MarkChannelReadInput } from "../model/channel-types";

export function useMarkChannelRead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markChannelRead = useCallback(async (input: MarkChannelReadInput) => {
    setLoading(true);
    setError(null);

    try {
      await channelService.markChannelRead(input);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to mark channel as read";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    markChannelRead,
    loading,
    error,
  };
}