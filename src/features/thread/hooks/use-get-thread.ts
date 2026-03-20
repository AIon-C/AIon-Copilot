'use client';

import { useCallback, useState } from 'react';

import { threadService } from '../api/thread-service';
import type { GetThreadInput, ThreadModel } from '../model/thread-types';

export function useGetThread() {
  const [thread, setThread] = useState<ThreadModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = useCallback(async (input: GetThreadInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await threadService.getThread(input);
      setThread(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to get thread';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearThread = useCallback(() => {
    setThread(null);
    setError(null);
  }, []);

  return {
    thread,
    fetchThread,
    clearThread,
    loading,
    error,
  };
}
