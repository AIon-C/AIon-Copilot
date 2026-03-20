import { workspaceService } from '@/features/workspaces/api/workspace-service';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  id: Id<'members'>;
  workspaceId: Id<'workspaces'>;
  userId: Id<'users'>;
};

type ResponseType = Id<'members'> | null;

export const useRemoveMember = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    await workspaceService.removeMember({
      workspaceId: values.workspaceId,
      userId: values.userId,
    });

    return values.id;
  });
};
