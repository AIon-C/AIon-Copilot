import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

import { workspaceService } from './workspace-service';

type RequestType = {
  id: Id<'workspaces'>;
  name: string;
};

type ResponseType = Id<'workspaces'> | null;

export const useUpdateWorkspace = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    const workspace = await workspaceService.updateWorkspace(values);
    return (workspace?.id as Id<'workspaces'> | undefined) ?? null;
  });
};
