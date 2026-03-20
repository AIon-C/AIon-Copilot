'use client';

import { Bot, PanelLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { links } from '@/config';
import { useGetChannels } from '@/features/channels/api/use-get-channels';
import { useGetMembers } from '@/features/user/api/use-get-members';
import { useGetWorkspace } from '@/features/workspaces/api/use-get-workspace';
import { usePanel } from '@/hooks/use-panel';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { useWorkspaceSidebarToggle } from '@/hooks/use-workspace-sidebar-toggle';
import type { Id } from '@/mock/types';

export const Toolbar = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { aiChatOpen, onOpenAiChat, onCloseAiChat } = usePanel();
  const { workspaceSidebarOpen, onToggleWorkspaceSidebar } = useWorkspaceSidebarToggle();

  const { data } = useGetWorkspace({ id: workspaceId });
  const { data: channels } = useGetChannels({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });

  const [open, setOpen] = useState(false);

  const onChannelClick = (channelId: Id<'channels'>) => {
    setOpen(false);

    router.push(`/workspace/${workspaceId}/channel/${channelId}`);
  };

  const onMemberClick = (memberId: Id<'members'>) => {
    setOpen(false);

    router.push(`/workspace/${workspaceId}/member/${memberId}`);
  };

  const onToggleAiChat = useCallback(() => {
    if (aiChatOpen) {
      onCloseAiChat();
      return;
    }

    onOpenAiChat();
  }, [aiChatOpen, onCloseAiChat, onOpenAiChat]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isCopilotShortcut = e.ctrlKey && !e.metaKey && e.shiftKey && e.code === 'KeyB';

      if (isCopilotShortcut) {
        e.preventDefault();
        onToggleAiChat();
        return;
      }

      const isWorkspaceSidebarShortcut = e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === 'KeyB';

      if (isWorkspaceSidebarShortcut) {
        e.preventDefault();
        onToggleWorkspaceSidebar();
        return;
      }

      const target = e.target as HTMLElement | null;
      const isEditableTarget = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;

      if (isEditableTarget) {
        return;
      }

      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
        return;
      }
    },
    [onToggleAiChat, onToggleWorkspaceSidebar],
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <nav className="flex h-10 items-center justify-between border-b border-cyan-400/20 bg-[#020617]/95 p-1.5 backdrop-blur">
      <div className="flex flex-1 items-center">
        <Button
          variant="transparent"
          size="sm"
          onClick={onToggleWorkspaceSidebar}
          className="h-7 gap-1.5 text-slate-100 hover:text-cyan-200"
          aria-label={workspaceSidebarOpen ? 'Close channels panel' : 'Open channels panel'}
        >
          <PanelLeft className="size-4" />
          Channels
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-cyan-300/30 bg-cyan-400/10 px-1.5 font-mono text-[10px] font-medium text-cyan-100">
            <span className="text-xs">Ctrl</span>B
          </kbd>
        </Button>
      </div>

      <div className="min-w-[280px] max-w-[642px] shrink grow-[2]">
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpen(true)} size="sm" className="h-7 flex-1 justify-start border border-cyan-400/30 bg-slate-900/70 px-2 hover:bg-slate-900">
            <Search className="mr-2 size-4 text-slate-200" />
            <span className="text-xs text-slate-200">Search {data?.name ?? 'workspace'}...</span>

            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-cyan-300/30 bg-cyan-400/10 px-1.5 font-mono text-[10px] font-medium text-cyan-100 opacity-90">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <Button variant="transparent" size="sm" onClick={onToggleAiChat} className="h-7 gap-1.5 text-slate-100 hover:text-cyan-200">
            <Bot className="size-4" />
            Copilot
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-cyan-300/30 bg-cyan-400/10 px-1.5 font-mono text-[10px] font-medium text-cyan-100">
              <span className="text-xs">Ctrl</span>
              <span className="text-xs">⇧</span>B
            </kbd>
          </Button>
        </div>

        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder={`Search ${data?.name ?? 'workspace'}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Channels">
              {channels?.map((channel) => (
                <CommandItem onSelect={() => onChannelClick(channel._id)} key={channel._id}>
                  {channel.name}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Members">
              {members?.map((member) => (
                <CommandItem onSelect={() => onMemberClick(member._id)} key={member._id}>
                  {member.user.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>

      <div className="flex-1" aria-hidden />
    </nav>
  );
};
