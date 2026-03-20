'use client';

import { CopyIcon, MailPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNewJoinCode } from '@/features/workspaces/api/use-new-join-code';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

interface InviteModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  name: string;
}

export const InviteModal = ({ open, setOpen, name }: InviteModalProps) => {
  const workspaceId = useWorkspaceId();
  const [email, setEmail] = useState('');

  const { mutate, isPending, data: inviteToken } = useNewJoinCode();
  const inviteLink = useMemo(() => {
    if (!inviteToken) {
      return null;
    }

    return `${window.location.origin}/join/${inviteToken}`;
  }, [inviteToken]);

  const handleCreateInvite = async () => {
    if (!email.trim()) {
      toast.error('Email is required.');
      return;
    }

    mutate(
      {
        workspaceId,
        email,
      },
      {
        onSuccess: () => {
          toast.success('Invite link generated.');
        },
        onError: () => {
          toast.error('Failed to generate invite link.');
        },
      },
    );
  };

  const handleCopy = () => {
    if (!inviteLink) {
      toast.error('Create an invite link first.');
      return;
    }

    navigator.clipboard
      .writeText(inviteLink)
      .then(() => toast.success('Invite link copied to clipboard.'))
      .catch(() => toast.error('Failed to copy link to clipboard'));
  };

  return (
    <Dialog open={open || isPending} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite people to {name}</DialogTitle>
          <DialogDescription>Enter an email address to generate an invite link.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            disabled={isPending}
          />

          <Button disabled={isPending} onClick={handleCreateInvite} variant="outline" className="w-full">
            Generate invite link
            <MailPlus className="ml-2 size-4" />
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center gap-y-2 rounded-md bg-muted/50 px-3 py-4">
          <p className="w-full break-all text-sm text-muted-foreground">{inviteLink ?? 'Invite link will appear here.'}</p>

          <Button disabled={isPending || !inviteLink} onClick={handleCopy} variant="ghost" size="sm">
            Copy link <CopyIcon className="ml-2 size-4" />
          </Button>
        </div>

        <div className="flex w-full justify-end">
          <DialogClose asChild>
            <Button disabled={isPending}>Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
