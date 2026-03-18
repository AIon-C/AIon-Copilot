"use client";

import { useCallback, useState } from "react";
import { channelService } from "../api/channel-service";
import type {
  ChannelMemberModel,
  JoinChannelInput,
} from "../model/channel-types";

export function useJoinChannel() {
  const [membership, setMembership] = useState<ChannelMemberModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinChannel = useCallback(async (input: JoinChannelInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await channelService.joinChannel(input);
      setMembership(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to join channel";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMembership = useCallback(() => {
    setMembership(null);
    setError(null);
  }, []);

  return {
    membership,
    joinChannel,
    clearMembership,
    loading,
    error,
  };
}