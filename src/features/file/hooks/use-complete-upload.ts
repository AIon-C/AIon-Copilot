'use client';

import { useCallback, useState } from 'react';

import { fileService } from '../api/file-service';
import type { CompleteUploadInput, FileModel } from '../model/file-types';

export function useCompleteUpload() {
  const [file, setFile] = useState<FileModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeUpload = useCallback(async (input: CompleteUploadInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fileService.completeUpload(input);
      setFile(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to complete upload';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    file,
    completeUpload,
    loading,
    error,
  };
}
