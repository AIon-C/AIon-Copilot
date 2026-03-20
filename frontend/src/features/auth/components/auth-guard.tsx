'use client';

import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '../hooks/use-auth';

type AuthGuardProps = {
  children: React.ReactNode;
};

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const { isAuthenticated, initialized } = useAuth();

  useEffect(() => {
    if (!initialized) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [initialized, isAuthenticated, router]);

  if (!initialized || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="size-5 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};