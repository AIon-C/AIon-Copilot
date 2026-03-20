'use client';

import { useCallback, useState } from 'react';

import { reactionService } from '../api/reaction-service';
import type { RemoveReactionInput, RemoveReactionResult } from '../model/reaction-types';

export function useRemoveReaction() {
  const [result, setResult] = useState<RemoveReactionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeReaction = useCallback(async (input: RemoveReactionInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await reactionService.removeReaction(input);
      setResult(response);
      return response;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to remove reaction';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    result,
    removeReaction,
    loading,
    error,
  };
}
