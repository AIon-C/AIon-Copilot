import { useEffect } from 'react';

import { authStore } from '@/features/auth/model/auth-store';
import { useMe } from '@/features/user/hooks/use-me';
import { tokenStore } from '@/lib/auth/token-store';

export const useCurrentUser = () => {
  const { user, initialized, fetchMe } = useMe();

  useEffect(() => {
    if (initialized) {
      return;
    }

    if (!tokenStore.hasAccessToken()) {
      authStore.markInitialized();
      return;
    }

    const persistedTokens = tokenStore.getTokens();
    authStore.setState({
      tokens: persistedTokens,
      isAuthenticated: Boolean(persistedTokens.accessToken),
    });

    void fetchMe().catch(() => {
      // error state is managed by useMe/authStore
    });
  }, [fetchMe, initialized]);

  return {
    data: user,
    isLoading: !initialized,
  };
};
