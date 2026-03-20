import { useCallback } from 'react';

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

      return toUiMessage(message, {
        workspaceId,
        membersByUserId,
      });
    } catch {
      return null;
    }
  }, [id, workspaceId]);

  return useMockQuery(queryFn);
};
