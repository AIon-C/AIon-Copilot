"use client";

import { useCallback, useState } from "react";
import { reactionService } from "../api/reaction-service";
import type {
  ListReactionsInput,
  ReactionModel,
} from "../model/reaction-types";

export function useListReactions() {
  const [reactions, setReactions] = useState<ReactionModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReactions = useCallback(async (input: ListReactionsInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await reactionService.listReactions(input);
      setReactions(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to list reactions";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearReactions = useCallback(() => {
    setReactions([]);
    setError(null);
  }, []);

  return {
    reactions,
    fetchReactions,
    clearReactions,
    loading,
    error,
  };
}