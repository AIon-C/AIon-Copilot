'use client';

import { Loader, Undo2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useJoin } from '@/features/workspaces/api/use-join';
import { useGetInviteInfo } from '@/features/workspaces/hooks/use-get-invite-info';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

const JoinWorkspaceIdPage = () => {
  const router = useRouter();
  const inviteToken = useWorkspaceId();

  const { mutate, isPending } = useJoin();
  const { inviteInfo, fetchInviteInfo, loading: isLoadingInviteInfo } = useGetInviteInfo();

  useEffect(() => {
    if (!inviteToken) {
      return;
    }

    void fetchInviteInfo(inviteToken).catch(() => {
      // error state is handled in hook/toast on action
    });
  }, [fetchInviteInfo, inviteToken]);

  const handleJoin = () => {
    mutate(
      { inviteToken },
      {
        onSuccess: (id) => {
          if (!id) {
            toast.error('Invalid invite token.');
            return;
          }

          router.replace(`/workspace/${id}`);
          toast.success('Workspace joined.');
        },
        onError: () => {
          toast.error('Failed to join workspace.');
        },
      },
    );
  };

  if (isLoadingInviteInfo) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-y-8 rounded-lg bg-white p-8 shadow-md">
      <Image src="/logo.png" alt="AIon Copilot logo" width={60} height={60} />

      <div className="flex max-w-md flex-col items-center justify-center gap-y-4">
        <div className="flex flex-col items-center justify-center gap-y-2">
          <h1 className="text-2xl font-bold">Join {inviteInfo?.workspace?.name ?? 'Workspace'}</h1>

          <p className="text-md text-muted-foreground">Accept the invite to join this workspace.</p>
        </div>

        <Button size="lg" disabled={isPending || !inviteInfo?.workspace} onClick={handleJoin}>
          {isPending ? 'Joining...' : 'Join workspace'}
        </Button>
      </div>

      <div className="flex gap-x-4">
        <Button size="lg" variant="outline" asChild>
          <Link href="/">
            <Undo2 className="mr-2 size-4" /> Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default JoinWorkspaceIdPage;
