'use client';

import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '../hooks/use-auth';

type GuestGuardProps = {
  children: React.ReactNode;
};

export const GuestGuard = ({ children }: GuestGuardProps) => {
  const router = useRouter();
  const { isAuthenticated, initialized } = useAuth();

  useEffect(() => {
    if (!initialized) return;

    if (isAuthenticated) {
      router.replace('/');
    }
  }, [initialized, isAuthenticated, router]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="size-5 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
