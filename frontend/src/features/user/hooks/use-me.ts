"use client";

import { useCallback, useState } from "react";
import { useSyncExternalStore } from "react";
import { authStore } from "@/features/auth/model/auth-store";
import { userService } from "../api/user-service";

export function useMe() {
  const authState = useSyncExternalStore(
    authStore.subscribe,
    authStore.getState,
    authStore.getState,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await userService.getMe();
      authStore.setUser(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to fetch current user";
      setError(message);
      authStore.markInitialized();
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMe = useCallback(() => {
    authStore.setUser(null);
    setError(null);
  }, []);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    initialized: authState.initialized,
    fetchMe,
    clearMe,
    loading,
    error,
  };
}