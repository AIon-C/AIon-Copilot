'use client';

import { useCallback, useState } from 'react';

import { fileService } from '../api/file-service';
import type { GetDownloadUrlInput, GetDownloadUrlResult } from '../model/file-types';

export function useGetDownloadUrl() {
  const [download, setDownload] = useState<GetDownloadUrlResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDownloadUrl = useCallback(async (input: GetDownloadUrlInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fileService.getDownloadUrl(input);
      setDownload(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to get download url';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    download,
    getDownloadUrl,
    loading,
    error,
  };
}
