'use client';

import { useCurrentUser } from '@/features/auth/api/use-current-user';

export const AuthBootstrapper = () => {
  useCurrentUser();
  return null;
};