import { useCallback } from 'react';

import { getCurrentUser, signInMockUser, signOutMockUser } from '@/mock/api';

type SignInProvider = 'github' | 'google' | 'password';

export const useAuthActions = () => {
  const signIn = useCallback(
    async (provider: SignInProvider, payload?: { email?: string; password?: string; name?: string; flow?: 'signIn' | 'signUp' }) => {
      const current = await getCurrentUser();
      const email = payload?.email ?? current?.email ?? 'demo@example.com';
      const name = payload?.name ?? current?.name ?? 'Demo User';

      await signInMockUser({
        name: provider === 'github' ? 'GitHub User' : provider === 'google' ? 'Google User' : name,
        email,
      });
    },
    [],
  );

  const signOut = useCallback(async () => {
    await signOutMockUser();
  }, []);

  return {
    signIn,
    signOut,
  };
};
