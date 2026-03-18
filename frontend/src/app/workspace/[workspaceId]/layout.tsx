'use client';

import { Loader } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Profile } from '@/features/user/components/profile';
import { AiChatPanel } from '@/features/messages/components/copilot-chat-panel';
import { Thread } from '@/features/messages/components/thread';
import { usePanel } from '@/hooks/use-panel';
import type { Id } from '@/mock/types';

import { Sidebar } from './sidebar';
import { Toolbar } from './toolbar';
import { WorkspaceSidebar } from './workspace-sidebar';

const WorkspaceIdLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const { aiChatOpen, parentMessageId, profileMemberId, onClose, onCloseAiChat, onCloseMessage } = usePanel();

  const showPanel = !!aiChatOpen || !!parentMessageId || !!profileMemberId;

  return (
    <div className="h-full">
      <Toolbar />

      <div className="flex h-[calc(100vh_-_40px)]">
        <Sidebar />

        <ResizablePanelGroup direction="horizontal" autoSaveId="slack-clone-workspace-layout">
          <ResizablePanel defaultSize={20} minSize={11} className="bg-[#5E2C5F]">
            <WorkspaceSidebar />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={80} minSize={20}>
            {children}
          </ResizablePanel>

          {showPanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel minSize={20} defaultSize={29}>
                {aiChatOpen && parentMessageId ? (
                  <ResizablePanelGroup direction="horizontal" autoSaveId="slack-clone-thread-ai-layout">
                    <ResizablePanel minSize={35} defaultSize={50}>
                      <Thread messageId={parentMessageId as Id<'messages'>} onClose={onCloseMessage} />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel minSize={35} defaultSize={50}>
                      <AiChatPanel onClose={onCloseAiChat} />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                ) : aiChatOpen ? (
                  <AiChatPanel onClose={onCloseAiChat} />
                ) : parentMessageId ? (
                  <Thread messageId={parentMessageId as Id<'messages'>} onClose={onCloseMessage} />
                ) : profileMemberId ? (
                  <Profile memberId={profileMemberId as Id<'members'>} onClose={onClose} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default WorkspaceIdLayout;
