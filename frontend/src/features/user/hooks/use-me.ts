"use client";

import { useCallback, useState } from "react";
import { userService } from "../api/user-service";
import type { UserModel } from "../model/user-types";

export function useMe() {
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await userService.getMe();
      setUser(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to fetch current user";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    fetchMe,
    clearUser,
    loading,
    error,
  };
}