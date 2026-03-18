"use client";

import { useCallback, useState } from "react";
import { authStore } from "@/features/auth/model/auth-store";
import { userService } from "../api/user-service";
import type { UpdateProfileInput } from "../model/user-types";

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await userService.updateProfile(input);
      authStore.setUser(result);
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

  return {
    updateProfile,
    loading,
    error,
  };
}