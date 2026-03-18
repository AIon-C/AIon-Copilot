"use client";

import { useCallback, useState } from "react";
import { userService } from "../api/user-service";
import type { ChangePasswordInput } from "../model/user-types";

export function useChangePassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    setLoading(true);
    setError(null);
    setSucceeded(false);

    try {
      await userService.changePassword(input);
      setSucceeded(true);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to change password";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetStatus = useCallback(() => {
    setError(null);
    setSucceeded(false);
  }, []);

  return {
    changePassword,
    loading,
    error,
    succeeded,
    resetStatus,
  };
}