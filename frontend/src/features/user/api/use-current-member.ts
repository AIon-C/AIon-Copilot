import { useEffect, useState } from 'react';

import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { workspaceService } from '@/features/workspaces/api/workspace-service';
import type { Id, MockMember } from '@/mock/types';

interface UseCurrentMemberProps {
  workspaceId: Id<'workspaces'>;
}

export const useCurrentMember = ({ workspaceId }: UseCurrentMemberProps) => {
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const [data, setData] = useState<MockMember | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (isUserLoading) {
        return;
      }

      if (!currentUser?.id) {
        if (active) {
          setData(null);
        }
        return;
      }

      try {
        const members = await workspaceService.listWorkspaceMembers({ workspaceId });
        const member = members.find((item) => item.userId === currentUser.id);

        if (!active) {
          return;
        }

        if (!member) {
          setData(null);
          return;
        }

        setData({
          _id: member.id as Id<'members'>,
          _creationTime: 0,
          role: member.role === 'admin' ? 'admin' : 'member',
          workspaceId: member.workspaceId as Id<'workspaces'>,
          userId: member.userId as Id<'users'>,
          user: {
            _id: currentUser.id as Id<'users'>,
            name: currentUser.displayName,
            email: currentUser.email,
            image: currentUser.avatarUrl ?? undefined,
          },
        });
      } catch {
        if (active) {
          setData(null);
        }
      }
    };

    setData(undefined);
    void load();

    return () => {
      active = false;
    };
  }, [currentUser?.avatarUrl, currentUser?.displayName, currentUser?.email, currentUser?.id, isUserLoading, workspaceId]);

  return {
    data,
    isLoading: isUserLoading || data === undefined,
  };
};
