'use client';

import { Loader, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/features/auth/api/use-current-user';

import { authService } from '../api/auth-service';

export const UserButton = () => {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data, isLoading } = useCurrentUser();

  if (isLoading || isSigningOut) {
    return <Loader className="size-4 animate-spin text-muted-foreground" />;
  }

  if (!data) {
    return null;
  }

  const { avatarUrl, displayName } = data;

  const avatarFallback = displayName?.charAt(0).toUpperCase();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="relative outline-none">
        <Avatar className="size-10 transition hover:opacity-75">
          <AvatarImage alt={displayName} src={avatarUrl ?? undefined} />

          <AvatarFallback className="text-base">{avatarFallback}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" side="right" className="w060">
        <DropdownMenuItem
          onClick={async () => {
            if (isSigningOut) {
              return;
            }

            setIsSigningOut(true);

            try {
              await authService.logout();
              router.replace('/auth');
            } finally {
              setIsSigningOut(false);
            }
          }}
          className="h-10"
        >
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
