import { updateWorkspace } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  id: Id<'workspaces'>;
  name: string;
};

type ResponseType = Id<'workspaces'> | null;

export const useUpdateWorkspace = () => {
  return useMockMutation<RequestType, ResponseType>((values) => updateWorkspace(values));
};
