"use client";

import { useCallback, useState } from "react";
import { userService } from "../api/user-service";
import type { UpdateProfileInput, UserModel } from "../model/user-types";

export function useUpdateProfile() {
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await userService.updateProfile(input);
      setUser(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to update profile";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUpdatedUser = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    updateProfile,
    clearUpdatedUser,
    loading,
    error,
  };
}