'use client';

import { Loader } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import type { ImperativePanelHandle } from 'react-resizable-panels';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { AiChatPanel } from '@/features/messages/components/copilot-chat-panel';
import { Thread } from '@/features/messages/components/thread';
import { Profile } from '@/features/user/components/profile';
import { useChannelId } from '@/hooks/use-channel-id';
import { usePanel } from '@/hooks/use-panel';
import { useWorkspaceSidebarToggle } from '@/hooks/use-workspace-sidebar-toggle';
import type { Id } from '@/mock/types';

import { Sidebar } from './sidebar';
import { Toolbar } from './toolbar';
import { WorkspaceSidebar } from './workspace-sidebar';

const DEFAULT_WORKSPACE_SIDEBAR_SIZE = 20;

const WorkspaceIdLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const { aiChatOpen, parentMessageId, profileMemberId, onClose, onCloseAiChat, onCloseMessage } = usePanel();
  const channelId = useChannelId();
  const { workspaceSidebarOpen } = useWorkspaceSidebarToggle();
  const workspaceSidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const workspaceSidebarSizeRef = useRef(DEFAULT_WORKSPACE_SIDEBAR_SIZE);

  const showContextPanel = !!parentMessageId || !!profileMemberId;
  const showAiPanel = !!aiChatOpen;
  const showRightPanels = showContextPanel || showAiPanel;

  useEffect(() => {
    if (!workspaceSidebarPanelRef.current) {
      return;
    }

    if (workspaceSidebarOpen) {
      workspaceSidebarPanelRef.current.expand();
      return;
    }

    workspaceSidebarPanelRef.current.collapse();
  }, [workspaceSidebarOpen]);

  return (
    <div className="h-full">
      <Toolbar />

      <div className="flex h-[calc(100vh_-_40px)]">
        <Sidebar />

        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            ref={workspaceSidebarPanelRef}
            collapsible
            collapsedSize={0}
            defaultSize={workspaceSidebarOpen ? DEFAULT_WORKSPACE_SIDEBAR_SIZE : 0}
            minSize={11}
            className="bg-[#5E2C5F]"
            onResize={(size) => {
              workspaceSidebarSizeRef.current = size;
            }}
          >
            <WorkspaceSidebar />
          </ResizablePanel>

          <ResizableHandle withHandle={workspaceSidebarOpen} />

          <ResizablePanel defaultSize={80} minSize={20}>
            <ResizablePanelGroup direction="horizontal" autoSaveId="slack-clone-workspace-content-layout">
              <ResizablePanel defaultSize={100} minSize={20}>
                {children}
              </ResizablePanel>

              {showRightPanels && (
                <>
                  {showContextPanel && (
                    <>
                      <ResizableHandle withHandle />
                      <ResizablePanel minSize={20} defaultSize={29}>
                        {parentMessageId ? (
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

                  {showAiPanel && (
                    <>
                      <ResizableHandle withHandle />
                      <ResizablePanel minSize={20} defaultSize={29}>
                        <AiChatPanel
                          onClose={onCloseAiChat}
                          channelId={channelId}
                          threadRootId={parentMessageId ? (parentMessageId as Id<'messages'>) : undefined}
                        />
                      </ResizablePanel>
                    </>
                  )}
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default WorkspaceIdLayout;
