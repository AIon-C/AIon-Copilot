import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

import { workspaceService } from './workspace-service';

type RequestType = {
  name: string;
};

type ResponseType = Id<'workspaces'> | null;

export const useCreateWorkspace = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    const workspace = await workspaceService.createWorkspace(values);
    return (workspace?.id as Id<'workspaces'> | undefined) ?? null;
  });
};
