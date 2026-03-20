import { useCallback, useEffect, useState } from 'react';

import { workspaceService } from '@/features/workspaces/api/workspace-service';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { useMockPaginatedQuery } from '@/mock/hooks';
import type { Id, MockMessage } from '@/mock/types';

import { toUiMessage } from '../utils/message-ui-adapter';
import { messageService } from './message-service';

interface UseGetMessagesProps {
  channelId?: Id<'channels'>;
  conversationId?: Id<'conversations'>;
  parentMessageId?: Id<'messages'>;
}

export type GetMessagesReturnType = MockMessage[];

export const useGetMessages = ({ channelId, conversationId, parentMessageId }: UseGetMessagesProps) => {
  const workspaceId = useWorkspaceId();
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleMessagesUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ channelId?: string }>;
      const updatedChannelId = customEvent.detail?.channelId;

      if (!updatedChannelId || updatedChannelId === channelId) {
        setRefreshVersion((version) => version + 1);
      }
    };

    window.addEventListener('messages:updated', handleMessagesUpdated);

    return () => {
      window.removeEventListener('messages:updated', handleMessagesUpdated);
    };
  }, [channelId]);

  const queryFn = useCallback(async (): Promise<GetMessagesReturnType> => {
    if (!channelId) {
      return [];
    }

    try {
      const members = await workspaceService.listWorkspaceMembers({ workspaceId });
      const membersByUserId = Object.fromEntries(
        members.map((member) => {
          const shortId = member.userId.slice(0, 6) || 'user';

          return [
            member.userId,
            {
              memberId: member.id,
              userId: member.userId,
              role: member.role,
              name: `User ${shortId}`,
              email: `${shortId}@unknown.local`,
              image: undefined,
            },
          ];
        }),
      );

      const response = await messageService.listMessages({
        channelId,
      });

      const mapped = response.messages.map(
        (message) =>
          toUiMessage(message, {
            workspaceId,
            membersByUserId,
          }) as MockMessage,
      );

      if (parentMessageId) {
        return mapped.filter((message) => message.parentMessageId === parentMessageId);
      }

      if (conversationId) {
        return [];
      }

      return mapped.filter((message) => !message.parentMessageId);
    } catch {
      return [];
    }
  }, [channelId, conversationId, parentMessageId, refreshVersion, workspaceId]);

  return useMockPaginatedQuery(queryFn);
};
