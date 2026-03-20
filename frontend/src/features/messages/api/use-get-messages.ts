import { useCallback, useEffect, useState } from 'react';

import { reactionService } from '@/features/reactions/api/reaction-service';
import { threadService } from '@/features/thread/api/thread-service';
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

      if (parentMessageId) {
        const thread = await threadService.getThread({
          threadRootId: parentMessageId,
        });

        const reactionsByMessageId = Object.fromEntries(
          await Promise.all(
            thread.replies.map(async (message) => {
              try {
                const reactions = await reactionService.listReactions({
                  messageId: message.id,
                });

                const grouped = Object.values(
                  reactions.reduce<Record<string, { value: string; createdAt: number; memberIds: string[] }>>((acc, reaction) => {
                    const member = membersByUserId[reaction.userId];
                    const memberId = member?.memberId ?? reaction.userId;
                    const existing = acc[reaction.emojiCode];
                    const createdAt = reaction.createdAt?.getTime() ?? Date.now();

                    if (!existing) {
                      acc[reaction.emojiCode] = {
                        value: reaction.emojiCode,
                        createdAt,
                        memberIds: [memberId],
                      };
                      return acc;
                    }

                    existing.memberIds.push(memberId);
                    if (createdAt < existing.createdAt) {
                      existing.createdAt = createdAt;
                    }

                    return acc;
                  }, {}),
                ).map((item) => ({
                  _id: `reaction-${message.id}-${item.value}`,
                  _creationTime: item.createdAt,
                  value: item.value,
                  count: item.memberIds.length,
                  memberIds: item.memberIds,
                }));

                return [message.id, grouped] as const;
              } catch {
                return [message.id, []] as const;
              }
            }),
          ),
        );

        return thread.replies.map(
          (message) =>
            toUiMessage(message, {
              workspaceId,
              membersByUserId,
              reactionsByMessageId,
            }) as MockMessage,
        );
      }

      const reactionsByMessageId = Object.fromEntries(
        await Promise.all(
          response.messages.map(async (message) => {
            try {
              const reactions = await reactionService.listReactions({
                messageId: message.id,
              });

              const grouped = Object.values(
                reactions.reduce<Record<string, { value: string; createdAt: number; memberIds: string[] }>>((acc, reaction) => {
                  const member = membersByUserId[reaction.userId];
                  const memberId = member?.memberId ?? reaction.userId;
                  const existing = acc[reaction.emojiCode];
                  const createdAt = reaction.createdAt?.getTime() ?? Date.now();

                  if (!existing) {
                    acc[reaction.emojiCode] = {
                      value: reaction.emojiCode,
                      createdAt,
                      memberIds: [memberId],
                    };
                    return acc;
                  }

                  existing.memberIds.push(memberId);
                  if (createdAt < existing.createdAt) {
                    existing.createdAt = createdAt;
                  }

                  return acc;
                }, {}),
              ).map((item) => ({
                _id: `reaction-${message.id}-${item.value}`,
                _creationTime: item.createdAt,
                value: item.value,
                count: item.memberIds.length,
                memberIds: item.memberIds,
              }));

              return [message.id, grouped] as const;
            } catch {
              return [message.id, []] as const;
            }
          }),
        ),
      );

      const mapped = response.messages.map(
        (message) =>
          toUiMessage(message, {
            workspaceId,
            membersByUserId,
            reactionsByMessageId,
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
