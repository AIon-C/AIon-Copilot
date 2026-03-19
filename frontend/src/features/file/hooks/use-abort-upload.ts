"use client";

import { useCallback, useState } from "react";
import { fileService } from "../api/file-service";
import type { AbortUploadInput } from "../model/file-types";

export function useAbortUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortUpload = useCallback(async (input: AbortUploadInput) => {
    setLoading(true);
    setError(null);

    try {
      await fileService.abortUpload(input);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to abort upload";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    abortUpload,
    loading,
    error,
  };
}