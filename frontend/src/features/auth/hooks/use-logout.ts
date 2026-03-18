"use client";

import { useCallback, useState } from "react";
import { authService } from "../api/auth-service";

export function useLogout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await authService.logout();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to logout";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logout,
    loading,
    error,
  };
};