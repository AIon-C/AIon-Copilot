import { removeWorkspace } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  id: Id<'workspaces'>;
};

type ResponseType = Id<'workspaces'> | null;

export const useRemoveWorkspace = () => {
  return useMockMutation<RequestType, ResponseType>((values) => removeWorkspace(values));
};
