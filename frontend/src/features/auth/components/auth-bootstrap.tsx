'use client';

import { useEffect } from 'react';

import { userService } from '@/features/user/api/user-service';
import { tokenStore } from '@/lib/auth/token-store';

import { authService } from '../api/auth-service';
import { authStore } from '../model/auth-store';

type AuthBootstrapProps = {
  children: React.ReactNode;
};

export const AuthBootstrap = ({ children }: AuthBootstrapProps) => {
  useEffect(() => {
    const initialize = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!accessToken && !refreshToken) {
          return;
        }

        tokenStore.replaceTokens({
          accessToken: accessToken ?? null,
          refreshToken: refreshToken ?? null,
          expiresAt: null,
        });

        authStore.setTokens({
          accessToken: accessToken ?? null,
          refreshToken: refreshToken ?? null,
          expiresAt: null,
        });

        try {
          const me = await userService.getMe();
          authStore.setUser(me);
          return;
        } catch {
          if (refreshToken) {
            await authService.refresh({ refreshToken });
            const me = await userService.getMe();
            authStore.setUser(me);
            return;
          }

          authService.clearLocalAuth();
        }
      } catch {
        authService.clearLocalAuth();
      } finally {
        authStore.markInitialized();
      }
    };

    initialize();
  }, []);

  return <>{children}</>;
};
