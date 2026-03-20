'use client';

import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ShinyText } from '@/components/ui/shiny-text';
import { useRemoveChannel } from '@/features/channels/api/use-remove-channel';
import { useUpdateChannel } from '@/features/channels/api/use-update-channel';
import { useCurrentMember } from '@/features/user/api/use-current-member';
import { useChannelId } from '@/hooks/use-channel-id';
import { useConfirm } from '@/hooks/use-confirm';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

interface HeaderProps {
  channelName: string;
}

export const Header = ({ channelName }: HeaderProps) => {
  const router = useRouter();
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  const [ConfirmDialog, confirm] = useConfirm(
    'Leave this channel?',
    'You are about to leave this channel. You can join again later if you have permission.',
  );

  const [value, setValue] = useState(channelName);
  const [editOpen, setEditOpen] = useState(false);

  const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId });
  const { mutate: updateChannel, isPending: isUpdatingChannel } = useUpdateChannel();
  const { mutate: leaveChannel, isPending: isLeavingChannel } = useRemoveChannel();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '-').toLowerCase();

    setValue(value);
  };

  const handleEditOpen = (value: boolean) => {
    if (member?.role !== 'admin') return;

    setEditOpen(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    updateChannel(
      { id: channelId, name: value },
      {
        onSuccess: () => {
          toast.success('Channel updated.');
          setEditOpen(false);
        },
        onError: () => {
          toast.error('Failed to update channel.');
        },
      },
    );
  };

  const handleLeave = async () => {
    const ok = await confirm();

    if (!ok) return;

    leaveChannel(
      { id: channelId },
      {
        onSuccess: () => {
          toast.success('Left channel.');

          router.push(`/workspace/${workspaceId}`);
        },
        onError: () => {
          toast.error('Failed to leave channel.');
        },
      },
    );
  };

  return (
    <div className="flex h-[49px] items-center overflow-hidden border-b border-slate-700 bg-black/90 px-4">
      <ConfirmDialog />

      <Dialog>
        <DialogTrigger asChild>
          <Button disabled={memberLoading} variant="ghost" className="w-auto overflow-hidden px-2 text-lg font-semibold" size="sm">
            <span className="flex min-w-0 items-center">
              #
              <ShinyText className="ml-1 truncate" color="#e2e8f0" shineColor="#ffffff" speed={2.2} spread={120}>
                {channelName}
              </ShinyText>
            </span>
            <FaChevronDown className="ml-2 size-2.5" />
          </Button>
        </DialogTrigger>

        <DialogContent className="overflow-hidden border-slate-700 bg-slate-900 p-0 text-slate-100">
          <DialogHeader className="border-b border-slate-700 bg-slate-900 p-4">
            <DialogTitle># {channelName}</DialogTitle>

            <VisuallyHidden.Root>
              <DialogDescription>Your channel preferences</DialogDescription>
            </VisuallyHidden.Root>
          </DialogHeader>

          <div className="flex flex-col gap-y-2 px-4 pb-4">
            <Dialog open={editOpen || isUpdatingChannel} onOpenChange={handleEditOpen}>
              <DialogTrigger asChild>
                <button
                  disabled={isUpdatingChannel}
                  className="flex w-full cursor-pointer flex-col rounded-lg border border-slate-700 bg-slate-800 px-5 py-4 text-slate-100 hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  <div className="flex w-full items-center justify-between">
                    <p className="text-sm font-semibold">Channel name</p>
                    {member?.role === 'admin' && <p className="text-sm font-semibold text-cyan-300 hover:underline">Edit</p>}
                  </div>

                  <p className="text-sm"># {channelName}</p>
                </button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename this channel</DialogTitle>

                  <VisuallyHidden.Root>
                    <DialogDescription>Rename this channel to match your case.</DialogDescription>
                  </VisuallyHidden.Root>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    value={value}
                    disabled={isUpdatingChannel}
                    onChange={handleChange}
                    required
                    autoFocus
                    minLength={3}
                    maxLength={20}
                    placeholder="e.g. plan-budget"
                  />

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" disabled={isUpdatingChannel}>
                        Cancel
                      </Button>
                    </DialogClose>

                    <Button disabled={isUpdatingChannel}>Save</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <button
              onClick={handleLeave}
              disabled={isLeavingChannel}
              className="flex cursor-pointer items-center gap-x-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-4 text-rose-400 hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash className="size-4" />
              <p className="text-sm font-semibold">Leave channel</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
