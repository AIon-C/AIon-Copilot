"use client";

import { useCallback, useState } from "react";
import { AuthResult, LogInInput } from "../model/auth-types";
import { authService } from "../api/auth-service";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (input: LogInInput): Promise<AuthResult> => {
    setLoading(true);
    setError(null);

    try {
      return await authService.logIn(input);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to login";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);
  return {
    login,
    loading,
    error,
  };
}