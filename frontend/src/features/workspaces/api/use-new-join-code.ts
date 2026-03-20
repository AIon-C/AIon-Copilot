import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

import { workspaceService } from './workspace-service';

type RequestType = {
  workspaceId: Id<'workspaces'>;
  email: string;
};

type ResponseType = string | null;

export const useNewJoinCode = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    return workspaceService.inviteWorkspaceMember({
      workspaceId: values.workspaceId,
      email: values.email,
    });
  });
};
