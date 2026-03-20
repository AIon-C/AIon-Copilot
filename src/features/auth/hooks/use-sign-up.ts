'use client';

import { useCallback, useState } from 'react';

import { authService } from '../api/auth-service';
import type { AuthResult, SignUpInput } from '../model/auth-types';

export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = useCallback(async (input: SignUpInput): Promise<AuthResult> => {
    setLoading(true);
    setError(null);

    try {
      return await authService.signUp(input);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to sign up';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);
  return {
    signUp,
    loading,
    error,
  };
}
