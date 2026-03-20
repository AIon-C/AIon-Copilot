import { useCallback } from 'react';

import { useMockQuery } from '@/mock/hooks';
import type { Id, MockMember } from '@/mock/types';

import { workspaceService } from '@/features/workspaces/api/workspace-service';

interface UseGetMembersProps {
  workspaceId: Id<'workspaces'>;
}

export const useGetMembers = ({ workspaceId }: UseGetMembersProps) => {
  const queryFn = useCallback(async (): Promise<MockMember[]> => {
    try {
      const members = await workspaceService.listWorkspaceMembers({ workspaceId });

      return members.map((member) => {
        const shortId = member.userId.slice(0, 6) || 'user';

        return {
          _id: member.id as Id<'members'>,
          _creationTime: 0,
          role: member.role === 'admin' ? 'admin' : 'member',
          workspaceId: member.workspaceId as Id<'workspaces'>,
          userId: member.userId as Id<'users'>,
          user: {
            _id: member.userId as Id<'users'>,
            name: `User ${shortId}`,
            email: `${shortId}@unknown.local`,
            image: undefined,
          },
        };
      });
    } catch {
      return [];
    }
  }, [workspaceId]);

  return useMockQuery(queryFn);
};
