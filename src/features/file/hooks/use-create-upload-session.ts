'use client';

import { useCallback, useState } from 'react';

import { fileService } from '../api/file-service';
import type { CreateUploadSessionInput, CreateUploadSessionResult } from '../model/file-types';

export function useCreateUploadSession() {
  const [session, setSession] = useState<CreateUploadSessionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUploadSession = useCallback(async (input: CreateUploadSessionInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fileService.createUploadSession(input);
      setSession(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create upload session';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    session,
    createUploadSession,
    loading,
    error,
  };
}
