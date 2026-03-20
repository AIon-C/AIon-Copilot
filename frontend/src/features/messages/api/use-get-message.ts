import { useCallback } from 'react';

import { reactionService } from '@/features/reactions/api/reaction-service';
import { workspaceService } from '@/features/workspaces/api/workspace-service';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { useMockQuery } from '@/mock/hooks';
import type { Id } from '@/mock/types';

import { toUiMessage } from '../utils/message-ui-adapter';
import { messageService } from './message-service';

interface UseGetMessageProps {
  id: Id<'messages'>;
}

export const useGetMessage = ({ id }: UseGetMessageProps) => {
  const workspaceId = useWorkspaceId();

  const queryFn = useCallback(async () => {
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

      const message = await messageService.getMessage({ messageId: id });

      if (!message) {
        return null;
      }

      let reactionsByMessageId: Record<string, Array<{ _id: string; _creationTime: number; value: string; count: number; memberIds: string[] }>> = {
        [message.id]: [],
      };

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

        reactionsByMessageId = {
          [message.id]: grouped,
        };
      } catch {
        // Ignore reaction lookup failures to keep message rendering resilient.
      }

      return toUiMessage(message, {
        workspaceId,
        membersByUserId,
        reactionsByMessageId,
      });
    } catch {
      return null;
    }
  }, [id, workspaceId]);

  return useMockQuery(queryFn);
};
