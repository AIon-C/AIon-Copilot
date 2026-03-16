import { createWorkspace } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  name: string;
};

type ResponseType = Id<'workspaces'> | null;

export const useCreateWorkspace = () => {
  return useMockMutation<RequestType, ResponseType>((values) => createWorkspace(values));
};
