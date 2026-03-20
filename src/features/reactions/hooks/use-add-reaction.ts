'use client';

import { useCallback, useState } from 'react';

import { reactionService } from '../api/reaction-service';
import type { AddReactionInput, ReactionModel } from '../model/reaction-types';

export function useAddReaction() {
  const [reaction, setReaction] = useState<ReactionModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addReaction = useCallback(async (input: AddReactionInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await reactionService.addReaction(input);
      setReaction(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add reaction';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    reaction,
    addReaction,
    loading,
    error,
  };
}
