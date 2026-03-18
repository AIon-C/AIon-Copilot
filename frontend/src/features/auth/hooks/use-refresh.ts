"use client";

import { useCallback, useState } from "react";
import { authService } from "../api/auth-service";
import type { AuthTokens, RefreshInput } from "../model/auth-types";

export function useRefresh() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (input?: RefreshInput): Promise<AuthTokens> => {
      setLoading(true);
      setError(null);

      try {
        return await authService.refresh(input);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to refresh token";
        setError(message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    refresh,
    loading,
    error,
  };
}