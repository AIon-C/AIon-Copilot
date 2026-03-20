import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

import { workspaceService } from './workspace-service';

type RequestType = {
  inviteToken: string;
};

type ResponseType = Id<'workspaces'> | null;

export const useJoin = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    const member = await workspaceService.joinWorkspaceByInvite({
      inviteToken: values.inviteToken,
    });

    return (member?.workspaceId as Id<'workspaces'> | undefined) ?? null;
  });
};
