import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

import { workspaceService } from './workspace-service';

type RequestType = {
  workspaceId: Id<'workspaces'>;
  userId: string;
};

type ResponseType = Id<'workspaces'> | null;

export const useRemoveWorkspace = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    await workspaceService.removeMember({
      workspaceId: values.workspaceId,
      userId: values.userId,
    });

    return values.workspaceId;
  });
};
