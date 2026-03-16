import { joinWorkspace } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  workspaceId: Id<'workspaces'>;
  joinCode: string;
};

type ResponseType = Id<'workspaces'> | null;

export const useJoin = () => {
  return useMockMutation<RequestType, ResponseType>((values) => joinWorkspace(values));
};
